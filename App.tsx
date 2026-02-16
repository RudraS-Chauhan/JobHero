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

const getTroubleshootingData = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes('api key') || msg.includes('401')) {
        return { 
            title: "API Authorization Failed", 
            tip: "The system's API key is missing or invalid. Action: Please check your environment variables (VITE_API_KEY) or contact the administrator.",
            color: "red"
        };
    }
    if (msg.includes('quota') || msg.includes('429') || msg.includes('limit')) {
        return { 
            title: "Rate Limit Exceeded", 
            tip: "The AI model is handling high traffic. Action: Wait for 60 seconds and try generating your toolkit again.",
            color: "amber"
        };
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline') || msg.includes('timeout')) {
        return { 
            title: "Connection Interrupted", 
            tip: "Network request timed out. Action: Check your WiFi/Mobile data and disable any VPNs that might interfere with API calls.",
            color: "blue"
        };
    }
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('finish_reason: safety')) {
        return { 
            title: "Content Generation Blocked", 
            tip: "Gemini's safety filters flagged the input. Action: Ensure your project descriptions and profile goals use standard, professional language.",
            color: "purple"
        };
    }
    return { 
        title: "AI Synthesis Error", 
        tip: "An unexpected error occurred in the reasoning engine. Action: Click 'Retry Now' to restart the process. This is often a transient issue.",
        color: "slate"
    };
};

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [jobToolkit, setJobToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

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
    try { 
        const result = await generateJobToolkit(data); 
        setJobToolkit(result); 
    } catch (err: any) { 
        setError(err.message || 'An unexpected error occurred during profile synthesis.'); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleUpdateToolkit = (updates: Partial<JobToolkit>) => { 
    setJobToolkit(prev => prev ? ({ ...prev, ...updates }) : null); 
  };
  
  const handleRegenerateRoadmap = async (newRole: string, useThinkingModel: boolean) => {
    if (!userInput) return;
    try {
      const roadmap = await regenerateCareerRoadmap(userInput, newRole, useThinkingModel);
      setJobToolkit(prev => prev ? { ...prev, careerRoadmap: roadmap } : null);
    } catch (err: any) {
      setError(err.message || "Failed to update strategic roadmap.");
    }
  };

  const handleReset = () => { setUserInput(null); setJobToolkit(null); setError(null); setIsLoading(false); };
  const handleRetry = () => { if (userInput) handleSubmit(userInput); else handleReset(); };

  const errorInfo = error ? getTroubleshootingData(error) : null;

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#020617] text-slate-800 dark:text-slate-200 font-sans flex flex-col relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-blue-600 p-1.5 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
                JobHero<span className="text-blue-600">.ai</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all">
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center relative z-10">
        {/* ACTIONABLE Error Handler UI */}
        {error && errorInfo && (
            <div className="w-full max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-top-6 duration-500">
                <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-l-8 ${errorInfo.color === 'red' ? 'border-red-500' : errorInfo.color === 'amber' ? 'border-amber-500' : errorInfo.color === 'blue' ? 'border-blue-500' : 'border-purple-500'} p-8 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden group`}>
                    <button onClick={() => setError(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" aria-label="Dismiss error">✕</button>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl shrink-0">
                        <WarningIcon className={`w-8 h-8 ${errorInfo.color === 'red' ? 'text-red-500' : errorInfo.color === 'amber' ? 'text-amber-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{errorInfo.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed font-medium">Model Response: <span className="italic">"{error}"</span></p>
                        
                        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><LogoIcon className="w-12 h-12" /></div>
                            <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span> Recommended Action
                            </h4>
                            <p className="text-sm text-slate-800 dark:text-slate-200 font-bold leading-relaxed">{errorInfo.tip}</p>
                        </div>
                        
                        <div className="flex gap-4">
                            <button onClick={handleRetry} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-2xl transition-all active:scale-95">Retry Now</button>
                            <button onClick={() => setError(null)} className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Dismiss</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {!jobToolkit && !isLoading && (
            <div className="w-full max-w-5xl text-center flex flex-col items-center">
                <div className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6 animate-bounce">
                    New: High-Precision Career Synthesis
                </div>
                <h1 className="text-6xl sm:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-8">
                    Your Career, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Architected by AI.</span>
                </h1>
                <p className="text-xl sm:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
                    Personalized strategy for students and freshers. 
                    Bridges the gap between your current skills and target role.
                </p>
                <div className="w-full relative animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                    <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
                </div>
            </div>
        )}
        
        {isLoading && (
          <div className="flex flex-col items-center text-center p-16 bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] max-w-xl w-full mx-auto mt-12 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500">
            <div className="relative">
                <div className="w-32 h-32 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🚀</div>
            </div>
            <h2 className="text-3xl font-black mt-10 text-slate-900 dark:text-white tracking-tight">Synthesizing Strategy</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 mb-10 font-medium text-lg leading-relaxed">
                Analyzing skill gaps and architecting your professional roadmap...
            </p>
            <div className="w-full space-y-3">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 rounded-full animate-progress-indeterminate shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Optimizing for ATS Algorithms</p>
            </div>
          </div>
        )}

        {jobToolkit && userInput && (
             <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 w-full">
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
      
      <footer className="py-12 text-center">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.3em] mb-2 opacity-50">System Version 3.1.2</p>
        <p className="text-xs text-slate-400 font-medium">JobHero.ai • Powered by Google DeepMind Gemini • Built for Career Excellence.</p>
      </footer>
    </div>
  );
};

export default App;
