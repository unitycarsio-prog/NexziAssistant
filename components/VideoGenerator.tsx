
import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, pollVideo } from '../services/geminiService';
import { Spinner } from './Spinner';
import { VideoIcon } from './icons/Icons';
import { VIDEO_LOADING_MESSAGES } from '../constants';
// Fix: Removed unused and non-exported type VideosOperationResponse from '@google/genai'.

type LoadingState = 'idle' | 'generating' | 'polling' | 'done' | 'error';

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(VIDEO_LOADING_MESSAGES[0]);

    const pollIntervalRef = useRef<number | null>(null);
    const messageIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
        };
    }, []);

    const startLoadingMessages = () => {
        let i = 0;
        messageIntervalRef.current = window.setInterval(() => {
            i = (i + 1) % VIDEO_LOADING_MESSAGES.length;
            setLoadingMessage(VIDEO_LOADING_MESSAGES[i]);
        }, 3000);
    };

    const stopLoadingMessages = () => {
        if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setLoadingState('generating');
        setError(null);
        setVideoUrl(null);
        startLoadingMessages();

        try {
            const initialOperation = await generateVideo(prompt);
            setLoadingState('polling');
            
            pollIntervalRef.current = window.setInterval(async () => {
                try {
                    // Fix: The type of the video operation object is not an exported member. Using `any`.
                    const operation: any = await pollVideo(initialOperation);
                    if (operation.done) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        stopLoadingMessages();

                        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
                        if (uri && process.env.API_KEY) {
                            setVideoUrl(`${uri}&key=${process.env.API_KEY}`);
                            setLoadingState('done');
                        } else {
                            throw new Error('Video URI not found in response.');
                        }
                    }
                } catch (pollError) {
                    console.error('Polling error:', pollError);
                    setError('An error occurred while checking video status.');
                    setLoadingState('error');
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    stopLoadingMessages();
                }
            }, 10000);

        } catch (e) {
            console.error('Error generating video:', e);
            setError('Failed to start video generation. Please try again.');
            setLoadingState('error');
            stopLoadingMessages();
        }
    };

    const isLoading = loadingState === 'generating' || loadingState === 'polling';

    return (
        <div className="flex flex-col items-center justify-center flex-grow w-full max-w-3xl mx-auto">
            <div className="w-full bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Video Generation</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A neon hologram of a cat driving"
                        className="flex-grow px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-wait flex items-center justify-center"
                    >
                        {isLoading ? <><Spinner /> Generating...</> : 'Generate'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                <div className="mt-8 w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                    {isLoading ? (
                        <div className="text-center">
                            <Spinner size="lg"/>
                            <p className="mt-2 text-slate-600">{loadingMessage}</p>
                        </div>
                    ) : videoUrl ? (
                         <video src={videoUrl} controls autoPlay className="w-full h-full rounded-md"></video>
                    ) : (
                        <div className="text-center text-slate-500">
                            <VideoIcon className="mx-auto" />
                            <p>Your generated video will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
