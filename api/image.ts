
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' }});
    }
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: { message: 'API key is not configured on the server.' } });
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { prompt } = req.body;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        
        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (!imageBytes) {
            throw new Error("Image generation failed to return an image.");
        }
        return res.status(200).json({ imageBytes });

    } catch (error: any) {
        console.error('Error in /api/image:', error);
        return res.status(500).json({ error: { message: error.message || 'An internal server error occurred.' } });
    }
}
