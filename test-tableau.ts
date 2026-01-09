import axios from "axios";
import https from "https";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
});

const SERVER_URL = env.TABLEAU_SERVER_URL;
const SITE_ID = env.TABLEAU_SITE_ID || "";
const TOKEN_NAME = env.TABLEAU_TOKEN_NAME;
const TOKEN_VALUE = env.TABLEAU_TOKEN_VALUE;

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
axios.defaults.httpsAgent = httpsAgent;

console.log("=== Tableau Deep Diagnostic ===");
console.log("Target: " + SERVER_URL);

async function detectApiVersion() {
    try {
        const res = await axios.get(SERVER_URL + "/api/2.4/serverInfo");
        const info = res.data;
        
        let version = "3.19"; 
        
        // JSON regex match
        const regex = new RegExp('"restApiVersion":"([0-9.]+)"');
        const match = JSON.stringify(info).match(regex);
        
        if (match) {
            version = match[1];
            console.log("✅ Detected API Version: " + version);
        } else {
             console.log("⚠️ Could not parse version from JSON, defaulting to 3.19");
        }
        return version;
    } catch (e: any) {
        console.log("⚠️ Failed to detect version. Defaulting to 3.19");
        return "3.19";
    }
}

async function attemptLogin(apiVersion: string, passwordCandidate: string, label: string) {
    console.log("\n--- Trying " + label + " ---");
    // console.log("Password: " + passwordCandidate); 
    
    const url = SERVER_URL + "/api/" + apiVersion + "/auth/signin";
    const payload = {
        credentials: {
            name: TOKEN_NAME,
            password: passwordCandidate,
            site: {
                contentUrl: SITE_ID
            }
        }
    };

    try {
        const res = await axios.post(url, payload, {
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        console.log("✅ LOGIN SUCCESS!");
        console.log("Token: " + res.data.credentials.token);
        return true;
    } catch (e: any) {
        if (e.response && e.response.status === 401) {
            console.log("❌ 401 Unauthorized (Wrong Credentials)");
        } else if (e.response) {
            console.log("❌ Error " + e.response.status + ": " + JSON.stringify(e.response.data));
        } else {
            console.log("❌ Error: " + e.message);
        }
        return false;
    }
}

async function run() {
    const apiVersion = await detectApiVersion();
    
    // 1. Try Full Token
    if (await attemptLogin(apiVersion, TOKEN_VALUE, "Full Token Value")) return;

    // 2. Try Split (if colon exists)
    if (TOKEN_VALUE.includes(":")) {
        const parts = TOKEN_VALUE.split(":");
        
        // Try Part 1
        if (await attemptLogin(apiVersion, parts[0], "Part 1 (Before Colon)")) {
            console.log("\n✅ SOLUTION FOUND: Please update .env TABLEAU_TOKEN_VALUE to use ONLY the part before the colon.");
            return;
        }

        // Try Part 2
        if (await attemptLogin(apiVersion, parts[1], "Part 2 (After Colon)")) {
             console.log("\n✅ SOLUTION FOUND: Please update .env TABLEAU_TOKEN_VALUE to use ONLY the part after the colon.");
             return;
        }
    }
    
    console.log("\n❌ All attempts failed. Please verify Token Name, Site ID, or generate a NEW Token.");
}

run();
