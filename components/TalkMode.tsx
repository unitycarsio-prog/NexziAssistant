
import React, { useState, useRef, useCallback, useEffect } from 'react';
// Fix: Removed non-exported type LiveSession.
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type } from "@google/genai";
// Fix: Spinner is imported from its own component, not from icons.
import { MicIcon, MicOffIcon, StopIcon } from './icons/Icons';
import { Spinner } from './Spinner';
import { SYSTEM_PROMPT } from '../constants';

// Audio Encoding/Decoding Utilities
const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


export const TalkMode: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [language, setLanguage] = useState<'english' | 'hindi'>('english');
    const [transcription, setTranscription] = useState<{ user: string, model: string }>({ user: '', model: '' });
    const [isMuted, setIsMuted] = useState(false);

    // Fix: The type of the live session object is not an exported member. Using `any`.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        streamRef.current?.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setStatus('idle');
    }, []);

    const startConversation = async () => {
        setStatus('connecting');
        
        try {
            if (!process.env.API_KEY) throw new Error("API Key not found");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            const languageInstruction = language === 'hindi' ? 'You must respond in Hindi.' : 'You must respond in English.';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        setStatus('connected');
                        
                        sourceNodeRef.current = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                if(!isMuted) session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        sourceNodeRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                            setTranscription({ user: currentInputTranscription, model: currentOutputTranscription });
                        } else if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                             setTranscription({ user: currentInputTranscription, model: currentOutputTranscription });
                        }

                        if (message.serverContent?.turnComplete) {
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus('error');
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `${SYSTEM_PROMPT} ${languageInstruction}`,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                },
            });

        } catch (err) {
            console.error('Failed to start conversation:', err);
            setStatus('error');
        }
    };
    
    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="flex flex-col items-center justify-center flex-grow w-full max-w-2xl mx-auto">
            <div className="w-full bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Talk Mode</h2>
                <p className="text-slate-500 mb-6">Have a real-time conversation with Nexzi</p>

                {status === 'idle' && (
                    <div className="mb-6">
                        <label htmlFor="language-select" className="mr-2 font-medium">Language:</label>
                        <select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'english' | 'hindi')}
                            className="p-2 border border-slate-300 rounded-md"
                        >
                            <option value="english">English</option>
                            <option value="hindi">Hindi</option>
                        </select>
                    </div>
                )}
                
                {status !== 'idle' && (
                    <div className="w-full h-48 p-4 bg-slate-100 rounded-lg mb-6 text-left overflow-y-auto">
                        <p><span className="font-bold text-blue-600">You:</span> {transcription.user}</p>
                        <p><span className="font-bold text-purple-600">Nexzi:</span> {transcription.model}</p>
                    </div>
                )}


                {status === 'idle' && <button onClick={startConversation} className="bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center mx-auto"><MicIcon /> Start Talking</button>}
                {status === 'connecting' && <button disabled className="bg-slate-400 text-white font-bold py-4 px-8 rounded-full text-lg flex items-center justify-center mx-auto"><Spinner /> Connecting...</button>}
                {status === 'connected' && (
                    <div className="flex space-x-4 justify-center">
                        <button onClick={() => setIsMuted(!isMuted)} className={`font-bold py-4 px-6 rounded-full text-lg transition-colors flex items-center justify-center ${isMuted ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {isMuted ? <MicOffIcon /> : <MicIcon />} {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <button onClick={stopConversation} className="bg-red-600 text-white font-bold py-4 px-6 rounded-full text-lg hover:bg-red-700 transition-colors flex items-center justify-center"><StopIcon /> Stop</button>
                    </div>
                )}
                 {status === 'error' && <p className="text-red-500 mt-4">An error occurred. Please check console and try again.</p>}
            </div>
        </div>
    );
};
