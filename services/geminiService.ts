import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const isApiKeySet = (): boolean => {
    return !!API_KEY;
}

const getAi = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("Gemini AI not initialized. API key is missing.");
    }
    return ai;
}


let chat: Chat | null = null;

export const startChat = () => {
    chat = getAi().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_PROMPT,
        },
    });
};

export const generateText = async (prompt: string): Promise<GenerateContentResponse> => {
    if (!chat) {
        startChat();
    }
    if (!chat) throw new Error("Chat not initialized"); // Should not happen if API key is set
    
    return await chat.sendMessage({ message: prompt });
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await getAi().models.generateImages({
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
    return imageBytes;
};

export const editImage = async (prompt: string, image: { data: string; mimeType: string }): Promise<string> => {
    const response = await getAi().models.generateContent({
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
        return imagePart.inlineData.data;
    }

    throw new Error("No image was generated in the response.");
};

// Fix: Add generateVideo function for video generation.
export const generateVideo = async (prompt: string, image?: { data: string; mimeType: string }): Promise<any> => {
    const ai = getAi();
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
    return await ai.models.generateVideos(request);
};

// Fix: Add pollVideo function to check the status of video generation.
export const pollVideo = async (operation: any): Promise<any> => {
    return await getAi().operations.getVideosOperation({ operation });
};