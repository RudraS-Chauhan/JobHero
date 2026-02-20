import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { JobToolkit, ResumeAnalysis, UserInput, InterviewFeedback } from '../types';
import { analyzeResume, generateEliteTools, analyzeInterviewAnswer, regenerateCareerRoadmap } from '../services/geminiService';
import { ResumePreview, TemplateType } from './ResumePreview';
import { ResumeIcon } from './icons/ResumeIcon';
import { CoverLetterIcon } from './icons/CoverLetterIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { InterviewIcon } from './icons/InterviewIcon';
import { RoadmapIcon } from './icons/RoadmapIcon';
import { SearchIcon } from './icons/SearchIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ShareIcon } from './icons/ShareIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { RoadmapVisualizer } from './RoadmapVisualizer';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface ResultsDisplayProps {
  toolkit: JobToolkit;
  userInput: UserInput;
  onReset: () => void;
  onUpdateToolkit: (updates: Partial<JobToolkit>) => void;
}

type Tab = 'resume' | 'coverLetter' | 'linkedin' | 'interview' | 'roadmap' | 'elite';

const tabs: { id: Tab; name: string; icon: any }[] = [
  { id: 'resume', name: 'Resume', icon: ResumeIcon },
  { id: 'coverLetter', name: 'Cover Letter', icon: CoverLetterIcon },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
  { id: 'interview', name: 'Interview', icon: InterviewIcon },
  { id: 'roadmap', name: 'Strategy', icon: RoadmapIcon },
  { id: 'elite', name: 'Elite Suite', icon: () => <span className="text-lg">⚡</span> },
];

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

