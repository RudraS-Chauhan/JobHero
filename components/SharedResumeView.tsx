import React, { useEffect, useState } from 'react';
import { ResumePreview, TemplateType } from './ResumePreview';
import { LogoIcon } from './icons/LogoIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { TwitterIcon } from './icons/TwitterIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

export const SharedResumeView: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Apply dark mode logic for shared view
    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const encoded = params.get('shareData');
            if (!encoded) {
                setError("No resume data found.");
                return;
            }
            
            // Decode: Base64 -> URI Component -> JSON
            const jsonStr = decodeURIComponent(atob(encoded));
            const parsed = JSON.parse(jsonStr);
            setData(parsed);
        } catch (e) {
            console.error("Failed to decode resume:", e);
            setError("Invalid or expired resume link.");
        }
    }, []);

    const handleSocialShare = (platform: 'linkedin' | 'twitter' | 'facebook') => {
        if (!data) return;
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`Check out ${data.n}'s professional resume created with JobHero AI! 🚀`);
        
        let shareUrl = '';
        if (platform === 'linkedin') {
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        } else if (platform === 'twitter') {
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        } else if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        }
        
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Oops! Link Error</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
                    <a href="/" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        Go to JobHero AI
                    </a>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Resume...</p>
                </div>
            </div>
        );
    }

    const mockUserInput = {
        fullName: data.n,
        email: data.e,
        phone: data.p,
        linkedinGithub: data.l
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                         <LogoIcon className="h-6 w-6 text-blue-600" />
                         <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">JobHero<span className="text-blue-600">.ai</span></span>
                    </div>
                    <a href="/" className="text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors shadow-sm hover:shadow-md">
                        ✨ Create Your Own
                    </a>
                </div>
            </header>

            {/* Resume Content */}
            <main className="flex-grow container mx-auto p-4 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-[850px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 mb-8">
                    {/* ResumePreview is deliberately kept light to simulate paper */}
                    <ResumePreview 
                        text={data.r} 
                        template={data.t as TemplateType} 
                        userInput={mockUserInput} 
                    />
                </div>

                {/* Share Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 w-full max-w-[850px] justify-between">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Share This Profile:</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleSocialShare('linkedin')} className="p-2.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#0077b5] dark:text-[#3b82f6] transition-colors" aria-label="Share on LinkedIn" title="Share on LinkedIn">
                            <LinkedInIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleSocialShare('twitter')} className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-black dark:text-white transition-colors" aria-label="Share on X (Twitter)" title="Share on X (Twitter)">
                            <TwitterIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleSocialShare('facebook')} className="p-2.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-[#1877F2] transition-colors" aria-label="Share on Facebook" title="Share on Facebook">
                            <FacebookIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        
                        <button 
                            onClick={handleCopyLink} 
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                        >
                            {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Generated by JobHero AI powered by Gemini 3.0</p>
                <a href="/" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm">Build your own resume for free →</a>
            </footer>
        </div>
    );
};