import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import https from "https";
import http from "http";

const TABLEAU_SERVER_URL = process.env.TABLEAU_SERVER_URL;
const TABLEAU_SITE_ID = process.env.TABLEAU_SITE_ID || "";
const TABLEAU_TOKEN_NAME = process.env.TABLEAU_TOKEN_NAME;
const TABLEAU_TOKEN_VALUE = process.env.TABLEAU_TOKEN_VALUE;
const API_VERSION = "3.19"; 

if (!TABLEAU_SERVER_URL || !TABLEAU_TOKEN_NAME || !TABLEAU_TOKEN_VALUE) {
    console.error("Missing Tableau environment variables.");
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

interface TableauAuth {
    token: string;
    siteId: string;
    userId: string;
}

export class TableauService {
    private auth: TableauAuth | null = null;
    private cookies: string[] = [];
    
    // Create agents specifically like the working example
    private httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: false });
    private httpAgent = new http.Agent({ keepAlive: false });

    private get baseUrl() {
        return `${TABLEAU_SERVER_URL}/api/${API_VERSION}`;
    }

    private getAgent() {
        return TABLEAU_SERVER_URL?.startsWith("https") ? this.httpsAgent : this.httpAgent;
    }

    private async signIn(): Promise<TableauAuth> {
        console.log("Signing in to Tableau...");
        const url = `${this.baseUrl}/auth/signin`;
        
        const body = `
            <tsRequest>
                <credentials personalAccessTokenName="${TABLEAU_TOKEN_NAME}" personalAccessTokenSecret="${TABLEAU_TOKEN_VALUE}">
                    <site contentUrl="${TABLEAU_SITE_ID}" />
                </credentials>
            </tsRequest>
        `;

        try {
            const response = await axios.post(url, body, {
                headers: { 
                    "Content-Type": "application/xml",
                    "Accept": "application/xml"
                },
                httpsAgent: this.httpsAgent,
                httpAgent: this.httpAgent
            });

            if (response.headers['set-cookie']) {
                this.cookies = response.headers['set-cookie'];
            }

            const parsed = parser.parse(response.data);
            if (!parsed.tsResponse || !parsed.tsResponse.credentials) {
                console.error("Invalid Tableau Sign In Response:", JSON.stringify(parsed, null, 2));
                throw new Error("Invalid Tableau Sign In Response");
            }

            const credentials = parsed.tsResponse.credentials;
            
            this.auth = {
                token: credentials["@_token"],
                siteId: credentials.site["@_id"],
                userId: credentials.user["@_id"]
            };

            console.log(`Tableau Sign In Successful. Site ID: ${this.auth.siteId}`);
            return this.auth!;
        } catch (error: any) {
            console.error("Tableau Sign In Failed:", error.message);
            if (error.response) {
                console.error("Response Status:", error.response.status);
                console.error("Response Data:", typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    private async ensureAuth() {
        if (!this.auth) {
            await this.signIn();
        }
    }

    private getHeaders() {
        const headers: Record<string, string> = {
            "X-Tableau-Auth": this.auth?.token || "",
            "Accept": "application/xml"
        };
        if (this.cookies && this.cookies.length > 0) {
            headers["Cookie"] = this.cookies.join('; ');
        }
        return headers;
    }

    // Generic wrapper to handle 401 retries
    private async requestWithRetry<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                console.warn("Received 401 from Tableau. Re-authenticating...");
                this.auth = null; // Clear auth
                this.cookies = [];
                await this.signIn(); // Relogin
                return await operation(); // Retry once
            }
            throw error;
        }
    }

    async getWorkbooks() {
        await this.ensureAuth();
        
        return this.requestWithRetry(async () => {
            const response = await axios.get(`${this.baseUrl}/sites/${this.auth?.siteId}/workbooks`, {
                headers: this.getHeaders(),
                httpsAgent: this.httpsAgent,
                httpAgent: this.httpAgent
            });
            
            const parsed = parser.parse(response.data);
            
            if (parsed.tsResponse && !parsed.tsResponse.workbooks) {
                 return [];
            }

            let workbooks = parsed.tsResponse.workbooks.workbook;
            if (!workbooks) return [];
            
            if (!Array.isArray(workbooks)) {
                workbooks = [workbooks];
            }
            
            return workbooks.map((wb: any) => ({
                id: wb["@_id"],
                name: wb["@_name"],
                contentUrl: wb["@_contentUrl"],
                projectId: wb.project ? wb.project["@_id"] : null,
                projectName: wb.project ? wb.project["@_name"] : null
            }));
        });
    }

    async getViewsForWorkbook(workbookId: string) {
        await this.ensureAuth();
        
        return this.requestWithRetry(async () => {
            const response = await axios.get(`${this.baseUrl}/sites/${this.auth?.siteId}/workbooks/${workbookId}/views`, {
                headers: this.getHeaders(),
                httpsAgent: this.httpsAgent,
                httpAgent: this.httpAgent
            });

            const parsed = parser.parse(response.data);
            if (!parsed.tsResponse || !parsed.tsResponse.views) return [];

            let views = parsed.tsResponse.views.view;
            if (!views) return [];
            
            if (!Array.isArray(views)) {
                views = [views];
            }

            return views.map((v: any) => ({
                id: v["@_id"],
                name: v["@_name"],
                contentUrl: v["@_contentUrl"]
            }));
        });
    }

    async getViewImage(viewId: string): Promise<Buffer> {
        await this.ensureAuth();
        
        // Note: For image download, we don't easily use the generic retry wrapper 
        // because it uses fetch, but we can wrap the fetch logic.
        const doFetch = async () => {
            const url = `${this.baseUrl}/sites/${this.auth?.siteId}/views/${viewId}/image?maxAge=1&resolution=high`;
            const headers = this.getHeaders();
            
            // Fetch in Bun doesn't support httpAgent/httpsAgent like Axios does.
            // But usually fetch handles SSL based on global context or simple ignore.
            // If fetch fails, we might need to use axios with arraybuffer responseType.
            // Let's stick to fetch as it worked for the user, but handle 401.
            
            const res = await fetch(url, { headers });
            
            if (res.status === 401) {
                throw { response: { status: 401 } }; // Fake axios-like error for retry logic
            }
            if (!res.ok) {
                throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
            }
            
            const arrayBuffer = await res.arrayBuffer();
            return Buffer.from(arrayBuffer);
        };

        try {
            return await doFetch();
        } catch (error: any) {
             if (error.response && error.response.status === 401) {
                console.warn("Received 401 getting Image. Re-authenticating...");
                this.auth = null;
                await this.signIn();
                return await doFetch();
            }
            console.error(`Failed to get image for view ${viewId}:`, error);
            throw error;
        }
    }
}

export const tableauService = new TableauService();
