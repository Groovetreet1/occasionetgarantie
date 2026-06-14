/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { androidFiles } from '../androidCode';
import { Copy, Check, FileCode, ChevronRight, HelpCircle } from 'lucide-react';

export default function AndroidCodeViewer() {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = androidFiles[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="android-code-viewer-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800">
      
      {/* Sidebar: File List */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-400 font-sans tracking-tight">
            💻 Code Source Android Natif
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Sélectionnez un fichier pour voir la structure Kotlin / Room / Clean Architecture complète.
          </p>
        </div>

        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-2 max-h-[350px] lg:max-h-[500px] scrollbar-thin scrollbar-thumb-emerald-600">
          {androidFiles.map((file, idx) => (
            <button
              id={`btn-android-file-${idx}`}
              key={file.name}
              onClick={() => {
                setSelectedFileIndex(idx);
                setCopied(false);
              }}
              className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 shrink-0 lg:shrink ${
                selectedFileIndex === idx
                  ? 'bg-emerald-555 bg-emerald-950 text-emerald-300 border-l-4 border-emerald-500 font-medium'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border-l-4 border-transparent'
              }`}
            >
              <FileCode size={18} className={selectedFileIndex === idx ? 'text-emerald-400' : 'text-slate-500'} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{file.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{file.path}</p>
              </div>
              <ChevronRight size={14} className="hidden lg:block text-slate-600" />
            </button>
          ))}
        </div>

        {/* Informative Tip Box */}
        <div className="bg-slate-850/50 bg-slate-800/40 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-3">
          <HelpCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">Conseils d'intégration :</span>
            <p className="leading-relaxed">
              Pour reproduire ce système de notifications, ajoutez la dépendance Room dans votre <code className="text-emerald-300 font-mono text-[10px]">build.gradle</code> ainsi que l'autorisation <code className="text-emerald-300 font-mono text-[10px]">SCHEDULE_EXACT_ALARM</code> dans AndroidManifest.
            </p>
          </div>
        </div>
      </div>

      {/* Code Editor Window */}
      <div className="lg:col-span-8 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
        
        {/* Editor Tab Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400 font-mono ml-3 truncate max-w-[200px] sm:max-w-xs">{currentFile.path}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
              {currentFile.language}
            </span>
            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              title="Copier le code"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copie !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* File Description */}
        <div className="bg-emerald-950/20 px-4 py-3 border-b border-emerald-900/45 text-xs text-emerald-250 text-slate-200">
          <span className="font-semibold text-emerald-300">Description : </span>
          {currentFile.description}
        </div>

        {/* Code Block Area */}
        <div className="flex-1 overflow-auto max-h-[450px] p-4 text-xs font-mono leading-relaxed text-slate-150 text-left relative">
          <pre className="text-emerald-100 whitespace-pre scrollbar-thin select-all">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>

    </div>
  );
}
