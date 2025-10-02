
import type { Message } from '../types';

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'An unknown error occurred.' } }));
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const generateText = async (prompt: string, history: Message[]): Promise<string> => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history }),
    });
    const data = await handleApiResponse(response);
    return data.text;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    const data = await handleApiResponse(response);
    return data.imageBytes;
};

export const editImage = async (prompt: string, image: { data: string; mimeType: string }): Promise<string> => {
    const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image }),
    });
    const data = await handleApiResponse(response);
    return data.imageData;
};

export const generateVideo = async (prompt: string, image?: { data: string; mimeType: string }): Promise<any> => {
    const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt, image }),
    });
    const data = await handleApiResponse(response);
    return data.operation;
};

export const pollVideo = async (operation: any): Promise<any> => {
    const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll', operation }),
    });
    const data = await handleApiResponse(response);
    return data.operation;
};
