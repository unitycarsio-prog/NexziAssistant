
import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, pollVideo } from '../services/geminiService';
import { Spinner } from './Spinner';
import { VideoIcon, UploadIcon, CloseIcon } from './icons/Icons';
import { VIDEO_LOADING_MESSAGES } from '../constants';

type LoadingState = 'idle' | 'generating' | 'polling' | 'done' | 'error';

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(VIDEO_LOADING_MESSAGES[0]);
    const [uploadedImage, setUploadedImage] = useState<{ dataUrl: string; file: File } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const pollIntervalRef = useRef<number | null>(null);
    const messageIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
        };
    }, []);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage({ dataUrl: reader.result as string, file });
                setVideoUrl(null); 
            };
            reader.readAsDataURL(file);
        }
    };

    const removeUploadedImage = () => {
        setUploadedImage(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const startLoadingMessages = () => {
        let i = 0;
        setLoadingMessage(VIDEO_LOADING_MESSAGES[0]);
        messageIntervalRef.current = window.setInterval(() => {
            i = (i + 1) % VIDEO_LOADING_MESSAGES.length;
            setLoadingMessage(VIDEO_LOADING_MESSAGES[i]);
        }, 3000);
    };

    const stopLoadingMessages = () => {
        if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
        }
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
            let initialOperation;
            if (uploadedImage) {
                const base64Data = uploadedImage.dataUrl.split(',')[1];
                const mimeType = uploadedImage.file.type;
                initialOperation = await generateVideo(prompt, { data: base64Data, mimeType });
            } else {
                initialOperation = await generateVideo(prompt);
            }
            
            setLoadingState('polling');
            
            pollIntervalRef.current = window.setInterval(async () => {
                try {
                    const operation: any = await pollVideo(initialOperation);
                    if (operation.done) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        stopLoadingMessages();

                        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
                        if (uri) {
                            setVideoUrl(uri);
                            setLoadingState('done');
                        } else {
                           const errorMessage = operation.error?.message || 'Video generation finished but no video URI was found.';
                           setError(errorMessage);
                           setLoadingState('error');
                        }
                    }
                } catch (pollError: any) {
                    console.error('Polling error:', pollError);
                    let friendlyMessage = pollError.message || 'An error occurred while checking video status.';
                    if (pollError.message.includes('API key not valid')) {
                        friendlyMessage = "The API key provided is not valid. Please check the `API_KEY` environment variable in your Vercel project settings and ensure it's a correct key from Google AI Studio.";
                    }
                    setError(friendlyMessage);
                    setLoadingState('error');
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    stopLoadingMessages();
                }
            }, 10000);

        } catch (e: any) {
            console.error('Error generating video:', e);
            let friendlyMessage = e.message || 'Failed to start video generation. Please try again.';
            if (e.message.includes('API key not valid')) {
                friendlyMessage = "The API key provided is not valid. Please check the `API_KEY` environment variable in your Vercel project settings and ensure it's a correct key from Google AI Studio.";
            }
            setError(friendlyMessage);
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
                        placeholder={uploadedImage ? "e.g., Make the cat drive a car" : "e.g., A neon hologram of a cat"}
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
                 <div className="text-center mt-4">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*" 
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLoading} 
                        className="text-blue-600 hover:text-blue-800 font-medium disabled:text-slate-400 flex items-center justify-center mx-auto"
                    >
                      <UploadIcon /> {uploadedImage ? 'Change Image' : 'Upload Image to Animate'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                <div className="mt-6 w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden">
                    {isLoading ? (
                        <div className="text-center p-4">
                            <Spinner size="lg"/>
                            <p className="mt-2 text-slate-600">{loadingMessage}</p>
                        </div>
                    ) : videoUrl ? (
                         <video src={videoUrl} controls autoPlay muted loop className="w-full h-full object-contain"></video>
                    ) : uploadedImage ? (
                        <div className="relative w-full h-full">
                            <img src={uploadedImage.dataUrl} alt="Uploaded preview" className="object-contain w-full h-full" />
                            <button 
                                onClick={removeUploadedImage} 
                                className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                                aria-label="Remove uploaded image"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
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