
import React, { useState } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { ImageGenerator } from './components/ImageGenerator';
import { TalkMode } from './components/TalkMode';
import type { AppMode } from './types';
import { isApiKeySet } from './services/geminiService';
import { WarningIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('chat');

  if (!isApiKeySet()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-700 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <WarningIcon className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
          <p className="max-w-md">
            The application cannot connect to the AI service because the <strong>API_KEY</strong> is missing.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Please ensure the required environment variable is correctly set up for this application to function.
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (mode) {
      case 'chat':
        return <ChatInterface />;
      case 'image':
        return <ImageGenerator />;
      case 'talk':
        return <TalkMode />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Header activeMode={mode} setActiveMode={setMode} />
      <main className="flex-grow p-4 flex flex-col">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>NexziAssistant - Created by Shashwat Ranjan Jha</p>
      </footer>
    </div>
  );
};

export default App;