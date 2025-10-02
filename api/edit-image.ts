
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' }});
    }
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: { message: 'API key is not configured on the server.' } });
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { prompt, image } = req.body;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.data,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            return res.status(200).json({ imageData: imagePart.inlineData.data });
        }

        throw new Error("No image was generated in the response.");
        
    } catch (error: any) {
        console.error('Error in /api/edit-image:', error);
        return res.status(500).json({ error: { message: error.message || 'An internal server error occurred.' } });
    }
}
