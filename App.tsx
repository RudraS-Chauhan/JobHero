import React, { useState } from 'react';
import { UserInput, JobToolkit } from './types';
import { generateJobToolkit, regenerateCareerRoadmap } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { LogoIcon } from './components/icons/LogoIcon';

const HeroSection = () => (
  <div className="text-center mb-16 relative z-10">
    {/* Floating Badge */}
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-blue-200 text-blue-700 text-sm font-semibold mb-8 shadow-sm hover:scale-105 transition-transform cursor-default animate-in fade-in slide-in-from-top-8 duration-700">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
      </span>
      <span>Powered by <strong>Gemini 2.0 Flash</strong></span>
    </div>

    {/* Animated Title */}
    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
      Stop Applying. <br className="hidden sm:block" />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x bg-[length:200%_auto]">
        Start Getting Hired.
      </span>
    </h1>

    {/* Description */}
    <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      JobHero AI turns your rough notes into a 
      <span className="font-semibold text-slate-900 bg-blue-50 px-1 rounded mx-1 border border-blue-100">🏆 professional resume</span>, 
      <span className="font-semibold text-slate-900 bg-purple-50 px-1 rounded mx-1 border border-purple-100">💌 cover letter</span>, and 
      <span className="font-semibold text-slate-900 bg-green-50 px-1 rounded mx-1 border border-green-100">🎤 interview kit</span> in seconds.
    </p>

    {/* Feature Grid with Staggered Animation */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12 text-left">
       {[
          { icon: "📝", title: "ATS Resume", desc: "Beat the bots", color: "bg-blue-50 border-blue-100" },
          { icon: "💌", title: "Cover Letter", desc: "Instant persuasion", color: "bg-purple-50 border-purple-100" },
          { icon: "🎤", title: "Interview Coach", desc: "Real-time Q&A", color: "bg-green-50 border-green-100" },
          { icon: "🗺️", title: "Career Map", desc: "Your growth plan", color: "bg-amber-50 border-amber-100" }
       ].map((feature, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border ${feature.color} shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-default animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards bg-white/80 backdrop-blur-sm group`}
            style={{ animationDelay: `${300 + (idx * 100)}ms` }}
          >
              <div className="text-3xl mb-2 filter drop-shadow-sm transform transition-transform group-hover:scale-110 duration-200">{feature.icon}</div>
              <div className="font-bold text-slate-900 text-sm">{feature.title}</div>
              <div className="text-xs text-slate-500 font-medium">{feature.desc}</div>
          </div>
       ))}
    </div>
  </div>
);

const HowItWorks = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 px-4">
      {[
          { step: "01", title: "Share Your Story", desc: "Enter your raw details, rough notes, or copy-paste your old resume.", icon: "✍️" },
          { step: "02", title: "AI Architect", desc: "Our Gemini 2.0 engine structures, polishes, and keywords your profile.", icon: "🧠" },
          { step: "03", title: "Launch Career", desc: "Download ATS-ready PDFs, prep for interviews, and get the job.", icon: "🚀" }
      ].map((item, i) => (
          <div key={i} className="relative group bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform">
                  {item.step}
              </div>
              <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110 duration-300">{item.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
          </div>
      ))}
  </div>
);

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [jobToolkit, setJobToolkit] = useState<JobToolkit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: UserInput) => {
    setIsLoading(true);
    setError(null);
    setJobToolkit(null);
    setUserInput(data);

    try {
      const result = await generateJobToolkit(data);
      setJobToolkit(result);
    } catch (err: any) {
      // Capture detailed error message for better debugging on Vercel
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
      alert(msg); // Simple alert for roadmap regeneration errors
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col relative overflow-x-hidden">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-40 pointer-events-none z-0"></div>
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl animate-blob opacity-50 mix-blend-multiply"></div>
          <div className="absolute top-[30%] -right-[20%] w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-50 mix-blend-multiply"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-4000 opacity-50 mix-blend-multiply"></div>
      </div>

      <header className="bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleReset}>
            <LogoIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">JobHero<span className="text-blue-600">.ai</span></h1>
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            About
          </a>
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
                <div className="inline-flex items-center gap-6 text-sm text-slate-500 bg-white/50 px-6 py-2 rounded-full border border-slate-200 backdrop-blur-sm">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        124 Resumes Generated
                    </span>
                    <span className="hidden sm:inline w-px h-4 bg-slate-300"></span>
                    <span className="hidden sm:flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                        89 Cover Letters Drafted
                    </span>
                    <span className="hidden sm:inline w-px h-4 bg-slate-300"></span>
                     <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></span>
                        Latest: Senior React Dev @ Uber
                    </span>
                </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 max-w-lg mx-auto mt-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">✨</div>
            </div>
            <h2 className="text-3xl font-bold mt-8 text-slate-900">Crafting Your Career Toolkit</h2>
            <p className="text-slate-500 mt-3 mb-8 text-lg">Our AI is analyzing your profile, writing your resume, and preparing interview questions...</p>
            
            <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full animate-progress-indeterminate"></div>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Powered by Google Gemini 2.0</p>
          </div>
        )}

        {error && (
            <div className="bg-white rounded-xl shadow-xl p-8 text-center border border-red-100 max-w-lg mx-auto mt-10 animate-in shake">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Generation Failed</h3>
                <p className="text-slate-600 mb-6">{error}</p>
                <div className="text-sm text-slate-500 mb-6 bg-slate-50 p-4 rounded-lg text-left border border-slate-100">
                  <strong className="text-slate-700 block mb-2">Troubleshooting:</strong>
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

      <footer className="text-center py-8 text-slate-400 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} JobHero AI. Built for the Future.</p>
      </footer>
      
      <style>{`
        @keyframes progress-indeterminate {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 70%; margin-left: 30%; }
            100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress-indeterminate {
            animation: progress-indeterminate 1.5s infinite linear;
        }
        
        @keyframes gradient-x {
            0%, 100% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
        }
        .animate-gradient-x {
            animation: gradient-x 3s ease infinite;
        }

        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
            animation: blob 10s infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        .animation-delay-4000 {
            animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default App;