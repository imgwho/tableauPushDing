import axios from "axios";
import FormData from "form-data";

interface TokenCache {
    token: string;
    expiresAt: number;
}

export class DingtalkService {
    private tokenCache: Map<string, TokenCache> = new Map();

    async getAccessToken(appKey: string, appSecret: string): Promise<string> {
        const now = Date.now();
        const cache = this.tokenCache.get(appKey);

        if (cache && cache.expiresAt > now + 60000) { // Buffer 60s
            return cache.token;
        }

        try {
            const response = await axios.get("https://oapi.dingtalk.com/gettoken", {
                params: {
                    appkey: appKey,
                    appsecret: appSecret
                }
            });

            if (response.data.errcode !== 0) {
                throw new Error(`DingTalk GetToken Error: ${response.data.errmsg}`);
            }

            const token = response.data.access_token;
            const expiresIn = response.data.expires_in || 7200;
            
            this.tokenCache.set(appKey, {
                token,
                expiresAt: now + (expiresIn * 1000)
            });

            return token;
        } catch (error) {
            console.error("Failed to get DingTalk Access Token:", error);
            throw error;
        }
    }

    async uploadImage(accessToken: string, imageBuffer: Buffer): Promise<string> {
        const formData = new FormData();
        formData.append('media', imageBuffer, { filename: 'screenshot.png', contentType: 'image/png' });
        formData.append('type', 'image');

        try {
            const response = await axios.post(`https://oapi.dingtalk.com/media/upload?access_token=${accessToken}&type=image`, formData, {
                headers: formData.getHeaders()
            });

            if (response.data.errcode !== 0) {
                 throw new Error(`DingTalk Upload Media Error: ${response.data.errmsg}`);
            }

            return response.data.media_id;
        } catch (error) {
            console.error("Failed to upload image to DingTalk:", error);
            throw error;
        }
    }

    async sendWorkNotification(
        accessToken: string, 
        agentId: string, 
        userIdList: string[], 
        mediaId: string,
        title: string, // New: Title for the message (e.g., Workbook Name)
        messageText: string // New: Additional text content (e.g., Push Time)
    ) {
        if (userIdList.length === 0) return;

        const chunks = [];
        for (let i = 0; i < userIdList.length; i += 100) {
            chunks.push(userIdList.slice(i, i + 100));
        }

        const markdownContent = `## ${title}\n\n${messageText}\n\n![图片](${mediaId})`;

        for (const chunk of chunks) {
            const body = {
                agent_id: parseInt(agentId),
                userid_list: chunk.join(','),
                msg: {
                    msgtype: "markdown",
                    markdown: {
                        title: title, // This title is for the push notification/summary
                        text: markdownContent
                    }
                }
            };

            try {
                const response = await axios.post(`https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${accessToken}`, body);
                
                if (response.data.errcode !== 0) {
                    console.error(`DingTalk Send Message Error (Partial): ${response.data.errmsg}`);
                } else {
                    console.log(`Message sent to ${chunk.length} users. TaskId: ${response.data.task_id}`);
                }
            } catch (error) {
                 console.error("Failed to send DingTalk message:", error);
            }
        }
    }
}

export const dingtalkService = new DingtalkService();
