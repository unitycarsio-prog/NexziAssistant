
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = "You are NexziAssistant, a highly advanced AI with mastery in coding and other subjects. You were created by Shashwat Ranjan Jha. You are helpful, creative, and precise. When providing code, always wrap it in markdown code blocks with the language specified, like ```python\\nprint('Hello')\\n```.";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' }});
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: { message: 'API key is not configured on the server.' } });
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const { history, message } = req.body;

        const contents = [
            ...history.map((msg: any) => ({
                role: msg.role,
                parts: msg.parts.map((part: any) => ({ text: part.text }))
            })),
            {
                role: 'user',
                parts: [{ text: message }]
            }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: SYSTEM_PROMPT,
            },
        });

        return res.status(200).json({ text: response.text });
    } catch (error: any) {
        console.error('Error in /api/chat:', error);
        return res.status(500).json({ error: { message: error.message || 'An internal server error occurred.' } });
    }
}
