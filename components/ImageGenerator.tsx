
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ImageIcon } from './icons/Icons';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const base64ImageBytes = await generateImage(prompt);
      setImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
    } catch (e) {
      console.error('Error generating image:', e);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full max-w-3xl mx-auto">
      <div className="w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Image Generation</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A blue robot holding a red skateboard"
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
        <div className="mt-8 w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
          {isLoading ? (
            <div className="text-center">
                <Spinner size="lg"/>
                <p className="mt-2 text-slate-500">Conjuring up your image...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Generated" className="object-contain max-w-full max-h-full rounded-md" />
          ) : (
            <div className="text-center text-slate-500">
              <ImageIcon className="mx-auto" />
              <p>Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
