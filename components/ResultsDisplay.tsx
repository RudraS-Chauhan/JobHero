import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { JobToolkit, ResumeAnalysis, UserInput, ResumeVersion, RoadmapStep } from '../types';
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
import { LogoIcon } from './icons/LogoIcon';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const WarningIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

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
  { id: 'interview', name: 'Interview Coach', icon: InterviewIcon },
  { id: 'roadmap', name: 'Career Strategy', icon: RoadmapIcon },
  { id: 'elite', name: 'Elite Suite', icon: () => <span className="text-lg">⚡</span> },
];

const CircularProgress = ({ score, size = 100, strokeWidth = 8 }: { score: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-200 dark:text-slate-700" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${colorClass} transition-all duration-1000 ease-out`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${colorClass}`}>{score}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            </div>
        </div>
    );
};

const TemplateCard: React.FC<{ type: TemplateType, isSelected: boolean, isLocked: boolean, onClick: () => void }> = ({ type, isSelected, isLocked, onClick }) => {
    let previewContent;
    if (type === 'Classic') {
        previewContent = <div className="flex flex-col gap-1 p-2 h-full bg-white border border-slate-200"><div className="w-full h-2 bg-slate-400 mb-1"></div><div className="w-full h-1 bg-slate-100"></div><div className="w-2/3 h-1 bg-slate-100"></div></div>;
    } else if (type === 'Modern') {
        previewContent = <div className="flex flex-col h-full bg-white border-l-4 border-blue-500"><div className="p-2"><div className="w-1/2 h-2 bg-blue-500 mb-2"></div><div className="w-full h-1 bg-slate-100"></div><div className="w-3/4 h-1 bg-slate-100"></div></div></div>;
    } else if (type === 'Minimalist') {
        previewContent = <div className="flex flex-col h-full bg-white border border-slate-100 p-2"><div className="w-1/3 h-1.5 bg-slate-900 mb-4"></div><div className="w-full h-0.5 bg-slate-50 mb-1"></div><div className="w-full h-0.5 bg-slate-50 mb-1"></div><div className="w-full h-0.5 bg-slate-50 mb-1"></div></div>;
    } else if (type === 'Creative') {
        previewContent = <div className="flex flex-col h-full bg-purple-50"><div className="w-full h-4 bg-purple-600 mb-2"></div><div className="p-2 space-y-1"><div className="w-3/4 h-1 bg-purple-200"></div><div className="w-full h-1 bg-purple-100"></div></div></div>;
    } else if (type === 'Elegant') {
        previewContent = <div className="flex flex-col h-full bg-amber-50 border-t-4 border-amber-800"><div className="p-2"><div className="w-1/2 h-2 bg-amber-900 mb-2"></div><div className="w-full h-1 bg-amber-200"></div><div className="w-3/4 h-1 bg-amber-200"></div></div></div>;
    } else if (type === 'Executive') {
        previewContent = <div className="flex h-full bg-slate-900"><div className="w-1/4 h-full bg-slate-800"></div><div className="flex-1 p-2"><div className="w-3/4 h-2 bg-white mb-2"></div><div className="w-full h-1 bg-slate-700"></div></div></div>;
    }

    return (
        <div onClick={onClick} className={`relative w-20 h-28 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 shadow-sm overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
            {previewContent}
            {isLocked && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center"><div className="bg-amber-500 text-white rounded-full p-1.5 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg></div></div>}
            <div className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-1 truncate px-1 ${type === 'Executive' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{type}</div>
        </div>
    );
};

const RoadmapStepItem: React.FC<{ step: RoadmapStep, index: number, isLast: boolean, onUnlock: () => void, isPro: boolean }> = ({ step, index, isLast, onUnlock, isPro }) => {
    const [isExpanded, setIsExpanded] = useState(index === 0);
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    const totalMilestones = step.milestones?.length || 0;
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const progressPercent = totalMilestones > 0 ? Math.round((checkedCount / totalMilestones) * 100) : 0;

    const depthColor = step.depthLevel === 'Elite' 
        ? 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' 
        : step.depthLevel === 'Intermediate' 
            ? 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
            : 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700';

    const toggleCheck = (idx: number) => {
        setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="relative pl-12 sm:pl-16 py-6 group">
            {!isLast && <div className="absolute left-[1.15rem] sm:left-[2.15rem] top-10 bottom-[-2.5rem] w-0.5 bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-400 transition-colors z-0"></div>}
            <div className={`absolute left-[0.4rem] sm:left-[1.4rem] top-7 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold transition-all duration-500 z-10 shadow-lg ${isExpanded ? 'bg-blue-600 text-white scale-125 ring-4 ring-blue-100 dark:ring-blue-900/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {index + 1}
            </div>
            
            <div className={`bg-white dark:bg-slate-900 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden cursor-pointer relative group/card ${isExpanded ? 'shadow-2xl border-blue-500 ring-1 ring-blue-500/20' : 'shadow-sm border-slate-100 dark:border-slate-800 hover:border-blue-300'}`} onClick={() => setIsExpanded(!isExpanded)}>
                <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{step.phase} • {step.duration}</span>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${depthColor}`}>{step.depthLevel} LEVEL</span>
                        </div>
                        <h3 className={`text-2xl font-black tracking-tight transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{step.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-2 line-clamp-2 font-medium">{step.description}</p>
                        
                        <div className="mt-4 flex items-center gap-4">
                            <div className="h-1.5 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${progressPercent === 100 ? 'text-green-500' : 'text-blue-500'}`}>{progressPercent}% COMPLETED</span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-2xl transition-all duration-500 shrink-0 ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 rotate-180' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity,padding] duration-700 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0 pb-0'}`}>
                    <div className="overflow-hidden">
                        <div className="px-6 sm:px-8 pt-0 border-t-2 border-slate-50 dark:border-slate-800/50 mt-4">
                            {/* Interactive Weekly Plan */}
                            {step.weeklyBreakdown && (
                                <div className="mt-10 mb-10">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"></div>
                                        Sprint Execution
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {step.weeklyBreakdown.map((week, wIdx) => (
                                            <div key={wIdx} className="group/week flex gap-4 p-5 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-900/40 transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm hover:shadow-xl">
                                                <div className="font-mono text-xs font-black text-blue-600 bg-white dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50 shadow-sm uppercase group-hover/week:scale-110 transition-transform">W{wIdx + 1}</div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{week}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2.5 mb-10">
                                {step.tools?.map((tool: string, t: number) => (
                                    <span key={t} className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl border-2 border-slate-100 dark:border-slate-700 flex items-center gap-2.5 shadow-sm group/tool hover:border-blue-400 transition-all">
                                        <TechIcon name={tool} className="w-4 h-4 group-hover/tool:scale-125 transition-transform" />
                                        {tool}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-[2.5rem] p-8 border-2 border-blue-100 dark:border-blue-900/40 shadow-inner">
                                    <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg"><CheckIcon className="w-4 h-4 text-white" /></div>
                                        Interactive Checkpoints
                                    </h4>
                                    <ul className="space-y-4">
                                        {step.milestones?.map((m: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 group/li" onClick={(e) => { e.stopPropagation(); toggleCheck(i); }}>
                                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checkedItems[i] ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                                    {checkedItems[i] && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className={`text-sm font-bold transition-all ${checkedItems[i] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{m}</span>
                                            </li>
                                        )) || <li className="text-xs text-slate-400 italic">No milestones defined for this role.</li>}
                                    </ul>
                                </div>

                                <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-[2.5rem] p-8 border-2 border-amber-100 dark:border-amber-900/40 relative overflow-hidden shadow-inner">
                                    {!isPro && (
                                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-10 animate-in fade-in duration-500">
                                            <div className="w-16 h-16 bg-amber-500 text-white rounded-3xl flex items-center justify-center text-2xl mb-4 shadow-xl shadow-amber-500/30">🔒</div>
                                            <h5 className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest text-xs">Premium Knowledge Base</h5>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Unlock role-specific curated courses and exclusive project templates.</p>
                                            <button onClick={(e) => { e.stopPropagation(); onUnlock(); }} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">Unlock Library (₹25)</button>
                                        </div>
                                    )}
                                    <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <div className="p-1.5 bg-amber-500 rounded-lg shadow-lg"><span className="text-sm">📚</span></div>
                                        Strategic Intelligence
                                    </h4>
                                    <ul className="space-y-4">
                                        {step.resources?.map((r: any, i: number) => (
                                            <li key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-xl transition-all hover:border-amber-400 group/res">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{r.title}</span>
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase mt-1">{r.type}</span>
                                                </div>
                                                <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover/res:bg-amber-500 group-hover/res:text-white transition-all">
                                                    <ArrowRightIcon className="w-4 h-4" />
                                                </div>
                                            </li>
                                        )) || <li className="text-xs text-slate-400 italic">Curating best-in-class resources...</li>}
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

const SuccessModal = ({ email, transactionId }: { email: string; transactionId: string }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] p-12 max-w-sm w-full text-center border-2 border-blue-500 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl shadow-xl shadow-green-500/20">✓</div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">You are Elite!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 font-medium leading-relaxed">
                Elite access enabled for 24 hours. Profile synthesis has been upgraded with deep reasoning and exclusive materials.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-10 font-mono text-[10px] text-slate-400 truncate tracking-tighter">RECEIPT: {transactionId}</div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">Start Exploring</button>
        </div>
    </div>
);

const ActionButtons = ({ textToCopy, onDownloadPDF, onShare, templateSelector }: { textToCopy: string; onDownloadPDF: () => void; onShare: () => void; templateSelector?: React.ReactNode }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-4">
                <button onClick={handleCopy} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-black uppercase tracking-widest hover:border-blue-400 transition-all shadow-sm">
                    {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy Text'}
                </button>
                <button onClick={onDownloadPDF} className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-xl transition-all shadow-lg">
                    <DownloadIcon className="h-4 w-4" /> Export PDF
                </button>
                <button onClick={onShare} className="flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-100 dark:border-blue-800 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                    <ShareIcon className="h-4 w-4" /> Profile Link
                </button>
            </div>
            {templateSelector && <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">{templateSelector}</div>}
        </div>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ toolkit, userInput, onReset, onRegenerateRoadmap, onUpdateToolkit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
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
  const [currentBio, setCurrentBio] = useState(toolkit.linkedin.bio);
  const [bioTone, setBioTone] = useState<'Professional' | 'Storyteller' | 'Executive'>('Professional');
  const [isRegeneratingBio, setIsRegeneratingBio] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([{ id: 'v1-initial', role: userInput.jobRoleTarget, content: toolkit.resume, timestamp: Date.now() }]);
  const [activeVersionId, setActiveVersionId] = useState<string>('v1-initial');
  const [isGeneratingVersion, setIsGeneratingVersion] = useState(false);
  const currentResumeContent = resumeVersions.find(v => v.id === activeVersionId)?.content || toolkit.resume;
  const [currentHeadline, setCurrentHeadline] = useState(toolkit.linkedin.headline);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<number, string>>({});
  const [interviewFeedback, setInterviewFeedback] = useState<Record<number, string>>({});
  const [evaluatingIndex, setEvaluatingIndex] = useState<number | null>(null);
  const [linkedInView, setLinkedInView] = useState<'structured' | 'draft'>('structured');

  const hasEliteContent = !!(
    toolkit.recruiterPsychology || 
    toolkit.salaryNegotiation || 
    toolkit.coldEmail || 
    toolkit.hrEmail || 
    toolkit.linkedinPitch || 
    toolkit.followUpEmail || 
    toolkit.referralEmail || 
    (toolkit.suggestedCourses && toolkit.suggestedCourses.length > 0)
  );

  const [isProMember, setIsProMember] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        const expiry = localStorage.getItem('jobHero_proExpiry');
        if (expiry) return Date.now() < parseInt(expiry, 10);
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
             if (diff <= 0) { setIsProMember(false); setTimeRemaining(""); setProgressRemaining(0); localStorage.removeItem('jobHero_proExpiry'); } 
             else { setIsProMember(true); const h = Math.floor(diff / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((diff % (1000 * 60)) / 1000); setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`); setProgressRemaining(Math.min(100, Math.max(0, (diff / (24 * 60 * 60 * 1000)) * 100))); }
        } else { setIsProMember(false); setTimeRemaining(""); setProgressRemaining(0); }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePaymentSuccess = (txnId: string) => {
    localStorage.setItem('jobHero_proExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
    setIsProMember(true);
    setTransactionId(txnId || "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase());
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 6000);
  };

  const handleRazorpayPayment = () => {
    const key = (process.env as any).VITE_RAZORPAY_KEY_ID;
    if (!window.Razorpay) { alert("Razorpay SDK not loaded."); return; }
    if (!key) { if (confirm("⚠️ SIMULATED PAYMENT: System is in debug mode. Proceed to Elite?")) handlePaymentSuccess("SIM_" + Date.now()); return; }
    const options = { key, amount: 2500, currency: "INR", name: "JobHero AI", description: "Elite Day Pass (24 Hours)", handler: (r: any) => handlePaymentSuccess(r.razorpay_payment_id), prefill: { name: userInput.fullName, email: userInput.email, contact: userInput.phone }, theme: { color: "#2563EB" } };
    new window.Razorpay(options).open();
  };

  const handleAnalyzeResume = async () => { setIsAnalyzing(true); setLocalError(null); try { const result = await analyzeResume(currentResumeContent, userInput.jobRoleTarget); setResumeAnalysis(result); } catch (e) { setLocalError("Resume analysis service is currently overwhelmed."); } finally { setIsAnalyzing(false); } };
  const handleGenerateEliteTools = async () => { setIsGeneratingElite(true); setLocalError(null); try { const eliteData = await generateEliteTools(userInput); onUpdateToolkit(eliteData); } catch (e: any) { setLocalError(e.message || "Failed to sync elite suite."); } finally { setIsGeneratingElite(false); } };
  const handleFindInternships = async () => { setIsFinding(true); setLocalError(null); try { const data = await generateInternshipFinder(userInput, currentResumeContent); onUpdateToolkit({ internshipHunter: data }); } catch (e: any) { setLocalError(e.message || "Internship matcher failed."); } finally { setIsFinding(false); } };
  const handleGenerateNewVersion = async (role: string) => { if (!role.trim()) return; setIsGeneratingVersion(true); setLocalError(null); try { const newResumeText = await generateTargetedResume(userInput, role); const newVersion: ResumeVersion = { id: `v${Date.now()}`, role, content: newResumeText, timestamp: Date.now() }; setResumeVersions(prev => [...prev, newVersion]); setActiveVersionId(newVersion.id); } catch (e: any) { setLocalError(e.message || "Resume regeneration failed."); } finally { setIsGeneratingVersion(false); } };
  const handleGenerateShareLink = () => { const payload = { r: currentResumeContent, t: selectedTemplate, n: userInput.fullName, e: userInput.email, p: userInput.phone, l: userInput.linkedinGithub || "" }; const shareUrl = `${window.location.origin}${window.location.pathname}?shareData=${btoa(encodeURIComponent(JSON.stringify(payload)))}`; navigator.clipboard.writeText(shareUrl); alert("Unique share link copied to clipboard!"); };
  const handleDownloadPDF = (type: 'resume' | 'coverLetter') => { if (!isProMember && (selectedTemplate === 'Creative' || selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')) { handleRazorpayPayment(); return; } const doc = new jsPDF(); const content = type === 'resume' ? currentResumeContent : toolkit.coverLetter; const lines = doc.splitTextToSize(content.replace(/[^\x00-\x7F\n\r\t•\-.,()@:/]/g, " "), 180); doc.setFontSize(11); doc.text(lines, 15, 15); doc.save(`${type}_JobHero.pdf`); };
  const handleRoadmapUpdate = async (e?: React.FormEvent) => { if (e) e.preventDefault(); const roleToUse = newRoleInput.trim() || userInput.jobRoleTarget; setIsRegeneratingRoadmap(true); setLocalError(null); try { await onRegenerateRoadmap(roleToUse, useThinkingModel); } catch (error) { setLocalError("Roadmap generation failed. This role might be too niche."); } finally { setIsRegeneratingRoadmap(false); } };
  const handleGetFeedback = async (index: number, question: string) => { const answer = interviewAnswers[index]; if (!answer?.trim()) return; setEvaluatingIndex(index); try { const feedback = await evaluateInterviewAnswer(question, answer, userInput.jobRoleTarget); setInterviewFeedback(prev => ({...prev, [index]: feedback})); } catch (e) { setLocalError("Interview AI is currently busy."); } finally { setEvaluatingIndex(null); } };
  const handleCopyBio = (text?: string) => { navigator.clipboard.writeText(text || currentBio).then(() => { setCopiedBio(true); setTimeout(() => setCopiedBio(false), 2000); }); };
  const handleToggleThinkingModel = () => { setUseThinkingModel(!useThinkingModel); };
  const handleCopyHeadline = (h: string, i: number) => { navigator.clipboard.writeText(h).then(() => { setCopiedHeadlineIndex(i); setCurrentHeadline(h); setTimeout(() => setCopiedHeadlineIndex(null), 2000); }); };
  const handleRegenerateBio = async () => { setIsRegeneratingBio(true); setLocalError(null); try { const newBio = await regenerateLinkedInBio(currentBio, bioTone); setCurrentBio(newBio); } catch (e: any) { setLocalError(e.message || "Failed to update profile narrative."); } finally { setIsRegeneratingBio(false); } };

  const contentToCopy = (tab: Tab): string => {
    if (tab === 'resume') return currentResumeContent;
    if (tab === 'coverLetter') return toolkit.coverLetter;
    if (tab === 'linkedin') return `${currentHeadline}\n\n${currentBio}`;
    if (tab === 'interview') return toolkit.mockInterview.questions.map(q => q.question).join('\n');
    if (tab === 'elite') return `${toolkit.coldEmail || ''}\n\n${toolkit.salaryNegotiation || ''}`;
    return '';
  };

  const freeTemplates: TemplateType[] = ['Classic', 'Modern', 'Minimalist'];
  const eliteTemplates: TemplateType[] = ['Creative', 'Elegant', 'Executive'];

  return (
    <div className="max-w-6xl mx-auto">
      {showSuccessModal && <SuccessModal email={userInput.email} transactionId={transactionId} />}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-0 px-4 sm:px-0">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
              <tab.icon className="h-4 w-4" /><span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
            {isProMember && <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-2 border-amber-200 dark:border-amber-800 text-xs font-black rounded-full flex items-center gap-2"><span>👑</span> ELITE PASS</span>}
            <button onClick={onReset} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-800 hover:text-red-500 transition-all"><RefreshIcon className="h-4 w-4 inline mr-2" />Reset</button>
        </div>
      </div>

      <div className="relative bg-white dark:bg-slate-900 p-6 sm:p-12 rounded-b-[3rem] rounded-tr-[3rem] shadow-2xl mt-0 min-h-[700px] transition-all duration-500 border-x border-b border-slate-100 dark:border-slate-800">
        {localError && <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-l-8 border-red-500 rounded-2xl flex items-center gap-4 text-sm text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-4"><WarningIcon className="w-6 h-6 flex-shrink-0" />{localError}</div>}

        {activeTab === 'resume' && (
            <div className="animate-in fade-in duration-700">
                <div className="mb-12">
                    <ActionButtons textToCopy={contentToCopy('resume')} onDownloadPDF={() => handleDownloadPDF('resume')} onShare={handleGenerateShareLink}
                        templateSelector={
                           <div className="flex flex-col gap-6">
                               <div className="flex flex-wrap items-center gap-3">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4">Standard Designs</span>
                                   {freeTemplates.map(t => <TemplateCard key={t} type={t} isSelected={selectedTemplate === t} isLocked={false} onClick={() => setSelectedTemplate(t)} />)}
                               </div>
                               <div className="flex flex-wrap items-center gap-3">
                                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mr-4">Elite Tier</span>
                                   {eliteTemplates.map(t => <TemplateCard key={t} type={t} isSelected={selectedTemplate === t} isLocked={!isProMember} onClick={() => !isProMember ? handleRazorpayPayment() : setSelectedTemplate(t)} />)}
                               </div>
                           </div>
                        }
                    />
                </div>
                <div className="border-4 border-slate-50 dark:border-slate-800 rounded-[3rem] overflow-hidden bg-slate-50 dark:bg-slate-950 p-1 sm:p-8 shadow-inner mb-16 relative">
                     <ResumePreview text={currentResumeContent} template={selectedTemplate} isBlurred={!isProMember && eliteTemplates.includes(selectedTemplate)} onUnlock={handleRazorpayPayment} userInput={userInput} versions={resumeVersions} activeVersionId={activeVersionId} onVersionChange={setActiveVersionId} onCreateVersion={handleGenerateNewVersion} isGeneratingVersion={isGeneratingVersion} />
                </div>
                {/* Score Section */}
                <div className="p-10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-8 -translate-y-8 group-hover:translate-x-4 transition-transform duration-1000">
                        <LogoIcon className="w-64 h-64" />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20"><SearchIcon className="w-6 h-6 text-white" /></div>
                                ATS Strategy Lab
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Cross-referencing your profile with: <span className="text-blue-600 font-black">{userInput.jobRoleTarget}</span></p>
                        </div>
                        <button onClick={handleAnalyzeResume} disabled={isAnalyzing} className="mt-6 md:mt-0 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-2xl">
                            {isAnalyzing ? 'Processing AI Algorithm...' : 'Run Neural Scan'}
                        </button>
                    </div>
                    {resumeAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6">
                            <div className="flex items-center justify-around bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-xl">
                                <CircularProgress score={resumeAnalysis.score} size={150} strokeWidth={16} />
                                <div className="text-center">
                                    <div className={`text-4xl font-black ${resumeAnalysis.jobFitPrediction === 'High' ? 'text-green-500' : 'text-amber-500'}`}>{resumeAnalysis.jobFitPrediction}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Hireability Confidence</div>
                                </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-[2.5rem] border-2 border-red-100 dark:border-red-900/40">
                                <h4 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <WarningIcon className="w-5 h-5" /> Target Keywords Missing
                                </h4>
                                <div className="flex flex-wrap gap-2.5">
                                    {resumeAnalysis.missingKeywords.map((k, i) => (
                                        <span key={i} className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 text-xs font-black rounded-xl border-2 border-red-100 dark:border-red-900/50 shadow-sm">{k}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20">
                        <LinkedInIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Profile Architecture</h3>
                        <p className="text-sm text-slate-500 font-medium">Optimized for recruiters and search visibility.</p>
                    </div>
                </div>
                <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1.5 border-2 border-slate-100 dark:border-slate-700 shadow-inner">
                    <button onClick={() => setLinkedInView('structured')} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${linkedInView === 'structured' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Sectional View</button>
                    <button onClick={() => setLinkedInView('draft')} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${linkedInView === 'draft' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Narrative Draft</button>
                </div>
            </div>

            {linkedInView === 'structured' && toolkit.linkedin.structuredBio ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-l-8 border-l-blue-600 shadow-xl border-y border-r border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-transform duration-500">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">The Hook</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-bold italic">"{toolkit.linkedin.structuredBio.hook}"</p>
                        <button onClick={() => handleCopyBio(toolkit.linkedin.structuredBio?.hook)} className="mt-8 text-[10px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase tracking-widest transition-colors"><CopyIcon className="w-4 h-4" /> Copy Section</button>
                    </div>
                    <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-l-8 border-l-purple-600 shadow-xl border-y border-r border-slate-100 dark:border-slate-800 hover:-translate-y-2 transition-transform duration-500">
                        <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4">Core Value</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-semibold">{toolkit.linkedin.structuredBio.expertise}</p>
                        <button onClick={() => handleCopyBio(toolkit.linkedin.structuredBio?.expertise)} className="mt-8 text-[10px] font-black text-slate-400 hover:text-purple-600 flex items-center gap-2 uppercase tracking-widest transition-colors"><CopyIcon className="w-4 h-4" /> Copy Section</button>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Generated Narrative</h3>
                        <button onClick={() => handleCopyBio(currentBio)} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                            {copiedBio ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            {copiedBio ? 'Copied' : 'Copy All'}
                        </button>
                    </div>
                    <textarea className="w-full h-96 p-8 border-2 border-slate-50 dark:border-slate-900 rounded-[2rem] text-slate-700 dark:text-slate-300 text-lg leading-relaxed resize-none focus:ring-4 focus:ring-blue-500/10 outline-none bg-white dark:bg-slate-900 font-medium" value={currentBio} onChange={(e) => setCurrentBio(e.target.value)} />
                </div>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row gap-6 items-end bg-blue-50 dark:bg-blue-950/20 p-8 rounded-[3rem] border-2 border-blue-100 dark:border-blue-900/40 shadow-inner">
                <div className="flex-grow w-full">
                   <div className="flex items-center gap-2 mb-3">
                       <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                       <label className="block text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-[0.2em]">Target Role Context</label>
                   </div>
                   <input type="text" placeholder="e.g. 'Cloud Solutions Architect'" className="block w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 text-sm font-bold shadow-sm focus:border-blue-500 outline-none transition-all" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)} />
                </div>
                <div className="flex flex-col items-center gap-2 mb-2 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deep Synthesis</span>
                    <button onClick={handleToggleThinkingModel} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${useThinkingModel ? 'bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-500 ${useThinkingModel ? 'translate-x-7' : 'translate-x-0 shadow-sm'}`}></div>
                    </button>
                </div>
                <button onClick={(e) => handleRoadmapUpdate(e)} disabled={isRegeneratingRoadmap} className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                    {isRegeneratingRoadmap ? 'Synthesizing Path...' : 'Update Roadmap'}
                </button>
            </div>
            
            <div className="relative pt-6">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="font-black text-4xl text-slate-900 dark:text-white tracking-tight flex items-center gap-5">
                        <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-600/20"><RoadmapIcon className="w-10 h-10 text-white" /></div>
                        Career Strategy Path
                    </h3>
                    <div className="hidden lg:flex gap-6">
                        <div className="flex items-center gap-2.5"><div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baseline</span></div>
                        <div className="flex items-center gap-2.5"><div className="w-4 h-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</span></div>
                        <div className="flex items-center gap-2.5"><div className="w-4 h-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery</span></div>
                    </div>
                </div>
                <div className="space-y-6">
                    {Array.isArray(toolkit.careerRoadmap) && toolkit.careerRoadmap.map((step, i) => (
                        <RoadmapStepItem key={i} step={step} index={i} isLast={i === toolkit.careerRoadmap.length - 1} onUnlock={handleRazorpayPayment} isPro={isProMember} />
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'elite' && (
            <div className="animate-in fade-in duration-700 space-y-12">
                 {isProMember ? (
                    <div className="space-y-12">
                         {!hasEliteContent ? (
                              <div className="text-center py-32 bg-slate-50 dark:bg-slate-950/50 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                                 <div className="text-8xl mb-8 animate-pulse">⚡</div>
                                 <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Sync Intelligence Suite</h3>
                                 <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xl mx-auto text-lg font-medium leading-relaxed">Your Elite Day Pass is active. Initialize our deep reasoning engines to build your networking and search strategy.</p>
                                 <button onClick={handleGenerateEliteTools} disabled={isGeneratingElite} className="px-14 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                     {isGeneratingElite ? 'Engine Synchronizing...' : 'Build My Elite Kit'}
                                 </button>
                              </div>
                         ) : (
                             <div className="space-y-16">
                                 {toolkit.suggestedCourses && (
                                     <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 p-10 relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl -mr-40 -mt-40 group-hover:bg-cyan-400/10 transition-colors duration-1000"></div>
                                         <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-10 flex items-center gap-5 relative z-10">
                                             <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-3xl"><span className="text-3xl">🎓</span></div>
                                             Neural Skill Bridge
                                         </h3>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                             {toolkit.suggestedCourses.map((course, idx) => (
                                                 <div key={idx} className="group bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-cyan-400 transition-all shadow-sm hover:shadow-2xl">
                                                     <div className="flex justify-between items-start mb-6">
                                                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-cyan-100 dark:border-cyan-900 shadow-sm">{course.provider}</span>
                                                         <ArrowRightIcon className="w-6 h-6 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-2 transition-all" />
                                                     </div>
                                                     <div className="font-black text-xl text-slate-900 dark:text-white mb-4 leading-tight">{course.title}</div>
                                                     <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-auto border-t-2 border-slate-100 dark:border-slate-800 pt-6 font-medium">"{course.reason}"</p>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         )}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-32 h-32 bg-amber-100 dark:bg-amber-900/30 rounded-[2.5rem] flex items-center justify-center text-7xl mb-12 shadow-2xl shadow-amber-500/20 border-2 border-amber-200 dark:border-amber-800 animate-bounce">🔒</div>
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Intelligence Access Restricted</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xl mb-14 text-xl font-medium leading-relaxed">Join the Elite tier to unlock <strong>Advanced Roadmaps</strong>, <strong>Recruiter Psychology</strong>, and <strong>Automated Networking Systems</strong>.</p>
                        <button onClick={handleRazorpayPayment} className="px-14 py-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black rounded-2xl shadow-[0_20px_40px_-12px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all text-xl">Unlock Full System (₹25)</button>
                    </div>
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
