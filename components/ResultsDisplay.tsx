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
  { id: 'roadmap', name: 'Roadmap', icon: RoadmapIcon },
  { id: 'elite', name: 'Elite Tools', icon: () => <span className="text-lg">⚡</span> },
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

const RoadmapStepItem: React.FC<{ step: any, index: number, isLast: boolean, onUnlock: () => void, isPro: boolean }> = ({ step, index, isLast, onUnlock, isPro }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="relative pl-12 sm:pl-16 py-4 group">
            {!isLast && <div className="absolute left-[1.15rem] sm:left-[2.15rem] top-8 bottom-[-2rem] w-0.5 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-300 dark:group-hover:bg-blue-800 transition-colors z-0"></div>}
            <div className={`absolute left-[0.4rem] sm:left-[1.4rem] top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 shadow-sm ${isExpanded ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{index + 1}</div>
            <div className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer relative ${isExpanded ? 'shadow-lg border-blue-300' : 'shadow-sm border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5'}`} onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0} aria-expanded={isExpanded}>
                <div className="p-5 flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 mb-2">{step.phase} • {step.duration}</span>
                        <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{step.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-1 line-clamp-2">{step.description}</p>
                        {!isExpanded && <p className="text-xs font-semibold text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 animate-in slide-in-from-left-2"><span>View Details & Resources</span><ArrowRightIcon className="w-3 h-3" /></p>}
                    </div>
                    <div className={`p-1.5 rounded-full mt-1 transition-all duration-300 ${isExpanded ? 'bg-blue-50 text-blue-600 rotate-180' : 'text-slate-400 group-hover:bg-slate-100 group-hover:text-blue-500'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg></div>
                </div>
                <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                            <div className="mt-4 flex flex-wrap gap-2 mb-6">
                                {step.tools?.map((tool: string, t: number) => (
                                    <span key={t} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1.5"><TechIcon name={tool} className="w-3.5 h-3.5" />{tool}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-3 flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Smart Action Plan</h4>
                                    <ul className="space-y-2">
                                        {step.milestones?.map((m: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:text-blue-600"><input type="checkbox" className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span>{m}</span></li>
                                        )) || <li className="text-xs text-slate-400 italic">No milestones generated.</li>}
                                    </ul>
                                </div>
                                <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-900/30 relative overflow-hidden group/resources">
                                    {!isPro && (
                                        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10"><span className="text-2xl mb-1">🔒</span><p className="text-xs font-bold text-slate-800 dark:text-white mb-2">Pro Resources Locked</p><button onClick={(e) => { e.stopPropagation(); onUnlock(); }} className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full font-bold shadow-sm">Unlock</button></div>
                                    )}
                                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-3 flex items-center gap-2"><span className="text-sm">📚</span> Elite Resources</h4>
                                    <ul className="space-y-2">
                                        {step.resources?.map((r: any, i: number) => (
                                            <li key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-all hover:border-amber-300 cursor-pointer"><div className="flex flex-col"><span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.title}</span><span className="text-[10px] text-slate-500 uppercase">{r.type}</span></div><ArrowRightIcon className="w-3 h-3 text-slate-400" /></li>
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

const SuccessModal = ({ email, transactionId }: { email: string; transactionId: string }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Your Elite access is now active for 24 hours. A receipt has been sent to <strong>{email}</strong>.</p>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mb-6 font-mono text-[10px] text-slate-500 truncate">TXN: {transactionId}</div>
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Get Started</button>
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                </button>
                <button onClick={onDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-slate-600 transition-colors shadow-sm">
                    <DownloadIcon className="h-4 w-4" /> Download PDF
                </button>
                <button onClick={onShare} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <ShareIcon className="h-4 w-4" /> Share Link
                </button>
            </div>
            {templateSelector && <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">{templateSelector}</div>}
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
    if (!key) { if (confirm("⚠️ KEY MISSING. Click OK to Simulate Success.")) handlePaymentSuccess("SIM_TEST_" + Date.now()); return; }
    const options = { key, amount: 2500, currency: "INR", name: "JobHero AI", description: "Elite Day Pass (24 Hours)", handler: (r: any) => handlePaymentSuccess(r.razorpay_payment_id), prefill: { name: userInput.fullName, email: userInput.email, contact: userInput.phone }, theme: { color: "#F59E0B" } };
    new window.Razorpay(options).open();
  };

  const handleAnalyzeResume = async () => { setIsAnalyzing(true); setLocalError(null); try { const result = await analyzeResume(currentResumeContent, userInput.jobRoleTarget); setResumeAnalysis(result); } catch (e) { setLocalError("Unable to complete resume audit."); } finally { setIsAnalyzing(false); } };
  const handleGenerateEliteTools = async () => { setIsGeneratingElite(true); setLocalError(null); try { const eliteData = await generateEliteTools(userInput); onUpdateToolkit(eliteData); } catch (e: any) { setLocalError(e.message || "Failed to generate Elite Tools"); } finally { setIsGeneratingElite(false); } };
  const handleFindInternships = async () => { setIsFinding(true); setLocalError(null); try { const data = await generateInternshipFinder(userInput, currentResumeContent); onUpdateToolkit({ internshipHunter: data }); } catch (e: any) { setLocalError(e.message || "Failed to find internships."); } finally { setIsFinding(false); } };
  const handleGenerateNewVersion = async (role: string) => { if (!role.trim()) return; setIsGeneratingVersion(true); setLocalError(null); try { const newResumeText = await generateTargetedResume(userInput, role); const newVersion: ResumeVersion = { id: `v${Date.now()}`, role, content: newResumeText, timestamp: Date.now() }; setResumeVersions(prev => [...prev, newVersion]); setActiveVersionId(newVersion.id); } catch (e: any) { setLocalError(e.message || "Failed to generate new resume version."); } finally { setIsGeneratingVersion(false); } };
  const handleGenerateShareLink = () => { const payload = { r: currentResumeContent, t: selectedTemplate, n: userInput.fullName, e: userInput.email, p: userInput.phone, l: userInput.linkedinGithub || "" }; const shareUrl = `${window.location.origin}${window.location.pathname}?shareData=${btoa(encodeURIComponent(JSON.stringify(payload)))}`; navigator.clipboard.writeText(shareUrl); };
  const handleDownloadPDF = (type: 'resume' | 'coverLetter') => { if (!isProMember && (selectedTemplate === 'Creative' || selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')) { handleRazorpayPayment(); return; } const doc = new jsPDF(); const content = type === 'resume' ? currentResumeContent : toolkit.coverLetter; const lines = doc.splitTextToSize(content.replace(/[^\x00-\x7F\n\r\t•\-.,()@:/]/g, " "), 180); doc.setFontSize(11); doc.text(lines, 15, 15); doc.save(`${type}_JobHero.pdf`); };
  const handleRoadmapUpdate = async (e?: React.FormEvent) => { if (e) e.preventDefault(); const roleToUse = newRoleInput.trim() || userInput.jobRoleTarget; setIsRegeneratingRoadmap(true); setLocalError(null); try { await onRegenerateRoadmap(roleToUse, useThinkingModel); } catch (error) { console.error("Roadmap update failed"); } finally { setIsRegeneratingRoadmap(false); } };
  const handleGetFeedback = async (index: number, question: string) => { const answer = interviewAnswers[index]; if (!answer?.trim()) return; setEvaluatingIndex(index); try { const feedback = await evaluateInterviewAnswer(question, answer, userInput.jobRoleTarget); setInterviewFeedback(prev => ({...prev, [index]: feedback})); } catch (e) { setLocalError("Failed to get feedback."); } finally { setEvaluatingIndex(null); } };
  const handleCopyBio = () => { navigator.clipboard.writeText(currentBio).then(() => { setCopiedBio(true); setTimeout(() => setCopiedBio(false), 2000); }); };
  const handleToggleThinkingModel = () => { setUseThinkingModel(!useThinkingModel); };
  const handleCopyHeadline = (h: string, i: number) => { navigator.clipboard.writeText(h).then(() => { setCopiedHeadlineIndex(i); setCurrentHeadline(h); setTimeout(() => setCopiedHeadlineIndex(null), 2000); }); };
  const handleRegenerateBio = async () => { setIsRegeneratingBio(true); setLocalError(null); try { const newBio = await regenerateLinkedInBio(currentBio, bioTone); setCurrentBio(newBio); } catch (e: any) { setLocalError(e.message || "Failed to update bio"); } finally { setIsRegeneratingBio(false); } };

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
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-0 px-4 sm:px-0">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-5 py-3 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
              <tab.icon className="h-4 w-4" /><span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            {isProMember && <span className="px-3 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse"><span>👑</span> ELITE PASS {timeRemaining && <span className="font-mono ml-1">({timeRemaining})</span>}</span>}
            <button onClick={onReset} className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:text-red-500"><RefreshIcon className="h-4 w-4 inline mr-2" />Start Over</button>
        </div>
      </div>

      <div className="relative bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-b-xl rounded-tr-xl shadow-lg mt-0 min-h-[500px] transition-colors duration-300">
        {localError && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-sm text-red-600 dark:text-red-300 animate-in fade-in slide-in-from-top-2"><WarningIcon className="w-5 h-5 flex-shrink-0" />{localError}<button onClick={() => setLocalError(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800/50 p-1 rounded">✕</button></div>}

        {activeTab === 'resume' && (
            <>
                <div className="mb-8">
                    <ActionButtons textToCopy={contentToCopy('resume')} onDownloadPDF={() => handleDownloadPDF('resume')} onShare={handleGenerateShareLink}
                        templateSelector={
                           <div className="flex flex-col gap-3">
                               <div className="flex flex-wrap items-center gap-2">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Free Designs:</span>
                                   {freeTemplates.map(t => <TemplateCard key={t} type={t} isSelected={selectedTemplate === t} isLocked={false} onClick={() => setSelectedTemplate(t)} />)}
                               </div>
                               <div className="flex flex-wrap items-center gap-2">
                                   <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mr-2">Elite Designs:</span>
                                   {eliteTemplates.map(t => <TemplateCard key={t} type={t} isSelected={selectedTemplate === t} isLocked={!isProMember} onClick={() => !isProMember ? handleRazorpayPayment() : setSelectedTemplate(t)} />)}
                               </div>
                           </div>
                        }
                    />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100/50 dark:bg-slate-900/50 p-1 sm:p-4 shadow-inner mb-10">
                     <ResumePreview text={currentResumeContent} template={selectedTemplate} isBlurred={!isProMember && eliteTemplates.includes(selectedTemplate)} onUnlock={handleRazorpayPayment} userInput={userInput} versions={resumeVersions} activeVersionId={activeVersionId} onVersionChange={setActiveVersionId} onCreateVersion={handleGenerateNewVersion} isGeneratingVersion={isGeneratingVersion} />
                </div>
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 relative z-10">
                            <div><h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2"><span className="text-2xl">🤖</span> ATS Compatibility Analyzer</h3><p className="text-sm text-slate-500">Instant feedback for: <span className="text-blue-600 font-semibold">{userInput.jobRoleTarget}</span></p></div>
                            <button onClick={handleAnalyzeResume} disabled={isAnalyzing} className="mt-4 md:mt-0 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-lg hover:bg-black dark:hover:bg-slate-200 disabled:opacity-50 shadow-md transition-all hover:scale-105">{isAnalyzing ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>Analyzing...</span> : "Run Free ATS Scan"}</button>
                        </div>
                        {resumeAnalysis ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between"><div className="flex flex-col items-center flex-1 border-r border-slate-100 dark:border-slate-700"><CircularProgress score={resumeAnalysis.score ?? 0} size={120} strokeWidth={10} /></div><div className="text-center flex-1"><div className={`text-2xl font-bold ${resumeAnalysis.jobFitPrediction === 'High' ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`}>{resumeAnalysis.jobFitPrediction ?? "N/A"}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Fit Prediction</div></div></div>
                                    <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50"><h4 className="font-bold text-red-900 dark:text-red-300 text-sm mb-3 flex items-center gap-2"><span className="bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-200 px-1.5 rounded text-[10px]">CRITICAL</span> Missing Keywords</h4><div className="flex flex-wrap gap-2">{resumeAnalysis.missingKeywords?.length > 0 ? resumeAnalysis.missingKeywords.map((k, i) => (<span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-md shadow-sm">{k}</span>)) : <span className="text-xs text-slate-500 dark:text-slate-400">None detected. Great job!</span>}</div></div>
                                </div>
                            </div>
                        ) : <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">Click "Run Free ATS Scan" to see how well your resume matches the job description.</div>}
                </div>
            </>
        )}

        {activeTab === 'linkedin' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Headline Strategy</h3>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">{currentHeadline}</p>
                {toolkit.linkedin.alternativeHeadlines && (
                    <div className="space-y-2">
                        {toolkit.linkedin.alternativeHeadlines.map((h, i) => (
                            <button key={i} onClick={() => handleCopyHeadline(h, i)} className="w-full text-left p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:border-blue-400 transition-colors flex justify-between items-center group">
                                <span>{h}</span>
                                <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 uppercase">{copiedHeadlineIndex === i ? 'Copied' : 'Copy'}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Interactive Bio (About Section)</h3>
                    <button onClick={handleCopyBio} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                        {copiedBio ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                        {copiedBio ? 'Bio Copied!' : 'Copy Full Bio'}
                    </button>
                </div>
                <textarea className="w-full h-48 p-4 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-950 text-sm mb-4" value={currentBio} onChange={(e) => setCurrentBio(e.target.value)} />
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Refine Tone:</span>
                    <select value={bioTone} onChange={(e) => setBioTone(e.target.value as any)} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Professional">Professional & Direct</option>
                        <option value="Storyteller">Storyteller (Engaging)</option>
                        <option value="Executive">Executive (Impactful)</option>
                    </select>
                    <button onClick={handleRegenerateBio} disabled={isRegeneratingBio} className="w-full sm:w-auto ml-auto px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded transition-colors disabled:opacity-50">
                        {isRegeneratingBio ? 'Updating Bio...' : 'Apply Tone Changes'}
                    </button>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex-grow w-full">
                   <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">Targeting a different role?</label>
                   <input type="text" placeholder="e.g. 'Senior Architect'" className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 text-sm" value={newRoleInput} onChange={(e) => setNewRoleInput(e.target.value)} />
                </div>
                <button onClick={(e) => handleRoadmapUpdate(e)} disabled={isRegeneratingRoadmap} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                    {isRegeneratingRoadmap ? 'Analyzing...' : 'Update Roadmap'}
                </button>
            </div>
            <div className="relative pt-4">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">🗺️</span> Career Strategy Flowchart
                </h3>
                <div className="space-y-2">
                    {Array.isArray(toolkit.careerRoadmap) ? toolkit.careerRoadmap.map((step, i) => (
                        <RoadmapStepItem key={i} step={step} index={i} isLast={i === toolkit.careerRoadmap.length - 1} onUnlock={handleRazorpayPayment} isPro={isProMember} />
                    )) : <div className="text-center py-10 text-slate-400">Roadmap generation failed. Please try regenerating.</div>}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'elite' && (
            <div className="space-y-8">
                {isProMember ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Elite Pass Indicator */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-400/10 rounded-full blur-xl"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400 ring-4 ring-white dark:ring-slate-800">
                                    <span className="text-xl">👑</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Elite Pass Active</h3>
                                    <p className="text-xs text-slate-500">All premium intelligence unlocked.</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 relative z-10">
                                <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Time Remaining</span>
                                <span className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">{timeRemaining}</span>
                            </div>
                        </div>

                        {!hasEliteContent ? (
                             <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Initialize Elite Strategy Engine ⚡</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto text-lg">Analyze your unique profile to generate bespoke courses, recruiter psychology, and networking kits.</p>
                                <button onClick={handleGenerateEliteTools} disabled={isGeneratingElite} className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transform transition hover:-translate-y-1">
                                    {isGeneratingElite ? 'Generating Elite Kit...' : 'Generate All Elite Tools'}
                                </button>
                             </div>
                        ) : (
                            <div className="space-y-10">
                                {/* Course Recommendations Section */}
                                {toolkit.suggestedCourses && toolkit.suggestedCourses.length > 0 && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8 animate-in fade-in slide-in-from-bottom-2 delay-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                                            <span className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg"><span className="text-xl">🎓</span></span>
                                            Elite Course Recommendations
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                            {toolkit.suggestedCourses.map((course, idx) => (
                                                <div key={idx} className="group bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all flex flex-col h-full shadow-sm hover:shadow-md">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 bg-cyan-50 dark:bg-cyan-900/40 px-2 py-0.5 rounded-md border border-cyan-100 dark:border-cyan-800">
                                                            {course.provider}
                                                        </span>
                                                        <div className="text-slate-300 dark:text-slate-700 group-hover:text-cyan-500 transition-colors">
                                                            <ArrowRightIcon className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                                                        {course.title}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-auto border-t border-slate-200 dark:border-slate-800 pt-3 italic">
                                                        "{course.reason}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 overflow-hidden relative animate-in fade-in slide-in-from-bottom-2">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🧠</div>
                                    <div className="p-6 relative z-10">
                                        <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2"><span className="text-2xl">🧠</span> Recruiter Psychology</h3>
                                        <p className="text-slate-300 text-sm italic mb-4 border-l-4 border-purple-500 pl-4 py-2 bg-slate-800/50 rounded-r">"Here is what I'm subconsciously thinking when I see your profile..."</p>
                                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{toolkit.recruiterPsychology}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><SearchIcon className="w-6 h-6 text-blue-600" />Universal Internship Matcher</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Smart Search Strategy for <strong>{userInput.currentYear}</strong> students (1st, 2nd, 3rd, or 4th year).</p>
                                        </div>
                                        <button onClick={handleFindInternships} disabled={isFinding} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors">
                                            {isFinding ? 'Finding...' : 'Run Matcher'}
                                        </button>
                                    </div>
                                    {toolkit.internshipHunter ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Copy-Paste Boolean Strings</h4><div className="space-y-3">{toolkit.internshipHunter?.searchQueries?.map((q, i) => (<div key={i} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 truncate group relative hover:border-blue-400 cursor-pointer" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`)}>{q}<div className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 opacity-0 group-hover:opacity-100">GO ↗</div></div>))}</div></div>
                                            <div><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Strategic Game Plan</h4><div className="flex flex-wrap gap-2 mb-4">{toolkit.internshipHunter?.platforms?.map((p, i) => (<span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 text-[10px] font-bold uppercase rounded-full border border-blue-100">{p}</span>))}</div><div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100"><p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">🔥 THE ELITE HACK</p><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{toolkit.internshipHunter?.strategy}</p></div></div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                            <p className="text-slate-400 text-sm">Tailor your search strategy with one click.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[{ title: "📧 Founder Cold Email", content: toolkit.coldEmail, color: "from-blue-600 to-indigo-600" }, { title: "🤝 HR / Recruiter Email", content: toolkit.hrEmail, color: "from-indigo-600 to-purple-600" }, { title: "💼 LinkedIn Pitch", content: toolkit.linkedinPitch, color: "from-sky-600 to-blue-600" }, { title: "🔄 Follow-Up Message", content: toolkit.followUpEmail, color: "from-slate-600 to-slate-800" }, { title: "👥 Referral Request", content: toolkit.referralEmail, color: "from-teal-600 to-emerald-600" }, { title: "💰 Salary Negotiation", content: toolkit.salaryNegotiation, color: "from-green-600 to-emerald-600" }].map((item, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                                            <div className={`bg-gradient-to-r ${item.color} p-3 text-white font-bold flex justify-between items-center`}>
                                                <span className="text-sm truncate mr-2">{item.title}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(item.content || ""); alert("Copied!"); }} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">Copy</button>
                                            </div>
                                            <div className="p-4 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-xs leading-relaxed flex-grow">
                                                {item.content || "Ready to generate..."}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                   <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-5xl mb-8">🔒</div>
                       <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Elite Tier Tools Locked</h2>
                       <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-10 text-lg">Join Elite to unlock <strong>Course Recommendations</strong>, <strong>Recruiter Profiles</strong>, <strong>Universal Internship Matcher</strong>, and more.</p>
                       <button onClick={handleRazorpayPayment} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black rounded-xl shadow-lg hover:scale-105 transition-transform text-lg">Unlock All Tools (24h) - ₹25</button>
                   </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;