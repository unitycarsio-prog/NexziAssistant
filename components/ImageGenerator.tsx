
import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ImageIcon, UploadIcon, CloseIcon } from './icons/Icons';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ dataUrl: string; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage({ dataUrl: reader.result as string, file });
        setImageUrl(null); // Clear previous generation
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      if (uploadedImage) {
        const base64Data = uploadedImage.dataUrl.split(',')[1];
        const mimeType = uploadedImage.file.type;
        const editedImageBytes = await editImage(prompt, { data: base64Data, mimeType });
        setImageUrl(`data:${mimeType};base64,${editedImageBytes}`);
      } else {
        const base64ImageBytes = await generateImage(prompt);
        setImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
      }
    } catch (e) {
      console.error('Error generating image:', e);
      const err = e as Error;
      let friendlyMessage = err.message || 'Failed to generate image. Please try again.';
      if (err.message.includes('API key not valid')) {
        friendlyMessage = "The API key provided is not valid. Please check the `API_KEY` environment variable in your Vercel project settings and ensure it's a correct key from Google AI Studio.";
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full">
      <div className="w-full max-w-7xl bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Image Generation &amp; Editing</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={uploadedImage ? "e.g., Add a party hat" : "e.g., A blue robot holding a skateboard"}
            className="flex-grow px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-wait flex items-center justify-center"
          >
            {isLoading ? <><Spinner /> Working...</> : (uploadedImage ? 'Edit Image' : 'Generate')}
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
              <UploadIcon /> {uploadedImage ? 'Change Image' : 'Upload Image to Edit'}
            </button>
        </div>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        <div className="mt-6 w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden">
          {isLoading ? (
            <div className="text-center">
                <Spinner size="lg"/>
                <p className="mt-2 text-slate-500">Conjuring up your image...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Generated" className="object-contain max-w-full max-h-full" />
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
              <ImageIcon className="mx-auto" />
              <p>Your generated image will appear here</p>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">
            Generated images may contain a small logo as part of the service.
        </p>
      </div>
    </div>
  );
};