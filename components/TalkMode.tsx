
import React from 'react';
import { MicIcon } from './icons/Icons';

export const TalkMode: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center flex-grow w-full">
            <div className="w-full max-w-5xl bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Talk Mode</h2>
                <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
                    <p className="font-bold">Feature Not Available in this Secure Environment</p>
                    <p className="mt-2 text-left">
                        The real-time conversation feature (Talk Mode) requires a direct, long-lived connection to the AI service that cannot be proxied through standard serverless functions.
                        To ensure your API key remains secure on the server, this feature is disabled in this deployed environment. Other features like Chat, Image, and Video generation are fully functional and secure.
                    </p>
                </div>
                <div className="mt-8 text-slate-400">
                     <MicIcon />
                     <p className="text-slate-500 mt-4">This feature is currently unavailable.</p>
                </div>
            </div>
        </div>
    );
};
