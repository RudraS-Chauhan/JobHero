import React, { useState, useEffect } from 'react';
import { UserInput, JobToolkit } from './types';
import { generateJobToolkit, regenerateCareerRoadmap } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { LogoIcon } from './components/icons/LogoIcon';

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

const AboutModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'mission' | 'tech' | 'privacy' | 'contact'>('mission');
    const renderContent = () => {
        switch(activeTab) {
            case 'mission': return (<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl"><h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm uppercase tracking-wide mb-2">Our Core Mission</h4><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">To democratize career success. We believe every student and job seeker deserves access to <strong>executive-level career coaching</strong>, regardless of their background or network.</p></div><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center"><div className="text-2xl mb-1">🚀</div><div className="font-bold text-slate-900 dark:text-white text-xs">Speed</div><div className="text-[10px] text-slate-500">From 0 to Applied in minutes</div></div><div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-center"><div className="text-2xl mb-1">🧠</div><div className="font-bold text-slate-900 dark:text-white text-xs">Intelligence</div><div className="text-[10px] text-slate-500">Powered by Gemini 3.0</div></div></div></div>);
            case 'tech': return (<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"><p className="text-sm text-slate-600 dark:text-slate-400">JobHero.ai leverages the cutting-edge capabilities of <strong>Google's Gemini 3.0 Flash</strong> model.</p><ul className="space-y-3"><li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"><span className="text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1 rounded">⚡</span><div><h5 className="text-xs font-bold text-slate-900 dark:text-white">Reasoning Engine</h5><p className="text-[10px] text-slate-500">Analyses your profile deeply to find transferable skills.</p></div></li><li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"><span className="text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-1 rounded">🛡️</span><div><h5 className="text-xs font-bold text-slate-900 dark:text-white">Secure Processing</h5><p className="text-[10px] text-slate-500">Data is processed ephemerally and returned to your browser.</p></div></li></ul></div>);
            case 'privacy': return (<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl flex gap-3"><div className="text-2xl">🔒</div><div><h4 className="font-bold text-green-900 dark:text-green-300 text-sm mb-1">Local-First Architecture</h4><p className="text-xs text-green-800 dark:text-green-400 leading-relaxed">We do not store your personal data on our servers. Your resume data lives in your browser's local storage and is sent to the AI model only for generation.</p></div></div></div>);
            case 'contact': return (<div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Developer & Support</p><div className="space-y-3"><a href="mailto:rudrasinghchauhan2007@gmail.com" className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors group"><span className="text-lg group-hover:scale-110 transition-transform">📧</span><div className="flex flex-col"><span className="text-sm text-slate-900 dark:text-white font-bold">Rudra Singh Chauhan</span><span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">rudrasinghchauhan2007@gmail.com</span></div></a></div></div><button onClick={() => window.open('mailto:rudrasinghchauhan2007@gmail.com')} className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">Contact Developer</button></div>);
        }
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50"><h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><LogoIcon className="h-6 w-6 text-blue-600" />About JobHero<span className="text-blue-600">.ai</span></h3><button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">✕</button></div>
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2">{['mission', 'tech', 'privacy', 'contact'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}>{tab}{activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}</button>))}</div>
                <div className="p-6 overflow-y-auto">{renderContent()}</div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center"><p className="text-[10px] text-slate-400">JobHero AI © {new Date().getFullYear()}. Created by Rudra Singh Chauhan.</p></div>
            </div>
        </div>
    );
};

const getTroubleshootingData = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes('api key') || msg.includes('401')) return { title: "API Authentication Error", tip: "Your API key is missing or invalid. Check your VITE_API_KEY in Vercel settings or .env file." };
    if (msg.includes('429') || msg.includes('quota')) return { title: "Rate Limit Exceeded", tip: "The AI model is on a free tier. Please wait about 60 seconds before trying again." };
    if (msg.includes('503') || msg.includes('overloaded')) return { title: "Server Overloaded", tip: "Google's AI servers are currently busy. Click 'Try Again' in a few moments." };
    if (msg.includes('network') || msg.includes('fetch')) return { title: "Connection Failed", tip: "Unable to reach the AI service. Check your internet connection or disable aggressive VPNs." };
    if (msg.includes('safety') || msg.includes('blocked')) return { title: "Content Blocked", tip: "The AI flagged the input as sensitive. Ensure your profile descriptions are professional." };
    return { title: "Unexpected AI Glitch", tip: "Something went wrong during generation. Retrying usually fixes temporary AI hiccups." };
};

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [jobToolkit, setJobToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true); document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false); document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) { document.documentElement.classList.remove('dark'); localStorage.theme = 'light'; setIsDarkMode(false); }
    else { document.documentElement.classList.add('dark'); localStorage.theme = 'dark'; setIsDarkMode(true); }
  };

  const handleSubmit = async (data: UserInput) => {
    setIsLoading(true); setError(null); setJobToolkit(null); setUserInput(data);
    try { const result = await generateJobToolkit(data); setJobToolkit(result); } 
    catch (err: any) { setError(err.message || 'An unknown error occurred'); } 
    finally { setIsLoading(false); }
  };

  const handleUpdateToolkit = (updates: Partial<JobToolkit>) => { setJobToolkit(prev => prev ? ({ ...prev, ...updates }) : null); };
  
  const handleRegenerateRoadmap = async (newRole: string, useThinkingModel: boolean) => {
    if (!userInput) return;
    try {
      const roadmap = await regenerateCareerRoadmap(userInput, newRole, useThinkingModel);
      setJobToolkit(prev => prev ? { ...prev, careerRoadmap: roadmap } : null);
    } catch (err: any) {
      setError(err.message || "Failed to update roadmap");
    }
  };

  const handleReset = () => { setUserInput(null); setJobToolkit(null); setError(null); setIsLoading(false); };
  const handleRetry = () => { if (userInput) handleSubmit(userInput); else handleReset(); };

  const errorInfo = error ? getTroubleshootingData(error) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300">
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleReset}><LogoIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" /><h1 className="text-xl font-bold text-slate-900 dark:text-white">JobHero<span className="text-blue-600">.ai</span></h1></div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors">{isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}</button>
            <button onClick={() => setShowAboutModal(true)} className="text-sm font-medium text-slate-500 hover:text-blue-600">About</button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-8 flex flex-col items-center relative z-10">
        {error && errorInfo && (
            <div className="w-full max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-l-4 border-red-500 p-6 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
                    <button onClick={() => setError(null)} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600"><WarningIcon className="w-6 h-6" /></div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{errorInfo.title}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">{error}</p>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 mb-4"><p className="text-xs text-slate-500"><strong>Quick Fix:</strong> {errorInfo.tip}</p></div>
                        <div className="flex gap-3"><button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">Retry Now</button><button onClick={() => setError(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg hover:bg-slate-300 transition-colors">Dismiss</button></div>
                    </div>
                </div>
            </div>
        )}
        
        {!jobToolkit && !isLoading && (
            <div className="w-full max-w-5xl text-center">
                <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Master Your Job Search.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Hireable in Minutes.</span></h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12">Universal career intelligence for students. 1st year to Final year — we help you build high-impact profiles.</p>
                <div className="relative mb-20"><InputForm onSubmit={handleSubmit} isLoading={isLoading} /></div>
            </div>
        )}
        
        {isLoading && (
          <div className="flex flex-col items-center text-center p-12 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg mx-auto mt-10 animate-in zoom-in-95">
            <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin flex items-center justify-center text-4xl">✨</div>
            <h2 className="text-2xl font-bold mt-8 text-slate-900 dark:text-white">AI Strategy Engine Working...</h2>
            <p className="text-slate-500 mt-3 mb-8">Analyzing profile and crafting bespoke templates for your target role.</p>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-3 overflow-hidden"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full animate-progress-indeterminate"></div></div>
          </div>
        )}

        {jobToolkit && userInput && (
             <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
                 <ResultsDisplay toolkit={jobToolkit} userInput={userInput} onReset={handleReset} onRegenerateRoadmap={handleRegenerateRoadmap} onUpdateToolkit={handleUpdateToolkit} />
             </div>
        )}
      </main>
      <footer className="py-8 text-center text-xs text-slate-400">JobHero.ai © {new Date().getFullYear()} • Powered by Gemini 3.0</footer>
    </div>
  );
};

export default App;