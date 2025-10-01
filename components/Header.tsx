
import React from 'react';
import type { AppMode } from '../types';
import { ChatIcon, ImageIcon, VideoIcon, MicIcon } from './icons/Icons';

interface HeaderProps {
  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeMode, setActiveMode }) => {
  // Fix: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  const navItems: { mode: AppMode; label: string; icon: React.ReactElement }[] = [
    { mode: 'chat', label: 'Chat', icon: <ChatIcon /> },
    { mode: 'image', label: 'Image Gen', icon: <ImageIcon /> },
    { mode: 'video', label: 'Video Gen', icon: <VideoIcon /> },
    { mode: 'talk', label: 'Talk Mode', icon: <MicIcon /> },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">NexziAssistant</h1>
        <nav className="flex items-center space-x-2 sm:space-x-4">
          {navItems.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-blue-100 hover:text-blue-700'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
