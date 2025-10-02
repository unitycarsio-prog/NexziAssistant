
import React, { useState, useEffect, useRef } from 'react';
import { generateText } from '../services/geminiService';
import type { Message, MessagePart } from '../types';
import { CodeBlock } from './CodeBlock';
import { Spinner } from './Spinner';
import { SendIcon, UserIcon, BotIcon } from './icons/Icons';

const parseResponse = (text: string): MessagePart[] => {
    const parts: MessagePart[] = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), isCode: false });
        }
        parts.push({ text: match[2], isCode: true, language: match[1] || 'plaintext' });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isCode: false });
    }
    
    if (parts.length === 0 && text.length > 0) {
        parts.push({ text: text, isCode: false });
    }

    return parts;
};

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    const history = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const modelText = await generateText(input, history);
      const modelParts = parseResponse(modelText);
      const modelMessage: Message = { role: 'model', parts: modelParts };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error generating text:', error);
      const err = error as Error;
      const errorMessage: Message = {
        role: 'model',
        parts: [{ text: `Sorry, an error occurred: ${err.message}` }],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col flex-grow w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <BotIcon />}
              <div className={`w-full max-w-full rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {msg.parts.map((part, partIndex) =>
                  part.isCode ? (
                    <CodeBlock key={partIndex} language={part.language || 'plaintext'} code={part.text} />
                  ) : (
                    <p key={partIndex} className="whitespace-pre-wrap">{part.text}</p>
                  )
                )}
              </div>
              {msg.role === 'user' && <UserIcon />}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <BotIcon />
              <div className="bg-slate-100 rounded-lg px-4 py-3 flex items-center">
                <Spinner />
                <span className="ml-2 text-slate-600">Nexzi is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Nexzi anything..."
            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
