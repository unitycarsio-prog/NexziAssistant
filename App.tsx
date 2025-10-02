
import React, { useState } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { ImageGenerator } from './components/ImageGenerator';
import { TalkMode } from './components/TalkMode';
import type { AppMode } from './types';
import { VideoGenerator } from './components/VideoGenerator';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('chat');

  const renderContent = () => {
    switch (mode) {
      case 'chat':
        return <ChatInterface />;
      case 'image':
        return <ImageGenerator />;
      case 'video':
        return <VideoGenerator />;
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
