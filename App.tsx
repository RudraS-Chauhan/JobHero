import React, { useState, useEffect } from 'react';
import { UserInput, JobToolkit } from './types';
import { generateJobToolkit, regenerateCareerRoadmap } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { LogoIcon } from './components/icons/LogoIcon';
import { SharedResumeView } from './components/SharedResumeView';

// Icons for Dark Mode Toggle
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

const ContactForm = () => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        
        // Simulate network delay before opening mail client
        setTimeout(() => {
            const subject = encodeURIComponent(`Support Request: ${form.name}`);
            const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
            window.location.href = `mailto:rudrasinghchauhan2007@gmail.com?subject=${subject}&body=${body}`;
            setStatus('success');
            setForm({ name: '', email: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
            {status === 'success' ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-bold text-center animate-in fade-in">
                    ✅ Message prepared! Opening your email client...
                </div>
            ) : (
                <>
                    <input 
                        type="text" 
                        placeholder="Your Name" 
                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        required
                    />
                    <input 
                        type="email" 
                        placeholder="Your Email" 
                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        required
                    />
                    <textarea 
                        placeholder="How can we help?" 
                        rows={3}
                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                        value={form.message}
                        onChange={e => setForm({...form, message: e.target.value})}
                        required
                    />
                    <button 
                        type="submit" 
                        disabled={status === 'submitting'}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                </>
            )}
        </form>
    );
};

const HeroSection = () => (
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
);

const HowItWorks = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 px-4">
      {[
          { step: "01", title: "Share Your Story", desc: "Enter your raw details, rough notes, or copy-paste your old resume.", icon: "✍️" },
          { step: "02", title: "AI Architect", desc: "Our Gemini 3.0 engine structures, polishes, and keywords your profile.", icon: "🧠" },
          { step: "03", title: "Launch Career", desc: "Download ATS-ready PDFs, prep for interviews, and get the job.", icon: "🚀" }
      ].map((item, i) => (
          <div key={i} className="relative group bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform">
                  {item.step}
              </div>
              <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110 duration-300">{item.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
      ))}
  </div>
);

// Expanded Error Handling Helpers
const getTroubleshootingTips = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    
    // API Configuration
    if (msg.includes('api key')) return "The API Key is missing or invalid. Please check your environment variables (.env file) or Vercel/Netlify configuration.";
    
    // Server/Network Issues
    if (msg.includes('429') || msg.includes('quota')) return "You have exceeded the API rate limit (Quota Exceeded). The free tier allows limited requests per minute. Please wait 60 seconds and try again.";
    if (msg.includes('503') || msg.includes('overloaded')) return "Google's AI servers are currently overloaded due to high global traffic. This is temporary. Please wait 1-2 minutes and retry.";
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) return "We couldn't reach the AI servers. Please check your internet connection. If you are using a VPN or Ad-blocker, try disabling them.";
    
    // Content & Parsing Issues
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('candidate')) return "The AI flagged your input as potentially unsafe or sensitive. Please revise your content to be more professional and remove any controversial or explicit language.";
    if (msg.includes('json') || msg.includes('parse') || msg.includes('syntax')) return "The AI returned a malformed response, likely due to a complex request. Please click 'Try Again' to regenerate.";
    if (msg.includes('400') || msg.includes('invalid argument')) return "The request was invalid. This often happens if the input text is too long or contains unsupported characters. Try shortening your entries.";
    if (msg.includes('404') || msg.includes('not found')) return "The requested AI model version may be deprecated or unavailable in your region. Please contact support.";
    
    return "Please verify all input fields are filled correctly. If the issue persists, try refreshing the page or clearing your browser cache.";
};

const getErrorTitle = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes('api key')) return "Configuration Error";
    if (msg.includes('network') || msg.includes('fetch')) return "Connection Failed";
    if (msg.includes('429') || msg.includes('quota')) return "Rate Limit Exceeded";
    if (msg.includes('503') || msg.includes('overloaded')) return "Service Overloaded";
    if (msg.includes('safety') || msg.includes('blocked')) return "Content Flagged";
    if (msg.includes('json') || msg.includes('parse')) return "Generation Error";
    if (msg.includes('400')) return "Invalid Request";
    return "Something went wrong";
};

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [jobToolkit, setJobToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
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
      // Ensure we always have a string error message
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

  if (isSharedView) {
      return <SharedResumeView />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300">
      
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-40 dark:opacity-5 pointer-events-none z-0"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
          <div className="absolute top-[30%] -right-[20%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-4000 opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
      </div>

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
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              About
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center relative z-10">
        
        {!jobToolkit && !isLoading && (
          <div className="w-full max-w-5xl">
            <HeroSection />
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                 <HowItWorks />
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

        {error && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 border-l-4 border-red-500 max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-top-4 relative z-40 ring-1 ring-slate-900/5" role="alert">
                <button 
                  onClick={() => setError(null)} 
                  className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Dismiss error"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 shrink-0 relative mt-1">
                        {error.toLowerCase().includes('safety') ? (
                             <span className="text-xl">🛡️</span>
                        ) : error.toLowerCase().includes('network') ? (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.5 10.5L3 3m18 0l-7.5 7.5M4.5 4.5l1.5 1.5m12 12l1.5 1.5" />
                            </svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{getErrorTitle(error)}</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm leading-relaxed font-mono bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-100 dark:border-slate-800 break-words">{error}</p>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2 flex items-center gap-1">
                              <span>💡</span> Troubleshooting Tip
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{getTroubleshootingTips(error)}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {!jobToolkit && (
                              <button
                                  onClick={handleRetry}
                                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors shadow-sm"
                              >
                                  ↻ Try Again
                              </button>
                            )}
                            <button
                                onClick={() => {
                                    const subject = encodeURIComponent("App Error Report");
                                    const body = encodeURIComponent(`Error Details:\n${error}\n\nTime: ${new Date().toISOString()}`);
                                    window.location.href = `mailto:rudrasinghchauhan2007@gmail.com?subject=${subject}&body=${body}`;
                                }}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {jobToolkit && userInput && !isLoading && (
          <ResultsDisplay 
            toolkit={jobToolkit}
            userInput={userInput}
            onReset={handleReset} 
            onRegenerateRoadmap={handleRegenerateRoadmap}
            onUpdateToolkit={handleUpdateToolkit}
          />
        )}
      </main>

      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                    <div className="flex items-center space-x-2 mb-6">
                        <LogoIcon className="h-8 w-8 text-blue-600" />
                        <span className="font-bold text-slate-900 dark:text-white text-xl">JobHero<span className="text-blue-600">.ai</span></span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        The #1 AI-powered career assistant helping students and freshers land their dream jobs with professional tools and guidance.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Contact Support</h3>
                    <p className="text-sm text-slate-500 mb-2">Have a question or billing issue? Drop us a message directly.</p>
                    <ContactForm />
                </div>

                 <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Legal & Resources</h3>
                    <div className="flex flex-col gap-3">
                        <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
                        <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Refund Policy</a>
                        <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQs</a>
                        
                        <div className="mt-6">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Direct Email</h4>
                            <a href="mailto:rudrasinghchauhan2007@gmail.com" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                rudrasinghchauhan2007@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 mt-12 pt-8 text-center text-sm text-slate-400">
                &copy; {new Date().getFullYear()} JobHero AI. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;