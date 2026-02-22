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

const tabs: { id: Tab; name: string; icon: any; tooltip: string }[] = [
  { id: 'resume', name: 'Resume', icon: ResumeIcon, tooltip: "View and customize your AI-generated resume" },
  { id: 'coverLetter', name: 'Cover Letter', icon: CoverLetterIcon, tooltip: "Get a tailored cover letter for your target role" },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon, tooltip: "Optimize your LinkedIn profile and headlines" },
  { id: 'interview', name: 'Interview', icon: InterviewIcon, tooltip: "Practice with AI-generated interview questions" },
  { id: 'roadmap', name: 'Strategy', icon: RoadmapIcon, tooltip: "View your personalized career roadmap" },
  { id: 'elite', name: 'Elite Suite', icon: () => <span className="text-lg">⚡</span>, tooltip: "Unlock premium career tools and insights" },
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

const LabeledCopyButton: React.FC<{ text: string, label: string }> = ({ text, label }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : label}
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

  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState<number | 'default'>('default');
  
  // Helper to get current questions
  const getCurrentQuestions = () => {
      if (selectedCompanyIndex === 'default' || !toolkit.mockInterview?.companySpecific) {
          return toolkit.mockInterview?.questions || [];
      }
      return toolkit.mockInterview.companySpecific[selectedCompanyIndex]?.questions || [];
  };

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
        doc.text("Recruiter Psychology, Salary Scripts, Cold Email Scripts, Premium Templates", 25, 100);
        doc.text("INR 25.00", 165, 95);

        doc.line(20, 110, 190, 110);
        doc.setFont(undefined, 'bold');
        doc.text("Total Paid:", 135, 120);
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text("INR 25.00", 165, 120);

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
          amount: 2500, currency: "INR", name: "AtlasCV", description: "Unlock Elite Career Tools",
          handler: (response: any) => { 
            localStorage.setItem('jobHero_pro', 'true'); 
            localStorage.setItem('jobHero_pro_expiry', expiryTime.toString());
            setIsPro(true); 
            generateAndSendInvoice(response.razorpay_payment_id || "TXN_PENDING");
          },
          modal: {
              ondismiss: () => {
                  if (confirm("Payment incomplete. Activate Demo Mode to preview Elite Tools?")) {
                      localStorage.setItem('jobHero_pro', 'true');
                      localStorage.setItem('jobHero_pro_expiry', expiryTime.toString());
                      setIsPro(true);
                      generateAndSendInvoice("DEMO_TXN_" + Date.now());
                  }
              }
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

    const downloadPDF = async (elementId: string, fileName: string) => {
        const element = document.getElementById(elementId);
        if (!element) {
            alert('Preview not found. Please try again.');
            return;
        }
        
        try {
            // Wait for fonts to load
            await document.fonts.ready;
            
            // Clone the element to ensure we capture the full content without scrollbars or hidden overflow
            const clone = element.cloneNode(true) as HTMLElement;
            
            // Reset styles on the clone to ensure full visibility
            clone.style.position = 'fixed';
            clone.style.top = '-10000px';
            clone.style.left = '-10000px';
            clone.style.width = '850px'; // Standard A4 width approx
            clone.style.height = 'auto';
            clone.style.overflow = 'visible';
            clone.style.maxHeight = 'none';
            clone.style.transform = 'none';
            clone.style.zIndex = '-1000';
            
            // Remove any blur or opacity classes from the clone
            clone.classList.remove('blur-sm', 'opacity-90', 'select-none', 'overflow-hidden');
            
            // Append to body temporarily
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                scale: 3, // Higher quality (300 DPI equivalent)
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 850,
            });
            
            // Remove clone
            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('High-quality PDF generation failed. Please try again or use a different browser.');
        }
    };

  const isPremium = (t: TemplateType) => ['Creative', 'Elegant', 'Executive', 'Minimalist', 'Professional'].includes(t);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-6 relative">
      {/* ... existing invoice modals */}
      {/* Elite Session Timer - Fixed Corner */}
      {isPro && timeLeft && (
          <div className="fixed bottom-6 left-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-left-10 fade-in duration-500">
              <div className="relative flex items-center justify-center w-10 h-10 bg-slate-800 rounded-full border border-slate-600">
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-800 rounded-full animate-pulse"></div>
                  <span className="text-lg">⚡</span>
              </div>
              <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Elite Session</p>
                  <p className="text-sm font-mono font-bold text-white tabular-nums tracking-wide">{timeLeft}</p>
              </div>
          </div>
      )}

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
            title={tab.tooltip}
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
                            <button onClick={() => downloadPDF('resume-preview-container', 'resume.pdf')} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                <DownloadIcon className="w-3.5 h-3.5" /> Download Resume as PDF
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

                {/* 3. ATS Strategy Lab (Linked from Elite Tab) */}
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden mt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <SearchIcon className="w-5 h-5 text-blue-600" /> ATS Neural Scan & Deep Audit
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Professional-grade analysis against target role requirements.</p>
                        </div>
                        <button onClick={isPro ? runAnalysis : handlePayment} disabled={isAnalyzing} className={`px-5 py-2.5 ${isPro ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-amber-500 text-slate-900'} text-xs font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg`}>
                            {!isPro && <span className="text-sm">🔒</span>}
                            {isAnalyzing ? 'Auditing...' : (isPro ? 'Run Deep Audit' : 'Unlock Audit (Pro)')}
                        </button>
                    </div>

                    {analysis && (
                        <div className="space-y-6 animate-in fade-in text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <h4 className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-3">Key Strengths</h4>
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] text-slate-700 dark:text-slate-300">
                                                <CheckIcon className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Strategic Improvements</h4>
                                    <ul className="space-y-2">
                                        {analysis.improvements.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] text-slate-700 dark:text-slate-300">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
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
                            <button onClick={handlePayment} className="px-6 py-2.5 bg-amber-500 text-slate-900 text-xs font-black rounded-xl hover:bg-amber-400 transition-all whitespace-nowrap">Unlock (₹25)</button>
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
                    <div className="flex gap-2">
                        <LabeledCopyButton text={toolkit.coverLetter || ""} label="Copy Text" />
                        <button onClick={() => downloadPDF('cover-letter-preview', 'cover_letter.pdf')} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                            <DownloadIcon className="w-3.5 h-3.5" /> Download Cover Letter as PDF
                        </button>
                    </div>
                </div>
                <div id="cover-letter-preview" className="w-full h-[600px] p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-serif leading-7 text-slate-700 dark:text-slate-300 shadow-inner overflow-auto whitespace-pre-wrap">
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
                    
                    {/* Company Selector */}
                    {toolkit.mockInterview?.companySpecific && toolkit.mockInterview.companySpecific.length > 0 && (
                        <div className="mt-4 flex justify-center">
                            <select 
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                                onChange={(e) => setSelectedCompanyIndex(e.target.value === 'default' ? 'default' : parseInt(e.target.value))}
                                value={selectedCompanyIndex}
                            >
                                <option value="default">General Interview Questions</option>
                                {toolkit.mockInterview.companySpecific.map((c, i) => (
                                    <option key={i} value={i}>{c.company}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {getCurrentQuestions().length > 0 ? getCurrentQuestions().map((q, i) => (
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
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                                <h5 className="text-[9px] font-bold uppercase text-slate-500 mb-1">Clarity</h5>
                                                <div className="text-lg font-black text-blue-600 dark:text-blue-400">{feedback[i]!.clarityScore}/10</div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">{feedback[i]!.clarity}</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                                <h5 className="text-[9px] font-bold uppercase text-slate-500 mb-1">Relevance</h5>
                                                <div className="text-lg font-black text-purple-600 dark:text-purple-400">{feedback[i]!.relevanceScore}/10</div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">{feedback[i]!.relevance}</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                                                <h5 className="text-[9px] font-bold uppercase text-slate-500 mb-1">Delivery</h5>
                                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{feedback[i]!.deliveryScore}/10</div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">{feedback[i]!.delivery}</p>
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

                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                            <h5 className="text-[9px] font-bold uppercase text-green-600 mb-2 flex items-center gap-2">
                                                <span>✨</span> 10/10 Sample Answer
                                            </h5>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">"{feedback[i]!.sampleAnswer}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-center text-slate-500 text-sm">No interview questions generated.</p>}
                    
                    {/* Premium Exact Answers Tile */}
                    <div className="mt-8 p-1 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 rounded-2xl shadow-xl">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm">
                                    🔑
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Unlock "The Perfect Script"</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                                    Get exact, word-for-word answers for every question above, tailored specifically to <strong>{userInput.company}</strong>'s culture and your unique background.
                                </p>
                                <button 
                                    onClick={handlePayment}
                                    disabled={isPro}
                                    className={`px-8 py-3 font-black text-sm rounded-xl shadow-lg transition-all transform hover:scale-105 ${
                                        isPro 
                                        ? 'bg-green-100 text-green-700 cursor-default' 
                                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/25'
                                    }`}
                                >
                                    {isPro ? '✅ Premium Access Active' : 'Unlock Exact Answers (₹25)'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'roadmap' && (
            <div className="animate-in fade-in py-4">
                {/* Control Panel */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="w-full md:w-auto flex-grow">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Target Role Strategy</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={roadmapRole} 
                                onChange={(e) => setRoadmapRole(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                             {isPro && (
                                <div className="flex items-center gap-2 px-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <span className="text-lg">⚡</span>
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider whitespace-nowrap">Elite Mode Active</span>
                                </div>
                            )}
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
                    <RoadmapVisualizer steps={toolkit.careerRoadmap} isPro={isPro} />
                ) : <p className="text-center text-slate-500 text-sm">No roadmap generated.</p>}

                {/* Elite Suite Footer for Roadmap */}
                <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden shadow-lg mt-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <div>
                            <h3 className="text-xl font-black mb-1 flex items-center gap-2 justify-center md:justify-start"><span className="text-amber-400">⚡</span> Elite Suite</h3>
                            <p className="text-slate-400 text-xs font-medium">Unlock recruiter insights & negotiation scripts.</p>
                        </div>
                        {!isPro ? (
                            <button onClick={handlePayment} className="px-6 py-2.5 bg-amber-500 text-slate-900 text-xs font-black rounded-xl hover:bg-amber-400 transition-all whitespace-nowrap">Unlock (₹25)</button>
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

        {activeTab === 'elite' && (
            <div className="py-12 text-center">
                {!isPro ? (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-5xl mb-4">🔒</div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Elite Strategy Suite</h2>
                        <p className="text-slate-500 text-sm">Unlock recruiter psychology insights, salary negotiation scripts, cold email templates, and custom networking strategies used by top 1% candidates.</p>
                        <button onClick={handlePayment} className="px-8 py-3 bg-blue-600 text-white font-black text-sm rounded-xl shadow-lg hover:scale-105 transition-all">Unlock Full System (₹25)</button>
                    </div>
                ) : (
                    <div className="text-left space-y-8 animate-in fade-in">
                        {!toolkit.recruiterPsychology && (
                            <div className="text-center py-10">
                                <button onClick={syncElite} disabled={isSyncingElite} className="px-8 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-blue-700">{isSyncingElite ? 'Syncing...' : 'Initialize Elite Tools'}</button>
                            </div>
                        )}
                        {toolkit.recruiterPsychology && (
                            <div className="space-y-8">
                                {/* 1. Recruiter Psych & Salary (Existing) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h4 className="font-black text-blue-600 text-[10px] uppercase mb-4 tracking-widest">Recruiter Psychology</h4>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium whitespace-pre-wrap">{toolkit.recruiterPsychology}</p>
                                    </div>
                                    <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h4 className="font-black text-blue-600 text-[10px] uppercase mb-4 tracking-widest">Salary Script</h4>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium whitespace-pre-wrap">{toolkit.salaryNegotiation}</p>
                                    </div>
                                </div>

                                {/* 2. Elevator Pitch & Why This Role (Separate Highlighted Section) */}
                                {toolkit.elevatorPitch && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1 rounded-2xl shadow-xl">
                                            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl h-full">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">The Perfect Pitch</h3>
                                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">"Tell Me About Yourself" - Mastered</p>
                                                    </div>
                                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                                                        <span className="text-2xl">🎙️</span>
                                                    </div>
                                                </div>
                                                <div className="prose dark:prose-invert max-w-none">
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium whitespace-pre-wrap border-l-4 border-blue-500 pl-6 italic">
                                                        {toolkit.elevatorPitch}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {toolkit.whyThisRole && (
                                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-2xl shadow-xl">
                                                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl h-full">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Why This Role?</h3>
                                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Strategic Alignment</p>
                                                        </div>
                                                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                                                            <span className="text-2xl">🎯</span>
                                                        </div>
                                                    </div>
                                                    <div className="prose dark:prose-invert max-w-none">
                                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium whitespace-pre-wrap border-l-4 border-purple-500 pl-6 italic">
                                                            {toolkit.whyThisRole}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 3. Cold Email Scripts (Downloadable) */}
                                {toolkit.coldEmails && (
                                    <div id="cold-emails-section" className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-black text-blue-600 text-[10px] uppercase tracking-widest">Cold Email Scripts</h4>
                                            <button 
                                                onClick={() => downloadPDF('cold-emails-section', 'Cold_Email_Scripts.pdf')}
                                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                            >
                                                <DownloadIcon className="w-3 h-3" /> Download All
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Hiring Manager</span>
                                                    <CopyButton text={toolkit.coldEmails.hiringManager} />
                                                </div>
                                                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 h-48 overflow-y-auto whitespace-pre-wrap">
                                                    {toolkit.coldEmails.hiringManager}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Peer Networking</span>
                                                    <CopyButton text={toolkit.coldEmails.peerNetworking} />
                                                </div>
                                                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 h-48 overflow-y-auto whitespace-pre-wrap">
                                                    {toolkit.coldEmails.peerNetworking}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Value Prop</span>
                                                    <CopyButton text={toolkit.coldEmails.valueProposition} />
                                                </div>
                                                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 h-48 overflow-y-auto whitespace-pre-wrap">
                                                    {toolkit.coldEmails.valueProposition}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. 90-Day Plan & Competitor Intel */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {toolkit.plan90Day && (
                                        <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-blue-600 text-[10px] uppercase tracking-widest">First 90 Days Strategy</h4>
                                                <button onClick={() => downloadPDF('plan-90-day', '90_Day_Plan.pdf')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"><DownloadIcon className="w-4 h-4"/></button>
                                            </div>
                                            <div id="plan-90-day" className="flex-grow p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap h-64 overflow-y-auto">
                                                {toolkit.plan90Day}
                                            </div>
                                        </div>
                                    )}
                                    {toolkit.competitorAnalysis && (
                                        <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-blue-600 text-[10px] uppercase tracking-widest">Competitor Intel (SWOT)</h4>
                                                <button onClick={() => downloadPDF('competitor-analysis', 'Competitor_Intel.pdf')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"><DownloadIcon className="w-4 h-4"/></button>
                                            </div>
                                            <div id="competitor-analysis" className="flex-grow p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap h-64 overflow-y-auto">
                                                {toolkit.competitorAnalysis}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 5. LinkedIn Connection Script */}
                                {toolkit.linkedinConnection && (
                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex items-center justify-between gap-4">
                                        <div className="flex-grow">
                                            <h4 className="font-black text-blue-600 text-[10px] uppercase mb-2 tracking-widest">LinkedIn Connection Request</h4>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{toolkit.linkedinConnection}"</p>
                                        </div>
                                        <CopyButton text={toolkit.linkedinConnection} />
                                    </div>
                                )}

                                {/* 6. Advanced Boolean Search Strings */}
                                {toolkit.booleanSearchStrings && (
                                    <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-700">
                                        <h4 className="font-black text-emerald-400 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <span>🕵️‍♂️</span> LinkedIn Boolean Search Strings
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Find Hiring Managers</span>
                                                    <CopyButton text={toolkit.booleanSearchStrings.hiringManagers} />
                                                </div>
                                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-300 break-all">
                                                    {toolkit.booleanSearchStrings.hiringManagers}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Find Technical Recruiters</span>
                                                    <CopyButton text={toolkit.booleanSearchStrings.recruiters} />
                                                </div>
                                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-blue-300 break-all">
                                                    {toolkit.booleanSearchStrings.recruiters}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Find Peers / Senior Engineers</span>
                                                    <CopyButton text={toolkit.booleanSearchStrings.peers} />
                                                </div>
                                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-purple-300 break-all">
                                                    {toolkit.booleanSearchStrings.peers}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 7. Personal Brand Audit & Technical Challenge */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {toolkit.personalBrandAudit && (
                                        <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                                            <h4 className="font-black text-purple-600 dark:text-purple-400 text-[10px] uppercase mb-4 tracking-widest flex items-center gap-2">
                                                <span>✨</span> Personal Brand Audit
                                            </h4>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                                {toolkit.personalBrandAudit}
                                            </div>
                                        </div>
                                    )}
                                    {toolkit.technicalChallenge && (
                                        <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <h4 className="font-black text-slate-600 dark:text-slate-400 text-[10px] uppercase mb-4 tracking-widest flex items-center gap-2">
                                                <span>💻</span> Technical Challenge Prediction
                                            </h4>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                {toolkit.technicalChallenge}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 8. Advanced Networking Scripts */}
                                {toolkit.networkingScripts && (
                                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl mt-8">
                                        <h4 className="font-black text-indigo-600 dark:text-indigo-400 text-[10px] uppercase mb-6 tracking-widest flex items-center gap-2">
                                            <span>🤝</span> Advanced Networking Scripts
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Connection Follow-Up</span>
                                                    <CopyButton text={toolkit.networkingScripts.connectionFollowUp} />
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed h-40 overflow-y-auto">
                                                    "{toolkit.networkingScripts.connectionFollowUp}"
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Informational Interview</span>
                                                    <CopyButton text={toolkit.networkingScripts.informationalInterview} />
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed h-40 overflow-y-auto">
                                                    "{toolkit.networkingScripts.informationalInterview}"
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Re-engagement</span>
                                                    <CopyButton text={toolkit.networkingScripts.reEngagement} />
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed h-40 overflow-y-auto">
                                                    "{toolkit.networkingScripts.reEngagement}"
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800 flex gap-3 items-start">
                                            <span className="text-lg">💡</span>
                                            <p className="text-[10px] text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed pt-1">
                                                <strong>Pro Tip:</strong> These scripts are psychological templates. Always customize the <span className="font-mono bg-indigo-200 dark:bg-indigo-800 px-1 rounded">[bracketed]</span> sections with specific details about the person to increase response rates by 300%.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ATS Strategy Lab (Moved Here) */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden mt-8">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in text-left">
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
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;