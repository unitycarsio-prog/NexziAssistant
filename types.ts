
export type AppMode = 'chat' | 'image' | 'video' | 'talk';

export interface MessagePart {
    text: string;
    isCode?: boolean;
    language?: string;
}

export interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}
