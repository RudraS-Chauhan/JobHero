import React, { useState, useEffect } from 'react';
import { UserInput, JobToolkit } from './types';
import { generateJobToolkit, regenerateCareerRoadmap } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { LogoIcon } from './components/icons/LogoIcon';
import { SharedResumeView } from './components/SharedResumeView';

// --- Icons ---
const SunIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

const WarningIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

// --- About Modal with Tabs ---
const AboutModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'mission' | 'tech' | 'privacy' | 'contact'>('mission');

    const renderContent = () => {
        switch(activeTab) {
            case 'mission':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                            <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm uppercase tracking-wide mb-2">Our Core Mission</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                To democratize career success. We believe every student and job seeker deserves access to 
                                <strong> executive-level career coaching</strong>, regardless of their background or network.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                <div className="text-2xl mb-1">🚀</div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">Speed</div>
                                <div className="text-[10px] text-slate-500">From 0 to Applied in minutes</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                <div className="text-2xl mb-1">🧠</div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">Intelligence</div>
                                <div className="text-[10px] text-slate-500">Powered by Gemini 3.0</div>
                            </div>
                        </div>
                    </div>
                );
            case 'tech':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            JobHero.ai leverages the cutting-edge capabilities of <strong>Google's Gemini 3.0 Flash</strong> model.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                <span className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1 rounded">⚡</span>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Reasoning Engine</h5>
                                    <p className="text-[10px] text-slate-500">Analyses your profile deeply to find transferable skills.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                <span className="text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-1 rounded">🛡️</span>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Secure Processing</h5>
                                    <p className="text-[10px] text-slate-500">Data is processed ephemerally and returned to your browser.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl flex gap-3">
                            <div className="text-2xl">🔒</div>
                            <div>
                                <h4 className="font-bold text-green-900 dark:text-green-300 text-sm mb-1">Local-First Architecture</h4>
                                <p className="text-xs text-green-800 dark:text-green-400 leading-relaxed">
                                    We do not store your personal data on our servers. Your resume data lives in your browser's local storage and is sent to the AI model only for generation.
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                            This project is open-source friendly and respects user sovereignty.
                        </p>
                    </div>
                );
            case 'contact':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Direct Support Channel</p>
                            <div className="space-y-3">
                                <a href="mailto:rudrasinghchauhan2007@gmail.com" className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors group">
                                    <span className="text-lg group-hover:scale-110 transition-transform">📧</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">rudrasinghchauhan2007@gmail.com</span>
                                </a>
                                <div className="flex items-center gap-3 p-2">
                                    <span className="text-lg">📞</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">+91 98765 43210</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => window.open('mailto:rudrasinghchauhan2007@gmail.com')} className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                            Send Email
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <LogoIcon className="h-6 w-6 text-blue-600" />
                        About JobHero<span className="text-blue-600">.ai</span>
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2">
                    {[
                        { id: 'mission', label: 'Mission' },
                        { id: 'tech', label: 'Technology' },
                        { id: 'privacy', label: 'Privacy' },
                        { id: 'contact', label: 'Contact' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
                                activeTab === tab.id 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {renderContent()}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">© 2024 JobHero AI. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

// --- Helper Functions for Error Handling ---
const getTroubleshootingData = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    
    if (msg.includes('api key') || msg.includes('401')) {
        return {
            title: "Configuration Error",
            tip: "The API Key is missing or invalid. Please check your environment variables or provider settings."
        };
    }
    if (msg.includes('429') || msg.includes('quota')) {
        return {
            title: "Usage Limit Exceeded",
            tip: "You've hit the rate limit for the free tier. Please wait roughly 60 seconds before trying again."
        };
    }
    if (msg.includes('503') || msg.includes('overloaded')) {
        return {
            title: "Service Overloaded",
            tip: "Google's AI servers are currently experiencing high traffic. Please wait a moment and retry."
        };
    }
    if (msg.includes('500') || msg.includes('internal')) {
        return {
            title: "AI Service Interruption",
            tip: "The AI model encountered a temporary internal error. Retrying usually fixes this."
        };
    }
    if (msg.includes('network') || msg.includes('fetch')) {
        return {
            title: "Connection Failed",
            tip: "Unable to reach the AI service. Please check your internet connection or disable VPN/Ad-blockers."
        };
    }
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('candidate')) {
        return {
            title: "Content Flagged",
            tip: "The AI flagged your input as sensitive or unsafe. Please revise your content to be more professional."
        };
    }
    if (msg.includes('json') || msg.includes('parse')) {
        return {
            title: "Generation Glitch",
            tip: "The AI response was malformed. This is a rare random error. Please click 'Try Again'."
        };
    }
    
    return {
        title: "Unexpected Error",
        tip: "An unknown issue occurred. Please check your inputs and try again, or refresh the page."
    };
};

// --- Main App Component ---
const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [jobToolkit, setJobToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [errorCopied, setErrorCopied] = useState(false);
  
  const [isSharedView, setIsSharedView] = useState(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return !!params.get('shareData');
    }
    return false;
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  const handleSubmit = async (data: UserInput) => {
    setIsLoading(true);
    setError(null);
    setJobToolkit(null);
    setUserInput(data);

    try {
      const result = await generateJobToolkit(data);
      setJobToolkit(result);
    } catch (err: any) {
      console.error("App Error:", err);
      let errorMessage = 'An unknown error occurred';
      if (typeof err === 'string') errorMessage = err;
      else if (err instanceof Error) errorMessage = err.message;
      else if (err?.message) errorMessage = err.message;
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateToolkit = (updates: Partial<JobToolkit>) => {
    setJobToolkit(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const handleReset = () => {
    setUserInput(null);
    setJobToolkit(null);
    setError(null);
    setIsLoading(false);
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  const handleRetry = () => {
    if (userInput) {
        handleSubmit(userInput);
    } else {
        handleReset();
    }
  };

  const handleResetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleReset();
    }
  };

  const handleRegenerateRoadmap = async (newRole: string, useThinkingModel: boolean) => {
    if (!userInput) return;
    setError(null);
    try {
      const newRoadmap = await regenerateCareerRoadmap(userInput, newRole, useThinkingModel);
      setJobToolkit((prev) => prev ? ({ ...prev, careerRoadmap: newRoadmap }) : null);
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to update roadmap";
      setError(msg);
    }
  };

  const handleErrorCopy = () => {
      if (error) {
          navigator.clipboard.writeText(error);
          setErrorCopied(true);
          setTimeout(() => setErrorCopied(false), 2000);
      }
  };

  if (isSharedView) {
      return <SharedResumeView />;
  }

  // Derived error data
  const errorInfo = error ? getTroubleshootingData(error) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300">
      
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-40 dark:opacity-5 pointer-events-none z-0"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
          <div className="absolute top-[30%] -right-[20%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-4000 opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
      </div>

      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}

      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer group" 
            onClick={handleReset}
            onKeyDown={handleResetKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Reset Application"
          >
            <LogoIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">JobHero<span className="text-blue-600">.ai</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <button 
                onClick={() => setShowAboutModal(true)} 
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              About
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center relative z-10">
        
        {/* Error Banner */}
        {error && errorInfo && (
            <div className="w-full max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 relative z-50">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border-l-4 border-red-500 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                                    <WarningIcon className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    {errorInfo.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                    {error}
                                </p>
                                
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50 mb-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mr-1">Troubleshooting:</span>
                                        {errorInfo.tip}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button 
                                        onClick={handleRetry}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                        Try Again
                                    </button>
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-sm font-bold rounded-lg transition-colors"
                                    >
                                        Reload Page
                                    </button>
                                    <button 
                                        onClick={handleErrorCopy}
                                        className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition-colors ml-auto"
                                    >
                                        {errorCopied ? 'Copied to Clipboard' : 'Copy Error Details'}
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => setError(null)} 
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                aria-label="Dismiss error"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {!jobToolkit && !isLoading && (
          <div className="w-full max-w-5xl">
            <div className="text-center mb-16 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-8 shadow-sm hover:scale-105 transition-transform cursor-default animate-in fade-in slide-in-from-top-8 duration-700">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                </span>
                <span>Powered by <strong>Gemini 3.0 Flash</strong></span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Stop Applying. <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x bg-[length:200%_auto]">
                    Start Getting Hired.
                </span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                JobHero AI turns your rough notes into a 
                <span className="font-semibold text-slate-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 px-1 rounded mx-1 border border-blue-100 dark:border-blue-800">🏆 professional resume</span>, 
                <span className="font-semibold text-slate-900 dark:text-slate-100 bg-purple-50 dark:bg-purple-900/30 px-1 rounded mx-1 border border-purple-100 dark:border-purple-800">💌 cover letter</span>, and 
                <span className="font-semibold text-slate-900 dark:text-slate-100 bg-green-50 dark:bg-green-900/30 px-1 rounded mx-1 border border-green-100 dark:border-green-800">🎤 interview kit</span> in seconds.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12 text-left">
                {[
                    { icon: "📝", title: "ATS Resume", desc: "Beat the bots", color: "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" },
                    { icon: "💌", title: "Cover Letter", desc: "Instant persuasion", color: "bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800" },
                    { icon: "🎤", title: "Interview Coach", desc: "Real-time Q&A", color: "bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800" },
                    { icon: "🗺️", title: "Career Map", desc: "Your growth plan", color: "bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800" }
                ].map((feature, idx) => (
                    <div 
                        key={idx} 
                        className={`p-4 rounded-xl border ${feature.color} shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-default animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm group`}
                        style={{ animationDelay: `${300 + (idx * 100)}ms` }}
                    >
                        <div className="text-3xl mb-2 filter drop-shadow-sm transform transition-all duration-300 ease-out group-hover:scale-125 group-hover:-translate-y-1 group-hover:rotate-6 motion-safe:group-hover:animate-pulse">
                            {feature.icon}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{feature.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{feature.desc}</div>
                    </div>
                ))}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                 <div className="text-center mb-16 px-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-4xl mx-auto">
                        <div className="hidden md:block absolute top-12 left-16 right-16 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 -z-10"></div>
                        {[
                            { title: "Input Details", desc: "Share your skills, experience, and target role.", icon: "📝" },
                            { title: "AI Analysis", desc: "Gemini 3.0 analyzes your profile & generates content.", icon: "✨" },
                            { title: "Get Hired", desc: "Download toolkit, prep, and ace interviews.", icon: "🚀" }
                        ].map((step, i) => (
                            <div key={i} className="relative flex flex-col items-center group">
                                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full border-4 border-blue-50 dark:border-slate-700 flex items-center justify-center text-4xl shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 z-10">
                                    {step.icon}
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 relative">
                 <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-2xl blur opacity-20 animate-pulse"></div>
                 <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            
            <div className="mt-16 text-center opacity-70 animate-in fade-in duration-1000 delay-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Community Activity</p>
                <div className="inline-flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-6 py-2 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        124 Resumes Generated
                    </span>
                    <span className="hidden sm:inline w-px h-4 bg-slate-300 dark:bg-slate-600"></span>
                    <span className="hidden sm:flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                        89 Cover Letters Drafted
                    </span>
                    <span className="hidden sm:inline w-px h-4 bg-slate-300 dark:bg-slate-600"></span>
                     <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></span>
                        Latest: Senior React Dev @ Uber
                    </span>
                </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div 
            className="flex flex-col items-center justify-center text-center p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700 max-w-lg mx-auto mt-10 animate-in fade-in zoom-in-95 duration-500"
            role="status"
            aria-live="polite"
          >
            <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-100 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">✨</div>
            </div>
            <h2 className="text-3xl font-bold mt-8 text-slate-900 dark:text-white">Crafting Your Career Toolkit</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3 mb-8 text-lg">Our AI is analyzing your profile, writing your resume, and preparing interview questions...</p>
            
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full animate-progress-indeterminate"></div>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Powered by Google Gemini 3.0</p>
          </div>
        )}

        {jobToolkit && userInput && (
             <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
                 <ResultsDisplay 
                    toolkit={jobToolkit} 
                    userInput={userInput} 
                    onReset={handleReset} 
                    onRegenerateRoadmap={handleRegenerateRoadmap}
                    onUpdateToolkit={handleUpdateToolkit}
                 />
             </div>
        )}

      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 text-center relative z-10">
        <div className="container mx-auto px-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                JobHero.ai © {new Date().getFullYear()} • Powered by <span className="text-blue-600 font-bold">Google Gemini 3.0</span>
            </p>
            <p className="text-xs text-slate-400">
                Not affiliated with Google. Resume advice is AI-generated and should be verified.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;