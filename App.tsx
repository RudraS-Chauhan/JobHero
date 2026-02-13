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

const HeroSection = () => (
  <div className="text-center mb-16 relative z-10">
    {/* Floating Badge */}
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-8 shadow-sm hover:scale-105 transition-transform cursor-default animate-in fade-in slide-in-from-top-8 duration-700">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
      </span>
      <span>Powered by <strong>Gemini 3.0 Flash</strong></span>
    </div>

    {/* Animated Title */}
    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
      Stop Applying. <br className="hidden sm:block" />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x bg-[length:200%_auto]">
        Start Getting Hired.
      </span>
    </h1>

    {/* Description */}
    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      JobHero AI turns your rough notes into a 
      <span className="font-semibold text-slate-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 px-1 rounded mx-1 border border-blue-100 dark:border-blue-800">🏆 professional resume</span>, 
      <span className="font-semibold text-slate-900 dark:text-slate-100 bg-purple-50 dark:bg-purple-900/30 px-1 rounded mx-1 border border-purple-100 dark:border-purple-800">💌 cover letter</span>, and 
      <span className="font-semibold text-slate-900 dark:text-slate-100 bg-green-50 dark:bg-green-900/30 px-1 rounded mx-1 border border-green-100 dark:border-green-800">🎤 interview kit</span> in seconds.
    </p>

    {/* Feature Grid with Staggered Animation */}
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

const App: React.FC = () => {
  // Check for shared resume view based on URL params
  if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('shareData')) {
          return <SharedResumeView />;
      }
  }

  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [jobToolkit, setJobToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize Theme
  useEffect(() => {
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("App Error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUserInput(null);
    setJobToolkit(null);
    setError(null);
    setIsLoading(false);
  };

  const handleRegenerateRoadmap = async (newRole: string, useThinkingModel: boolean) => {
    if (!userInput) return;
    try {
      const newRoadmap = await regenerateCareerRoadmap(userInput, newRole, useThinkingModel);
      setJobToolkit((prev) => prev ? ({ ...prev, careerRoadmap: newRoadmap }) : null);
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to update roadmap";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-40 dark:opacity-5 pointer-events-none z-0"></div>
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
          <div className="absolute top-[30%] -right-[20%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-4000 opacity-50 mix-blend-multiply dark:mix-blend-normal"></div>
      </div>

      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleReset}>
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
            
            {/* Social Proof / Ticker */}
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 text-center border border-red-100 dark:border-red-900/30 max-w-lg mx-auto mt-10 animate-in shake" role="alert">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generation Failed</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-left border border-slate-100 dark:border-slate-700">
                  <strong className="text-slate-700 dark:text-slate-300 block mb-2">Troubleshooting:</strong>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Check your API Key configuration.</li>
                    <li>The AI might be busy (quota exceeded). Wait 1 min.</li>
                    <li>Try shorter input text.</li>
                  </ul>
                </div>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                >
                    Try Again
                </button>
            </div>
        )}

        {jobToolkit && userInput && !isLoading && (
          <ResultsDisplay 
            toolkit={jobToolkit}
            userInput={userInput}
            onReset={handleReset} 
            onRegenerateRoadmap={handleRegenerateRoadmap} 
          />
        )}
      </main>

      <footer className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} JobHero AI. Built for the Future.</p>
      </footer>
    </div>
  );
};

export default App;