// Improved Visual Template Card Component
const TemplateCard: React.FC<{ type: TemplateType, isSelected: boolean, isLocked: boolean, onClick: () => void }> = ({ type, isSelected, isLocked, onClick }) => {
    // Distinct visual layouts based on template type
    const renderPreview = () => {
        if (type === 'Classic') {
            return (
                <div className="flex flex-col items-center p-2 space-y-1.5 opacity-60">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full mb-0.5"></div>
                    <div className="w-10 h-1 bg-slate-400 rounded-full mb-2"></div>
                    <div className="w-full h-px bg-slate-300 mb-1"></div>
                    <div className="w-full space-y-1">
                         <div className="w-8 h-1 bg-slate-300 rounded-sm"></div>
                         <div className="w-full h-0.5 bg-slate-200"></div>
                         <div className="w-full h-0.5 bg-slate-200"></div>
                    </div>
                </div>
            );
        }
        if (type === 'Modern') {
            return (
                <div className="flex p-2 gap-1.5 opacity-70 h-full">
                    <div className="w-1/4 h-full bg-blue-50 rounded-l-sm flex flex-col gap-1 p-0.5 pt-2">
                        <div className="w-full h-1 bg-blue-200 rounded-full"></div>
                        <div className="w-3/4 h-1 bg-blue-200 rounded-full"></div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 pt-1">
                        <div className="w-16 h-2 bg-blue-600 rounded-sm mb-1"></div>
                        <div className="w-full h-0.5 bg-slate-200"></div>
                        <div className="w-full h-0.5 bg-slate-200"></div>
                    </div>
                </div>
            );
        }
        if (type === 'Executive') {
            return (
                <div className="flex h-full bg-slate-900 p-2 gap-1.5 opacity-90 text-slate-400">
                    <div className="w-1 h-full bg-blue-600 rounded-full"></div>
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="w-14 h-2 bg-white rounded-sm mb-1"></div>
                        <div className="w-full h-0.5 bg-slate-700"></div>
                        <div className="w-5/6 h-0.5 bg-slate-700"></div>
                        <div className="w-10 h-1 bg-blue-500 rounded-sm mt-1"></div>
                        <div className="w-full h-0.5 bg-slate-700"></div>
                    </div>
                </div>
            );
        }
        if (type === 'Creative') {
             return (
                 <div className="p-2 h-full opacity-80">
                     <div className="w-16 h-3 bg-purple-600 rounded-sm mb-2"></div>
                     <div className="flex gap-2">
                         <div className="w-1/3 space-y-1">
                             <div className="w-full h-1 bg-purple-200 rounded-full"></div>
                             <div className="w-full h-1 bg-purple-200 rounded-full"></div>
                         </div>
                         <div className="flex-1 space-y-1">
                             <div className="w-full h-0.5 bg-slate-200"></div>
                             <div className="w-full h-0.5 bg-slate-200"></div>
                             <div className="w-full h-0.5 bg-slate-200"></div>
                         </div>
                     </div>
                 </div>
             );
        }
        if (type === 'Elegant') {
            return (
                <div className="flex flex-col items-center p-2 h-full bg-[#FFFCF5] opacity-80 border-y-2 border-amber-900/10">
                    <div className="w-16 h-2 bg-amber-900/80 rounded-sm mb-2 mt-1"></div>
                    <div className="w-full h-px bg-amber-900/20 mb-2"></div>
                    <div className="w-full flex gap-2">
                        <div className="w-1/2 space-y-1">
                             <div className="w-8 h-1 bg-amber-800/40 rounded-sm"></div>
                             <div className="w-full h-0.5 bg-amber-900/10"></div>
                        </div>
                        <div className="w-1/2 space-y-1">
                             <div className="w-8 h-1 bg-amber-800/40 rounded-sm"></div>
                             <div className="w-full h-0.5 bg-amber-900/10"></div>
                        </div>
                    </div>
                </div>
            );
        }
        if (type === 'Startup') {
            return (
                <div className="p-2 h-full opacity-80 bg-slate-50 border-l-2 border-emerald-500">
                    <div className="w-20 h-3 bg-slate-900 rounded-sm mb-2"></div>
                    <div className="w-12 h-1 bg-emerald-500 rounded-full mb-2"></div>
                    <div className="space-y-1.5">
                        <div className="w-full h-0.5 bg-slate-300"></div>
                        <div className="w-full h-0.5 bg-slate-300"></div>
                        <div className="w-full h-0.5 bg-slate-300"></div>
                    </div>
                </div>
            );
        }
        // Minimalist / Professional default
        return (
            <div className="p-2 space-y-2 opacity-60">
                <div className="w-12 h-2 bg-slate-800 rounded-sm"></div>
                <div className="space-y-1">
                    <div className="w-8 h-1 bg-slate-400 rounded-sm"></div>
                    <div className="w-full h-0.5 bg-slate-200"></div>
                    <div className="w-full h-0.5 bg-slate-200"></div>
                </div>
            </div>
        );
    };

    return (
        <div onClick={onClick} className={`relative w-full aspect-[4/5] rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900 transform scale-105 z-10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md'} bg-white overflow-hidden group`}>
            {isLocked && (
                <div className="absolute inset-0 bg-slate-900/60 z-20 flex flex-col items-center justify-center text-white backdrop-blur-[1px] transition-opacity duration-300">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md mb-1">
                        <span className="text-sm">🔒</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Premium</span>
                </div>
            )}
            
            {renderPreview()}

            <div className="absolute bottom-0 inset-x-0 p-1.5 bg-white/90 backdrop-blur-sm border-t border-slate-100">
                 <p className={`text-[9px] font-bold text-center uppercase tracking-wider ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>{type}</p>
            </div>
        </div>
    );
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors group" title="Copy to clipboard">
            {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />}
        </button>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ toolkit, userInput, onReset, onUpdateToolkit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // Updated isPro initialization with expiry check
  const [isPro, setIsPro] = useState(() => {
      const isPurchased = !!localStorage.getItem('jobHero_pro');
      const expiry = localStorage.getItem('jobHero_pro_expiry');
      if (isPurchased && expiry) {
          if (Date.now() > parseInt(expiry)) {
              localStorage.removeItem('jobHero_pro');
              localStorage.removeItem('jobHero_pro_expiry');
              return false;
          }
      }
      return isPurchased;
  });
  const [timeLeft, setTimeLeft] = useState<string>('');

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Classic');
  const [isSyncingElite, setIsSyncingElite] = useState(false);
  
  // Roadmap Interactivity State
  const [expandedRoadmapStep, setExpandedRoadmapStep] = useState<number | null>(null);
  const [roadmapRole, setRoadmapRole] = useState(userInput.jobRoleTarget);
  const [isRegeneratingRoadmap, setIsRegeneratingRoadmap] = useState(false);

  // Interview Feedback State
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, InterviewFeedback | null>>({});
  const [analyzingAnswer, setAnalyzingAnswer] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!isPro) {
        setTimeLeft('');
        return;
    }

    const updateTimer = () => {
        const expiryStr = localStorage.getItem('jobHero_pro_expiry');
        if (!expiryStr) return;
        
        const diff = parseInt(expiryStr) - Date.now();
        if (diff <= 0) {
            setIsPro(false);
            localStorage.removeItem('jobHero_pro');
            localStorage.removeItem('jobHero_pro_expiry');
            setTimeLeft('');
        } else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isPro]);

  const generateAndSendInvoice = async (paymentId: string) => {
    setInvoiceStatus('sending');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235);
        doc.text("AtlasCV", 20, 25);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Tax Invoice & Receipt", 20, 32);
        
        const date = new Date().toLocaleDateString();
        const invoiceNum = `INV-${Date.now().toString().slice(-8)}`;
        
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Invoice #:`, 140, 25);
        doc.text(invoiceNum, 170, 25);
        doc.text(`Date:`, 140, 32);
        doc.text(date, 170, 32);

        doc.setDrawColor(220);
        doc.line(20, 40, 190, 40);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text("Billed To:", 20, 50);
        doc.setFont(undefined, 'normal');
        doc.text(userInput.fullName, 20, 56);
        doc.text(userInput.email, 20, 62);
        doc.text(userInput.phone, 20, 68);

        doc.setFillColor(248, 250, 252);
        doc.rect(20, 75, 170, 10, 'F');
        doc.setFont(undefined, 'bold');
        doc.text("Description", 25, 81);
        doc.text("Amount", 165, 81);
        doc.setFont(undefined, 'normal');
        doc.text("AtlasCV - Elite Strategy Suite (24 Hour Access)", 25, 95);
        doc.text("Recruiter Psychology, Salary Scripts, Premium Templates", 25, 100);
        doc.text("INR 29.00", 165, 95);

        doc.line(20, 110, 190, 110);
        doc.setFont(undefined, 'bold');
        doc.text("Total Paid:", 135, 120);
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text("INR 29.00", 165, 120);

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.setFont(undefined, 'normal');
        doc.text(`Transaction ID: ${paymentId}`, 20, 140);
        doc.text("This is a computer generated invoice.", 20, 145);
        
        doc.save(`AtlasCV_Invoice_${invoiceNum}.pdf`);
        setInvoiceStatus('sent');
        setTimeout(() => setInvoiceStatus('idle'), 6000);
    } catch (e) {
        console.error("Invoice generation failed", e);
        setInvoiceStatus('idle');
    }
  };

  const handlePayment = () => {
      // Robust key retrieval checking multiple common patterns
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 
                    (window as any).process?.env?.VITE_RAZORPAY_KEY_ID || 
                    import.meta.env.REACT_APP_RAZORPAY_KEY_ID ||
                    import.meta.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
                    "";

      const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

      if (!keyId || keyId === '') {
          console.warn("Razorpay Key missing. Checked: VITE_RAZORPAY_KEY_ID, REACT_APP_..., NEXT_PUBLIC_...");
          if (confirm("DEV MODE: No Razorpay Key found. Simulate successful payment?")) {
              localStorage.setItem('jobHero_pro', 'true');
              localStorage.setItem('jobHero_pro_expiry', expiryTime.toString());
              setIsPro(true);
              generateAndSendInvoice("TEST_TXN_" + Date.now());
          }
          return;
      }
      const options = {
          key: keyId,
          amount: 2900, currency: "INR", name: "AtlasCV", description: "Unlock Elite Career Tools",
          handler: (response: any) => { 
            localStorage.setItem('jobHero_pro', 'true'); 
            localStorage.setItem('jobHero_pro_expiry', expiryTime.toString());
            setIsPro(true); 
            generateAndSendInvoice(response.razorpay_payment_id || "TXN_PENDING");
          },
          prefill: { name: userInput.fullName, email: userInput.email }, theme: { color: "#2563EB" }
      };
      try { const rzp1 = new window.Razorpay(options); rzp1.open(); } catch (e) { alert("Razorpay SDK Error"); }
  };

  // Auto-sync Elite tools when Pro is active
  useEffect(() => {
    if (isPro && !toolkit.recruiterPsychology && !isSyncingElite) {
        syncElite();
    }
  }, [isPro]);

  const runAnalysis = async () => {
      setIsAnalyzing(true);
      try {
          const res = await analyzeResume(toolkit.resume, userInput.jobRoleTarget);
          setAnalysis(res);
      } catch (e) { alert("Analysis failed."); }
      finally { setIsAnalyzing(false); }
  };

  const syncElite = async () => {
      setIsSyncingElite(true);
      try {
          const elite = await generateEliteTools(userInput);
          onUpdateToolkit(elite);
      } catch (e) { alert("Elite sync failed."); }
      finally { setIsSyncingElite(false); }
  };

  const handleRegenerateRoadmap = async () => {
      if (!roadmapRole.trim()) return;
      setIsRegeneratingRoadmap(true);
      try {
          const result = await regenerateCareerRoadmap(userInput, roadmapRole, true); 
          if (result && result.careerRoadmap) {
              onUpdateToolkit({ careerRoadmap: result.careerRoadmap });
          }
      } catch (e) {
          alert("Failed to regenerate roadmap.");
      } finally {
          setIsRegeneratingRoadmap(false);
      }
  };

  const handleAnalyzeAnswer = async (index: number, question: string) => {
      const answer = userAnswers[index];
      if (!answer || answer.trim().length < 10) {
          alert("Please enter a more detailed answer (at least 10 characters).");
          return;
      }
      setAnalyzingAnswer(index);
      try {
          const result = await analyzeInterviewAnswer(question, answer, userInput.jobRoleTarget, userInput.company);
          setFeedback(prev => ({ ...prev, [index]: result }));
      } catch (e) {
          console.error(e);
          alert("Failed to analyze answer.");
      } finally {
          setAnalyzingAnswer(null);
      }
  };

  const handleShare = async () => {
      setIsSharing(true);
      try {
          // 1. Construct minimal data object
          const shareData = {
              n: userInput.fullName,
              e: userInput.email,
              p: userInput.phone,
              l: userInput.linkedinGithub,
              r: toolkit.resume,
              t: selectedTemplate
          };

          // 2. Encode to Base64
          const jsonStr = JSON.stringify(shareData);
          const encoded = btoa(encodeURIComponent(jsonStr));

          // 3. Construct URL
          const url = `${window.location.origin}?shareData=${encoded}`;

          // 4. Copy to clipboard
          await navigator.clipboard.writeText(url);
          alert("Resume link copied to clipboard! You can now share it.");
      } catch (e) {
          console.error("Sharing failed", e);
          alert("Failed to generate share link.");
      } finally {
          setIsSharing(false);
      }
  };

  const downloadPDF = async (text: string, name: string) => {
      const element = document.getElementById('resume-preview-container');
      if (!element) {
          // Fallback to text if element not found
          const doc = new jsPDF();
          doc.setFontSize(11);
          doc.text(doc.splitTextToSize(text, 180), 10, 10);
          doc.save(name);
          return;
      }

      try {
          // Use html2canvas to capture the visual design
          const canvas = await html2canvas(element, {
              scale: 2, // Higher scale for better quality
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0; // Top align

          // Calculate height in PDF units
          const imgHeightInPdf = imgHeight * ratio;
          
          // If content is longer than one page, we might need multi-page logic, 
          // but for now, let's fit to width and allow it to be a single long image or scale to fit.
          // A simple "scale to fit width" is usually best for resumes unless they are strictly multi-page.
          // Given the preview is often a single view, we'll scale to fit width.
          
          const componentWidth = pdfWidth;
          const componentHeight = (imgHeight * pdfWidth) / imgWidth;

          // If height exceeds A4, we might need to split, but for this "snapshot" approach:
          if (componentHeight > pdfHeight) {
             // Multi-page approach (basic)
             let heightLeft = componentHeight;
             let position = 0;
             
             pdf.addImage(imgData, 'PNG', 0, position, componentWidth, componentHeight);
             heightLeft -= pdfHeight;

             while (heightLeft >= 0) {
               position = heightLeft - componentHeight;
               pdf.addPage();
               pdf.addImage(imgData, 'PNG', 0, position, componentWidth, componentHeight);
               heightLeft -= pdfHeight;
             }
          } else {
             pdf.addImage(imgData, 'PNG', 0, 0, componentWidth, componentHeight);
          }

          pdf.save(name);
      } catch (error) {
          console.error("PDF generation failed", error);
          alert("Failed to generate PDF. Falling back to text mode.");
          // Fallback
          const doc = new jsPDF();
          doc.setFontSize(11);
          doc.text(doc.splitTextToSize(text, 180), 10, 10);
          doc.save(name);
      }
  };

  const isPremium = (t: TemplateType) => ['Creative', 'Elegant', 'Executive', 'Minimalist', 'Professional'].includes(t);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-6 relative">
      {/* ... existing invoice modals */}
      {invoiceStatus === 'sending' && (
          <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 flex items-center gap-4 border border-slate-200 dark:border-slate-700">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                  <h4 className="font-bold text-sm">Processing Invoice</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Generating tax receipt...</p>
              </div>
          </div>
      )}
      {invoiceStatus === 'sent' && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 flex items-center gap-4">
              <div className="bg-green-500 rounded-full p-1"><CheckIcon className="w-4 h-4 text-white" /></div>
              <div>
                  <h4 className="font-bold text-sm">Invoice Emailed</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Sent to {userInput.email}</p>
              </div>
          </div>
      )}

      <div className="sticky top-20 z-40 mb-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center flex-1 min-w-0 gap-1.5 px-1.5 py-2 rounded-lg text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap overflow-hidden ${
              activeTab === tab.id 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{tab.name}</span>
          </button>
        ))}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 flex-shrink-0"></div>
        <button onClick={onReset} className="flex-shrink-0 px-3 py-2 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">Reset</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 min-h-[800px]">
        
        {activeTab === 'resume' && (
            <div className="flex flex-col gap-6">
                
                {/* 1. Template Selector (Visually enhanced) */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <span className="text-xl">🎨</span>
                             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Design Gallery</h4>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleShare} disabled={isSharing} className="flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                <ShareIcon className="w-3.5 h-3.5" /> {isSharing ? 'Generating...' : 'Share Resume'}
                            </button>
                            <button onClick={() => downloadPDF(toolkit.resume, 'resume.pdf')} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                <DownloadIcon className="w-3.5 h-3.5" /> Download PDF
                            </button>
                        </div>
                    </div>
                    {/* Grid Layout - Compact */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
                        {['Classic', 'Modern', 'Minimalist', 'Creative', 'Professional', 'Elegant', 'Executive', 'Startup'].map((t) => (
                            <TemplateCard 
                                key={t} type={t as TemplateType} isSelected={selectedTemplate === t} 
                                isLocked={isPremium(t as TemplateType) && !isPro} 
                                onClick={() => (isPremium(t as TemplateType) && !isPro) ? handlePayment() : setSelectedTemplate(t as TemplateType)} 
                            />
                        ))}
                    </div>
                </div>

                {/* 2. Resume Preview (Center Stage) */}
                <div className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white shadow-sm min-h-[800px]">
                    <ResumePreview text={toolkit.resume} template={selectedTemplate} userInput={userInput} isBlurred={isPremium(selectedTemplate) && !isPro} onUnlock={handlePayment} />
                </div>

                {/* 3. ATS Strategy Lab */}
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden mt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <SearchIcon className="w-5 h-5 text-blue-600" /> ATS Neural Scan & Deep Audit
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Professional-grade analysis against target role requirements.</p>
                        </div>
                        <button onClick={runAnalysis} disabled={isAnalyzing} className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
                            {isAnalyzing ? 'Auditing...' : 'Run Deep Audit'}
                        </button>
                    </div>

                    {analysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Audit Summary</h4>
                                <p className={`text-sm font-bold leading-relaxed ${analysis.score >= 80 ? 'text-green-600' : (analysis.score >= 60 ? 'text-amber-500' : 'text-red-500')}`}>{analysis.summary}</p>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <div className="text-4xl font-black text-slate-900 dark:text-white">{analysis.score}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">/ 100</div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Strict evaluation based on provided skills and experience.</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
                                <h4 className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3">Critical Gaps & Missing Keywords</h4>
                                <div className="space-y-3">
                                    {analysis.missingKeywords.map((k, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-100 dark:border-red-900/20 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-2">
                                                    {k.keyword}
                                                </span>
                                                {k.context && (
                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                        {k.context}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                                                {k.reason}
                                            </p>
                                            
                                            <div className="relative bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                <div className="absolute top-3 left-3 text-blue-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                                    </svg>
                                                </div>
                                                <div className="pl-5">
                                                    <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5 uppercase text-[8px] tracking-widest">Optimization Strategy</span>
                                                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 italic">"{k.integrationTip}"</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Elite Suite (Footer) */}
                <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden shadow-lg mt-2">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <div>
                            <h3 className="text-xl font-black mb-1 flex items-center gap-2 justify-center md:justify-start"><span className="text-amber-400">⚡</span> Elite Suite</h3>
                            <p className="text-slate-400 text-xs font-medium">Unlock recruiter insights & negotiation scripts.</p>
                        </div>
                        {!isPro ? (
                            <button onClick={handlePayment} className="px-6 py-2.5 bg-amber-500 text-slate-900 text-xs font-black rounded-xl hover:bg-amber-400 transition-all whitespace-nowrap">Unlock (₹29)</button>
                        ) : (
                            <div className="flex flex-col items-end">
                                <div className="px-4 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50 flex items-center gap-2"><CheckIcon className="w-3 h-3"/> Active</div>
                                {timeLeft && <span className="text-[10px] font-mono text-slate-400 mt-1">Exp: {timeLeft}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ... (Other tabs remain unchanged) ... */}
        {activeTab === 'coverLetter' && (
            <div className="animate-in fade-in space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black">Cover Letter</h3>
                    <button onClick={() => downloadPDF(toolkit.coverLetter, 'cover_letter.pdf')} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"><DownloadIcon className="w-4 h-4"/></button>
                </div>
                <div className="w-full h-[600px] p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-serif leading-7 text-slate-700 dark:text-slate-300 shadow-inner overflow-auto whitespace-pre-wrap">
                    {toolkit.coverLetter || "Generating cover letter..."}
                </div>
            </div>
        )}

        {activeTab === 'linkedin' && (
            <div className="animate-in fade-in space-y-8">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Optimized Headlines</h4>
                    <div className="space-y-3">
                        {toolkit.linkedin?.headlines && toolkit.linkedin.headlines.length > 0 ? toolkit.linkedin.headlines.map((headline, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:shadow-sm transition-all group">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex-grow pr-4">{headline}</p>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={headline} />
                                </div>
                            </div>
                        )) : <p className="text-slate-500 text-xs italic">Content unavailable. Please try regenerating.</p>}
                    </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">About / Summary</h4>
                        <CopyButton text={toolkit.linkedin?.bio || ""} />
                    </div>
                    <textarea className="w-full h-60 bg-transparent text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 outline-none resize-none p-2" defaultValue={toolkit.linkedin?.bio || "Content unavailable."} />
                </div>
            </div>
        )}

        {activeTab === 'interview' && (
            <div className="animate-in fade-in space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl text-center mb-4">
                    <h3 className="text-xl font-black mb-1">Interview Prep</h3>
                    <p className="text-xs text-slate-500">Role: <span className="text-blue-600 font-bold">{userInput.jobRoleTarget}</span></p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {toolkit.mockInterview?.questions && toolkit.mockInterview.questions.length > 0 ? toolkit.mockInterview.questions.map((q, i) => (
                        <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <div className="flex gap-3 mb-3">
                                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">Q{i+1}</div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{q.question}</h4>
                            </div>
                            <div className="pl-9 space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                    <span className="font-bold not-italic text-slate-900 dark:text-slate-200 block mb-1 text-[10px] uppercase tracking-wide">Context & Strategy</span>
                                    {q.context} <br/> {q.feedback}
                                </div>
                                
                                <div className="space-y-2">
                                    <textarea
                                        placeholder="Type your answer here to get AI feedback..."
                                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                        rows={3}
                                        value={userAnswers[i] || ''}
                                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                    />
                                    <button 
                                        onClick={() => handleAnalyzeAnswer(i, q.question)} 
                                        disabled={analyzingAnswer === i || !userAnswers[i]}
                                        className="text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {analyzingAnswer === i ? 'Analyzing...' : 'Analyze Answer'}
                                    </button>
                                </div>

                                {feedback[i] && (
                                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">AI Analysis</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Score:</span>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded ${feedback[i]!.rating >= 7 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{feedback[i]!.rating}/10</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <h5 className="text-[9px] font-bold uppercase text-slate-500 mb-1">Clarity</h5>
                                                <p className="text-xs text-slate-700 dark:text-slate-300">{feedback[i]!.clarity}</p>
                                            </div>
                                            <div>
                                                <h5 className="text-[9px] font-bold uppercase text-slate-500 mb-1">Relevance</h5>
                                                <p className="text-xs text-slate-700 dark:text-slate-300">{feedback[i]!.relevance}</p>
                                            </div>
                                        </div>

                                        {feedback[i]!.missingPoints && feedback[i]!.missingPoints.length > 0 && (
                                            <div className="mb-3">
                                                <h5 className="text-[9px] font-bold uppercase text-red-500 mb-1">Missing Key Points</h5>
                                                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400">
                                                    {feedback[i]!.missingPoints.map((point, idx) => (
                                                        <li key={idx}>{point}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <h5 className="text-[9px] font-bold uppercase text-green-600 mb-1">Ideal Sample Answer</h5>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{feedback[i]!.sampleAnswer}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-center text-slate-500 text-sm">No interview questions generated.</p>}
                </div>
            </div>
        )}

        {activeTab === 'roadmap' && (
            <div className="animate-in fade-in py-4">
                {/* Control Panel */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="w-full md:w-auto flex-grow">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Target Role Strategy</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={roadmapRole} 
                                onChange={(e) => setRoadmapRole(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleRegenerateRoadmap}
                        disabled={isRegeneratingRoadmap}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isRegeneratingRoadmap ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Designing...
                            </>
                        ) : (
                            <>
                                <RefreshIcon className="w-4 h-4" />
                                Recalibrate Strategy
                            </>
                        )}
                    </button>
                </div>

                {toolkit.careerRoadmap && toolkit.careerRoadmap.length > 0 ? (
                    <RoadmapVisualizer steps={toolkit.careerRoadmap} />
                ) : <p className="text-center text-slate-500 text-sm">No roadmap generated.</p>}
            </div>
        )}

        {activeTab === 'elite' && (
            <div className="py-12 text-center">
                {!isPro ? (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-5xl mb-4">🔒</div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Elite Strategy Suite</h2>
                        <p className="text-slate-500 text-sm">Unlock recruiter psychology insights, salary negotiation scripts, and custom networking strategies used by top 1% candidates.</p>
                        <button onClick={handlePayment} className="px-8 py-3 bg-blue-600 text-white font-black text-sm rounded-xl shadow-lg hover:scale-105 transition-all">Unlock Full System (₹29)</button>
                    </div>
                ) : (
                    <div className="text-left space-y-8 animate-in fade-in">
                        <div className="flex justify-center mb-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 rounded-lg border border-slate-700 shadow-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-300">Session Active: <span className="text-white font-mono">{timeLeft}</span></span>
                            </div>
                        </div>

                        {!toolkit.recruiterPsychology && (
                            <div className="text-center py-10">
                                <button onClick={syncElite} disabled={isSyncingElite} className="px-8 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-blue-700">{isSyncingElite ? 'Syncing...' : 'Initialize Elite Tools'}</button>
                            </div>
                        )}
                        {toolkit.recruiterPsychology && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h4 className="font-black text-blue-600 text-[10px] uppercase mb-4 tracking-widest">Recruiter Psychology</h4>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium">{toolkit.recruiterPsychology}</p>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h4 className="font-black text-blue-600 text-[10px] uppercase mb-4 tracking-widest">Salary Script</h4>
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium">{toolkit.salaryNegotiation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;