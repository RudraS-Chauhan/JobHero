import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { JobToolkit, ResumeAnalysis, UserInput } from '../types';
import { analyzeResume, generateEliteTools } from '../services/geminiService';
import { ResumePreview, TemplateType } from './ResumePreview';
import { ResumeIcon } from './icons/ResumeIcon';
import { CoverLetterIcon } from './icons/CoverLetterIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { InterviewIcon } from './icons/InterviewIcon';
import { RoadmapIcon } from './icons/RoadmapIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { TechIcon } from './icons/TechIcons';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface ResultsDisplayProps {
  toolkit: JobToolkit;
  userInput: UserInput;
  onReset: () => void;
  onRegenerateRoadmap: (newRole: string, useThinkingModel: boolean) => Promise<void>;
  onUpdateToolkit: (updates: Partial<JobToolkit>) => void;
}

type Tab = 'resume' | 'coverLetter' | 'linkedin' | 'interview' | 'roadmap' | 'elite';

const tabs: { id: Tab; name: string; icon: any }[] = [
  { id: 'resume', name: 'Resume', icon: ResumeIcon },
  { id: 'coverLetter', name: 'Cover Letter', icon: CoverLetterIcon },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
  { id: 'interview', name: 'Mock Interview', icon: InterviewIcon },
  { id: 'roadmap', name: 'Career Roadmap', icon: RoadmapIcon },
  { id: 'elite', name: 'Elite Tools', icon: () => <span className="text-lg">⚡</span> },
];

const Tooltip = ({ text, children, position = 'top' }: { text: string; children?: React.ReactNode; position?: 'top' | 'bottom' }) => (
  <div className="relative group">
    {children}
    <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-50 shadow-md transition-opacity duration-200`}>
      {text}
      <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${position === 'top' ? 'top-full border-t-slate-800' : 'bottom-full border-b-slate-800'}`}></div>
    </div>
  </div>
);

const AnalysisList = ({ title, items, type }: { title: string, items: string[], type: 'strength' | 'improvement' }) => (
    <div className={`p-4 rounded-xl border h-full ${type === 'strength' ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
        <h4 className={`font-bold text-sm mb-3 flex items-center gap-2 ${type === 'strength' ? 'text-green-800 dark:text-green-400' : 'text-amber-800 dark:text-amber-400'}`}>
            {type === 'strength' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            {title}
        </h4>
        <ul className="space-y-2">
            {items?.length > 0 ? items.map((item, i) => (
                <li key={i} className={`text-xs leading-relaxed flex items-start gap-2 ${type === 'strength' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    <span className="mt-0.5">•</span>
                    {item}
                </li>
            )) : <li className="text-xs text-slate-400 italic">No items detected.</li>}
        </ul>
    </div>
);

