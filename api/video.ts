
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
// Fix: Import `Buffer` to resolve TypeScript error `Cannot find name 'Buffer'`.
import { Buffer } from 'buffer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' }});
    }
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: { message: 'API key is not configured on the server.' } });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { action, prompt, image, operation } = req.body;

    try {
        if (action === 'generate') {
            const request: any = {
                model: 'veo-2.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                },
            };
            if (image) {
                request.image = {
                    imageBytes: image.data,
                    mimeType: image.mimeType,
                };
            }
            const result = await ai.models.generateVideos(request);
            return res.status(200).json({ operation: result });
        } else if (action === 'poll') {
            if (!operation) {
                return res.status(400).json({ error: { message: 'Operation data is required for polling.' }});
            }
            const result = await ai.operations.getVideosOperation({ operation });
            
            if (result.done && result.response?.generatedVideos?.[0]?.video?.uri) {
                const uri = result.response.generatedVideos[0].video.uri;
                
                const videoResponse = await fetch(`${uri}&key=${process.env.API_KEY}`);
                if (!videoResponse.ok) {
                    throw new Error(`Failed to fetch video from storage: ${videoResponse.statusText}`);
                }
                const videoArrayBuffer = await videoResponse.arrayBuffer();
                const base64Video = Buffer.from(videoArrayBuffer).toString('base64');
                const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';
                const dataUrl = `data:${mimeType};base64,${base64Video}`;
                
                result.response.generatedVideos[0].video.uri = dataUrl;
            }
            return res.status(200).json({ operation: result });
        } else {
            return res.status(400).json({ error: { message: 'Invalid action specified.' }});
        }
    } catch (error: any) {
        console.error('Error in /api/video:', error);
        return res.status(500).json({ error: { message: error.message || 'An internal server error occurred.' } });
    }
}
