import React, { useState, useEffect } from 'react';
import { UserInput, JobToolkit } from './types';
import { generateJobToolkit } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { SharedResumeView } from './components/SharedResumeView';
import { LogoIcon } from './components/icons/LogoIcon';

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>;

const AboutModal = ({ onClose }: { onClose: () => void }) => {
    const [contactEmail, setContactEmail] = useState("");
    const [validationMsg, setValidationMsg] = useState("");

    const handleSend = () => {
        if (!contactEmail.trim()) {
            setValidationMsg("Email address is required.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            setValidationMsg("Please enter a valid email.");
            return;
        }
        setValidationMsg("");
        window.location.href = `mailto:rudrasinghchauhan2007@gmail.com?subject=AtlasCV Inquiry&body=Contact Email: ${contactEmail}`;
    };

    return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl">✕</button>
            <h2 className="text-4xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">System Intel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                    <div className="text-3xl mb-4">🚀</div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-blue-600 mb-2">Mission</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Helping 10k+ students turn their degrees into dream careers with AI-led strategy.</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <div className="text-3xl mb-4">🧠</div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">Technology</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Built on Gemini 3.1 Neural Engines for zero-latency career synthesis.</p>
                </div>
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-800/50">
                    <div className="text-3xl mb-4">🔒</div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-green-600 mb-2">Privacy</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">No data storage. Your professional info remains strictly on your device.</p>
                </div>
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-800/50 flex flex-col justify-between">
                    <div>
                        <div className="text-3xl mb-4">📬</div>
                        <h4 className="font-black text-xs uppercase tracking-widest text-amber-600 mb-2">Contact Us</h4>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 break-all">rudrasinghchauhan2007@gmail.com</p>
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Your Email</label>
                            <input 
                                type="email" 
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full p-2 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200"
                            />
                            {validationMsg && <p className="text-[10px] text-red-500 font-bold">{validationMsg}</p>}
                        </div>
                    </div>
                    <button onClick={handleSend} className="mt-4 px-4 py-3 bg-amber-500 text-white text-center rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg w-full">Send Message</button>
                </div>
            </div>
        </div>
    </div>
    );
};

const parseError = (err: any) => {
    const msg = err?.message || String(err);
    if (msg.includes('401') || msg.includes('API key') || msg.includes('unauthenticated')) {
        return { 
            title: 'Authentication Error', 
            desc: 'The API Key provided is invalid or expired.', 
            tip: 'Check your .env file or environment variables settings.' 
        };
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
        return { 
            title: 'Rate Limit Reached', 
            desc: 'Too many requests sent in a short period.', 
            tip: 'Please wait a minute before trying again.' 
        };
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return { 
            title: 'Network Connection', 
            desc: 'Unable to reach Google AI servers.', 
            tip: 'Check your internet connection or firewall.' 
        };
    }
    if (msg.includes('503') || msg.includes('overloaded')) {
        return { 
            title: 'Server Overloaded', 
            desc: 'Google Gemini is currently experiencing high traffic.', 
            tip: 'Try again in 10-15 seconds.' 
        };
    }
    if (msg.includes('candidate')) {
         return {
            title: 'Safety Filter Triggered',
            desc: 'The AI detected sensitive or unsafe content in your input.',
            tip: 'Ensure your project descriptions and bio are professional.'
         }
    }
    return { 
        title: 'Synthesis Failed', 
        desc: 'An unexpected error occurred during generation.', 
        tip: 'Try simplifying your inputs or refreshing the page.' 
    };
};

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [toolkit, setToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{title: string, desc: string, tip: string} | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showAbout, setShowAbout] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shareData')) {
        setIsSharedView(true);
    }
  }, []);

  const toggleTheme = () => {
    const isNowDark = !isDark;
    setIsDark(isNowDark);
    document.documentElement.classList.toggle('dark', isNowDark);
    localStorage.theme = isNowDark ? 'dark' : 'light';
  };

  const handleSubmit = async (data: UserInput) => {
    setIsLoading(true); 
    setErrorDetails(null); 
    setToolkit(null); 
    setUserInput(data);
    
    try {
        const result = await generateJobToolkit(data);
        setToolkit(result);
    } catch (e: any) { 
        console.error(e);
        setErrorDetails(parseError(e));
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleUpdate = (u: Partial<JobToolkit>) => setToolkit(prev => prev ? ({ ...prev, ...u }) : null);

  if (isSharedView) {
      return <SharedResumeView />;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#020617] text-slate-800 dark:text-slate-200 transition-colors duration-500 overflow-x-hidden">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { if(!isLoading) { setToolkit(null); setUserInput(null); } }}>
            <div className="bg-blue-600 p-1.5 rounded-xl"><LogoIcon className="h-6 w-6 text-white" /></div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">AtlasCV</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAbout(true)} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">About</button>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all">
                {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-6 flex flex-col items-center">
        {errorDetails && (
            <div className="w-full max-w-4xl mb-10 animate-in fade-in slide-in-from-top-4">
                <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-6 rounded-r-xl relative shadow-sm border border-red-100 dark:border-red-900/20">
                    <button 
                        onClick={() => setErrorDetails(null)} 
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-2"
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="text-2xl mt-0.5">⚠️</div>
                        <div>
                            <h3 className="text-red-800 dark:text-red-200 font-bold text-lg mb-1">{errorDetails.title}</h3>
                            <p className="text-red-700 dark:text-red-300 text-sm mb-3 font-medium">{errorDetails.desc}</p>
                            <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wide">
                                <span>💡</span> <span>Tip: {errorDetails.tip}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {!toolkit && !isLoading && (
            <div className="w-full max-w-5xl text-center flex flex-col items-center animate-in fade-in duration-1000">
                <div className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-8">Stop Applying. Start Getting Hired.</div>
                <h1 className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-16">
                    Break Into the Industry. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">High-Impact AI Synthesis.</span>
                </h1>
                <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center text-center p-20 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-xl w-full mx-auto mt-20 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
             <h2 className="text-3xl font-black mt-8 text-slate-900 dark:text-white">Synthesizing...</h2>
             <p className="text-slate-500 mt-4 font-medium italic">Architecting your selection strategy in real-time.</p>
          </div>
        )}

        {toolkit && userInput && !isLoading && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
            <ResultsDisplay toolkit={toolkit} userInput={userInput} onReset={() => { setToolkit(null); setUserInput(null); }} onUpdateToolkit={handleUpdate} />
          </div>
        )}
      </main>
      
      <footer className="py-12 text-center opacity-40">
        <p className="text-xs font-black uppercase tracking-[0.3em] mb-2">AtlasCV System Stable 3.4.0</p>
        <p className="text-xs font-bold text-slate-400">© 2025 AtlasCV. Lead Engineer Rudra Singh Chauhan.</p>
      </footer>
    </div>
  );
};

export default App;