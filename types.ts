
export type AppMode = 'chat' | 'image' | 'talk';

export interface MessagePart {
    text: string;
    isCode?: boolean;
    language?: string;
}

export interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}