const FormatCoverLetter: React.FC<{ text: string }> = ({ text }) => {
    // Split text by bracketed placeholders like [Date], [Company Name]
    const parts = text.split(/(\[.*?\])/g);

    return (
        <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 font-serif text-base">
            {parts.map((part, i) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    return (
                        <span 
                            key={i} 
                            contentEditable
                            suppressContentEditableWarning
                            className="bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded border border-dashed border-amber-400 dark:border-amber-600 font-bold mx-1 shadow-sm transition-all hover:scale-105 cursor-text focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            title="Editable Placeholder - Type directly"
                        >
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
};

const RoadmapStepItem: React.FC<{ step: any, index: number }> = ({ step, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div 
            className="relative pl-8 sm:pl-32 py-3 group focus:outline-none"
        >
            {/* Timeline Line */}
            <div className="absolute left-2 sm:left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-400 dark:group-hover:bg-blue-600 transition-colors"></div>
            
            {/* Timeline Dot */}
            <div className={`absolute left-[0.2rem] sm:-left-[0.35rem] top-6 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-all duration-300 z-10 ${isExpanded ? 'bg-blue-600 scale-125 ring-4 ring-blue-100 dark:ring-blue-900/30' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 group-hover:scale-110'}`}></div>

            {/* Time Label (Desktop) */}
            <div className={`hidden sm:block absolute left-4 w-24 text-right top-5 text-xs font-bold transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                {step.duration}
            </div>

            {/* Content Card */}
            <div 
                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                    isExpanded 
                        ? 'shadow-lg border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/30' 
                        : 'shadow-sm border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`Expand step ${index + 1}: ${step.title}`}
            >
                <div className="p-5 flex justify-between items-center">
                    <div>
                        <div className="sm:hidden text-xs font-bold text-blue-600 mb-1">{step.duration}</div>
                        <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white group-hover:text-blue-600'}`}>{step.title}</h3>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{step.phase}</div>
                    </div>
                    <div className={`p-2 rounded-full transition-all duration-300 ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 rotate-180' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 group-hover:text-blue-500'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>
                
                <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-700/50 mt-2 bg-slate-50/50 dark:bg-slate-800/50">
                             <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 mt-4">{step.description}</p>
                             <div className="flex flex-wrap gap-2">
                                {step.tools?.map((tool: string, t: number) => (
                                    <span key={t} className="px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 shadow-sm">
                                        <TechIcon name={tool} className="w-3.5 h-3.5" />
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SuccessModal = ({ email, transactionId }: { email: string, transactionId: string }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                 <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-100"></div>
                 <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping delay-200"></div>
            </div>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 relative z-10">You're In! 🚀</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4 relative z-10">Elite Day Pass Activated (24 Hours).</p>
            
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-left relative z-10">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-lg">🧾</span>
                    <span className="text-xs font-bold uppercase text-slate-500">Invoice Sent Automatically</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p>To: <span className="font-semibold text-slate-900 dark:text-white">{email}</span></p>
                    <p>Txn ID: <span className="font-mono text-blue-600 dark:text-blue-400">{transactionId}</span></p>
                    <p className="text-green-600 dark:text-green-500 font-medium">Status: Paid (₹25)</p>
                </div>
            </div>
        </div>
    </div>
);

const ActionButtons: React.FC<{ 
    textToCopy: string; 
    onDownloadPDF?: () => void; 
    onShare?: () => void;
    templateSelector?: React.ReactNode 
}> = ({ textToCopy, onDownloadPDF, onShare, templateSelector }) => {
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleShare = () => {
        if (onShare) {
            onShare();
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4 sm:mb-0">
            {templateSelector}
            <div className="flex gap-2">
                {onShare && (
                     <Tooltip text={shared ? "Link Copied!" : "Get Shareable Link"} position="bottom">
                        <button onClick={handleShare} className="bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 p-2 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm transition-colors" aria-label="Share">
                            {shared ? <CheckIcon className="h-5 w-5" /> : <ShareIcon className="h-5 w-5" />}
                        </button>
                    </Tooltip>
                )}
                {onDownloadPDF && (
                    <Tooltip text="Download as PDF" position="bottom">
                        <button onClick={onDownloadPDF} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm" aria-label="Download PDF">
                            <DownloadIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                )}
                <Tooltip text="Copy to Clipboard" position="bottom">
                    <button onClick={handleCopy} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm" aria-label="Copy to Clipboard">
                        {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

const ProUpsellCard: React.FC<{ description: string; onUnlock: () => void }> = ({ description, onUnlock }) => (
    <div className="mt-10 bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-6 relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all border border-slate-700" onClick={onUnlock}>
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-2 tracking-wide">
                    <span className="bg-amber-400/20 text-amber-300 p-1 rounded-lg">👑</span>
                    ELITE DAY PASS
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{description}</p>
            </div>
            <button className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-sm rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5 transition-all">
                Unlock 24 Hours - ₹25
            </button>
        </div>
    </div>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ toolkit, userInput, onReset, onRegenerateRoadmap, onUpdateToolkit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isRegeneratingRoadmap, setIsRegeneratingRoadmap] = useState(false);
  const [useThinkingModel, setUseThinkingModel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Classic');
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingElite, setIsGeneratingElite] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedHeadlineIndex, setCopiedHeadlineIndex] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        const expiryStr = localStorage.getItem('jobHero_proExpiry');
        if (expiryStr) {
             const diff = parseInt(expiryStr, 10) - Date.now();
             if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                const h = hours.toString().padStart(2, '0');
                const m = minutes.toString().padStart(2, '0');
                const s = seconds.toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
             }
        }
    }
    return "";
  });
  
  // State for LinkedIn Headline Swapping
  const [currentHeadline, setCurrentHeadline] = useState(toolkit.linkedin.headline);

  const [isProMember, setIsProMember] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        const expiry = localStorage.getItem('jobHero_proExpiry');
        if (expiry) {
            const now = Date.now();
            return now < parseInt(expiry, 10);
        }
    }
    return false;
  });

  useEffect(() => {
    if (!isProMember) return;

    const updateTimer = () => {
        const expiryStr = localStorage.getItem('jobHero_proExpiry');
        if (!expiryStr) {
            setIsProMember(false);
            return;
        }
        
        const expiry = parseInt(expiryStr, 10);
        const now = Date.now();
        const diff = expiry - now;

        if (diff <= 0) {
            setIsProMember(false);
            localStorage.removeItem('jobHero_proExpiry');
            setTimeRemaining("");
        } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            // Pad with leading zeros
            const h = hours.toString().padStart(2, '0');
            const m = minutes.toString().padStart(2, '0');
            const s = seconds.toString().padStart(2, '0');
            setTimeRemaining(`${h}:${m}:${s}`);
        }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isProMember]);

  const getRazorpayKey = () => {
    try {
        // @ts-ignore
        if (import.meta && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) return import.meta.env.VITE_RAZORPAY_KEY_ID;
    } catch(e) {}
    try {
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.VITE_RAZORPAY_KEY_ID) return process.env.VITE_RAZORPAY_KEY_ID;
        }
    } catch(e) {}
    return null;
  };

  const handlePaymentSuccess = (txnId: string) => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const expiryTime = Date.now() + twentyFourHours;
    localStorage.setItem('jobHero_proExpiry', expiryTime.toString());
    setIsProMember(true);
    setTransactionId(txnId || "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase());
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 6000);
  };

  const handleRazorpayPayment = () => {
    const key = getRazorpayKey();
    if (!window.Razorpay) { alert("Razorpay SDK not loaded."); return; }
    if (!key) {
        if (confirm("⚠️ KEY MISSING. Click OK to Simulate Success.")) handlePaymentSuccess("SIM_TEST_" + Date.now());
        return;
    }

    const options = {
        key: key, 
        amount: 2500, // 25 INR
        currency: "INR",
        name: "JobHero AI",
        description: "Elite Day Pass (24 Hours)",
        handler: function (response: any) { handlePaymentSuccess(response.razorpay_payment_id); },
        prefill: {
            name: userInput.fullName,
            email: userInput.email,
            contact: userInput.phone
        },
        theme: { color: "#F59E0B" }
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleAnalyzeResume = async () => {
      setIsAnalyzing(true);
      setLocalError(null);
      try {
          const result = await analyzeResume(toolkit.resume, userInput.jobRoleTarget);
          setResumeAnalysis(result);
      } catch (e) {
          setLocalError("Unable to complete resume audit. Please check your connection and try again.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleGenerateEliteTools = async () => {
      setIsGeneratingElite(true);
      setLocalError(null);
      try {
          const eliteData = await generateEliteTools(userInput);
          onUpdateToolkit(eliteData);
      } catch (e: any) {
          setLocalError(e.message || "Failed to generate Elite Tools");
      } finally {
          setIsGeneratingElite(false);
      }
  };

  const handleGenerateShareLink = () => {
      const payload = { r: toolkit.resume, t: selectedTemplate, n: userInput.fullName, e: userInput.email, p: userInput.phone, l: userInput.linkedinGithub || "" };
      const shareUrl = `${window.location.origin}${window.location.pathname}?shareData=${btoa(encodeURIComponent(JSON.stringify(payload)))}`;
      navigator.clipboard.writeText(shareUrl);
  };

  const handleDownloadPDF = (type: 'resume' | 'coverLetter') => {
    const isProTemplate = selectedTemplate === 'Elegant' || selectedTemplate === 'Executive';
    if (!isProMember && isProTemplate) { handleRazorpayPayment(); return; }

    const doc = new jsPDF();
    const content = type === 'resume' ? toolkit.resume : toolkit.coverLetter;
    const cleanText = content.replace(/[^\x00-\x7F\n\r\t•\-.,()@:/]/g, " "); // Simple ASCII clean
    
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(cleanText, 180);
    doc.text(lines, 15, 15);
    doc.save(`${type}_JobHero.pdf`);
  };

  const handleRoadmapUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    setIsRegeneratingRoadmap(true);
    setLocalError(null);
    try {
      await onRegenerateRoadmap(newRoleInput, useThinkingModel);
      setNewRoleInput('');
    } catch (error) {
       // Error is handled in App.tsx via setError, but we catch it here to stop loading state
       console.error("Roadmap update failed in view");
    } finally {
      setIsRegeneratingRoadmap(false);
    }
  };

  const handleToggleThinkingModel = () => {
      setUseThinkingModel(!useThinkingModel);
  };

  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggleThinkingModel();
      }
  };

  const handleCopyHeadline = (headline: string, index: number) => {
      navigator.clipboard.writeText(headline).then(() => {
          setCopiedHeadlineIndex(index);
          setCurrentHeadline(headline); // Update the preview as well
          setTimeout(() => setCopiedHeadlineIndex(null), 2000);
      });
  };

  const contentToCopy = (tab: Tab): string => {
    if (tab === 'resume') return toolkit.resume;
    if (tab === 'coverLetter') return toolkit.coverLetter;
    if (tab === 'linkedin') return `${currentHeadline}\n\n${toolkit.linkedin.bio}`;
    if (tab === 'interview') return toolkit.mockInterview.questions.map(q => q.question).join('\n');
    if (tab === 'elite') return `${toolkit.coldEmail || ''}\n\n${toolkit.salaryNegotiation || ''}`;
    return '';
  };

  // Check if Elite content exists
  const hasEliteContent = toolkit.coldEmail && toolkit.salaryNegotiation;

  return (
    <div className="max-w-6xl mx-auto">
      {showSuccessModal && <SuccessModal email={userInput.email} transactionId={transactionId} />}
      
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-0 px-4 sm:px-0">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border-t border-x border-transparent dark:border-slate-700'
                  : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            {isProMember && <span className="px-3 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1"><span>👑</span> ELITE PASS {timeRemaining && <span className="font-mono ml-1">({timeRemaining})</span>}</span>}
            <button onClick={onReset} className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:text-red-500">
                <RefreshIcon className="h-4 w-4 inline mr-2" />Start Over
            </button>
        </div>
      </div>

      <div className="relative bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-b-xl rounded-tr-xl shadow-lg mt-0 min-h-[500px] transition-colors duration-300">
        
        {localError && (
             <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-sm text-red-600 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
                 {localError}
                 <button onClick={() => setLocalError(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800/50 p-1 rounded">✕</button>
             </div>
        )}

        {activeTab === 'resume' && (
            <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                     <ActionButtons textToCopy={contentToCopy('resume')} onDownloadPDF={() => handleDownloadPDF('resume')} onShare={handleGenerateShareLink}
                        templateSelector={
                           <div className="flex flex-col items-end gap-1">
                               <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border px-2 py-1">
                                   <span className="text-xs font-semibold mr-2 text-slate-700 dark:text-slate-300">TEMPLATE:</span>
                                   <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)} className="text-xs border-none bg-transparent outline-none cursor-pointer text-slate-900 dark:text-white">
                                       <option value="Classic" className="text-slate-900">Classic</option>
                                       <option value="Modern" className="text-slate-900">Modern</option>
                                       <option value="Creative" className="text-slate-900">Creative</option>
                                       <option value="Elegant" className="text-slate-900">Elegant {isProMember ? '' : '👑'}</option>
                                       <option value="Executive" className="text-slate-900">Executive {isProMember ? '' : '👑'}</option>
                                   </select>
                               </div>
                               {(!isProMember && (selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')) && (
                                    <div 
                                        className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                                        onClick={handleRazorpayPayment}
                                    >
                                        <span>🔒 Previewing Premium. Tap to Unlock.</span>
                                    </div>
                               )}
                           </div>
                        }
                    />
                </div>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100/50 dark:bg-slate-900/50 p-1 sm:p-4 shadow-inner mb-10">
                     <ResumePreview text={toolkit.resume} template={selectedTemplate} isBlurred={!isProMember && (selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')} onUnlock={handleRazorpayPayment} userInput={userInput} />
                </div>
                
                {/* ATS Analysis Section - Available for Everyone */}
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 relative z-10">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-2xl">🤖</span> ATS Compatibility Analyzer
                                </h3>
                                <p className="text-sm text-slate-500">Instant feedback for: <span className="text-blue-600 font-semibold">{userInput.jobRoleTarget}</span></p>
                            </div>
                            <button onClick={handleAnalyzeResume} disabled={isAnalyzing} className="mt-4 md:mt-0 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-lg hover:bg-black dark:hover:bg-slate-200 disabled:opacity-50 shadow-md transition-all hover:scale-105">
                                {isAnalyzing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                                        Analyzing...
                                    </span>
                                ) : "Run Free ATS Scan"}
                            </button>
                        </div>
                        
                        {resumeAnalysis ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                         <div className="text-center">
                                             <div className={`text-4xl font-black ${resumeAnalysis.score >= 80 ? 'text-green-600' : resumeAnalysis.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{resumeAnalysis.score ?? 0}</div>
                                             <div className="text-xs font-bold text-slate-400">ATS Score</div>
                                         </div>
                                         <div className="text-center">
                                             <div className={`text-xl font-bold ${resumeAnalysis.jobFitPrediction === 'High' ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`}>{resumeAnalysis.jobFitPrediction ?? "N/A"}</div>
                                             <div className="text-xs font-bold text-slate-400">Fit Prediction</div>
                                         </div>
                                    </div>
                                    <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50">
                                        <h4 className="font-bold text-red-900 dark:text-red-300 text-sm mb-2">Missing Keywords</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {resumeAnalysis.missingKeywords?.length > 0 ? resumeAnalysis.missingKeywords.map((k, i) => (
                                                <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-md">{k}</span>
                                            )) : <span className="text-xs text-slate-500 dark:text-slate-400">None detected.</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AnalysisList title="Key Strengths" items={resumeAnalysis.strengths} type="strength" />
                                    <AnalysisList title="Suggested Improvements" items={resumeAnalysis.improvements} type="improvement" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                Click "Run Free ATS Scan" to see how well your resume matches the job description.
                            </div>
                        )}
                    </div>

                {!isProMember && <ProUpsellCard description="Unlock Elite Templates & Exclusive Career Strategies." onUnlock={handleRazorpayPayment} />}
            </>
        )}

        {/* Other Tabs (CoverLetter, LinkedIn, Interview, Roadmap) remain same as before, no changes needed inside them */}

        {activeTab === 'coverLetter' && (
            <>
                <ActionButtons textToCopy={contentToCopy('coverLetter')} onDownloadPDF={() => handleDownloadPDF('coverLetter')} />
                <div className="p-8 shadow-sm border border-slate-100 dark:border-slate-700 rounded-lg min-h-[600px] bg-white dark:bg-slate-900 mt-6 sm:mt-0">
                    <FormatCoverLetter text={toolkit.coverLetter} />
                </div>
            </>
        )}

        {activeTab === 'linkedin' && (
          <div className="space-y-6">
            <ActionButtons textToCopy={contentToCopy('linkedin')} />
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Optimized Headline</h3>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">{currentHeadline}</p>
                
                {toolkit.linkedin.alternativeHeadlines && toolkit.linkedin.alternativeHeadlines.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-500 mb-3">AI Suggestions (Click to copy):</p>
                        <div className="space-y-2">
                            {toolkit.linkedin.alternativeHeadlines.map((headline, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => handleCopyHeadline(headline, idx)}
                                    className="w-full text-left p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors flex justify-between items-center group focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <span className="flex-grow mr-2">{headline}</span>
                                    <span className={`text-xs font-bold whitespace-nowrap transition-all ${
                                        copiedHeadlineIndex === idx 
                                            ? 'text-green-600 opacity-100' 
                                            : 'text-blue-600 opacity-0 group-hover:opacity-100'
                                    }`}>
                                        {copiedHeadlineIndex === idx ? 'COPIED ✓' : 'COPY'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">About Section</h3>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{toolkit.linkedin.bio}</p>
            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="space-y-6">
            <ActionButtons textToCopy={contentToCopy('interview')} />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm">
                {toolkit.mockInterview.intro}
            </div>
            {toolkit.mockInterview.questions.map((item, index) => (
                <div key={index} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">{index + 1}</div>
                      <div>
                          <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">{item.question}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border-l-2 border-green-500">
                              💡 {item.feedback}
                          </p>
                      </div>
                  </div>
                </div>
            ))}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                   <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">Pivot to new role?</label>
                   <input type="text" placeholder="e.g. 'AI Engineer'" className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 text-sm" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)} />
                </div>
                <div 
                    className="flex items-center gap-2 mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" 
                    onClick={handleToggleThinkingModel}
                    onKeyDown={handleToggleKeyDown}
                    role="switch"
                    aria-checked={useThinkingModel}
                    tabIndex={0}
                    aria-label="Toggle Deep Thinking Model"
                >
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useThinkingModel ? 'bg-purple-600' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${useThinkingModel ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Deep Think</span>
                </div>
                <button onClick={handleRoadmapUpdate} disabled={isRegeneratingRoadmap} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors">
                    {isRegeneratingRoadmap ? 'Thinking...' : 'Regenerate'}
                </button>
            </div>
            
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 pb-4">
                {Array.isArray(toolkit.careerRoadmap) ? toolkit.careerRoadmap.map((step, i) => (
                    <RoadmapStepItem key={i} step={step} index={i} />
                )) : (
                    <div className="p-4 bg-red-50 text-red-600 rounded">Legacy roadmap format. Please regenerate.</div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'elite' && (
            <div className="space-y-8">
                {isProMember ? (
                    <div className="animate-in fade-in duration-500">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                             <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-400/10 rounded-full blur-xl"></div>
                             <div className="flex items-center gap-3 relative z-10">
                                 <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400 ring-4 ring-white dark:ring-slate-800">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-slate-900 dark:text-white text-sm">Elite Pass Active</h3>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">Premium tools unlocked.</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 relative z-10">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expires in</span>
                                  <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{timeRemaining}</span>
                             </div>
                        </div>

                        {!hasEliteContent ? (
                             <div className="text-center py-12">
                                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Initialize Elite Strategy Engine</h3>
                                 <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">Generate personalized cold emails, salary scripts, and recruiter psychological profiles.</p>
                                 <button 
                                    onClick={handleGenerateEliteTools} 
                                    disabled={isGeneratingElite}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 disabled:opacity-70"
                                 >
                                     {isGeneratingElite ? (
                                         <span className="flex items-center gap-2">
                                             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                             Generating Strategies...
                                         </span>
                                     ) : "Generate Elite Tools"}
                                 </button>
                             </div>
                        ) : (
                            <>
                                {/* Recruiter Psychology Section */}
                                <div className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 overflow-hidden mb-8 relative animate-in fade-in slide-in-from-bottom-2">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🧠</div>
                                    <div className="p-6 relative z-10">
                                        <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
                                            <span className="text-2xl">🧠</span> Recruiter Psychology
                                        </h3>
                                        <p className="text-slate-300 text-sm italic mb-4 border-l-4 border-purple-500 pl-4 py-2 bg-slate-800/50 rounded-r">
                                            "Here is what I'm subconsciously thinking when I see your profile..."
                                        </p>
                                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                                            {toolkit.recruiterPsychology}
                                        </p>
                                    </div>
                                </div>

                                {/* Internship & Hackathon Hunter */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 animate-in fade-in slide-in-from-bottom-2 delay-100">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <span className="text-2xl">🕵️‍♂️</span> Internship & Hackathon Hunter
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Copy-Paste Search Strings</h4>
                                            <div className="space-y-3">
                                                {toolkit.internshipHunter?.searchQueries?.map((query, i) => (
                                                    <div key={i} className="group relative">
                                                        <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate pr-10">
                                                            {query}
                                                        </div>
                                                        <button 
                                                            onClick={() => navigator.clipboard.writeText(query)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 font-bold text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            COPY
                                                        </button>
                                                    </div>
                                                )) || <p className="text-sm text-slate-500">No queries generated.</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Target Platforms & Strategy</h4>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {toolkit.internshipHunter?.platforms?.map((platform, i) => (
                                                    <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full border border-blue-100 dark:border-blue-800">
                                                        {platform}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">🔥 THE WINNING HACK</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    {toolkit.internshipHunter?.strategy || "No strategy available."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 delay-200">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white font-bold flex justify-between">
                                            <span>📧 Cold Email</span>
                                            <button onClick={() => navigator.clipboard.writeText(toolkit.coldEmail || "")} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Copy</button>
                                        </div>
                                        <div className="p-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                            {toolkit.coldEmail}
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white font-bold flex justify-between">
                                            <span>💰 Salary Negotiation</span>
                                            <button onClick={() => navigator.clipboard.writeText(toolkit.salaryNegotiation || "")} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Copy</button>
                                        </div>
                                        <div className="p-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                            {toolkit.salaryNegotiation}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center text-slate-400 text-xs mt-8">
                                    These tools are generated based on your profile and target role to maximize conversion.
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                   <div className="flex flex-col items-center justify-center py-16 text-center">
                       <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mb-6">🔒</div>
                       <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Elite Tools Locked</h2>
                       <p className="text-slate-500 max-w-md mb-8">Get access to <strong>Recruiter Psychology</strong>, <strong>Hidden Internship Search Strings</strong>, <strong>Cold Emails</strong>, and more.</p>
                       <button onClick={handleRazorpayPayment} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform">
                           Unlock 24 Hours - ₹25
                       </button>
                   </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default ResultsDisplay;