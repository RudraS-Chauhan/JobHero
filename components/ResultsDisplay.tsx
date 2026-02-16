import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { JobToolkit, ResumeAnalysis, UserInput, ResumeVersion } from '../types';
import { analyzeResume, generateEliteTools, generateTargetedResume, evaluateInterviewAnswer, generateInternshipFinder, regenerateLinkedInBio } from '../services/geminiService';
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
import { SearchIcon } from './icons/SearchIcon';

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

const CircularProgress = ({ score, size = 100, strokeWidth = 8 }: { score: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-700"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${colorClass} transition-all duration-1000 ease-out`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${colorClass}`}>{score}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
        </div>
    );
};

// ... (TemplateCard component remains the same)
const TemplateCard: React.FC<{ type: TemplateType, isSelected: boolean, isLocked: boolean, onClick: () => void }> = ({ type, isSelected, isLocked, onClick }) => {
    let previewContent;
    // ... (same as before)
    if (type === 'Classic') {
        previewContent = (
            <div className="flex flex-col gap-1 p-2 h-full bg-white text-[4px] leading-tight font-serif text-slate-800">
                <div className="w-1/2 h-2 bg-slate-800 mb-1"></div>
                <div className="w-full h-px bg-slate-200 mb-1"></div>
                <div className="w-full h-1 bg-slate-200"></div>
                <div className="w-3/4 h-1 bg-slate-200"></div>
                <div className="w-full h-px bg-slate-200 mt-1 mb-1"></div>
                <div className="w-full h-1 bg-slate-200"></div>
            </div>
        );
    } else if (type === 'Modern') {
        previewContent = (
             <div className="flex flex-col h-full bg-white text-[4px] font-sans">
                 <div className="w-full h-3 bg-blue-600 mb-1"></div>
                 <div className="p-1 flex flex-col gap-1">
                    <div className="w-1/3 h-1 bg-blue-600 mb-1"></div>
                    <div className="w-full h-1 bg-slate-200"></div>
                    <div className="w-3/4 h-1 bg-slate-200"></div>
                 </div>
             </div>
        );
    } else if (type === 'Creative') {
        previewContent = (
            <div className="flex flex-col h-full bg-slate-50 text-[4px] font-sans p-2">
                <div className="w-2/3 h-2 bg-purple-600 mb-1 rounded-sm"></div>
                <div className="w-full h-px bg-purple-200 mb-1"></div>
                <div className="flex gap-1">
                    <div className="w-1/3 h-full bg-purple-100/50 rounded-sm"></div>
                    <div className="flex-1 flex flex-col gap-1">
                         <div className="w-full h-1 bg-slate-300"></div>
                         <div className="w-full h-1 bg-slate-300"></div>
                    </div>
                </div>
            </div>
        );
    } else if (type === 'Elegant') {
        previewContent = (
            <div className="flex flex-col h-full bg-amber-50/20 text-[4px] font-serif p-2 border-t-2 border-amber-600">
                 <div className="w-1/2 h-2 bg-slate-800 mb-2 border-b border-amber-200"></div>
                 <div className="w-full h-1 bg-slate-300 mb-0.5"></div>
                 <div className="w-3/4 h-1 bg-slate-300"></div>
            </div>
        );
    } else if (type === 'Executive') {
        previewContent = (
            <div className="flex h-full bg-slate-900 text-[4px] font-sans">
                 <div className="w-1/4 h-full bg-slate-800 border-r border-slate-700"></div>
                 <div className="flex-1 p-2 flex flex-col gap-1">
                      <div className="w-3/4 h-2 bg-white mb-1"></div>
                      <div className="w-full h-1 bg-slate-400"></div>
                      <div className="w-2/3 h-1 bg-slate-400"></div>
                 </div>
            </div>
        );
    }

    return (
        <div 
            onClick={onClick}
            className={`relative w-20 h-28 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 shadow-sm overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
        >
            {previewContent}
            {isLocked && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-amber-500 text-white rounded-full p-1.5 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}
            <div className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-1 truncate px-1 ${type === 'Executive' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                {type}
            </div>
        </div>
    );
};

// ... (AnalysisList, FormatCoverLetter, RoadmapStepItem, SuccessModal, ActionButtons, ProUpsellCard remain the same)
const AnalysisList = ({ title, items, type }: { title: string, items: string[], type: 'strength' | 'improvement' }) => (
    <div className={`p-4 rounded-xl border h-full ${type === 'strength' ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
        <h4 className={`font-bold text-sm mb-3 flex items-center gap-2 ${type === 'strength' ? 'text-green-800 dark:text-green-400' : 'text-amber-800 dark:text-amber-400'}`}>
            {type === 'strength' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0118 0z" /></svg>
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
                            className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded border-2 border-dashed border-yellow-400 dark:border-yellow-600 font-bold mx-1 shadow-sm transition-all hover:scale-105 cursor-text focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-700 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                            title="Editable Placeholder - Type directly to replace"
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

const RoadmapStepItem: React.FC<{ step: any, index: number, isLast: boolean, onUnlock: () => void, isPro: boolean }> = ({ step, index, isLast, onUnlock, isPro }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className="relative pl-12 sm:pl-16 py-4 group">
            {/* Connector Line */}
            {!isLast && (
                <div className="absolute left-[1.15rem] sm:left-[2.15rem] top-8 bottom-[-2rem] w-0.5 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-300 dark:group-hover:bg-blue-800 transition-colors z-0"></div>
            )}
            
            {/* Number Node */}
            <div 
                className={`absolute left-[0.4rem] sm:left-[1.4rem] top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 shadow-sm ${
                    isExpanded 
                        ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-100 dark:ring-blue-900/30' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:border-blue-200'
                }`}
            >
                {index + 1}
            </div>

            <div 
                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer relative ${
                    isExpanded 
                        ? 'shadow-lg border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/20' 
                        : 'shadow-sm border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                }`}
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
            >
                <div className="p-5 flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 mb-2">
                            {step.phase} • {step.duration}
                        </span>
                        <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white group-hover:text-blue-600'}`}>
                            {step.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-1 line-clamp-2">
                            {step.description}
                        </p>
                    </div>
                    <div className={`p-1.5 rounded-full mt-1 transition-all duration-300 ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 rotate-180' : 'text-slate-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-700'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>
                
                {/* Expanded Content */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                             
                             {/* Tools Section */}
                             <div className="mt-4 flex flex-wrap gap-2 mb-6">
                                {step.tools?.map((tool: string, t: number) => (
                                    <span key={t} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1.5">
                                        <TechIcon name={tool} className="w-3.5 h-3.5" />
                                        {tool}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Milestones Checklist */}
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4" /> Smart Action Plan
                                    </h4>
                                    <ul className="space-y-2">
                                        {step.milestones?.map((m: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <input type="checkbox" className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span>{m}</span>
                                            </li>
                                        )) || <li className="text-xs text-slate-400 italic">No milestones generated.</li>}
                                    </ul>
                                </div>

                                {/* Curated Resources (Elite Feature) */}
                                <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-900/30 relative overflow-hidden">
                                    {!isPro && (
                                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10">
                                            <span className="text-2xl mb-1">🔒</span>
                                            <p className="text-xs font-bold text-slate-800 dark:text-white mb-2">Pro Resources Locked</p>
                                            <button onClick={onUnlock} className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full font-bold transition-colors">
                                                Unlock
                                            </button>
                                        </div>
                                    )}
                                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <span className="text-sm">📚</span> Elite Resources
                                    </h4>
                                    <ul className="space-y-2">
                                        {step.resources?.map((r: any, i: number) => (
                                            <li key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-amber-100 dark:border-amber-900/50 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.title}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{r.type}</span>
                                                </div>
                                                <ArrowRightIcon className="w-3 h-3 text-slate-400" />
                                            </li>
                                        )) || <li className="text-xs text-slate-400 italic">No resources found.</li>}
                                    </ul>
                                </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-0 w-full">
            <div className="flex-1">
                {templateSelector}
            </div>
            <div className="flex gap-2 self-end sm:self-center">
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
  // Initialize with current role to allow easy regeneration without re-typing
  const [newRoleInput, setNewRoleInput] = useState(userInput.jobRoleTarget || '');
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
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [progressRemaining, setProgressRemaining] = useState<number>(0);
  const [copiedBio, setCopiedBio] = useState(false);
  
  // Bio State for "Interactive" regeneration
  const [currentBio, setCurrentBio] = useState(toolkit.linkedin.bio);
  const [bioTone, setBioTone] = useState<'Professional' | 'Storyteller' | 'Executive'>('Professional');
  const [isRegeneratingBio, setIsRegeneratingBio] = useState(false);

  // Finder Tab State
  const [isFinding, setIsFinding] = useState(false);

  // Resume Versioning State
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([
      { id: 'v1-initial', role: userInput.jobRoleTarget, content: toolkit.resume, timestamp: Date.now() }
  ]);
  const [activeVersionId, setActiveVersionId] = useState<string>('v1-initial');
  const [isGeneratingVersion, setIsGeneratingVersion] = useState(false);

  // Derived state for current resume content
  const currentResumeContent = resumeVersions.find(v => v.id === activeVersionId)?.content || toolkit.resume;
  
  const [currentHeadline, setCurrentHeadline] = useState(toolkit.linkedin.headline);

  // Interview Feedback State
  const [interviewAnswers, setInterviewAnswers] = useState<Record<number, string>>({});
  const [interviewFeedback, setInterviewFeedback] = useState<Record<number, string>>({});
  const [evaluatingIndex, setEvaluatingIndex] = useState<number | null>(null);

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
    const checkExpiry = () => {
        const expiryStr = localStorage.getItem('jobHero_proExpiry');
        if (expiryStr) {
             const expiry = parseInt(expiryStr, 10);
             const now = Date.now();
             const diff = expiry - now;
             
             if (diff <= 0) {
                 setIsProMember(false);
                 setTimeRemaining("");
                 setProgressRemaining(0);
                 localStorage.removeItem('jobHero_proExpiry');
             } else {
                 setIsProMember(true);
                 const h = Math.floor(diff / (1000 * 60 * 60));
                 const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                 const s = Math.floor((diff % (1000 * 60)) / 1000);
                 const hStr = h.toString().padStart(2, '0');
                 const mStr = m.toString().padStart(2, '0');
                 const sStr = s.toString().padStart(2, '0');
                 setTimeRemaining(`${hStr}:${mStr}:${sStr}`);
                 
                 // Calculate percentage based on 24 hours
                 const total = 24 * 60 * 60 * 1000;
                 const p = Math.min(100, Math.max(0, (diff / total) * 100));
                 setProgressRemaining(p);
             }
        } else {
            setIsProMember(false);
            setTimeRemaining("");
            setProgressRemaining(0);
        }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

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
        amount: 2500,
        currency: "INR",
        name: "JobHero AI",
        description: "Elite Day Pass (24 Hours)",
        handler: function (response: any) { handlePaymentSuccess(response.razorpay_payment_id); },
        prefill: { name: userInput.fullName, email: userInput.email, contact: userInput.phone },
        theme: { color: "#F59E0B" }
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleAnalyzeResume = async () => {
      setIsAnalyzing(true);
      setLocalError(null);
      try {
          const result = await analyzeResume(currentResumeContent, userInput.jobRoleTarget);
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
  
  const handleFindInternships = async () => {
      setIsFinding(true);
      setLocalError(null);
      try {
          const data = await generateInternshipFinder(userInput, currentResumeContent);
          onUpdateToolkit({ internshipHunter: data });
      } catch (e: any) {
          setLocalError(e.message || "Failed to find internships.");
      } finally {
          setIsFinding(false);
      }
  };
  
  const handleGenerateNewVersion = async (role: string) => {
      if (!role.trim()) return;
      setIsGeneratingVersion(true);
      setLocalError(null);
      try {
          const newResumeText = await generateTargetedResume(userInput, role);
          const newVersion: ResumeVersion = {
              id: `v${Date.now()}`,
              role: role,
              content: newResumeText,
              timestamp: Date.now()
          };
          setResumeVersions(prev => [...prev, newVersion]);
          setActiveVersionId(newVersion.id);
      } catch (e: any) {
          setLocalError(e.message || "Failed to generate new resume version.");
      } finally {
          setIsGeneratingVersion(false);
      }
  };

  const handleGenerateShareLink = () => {
      const payload = { r: currentResumeContent, t: selectedTemplate, n: userInput.fullName, e: userInput.email, p: userInput.phone, l: userInput.linkedinGithub || "" };
      const shareUrl = `${window.location.origin}${window.location.pathname}?shareData=${btoa(encodeURIComponent(JSON.stringify(payload)))}`;
      navigator.clipboard.writeText(shareUrl);
  };

  const handleDownloadPDF = (type: 'resume' | 'coverLetter') => {
    const isProTemplate = selectedTemplate === 'Elegant' || selectedTemplate === 'Executive';
    if (!isProMember && isProTemplate) { handleRazorpayPayment(); return; }
    const doc = new jsPDF();
    const content = type === 'resume' ? currentResumeContent : toolkit.coverLetter;
    const cleanText = content.replace(/[^\x00-\x7F\n\r\t•\-.,()@:/]/g, " ");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(cleanText, 180);
    doc.text(lines, 15, 15);
    doc.save(`${type}_JobHero.pdf`);
  };

  const handleRoadmapUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Allow empty input to trigger default (current role) regeneration
    const roleToUse = newRoleInput.trim() || userInput.jobRoleTarget;
    
    setIsRegeneratingRoadmap(true);
    setLocalError(null);
    try {
      await onRegenerateRoadmap(roleToUse, useThinkingModel);
      // Don't clear input so user sees what they generated for
    } catch (error) {
       console.error("Roadmap update failed in view");
    } finally {
      setIsRegeneratingRoadmap(false);
    }
  };

  const handleGetFeedback = async (index: number, question: string) => {
    const answer = interviewAnswers[index];
    if (!answer?.trim()) return;
    
    setEvaluatingIndex(index);
    try {
        const feedback = await evaluateInterviewAnswer(question, answer, userInput.jobRoleTarget);
        setInterviewFeedback(prev => ({...prev, [index]: feedback}));
    } catch (e) {
        setLocalError("Failed to get feedback. Please try again.");
    } finally {
        setEvaluatingIndex(null);
    }
  };
  
  const handleCopyBio = () => {
      navigator.clipboard.writeText(currentBio).then(() => {
          setCopiedBio(true);
          setTimeout(() => setCopiedBio(false), 2000);
      });
  };

  const handleToggleThinkingModel = () => { setUseThinkingModel(!useThinkingModel); };
  const handleToggleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleThinkingModel(); } };
  const handleCopyHeadline = (headline: string, index: number) => {
      navigator.clipboard.writeText(headline).then(() => {
          setCopiedHeadlineIndex(index);
          setCurrentHeadline(headline);
          setTimeout(() => setCopiedHeadlineIndex(null), 2000);
      });
  };

  const handleRegenerateBio = async () => {
      setIsRegeneratingBio(true);
      setLocalError(null);
      try {
          const newBio = await regenerateLinkedInBio(currentBio, bioTone);
          setCurrentBio(newBio);
      } catch (e: any) {
          setLocalError(e.message || "Failed to update bio");
      } finally {
          setIsRegeneratingBio(false);
      }
  };

  const contentToCopy = (tab: Tab): string => {
    if (tab === 'resume') return currentResumeContent;
    if (tab === 'coverLetter') return toolkit.coverLetter;
    if (tab === 'linkedin') return `${currentHeadline}\n\n${currentBio}`;
    if (tab === 'interview') return toolkit.mockInterview.questions.map(q => q.question).join('\n');
    if (tab === 'elite') return `${toolkit.coldEmail || ''}\n\n${toolkit.salaryNegotiation || ''}`;
    return '';
  };

  const hasEliteContent = toolkit.coldEmail && toolkit.salaryNegotiation;
  const templateOptions: TemplateType[] = ['Classic', 'Modern', 'Creative', 'Elegant', 'Executive'];

  return (
    <div className="max-w-6xl mx-auto">
      {/* ... (Error display remains same) ... */}
      {showSuccessModal && <SuccessModal email={userInput.email} transactionId={transactionId} />}
      
      {/* ... (Tabs and header remain same) ... */}
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
            {isProMember && <span className="px-3 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse"><span>👑</span> ELITE PASS {timeRemaining && <span className="font-mono ml-1">({timeRemaining})</span>}</span>}
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
                <div className="mb-8">
                     <ActionButtons textToCopy={contentToCopy('resume')} onDownloadPDF={() => handleDownloadPDF('resume')} onShare={handleGenerateShareLink}
                        templateSelector={
                           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                               {templateOptions.map(t => {
                                   const isLocked = !isProMember && (t === 'Elegant' || t === 'Executive');
                                   return (
                                       <TemplateCard 
                                           key={t}
                                           type={t}
                                           isSelected={selectedTemplate === t}
                                           isLocked={isLocked}
                                           onClick={() => {
                                               if (isLocked) handleRazorpayPayment();
                                               else setSelectedTemplate(t);
                                           }}
                                       />
                                   );
                               })}
                           </div>
                        }
                    />
                </div>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100/50 dark:bg-slate-900/50 p-1 sm:p-4 shadow-inner mb-10">
                     <ResumePreview 
                        text={currentResumeContent} 
                        template={selectedTemplate} 
                        isBlurred={!isProMember && (selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')} 
                        onUnlock={handleRazorpayPayment} 
                        userInput={userInput}
                        versions={resumeVersions}
                        activeVersionId={activeVersionId}
                        onVersionChange={setActiveVersionId}
                        onCreateVersion={handleGenerateNewVersion}
                        isGeneratingVersion={isGeneratingVersion}
                     />
                </div>
                
                {/* ATS Analysis Section */}
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
                                    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                         <div className="flex flex-col items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                                             <CircularProgress score={resumeAnalysis.score ?? 0} size={120} strokeWidth={10} />
                                         </div>
                                         <div className="text-center flex-1">
                                             <div className={`text-2xl font-bold ${resumeAnalysis.jobFitPrediction === 'High' ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`}>{resumeAnalysis.jobFitPrediction ?? "N/A"}</div>
                                             <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fit Prediction</div>
                                         </div>
                                    </div>
                                    <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50">
                                        <h4 className="font-bold text-red-900 dark:text-red-300 text-sm mb-3 flex items-center gap-2">
                                            <span className="bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-200 px-1.5 rounded text-[10px]">CRITICAL</span> 
                                            Missing Keywords
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {resumeAnalysis.missingKeywords?.length > 0 ? resumeAnalysis.missingKeywords.map((k, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-md shadow-sm">{k}</span>
                                            )) : <span className="text-xs text-slate-500 dark:text-slate-400">None detected. Great job!</span>}
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
            
            {/* Interactive Bio Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase">About Section (Bio)</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCopyBio}
                            className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                        >
                             {copiedBio ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                             {copiedBio ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
                
                <textarea 
                    className="w-full h-48 p-4 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-950 text-sm font-sans mb-4"
                    value={currentBio}
                    onChange={(e) => setCurrentBio(e.target.value)}
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Refine Tone:</span>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {(['Professional', 'Storyteller', 'Executive'] as const).map(tone => (
                            <button
                                key={tone}
                                onClick={() => setBioTone(tone)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex-1 sm:flex-none ${
                                    bioTone === tone 
                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' 
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {tone}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleRegenerateBio}
                        disabled={isRegeneratingBio}
                        className="w-full sm:w-auto ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                    >
                        {isRegeneratingBio ? 'Updating...' : 'Regenerate Bio'}
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* ... (rest of the tabs remain same) ... */}
        {activeTab === 'interview' && (
          <div className="space-y-6">
            <ActionButtons textToCopy={contentToCopy('interview')} />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm">
                {toolkit.mockInterview.intro}
            </div>
            {toolkit.mockInterview.questions.map((item, index) => (
                <div key={index} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">{index + 1}</div>
                        <div className="w-full">
                            <p className="font-bold text-slate-900 dark:text-white text-lg mb-2">{item.question}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border-l-2 border-green-500 mb-4">
                                💡 General Tip: {item.feedback}
                            </p>
                            
                            <textarea 
                                placeholder="Type your answer here to get specific AI feedback..."
                                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[100px]"
                                value={interviewAnswers[index] || ''}
                                onChange={(e) => setInterviewAnswers({...interviewAnswers, [index]: e.target.value})}
                            />
                            
                            <div className="flex justify-end mt-2">
                                <button 
                                    onClick={() => handleGetFeedback(index, item.question)}
                                    disabled={!interviewAnswers[index]?.trim() || evaluatingIndex === index}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {evaluatingIndex === index ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Analyzing...
                                        </span>
                                    ) : 'Get AI Feedback'}
                                </button>
                            </div>

                            {interviewFeedback[index] && (
                                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-2">AI Coach Feedback</h4>
                                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {interviewFeedback[index]}
                                    </div>
                                </div>
                            )}
                        </div>
                      </div>
                  </div>
                </div>
            ))}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 text-sm text-center">
                {toolkit.mockInterview.outro}
            </div>
          </div>
        )}

        {/* ... (Roadmap and Elite tabs remain same) ... */}
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
                <button onClick={(e) => handleRoadmapUpdate(e)} disabled={isRegeneratingRoadmap} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors">
                    {isRegeneratingRoadmap ? 'Thinking...' : 'Regenerate'}
                </button>
            </div>
            
            <div className="relative pt-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">🗺️</span> Career Mastery Flowchart
                </h3>
                {Array.isArray(toolkit.careerRoadmap) ? toolkit.careerRoadmap.map((step, i) => (
                    <RoadmapStepItem 
                        key={i} 
                        step={step} 
                        index={i} 
                        isLast={i === toolkit.careerRoadmap.length - 1} 
                        onUnlock={handleRazorpayPayment}
                        isPro={isProMember}
                    />
                )) : (
                    <div className="p-8 border-2 border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-xl text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4 font-medium">Roadmap format unavailable for this role.</p>
                        <button 
                            onClick={() => handleRoadmapUpdate()} 
                            disabled={isRegeneratingRoadmap}
                            className="px-6 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                        >
                            {isRegeneratingRoadmap ? 'Generating...' : '↻ Generate Roadmap'}
                        </button>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* ... (Elite tab remains same) ... */}
        {activeTab === 'elite' && (
            <div className="space-y-8">
                {isProMember ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Elite Pass Badge */}
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
                             
                             <div className="flex flex-col items-end gap-2 relative z-10 min-w-[200px]">
                                <div className={`flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-sm border ${progressRemaining < 10 ? 'border-red-400 dark:border-red-600 animate-pulse' : 'border-slate-200 dark:border-slate-700'} w-full justify-between`}>
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expires in</span>
                                      <span className={`font-mono text-xl font-bold tabular-nums ${progressRemaining < 10 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{timeRemaining}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${progressRemaining < 10 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                        style={{ width: `${progressRemaining}%` }}
                                    ></div>
                                </div>
                             </div>
                        </div>

                        {!hasEliteContent ? (
                             <div className="text-center py-12">
                                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Initialize Elite Strategy Engine</h3>
                                 <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">Generate personalized cold emails, salary scripts, internship strategies, and recruiter psychological profiles.</p>
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

                                {/* Networking Power Pack Grid */}
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">⚡</span> Networking Power Pack
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-2 delay-100">
                                    {[
                                        { title: "📧 Founder Cold Email", content: toolkit.coldEmail, color: "from-blue-600 to-indigo-600" },
                                        { title: "🤝 HR / Recruiter Email", content: toolkit.hrEmail, color: "from-indigo-600 to-purple-600" },
                                        { title: "💼 LinkedIn Pitch", content: toolkit.linkedinPitch, color: "from-sky-600 to-blue-600" },
                                        { title: "🔄 Follow-Up Message", content: toolkit.followUpEmail, color: "from-slate-600 to-slate-800" },
                                        { title: "👥 Referral Request", content: toolkit.referralEmail, color: "from-teal-600 to-emerald-600" },
                                        { title: "💰 Salary Negotiation", content: toolkit.salaryNegotiation, color: "from-green-600 to-emerald-600" },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                                            <div className={`bg-gradient-to-r ${item.color} p-3 text-white font-bold flex justify-between items-center`}>
                                                <span className="text-sm truncate mr-2">{item.title}</span>
                                                <button onClick={() => navigator.clipboard.writeText(item.content || "")} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors whitespace-nowrap">Copy</button>
                                            </div>
                                            <div className="p-4 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-xs leading-relaxed flex-grow">
                                                {item.content || "Generating..."}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Suggested Courses Section */}
                                {toolkit.suggestedCourses && toolkit.suggestedCourses.length > 0 && (
                                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-xl shadow-sm border border-cyan-100 dark:border-cyan-800 p-6 mb-8 animate-in fade-in slide-in-from-bottom-2 delay-200">
                                        <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-300 mb-4 flex items-center gap-2">
                                            <span className="text-xl">🎓</span> Suggested Courses & Certifications
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {toolkit.suggestedCourses.map((course, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
                                                    <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1 uppercase">{course.provider}</div>
                                                    <div className="font-bold text-slate-900 dark:text-white mb-2 leading-tight">{course.title}</div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-auto">{course.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Internship & Hackathon Hunter Section (Moved from Finder Tab) */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8 animate-in fade-in slide-in-from-bottom-2 delay-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                    
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <SearchIcon className="w-6 h-6 text-blue-600" />
                                                Internship & Hackathon Hunter
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                AI-generated search strings and hacks to find hidden opportunities.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleFindInternships} 
                                            disabled={isFinding}
                                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                        >
                                            {isFinding ? 'Hunting...' : toolkit.internshipHunter ? 'Regenerate Strategy' : 'Launch Hunter'}
                                        </button>
                                    </div>

                                    {!toolkit.internshipHunter ? (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                            <p className="text-sm text-slate-500 mb-2">Unlock hidden internships and hackathons tailored to your profile.</p>
                                            <button onClick={handleFindInternships} className="text-blue-600 font-bold hover:underline text-sm">Click "Launch Hunter" to start</button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Copy-Paste Search Strings</h4>
                                                <div className="space-y-3">
                                                    {toolkit.internshipHunter?.searchQueries?.map((query, i) => (
                                                        <a 
                                                            key={i} 
                                                            href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block group relative"
                                                        >
                                                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors pr-8 truncate">
                                                                {query}
                                                            </div>
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                                                                GO ↗
                                                            </div>
                                                        </a>
                                                    )) || <p className="text-sm text-slate-500">No queries generated.</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Target Platforms & Strategy</h4>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {toolkit.internshipHunter?.platforms?.map((platform, i) => (
                                                        <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase rounded-full border border-blue-100 dark:border-blue-800">
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
                                    )}
                                </div>

                                <div className="text-center text-slate-400 text-xs mt-8 pb-4">
                                    These premium tools are generated based on your specific profile to maximize conversion rates.
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                   <div className="flex flex-col items-center justify-center py-16 text-center">
                       <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mb-6">🔒</div>
                       <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Elite Tools Locked</h2>
                       <p className="text-slate-500 max-w-md mb-8">Get access to <strong>Recruiter Psychology</strong>, <strong>Hidden Internship Search Strings</strong>, <strong>Cold Emails</strong>, <strong>LinkedIn Pitches</strong> and more.</p>
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