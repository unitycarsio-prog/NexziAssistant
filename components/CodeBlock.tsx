
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons/Icons';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-800 text-white rounded-md my-4">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 rounded-t-md">
        <span className="text-sm font-mono text-slate-400">{language}</span>
        <button onClick={handleCopy} className="text-slate-400 hover:text-white flex items-center">
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span className="ml-1 text-sm">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};
