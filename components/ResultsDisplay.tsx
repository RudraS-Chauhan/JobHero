import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from "jspdf";
import { JobToolkit, ResumeAnalysis, UserInput } from '../types';
import { analyzeResume } from '../services/geminiService';
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

// Declare Razorpay on window to avoid TS errors
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
}

type Tab = 'resume' | 'coverLetter' | 'linkedin' | 'interview' | 'roadmap';
type TemplateType = 'Classic' | 'Modern' | 'Creative' | 'Elegant' | 'Executive';

const tabs: { id: Tab; name: string; icon: React.ElementType }[] = [
  { id: 'resume', name: 'Resume', icon: ResumeIcon },
  { id: 'coverLetter', name: 'Cover Letter', icon: CoverLetterIcon },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
  { id: 'interview', name: 'Mock Interview', icon: InterviewIcon },
  { id: 'roadmap', name: 'Career Roadmap', icon: RoadmapIcon },
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

const ActionButtons: React.FC<{ textToCopy: string; onDownloadPDF?: () => void; templateSelector?: React.ReactNode }> = ({ textToCopy, onDownloadPDF, templateSelector }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4 sm:mb-0">
            {templateSelector}
            <div className="flex gap-2">
                {onDownloadPDF && (
                    <Tooltip text="Download as PDF" position="bottom">
                        <button 
                            onClick={onDownloadPDF} 
                            className="bg-white hover:bg-slate-50 text-slate-600 p-2 rounded-lg transition-colors border border-slate-200 shadow-sm"
                        >
                            <DownloadIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                )}
                <Tooltip text="Copy to Clipboard" position="bottom">
                    <button 
                        onClick={handleCopy} 
                        className="bg-white hover:bg-slate-50 text-slate-600 p-2 rounded-lg transition-colors border border-slate-200 shadow-sm"
                    >
                        {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

const ProUpsellCard: React.FC<{ description: string; onUnlock: () => void }> = ({ description, onUnlock }) => (
    <div className="mt-10 bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all border border-slate-700" onClick={onUnlock}>
        {/* Shine Effect */}
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]"></div>
        
        <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-24 h-24 text-amber-400">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
             </svg>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-2 tracking-wide">
                    <span className="bg-amber-400/20 text-amber-300 p-1 rounded-lg">👑</span>
                    ELITE ONE-TIME UNLOCK
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {description}
                </p>
                <div className="mt-2 text-xs text-slate-400 font-mono">
                    Includes: Executive Templates • Deep AI Audit • Keyword Gap Analysis
                </div>
            </div>
            <button 
                className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-sm rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5 transition-all"
            >
                Get Access - ₹30
            </button>
        </div>
    </div>
);

// --- Robust Resume Parser & Renderer ---

const parseResume = (text: string) => {
    const sections: Record<string, string> = {};
    
    // Standardize section keys
    const sectionMap: Record<string, string> = {
        'SUMMARY': 'SUMMARY',
        'PROFESSIONAL SUMMARY': 'SUMMARY',
        'OBJECTIVE': 'OBJECTIVE',
        'CAREER OBJECTIVE': 'OBJECTIVE',
        'EDUCATION': 'EDUCATION',
        'SKILLS': 'SKILLS',
        'TECHNICAL SKILLS': 'SKILLS',
        'EXPERIENCE': 'EXPERIENCE',
        'WORK EXPERIENCE': 'EXPERIENCE',
        'PROJECTS': 'PROJECTS',
        'CERTIFICATIONS': 'CERTIFICATIONS',
        'CERTIFICATES': 'CERTIFICATIONS'
    };
    
    // Icons that might be used by AI
    const icons = ['📝', '🎯', '🎓', '💡', '🚀', '🏢', '📜'];
    
    let currentSection = 'HEADER';
    const lines = text.split('\n');
    let buffer: string[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        const upper = trimmed.toUpperCase();
        
        // Detect section start logic:
        // 1. Line contains one of our known icons
        // 2. Line matches a known text header (ignoring Markdown chars like *, #)
        
        const cleanUpper = upper.replace(/[*#]/g, '').trim();
        const hasIcon = icons.some(icon => trimmed.includes(icon));
        const isKeywordHeader = Object.keys(sectionMap).some(key => cleanUpper === key || cleanUpper === key + ':');

        if (hasIcon || isKeywordHeader) {
            // Determine the standardized section key
            let newSectionKey = '';
            
            // Try to map based on text content first
            for (const [key, value] of Object.entries(sectionMap)) {
                if (cleanUpper.includes(key)) {
                    newSectionKey = value;
                    break;
                }
            }

            // If no text match, but icon exists, map icon to section
            if (!newSectionKey && hasIcon) {
                if (trimmed.includes('📝')) newSectionKey = 'SUMMARY';
                else if (trimmed.includes('🎯')) newSectionKey = 'OBJECTIVE';
                else if (trimmed.includes('🎓')) newSectionKey = 'EDUCATION';
                else if (trimmed.includes('💡')) newSectionKey = 'SKILLS';
                else if (trimmed.includes('🚀')) newSectionKey = 'PROJECTS';
                else if (trimmed.includes('🏢')) newSectionKey = 'EXPERIENCE';
                else if (trimmed.includes('📜')) newSectionKey = 'CERTIFICATIONS';
            }

            if (newSectionKey) {
                 // Save previous section buffer
                if (buffer.length > 0) {
                    sections[currentSection] = buffer.join('\n').trim();
                    buffer = [];
                }
                currentSection = newSectionKey;
                return; // Skip the header line itself in the buffer
            }
        }
        
        buffer.push(line);
    });
    
    // Save the final section
    if (buffer.length > 0) sections[currentSection] = buffer.join('\n').trim();
    
    return sections;
};

const ResumePreview: React.FC<{ text: string; template: TemplateType; isBlurred?: boolean; onUnlock?: () => void; userInput: UserInput }> = ({ text, template, isBlurred, onUnlock, userInput }) => {
    const sections = useMemo(() => parseResume(text), [text]);
    
    // Clean Content Helper
    const clean = (txt: string) => txt?.replace(/➤/g, '•').trim() || "";

    // Template CSS Classes
    let containerClass = "p-8 min-h-[800px] shadow-sm bg-white text-slate-800 text-sm leading-relaxed transition-all duration-300";
    let nameClass = "text-3xl font-bold uppercase tracking-wide";
    let contactClass = "text-sm text-slate-600 mt-1";
    let sectionTitleClass = "text-lg font-bold uppercase mt-6 mb-2 border-b border-slate-200 pb-1";
    let bodyClass = "whitespace-pre-line";

    if (template === 'Classic') {
        containerClass += " font-serif text-slate-900";
        sectionTitleClass = "text-lg font-bold border-b-2 border-slate-800 mt-6 mb-2 uppercase";
        contactClass = "text-sm text-slate-600 italic mt-1";
    } else if (template === 'Modern') {
        containerClass += " font-sans";
        nameClass = "text-4xl font-extrabold text-blue-700 mb-1";
        contactClass = "text-sm font-medium text-slate-500 mb-6";
        sectionTitleClass = "text-blue-700 font-bold text-lg mt-6 mb-2 uppercase tracking-wider";
    } else if (template === 'Creative') {
        containerClass += " font-sans bg-slate-50";
        nameClass = "text-4xl font-black text-purple-700 mb-1";
        contactClass = "text-sm font-semibold text-purple-900/60";
        sectionTitleClass = "text-purple-600 font-bold text-lg mt-6 mb-2 bg-purple-50 p-1 rounded inline-block pr-4";
    } else if (template === 'Elegant') {
        containerClass += " font-serif text-slate-800 max-w-3xl mx-auto border-t-8 border-amber-700";
        nameClass = "text-5xl font-serif text-slate-900 mb-4 tracking-tight";
        contactClass = "text-sm text-amber-700 font-medium uppercase tracking-widest mb-10";
        sectionTitleClass = "text-md font-bold text-slate-900 uppercase tracking-[0.15em] mt-8 mb-4 border-b border-amber-200 pb-2";
        bodyClass += " text-slate-700 leading-7";
    } else if (template === 'Executive') {
        containerClass += " font-sans bg-white text-slate-900 border-l-[12px] border-slate-800";
        nameClass = "text-4xl font-extrabold text-slate-900 mb-1 uppercase tracking-tighter";
        contactClass = "text-xs font-bold text-white bg-slate-800 inline-block px-3 py-1 mb-6 mt-2";
        sectionTitleClass = "font-black text-white bg-slate-800 px-2 py-1 uppercase text-sm mt-6 mb-3 inline-block tracking-wide";
        bodyClass += " text-slate-800 font-medium";
    }

    // Helper to render sections safely
    const renderSection = (title: string, contentKey: string) => {
        const key = Object.keys(sections).find(k => k.includes(contentKey)) || "";
        // Fallback: If AI put it in "HEADER" but it's empty, ignore. If it's the only content, it might be parsing fail.
        if (!key || !sections[key]) return null;
        
        return (
            <div className="mb-4">
                <h3 className={sectionTitleClass}>{title}</h3>
                <div className={bodyClass}>{clean(sections[key])}</div>
            </div>
        );
    };

    return (
        <div className="relative">
            <div className={`${containerClass} ${isBlurred ? 'blur-md select-none overflow-hidden h-[600px]' : ''}`}>
                <div className={`mb-6 ${template === 'Modern' || template === 'Elegant' ? "text-center" : ""}`}>
                     <div className={nameClass}>{userInput.fullName}</div>
                     <div className={contactClass}>
                        {userInput.email} | {userInput.phone}
                        {userInput.linkedinGithub && <span className="block sm:inline sm:ml-2">| {userInput.linkedinGithub}</span>}
                     </div>
                </div>

                {renderSection('Summary', 'SUMMARY')}
                {renderSection('Education', 'EDUCATION')}
                {renderSection('Skills', 'SKILLS')}
                {renderSection('Experience', 'EXPERIENCE')}
                {renderSection('Projects', 'PROJECTS')}
                {renderSection('Certifications', 'CERTIFICATIONS')}
            </div>
            
            {isBlurred && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm rounded-lg">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl text-center max-w-sm border border-slate-700 text-white">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Elite Template Locked</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            Unlock the <strong>{template}</strong> design and advanced AI analysis tools.
                        </p>
                        <button 
                            onClick={onUnlock}
                            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-[1.02]"
                        >
                            Unlock Everything - ₹30
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ toolkit, userInput, onReset, onRegenerateRoadmap }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isRegeneratingRoadmap, setIsRegeneratingRoadmap] = useState(false);
  const [useThinkingModel, setUseThinkingModel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Classic');
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize Pro State
  const [isProMember, setIsProMember] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('jobHero_isPro') === 'true';
    }
    return false;
  });

  const getRazorpayKey = () => {
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.RAZORPAY_KEY_ID) return process.env.RAZORPAY_KEY_ID;
        if (process.env.REACT_APP_RAZORPAY_KEY_ID) return process.env.REACT_APP_RAZORPAY_KEY_ID;
        if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (process.env.VITE_RAZORPAY_KEY_ID) return process.env.VITE_RAZORPAY_KEY_ID;
    }
    try {
        // @ts-ignore
        if (import.meta && import.meta.env) {
             // @ts-ignore
             if (import.meta.env.VITE_RAZORPAY_KEY_ID) return import.meta.env.VITE_RAZORPAY_KEY_ID;
        }
    } catch(e) {}
    return null;
  };

  const handlePaymentSuccess = () => {
    setIsProMember(true);
    localStorage.setItem('jobHero_isPro', 'true');
    alert("Payment Successful! Elite Features Unlocked.");
  };

  const handleRazorpayPayment = () => {
    const key = getRazorpayKey();

    if (!window.Razorpay) {
        alert("Razorpay SDK not loaded. Check your internet connection.");
        return;
    }

    if (!key) {
        const demo = confirm(
            "⚠️ RAZORPAY KEY MISSING ⚠️\n\n" +
            "You haven't set up the 'VITE_RAZORPAY_KEY_ID' environment variable yet.\n\n" +
            "Click OK to simulate a successful payment (DEMO MODE).\n" +
            "Click Cancel to abort."
        );
        if (demo) {
            handlePaymentSuccess();
        }
        return;
    }

    const options = {
        key: key, 
        amount: 3000, // 30 INR
        currency: "INR",
        name: "JobHero AI",
        description: "One-Time Elite Unlock",
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        handler: function (response: any) {
            console.log("Payment ID: ", response.razorpay_payment_id);
            handlePaymentSuccess();
        },
        prefill: {
            name: "JobHero User", 
            email: "user@example.com",
            contact: "9999999999" 
        },
        theme: {
            color: "#F59E0B"
        }
    };

    try {
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
            alert("Payment Failed: " + response.error.description);
        });
        rzp1.open();
    } catch (error) {
        console.error("Razorpay Error:", error);
        alert("Failed to open payment gateway.");
    }
  };

  const handleAnalyzeResume = async () => {
      setIsAnalyzing(true);
      try {
          const result = await analyzeResume(toolkit.resume, userInput.jobRoleTarget);
          setResumeAnalysis(result);
      } catch (e) {
          alert("Could not analyze resume. Try again.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleDownloadPDF = (type: 'resume' | 'coverLetter') => {
    const isProTemplate = selectedTemplate === 'Elegant' || selectedTemplate === 'Executive';
    if (!isProMember && isProTemplate) {
        handleRazorpayPayment();
        return;
    }

    const doc = new jsPDF();
    const content = type === 'resume' ? toolkit.resume : toolkit.coverLetter;
    
    // Clean text replacements
    let cleanText = content
        .replace(/➤/g, "•")
        .replace(/📝/g, "\nSUMMARY")
        .replace(/🎯/g, "\nOBJECTIVE")
        .replace(/🎓/g, "\nEDUCATION")
        .replace(/💡/g, "\nSKILLS")
        .replace(/🚀/g, "\nPROJECTS")
        .replace(/🏢/g, "\nEXPERIENCE")
        .replace(/📜/g, "\nCERTIFICATIONS")
        .replace(/👉/g, "\nNOTE:")
        .replace(/[^\x00-\x7F\n\r\t•\-.,()@:/]/g, " ");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);

    let currentY = margin;

    // Styles Configuration
    let fontName = 'times';
    let titleColor = [0, 0, 0];
    let headerColor = [0, 0, 0];
    let textColor = [0, 0, 0];
    let drawAccent = false;
    let isMonospace = false;
    let drawHeaderBg = false;

    if (selectedTemplate === 'Modern') {
        fontName = 'helvetica';
        titleColor = [30, 41, 59]; // Slate 800
        headerColor = [37, 99, 235]; // Blue 600
        textColor = [51, 65, 85]; // Slate 700
    } else if (selectedTemplate === 'Creative') {
        fontName = 'helvetica'; 
        titleColor = [255, 255, 255]; // White
        headerColor = [124, 58, 237]; // Purple 600
        textColor = [55, 65, 81]; // Gray 700
        drawAccent = true;
    } else if (selectedTemplate === 'Elegant') {
        fontName = 'times';
        titleColor = [15, 23, 42]; // Slate 900
        headerColor = [180, 83, 9]; // Amber 700
        textColor = [51, 65, 85]; // Slate 700
    } else if (selectedTemplate === 'Executive') {
        fontName = 'helvetica';
        titleColor = [15, 23, 42]; // Slate 900
        headerColor = [255, 255, 255]; // White
        textColor = [30, 41, 59];
        drawHeaderBg = true;
    }

    if (drawAccent) {
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, pageWidth, 40, 'F');
        currentY = 50;
    }

    doc.setFont(fontName, "bold");
    doc.setFontSize(drawAccent ? 22 : (isMonospace ? 16 : 20));
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    
    const docTitle = type === 'resume' ? "" : "COVER LETTER"; 
    
    if (type === 'resume') {
        if (selectedTemplate === 'Elegant') {
             // Center align name for Elegant
            doc.text(userInput.fullName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
            currentY += 8;
            doc.setFontSize(10);
            doc.setTextColor(180, 83, 9); // Amber 700
            doc.setFont(fontName, "bold"); // Bold contact info
            const contactInfo = `${userInput.email} | ${userInput.phone}${userInput.linkedinGithub ? ` | ${userInput.linkedinGithub}` : ''}`;
            doc.text(contactInfo, pageWidth / 2, currentY, { align: 'center' });
            currentY += 15;
        } else {
            // Draw Name
            doc.text(userInput.fullName.toUpperCase(), margin, drawAccent ? 25 : currentY);
            if (!drawAccent) currentY += 8;
            
            // Draw Contact Info
            doc.setFontSize(10);
            doc.setFont(fontName, "normal");
            if (selectedTemplate === 'Executive') {
                 // Badge style contact
                 const contactInfo = `${userInput.email} | ${userInput.phone}`;
                 doc.setFillColor(30, 41, 59); // Slate 800
                 doc.setTextColor(255, 255, 255);
                 doc.rect(margin, currentY - 4, doc.getTextWidth(contactInfo) + 4, 6, 'F');
                 doc.text(contactInfo, margin + 2, currentY);
                 doc.setTextColor(0, 0, 0); // Reset
            } else {
                const contactInfo = `${userInput.email} | ${userInput.phone}${userInput.linkedinGithub ? ` | ${userInput.linkedinGithub}` : ''}`;
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(contactInfo, margin, drawAccent ? 32 : currentY);
            }
            currentY += 15;
        }
    } else {
        if (drawAccent) {
            doc.text(docTitle, margin, 25);
        } else {
            doc.text(docTitle, margin, currentY);
            currentY += 15;
        }
    }

    if (selectedTemplate === 'Executive' && type === 'resume') {
        // Thick side border simulation
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 10, pageHeight, 'F');
    }

    doc.setFont(fontName, "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    const headerKeywords = ["SUMMARY", "OBJECTIVE", "EDUCATION", "SKILLS", "PROJECTS", "EXPERIENCE", "CERTIFICATIONS", "NOTE:", "CONTACT"];
    const lines = cleanText.split('\n');
    let skipMode = type === 'resume'; 
    
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            if (!skipMode) currentY += 4;
            return;
        }
        const isHeader = headerKeywords.some(k => trimmed.toUpperCase().startsWith(k));
        if (skipMode && isHeader) { skipMode = false; }
        if (skipMode) return;

        if (currentY > pageHeight - margin) {
            doc.addPage();
            if (drawAccent) {
                 doc.setFillColor(124, 58, 237);
                 doc.rect(0, 0, pageWidth, 15, 'F'); 
                 currentY = 25;
            } else if (selectedTemplate === 'Executive' && type === 'resume') {
                doc.setFillColor(30, 41, 59);
                doc.rect(0, 0, 10, pageHeight, 'F');
                currentY = margin;
            } else {
                currentY = margin;
            }
        }
        
        if (isHeader) {
            currentY += 6;
            doc.setFont(fontName, "bold");
            doc.setFontSize(11.5);
            doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
            
            const headerText = trimmed.toUpperCase();

            if (drawHeaderBg) { // Executive
                doc.setFillColor(30, 41, 59);
                doc.rect(margin, currentY - 4, doc.getTextWidth(headerText) + 6, 6, 'F');
                doc.text(headerText, margin + 2, currentY);
            } else {
                doc.text(headerText, margin, currentY);
            }
            
            if (selectedTemplate === 'Elegant') {
                // Underline
                doc.setDrawColor(180, 83, 9);
                doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1);
            }

            currentY += 6;

        } else {
            doc.setFont(fontName, "normal");
            doc.setFontSize(10.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            
            const textLines = doc.splitTextToSize(trimmed, maxLineWidth);
            textLines.forEach((textLine: string) => {
                 if (currentY > pageHeight - margin) {
                    doc.addPage();
                    if (selectedTemplate === 'Executive' && type === 'resume') {
                         doc.setFillColor(30, 41, 59);
                         doc.rect(0, 0, 10, pageHeight, 'F');
                    }
                    currentY = margin;
                }
                doc.text(textLine, margin, currentY);
                currentY += 6; 
            });
        }
        doc.setFont(fontName, "normal");
    });
    
    doc.save(`${type}_JobHero_${selectedTemplate}.pdf`);
  };

  const handleRoadmapUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;

    setIsRegeneratingRoadmap(true);
    try {
      await onRegenerateRoadmap(newRoleInput, useThinkingModel);
      setNewRoleInput('');
    } catch (error) {
      alert("Failed to update roadmap. Please try again.");
    } finally {
      setIsRegeneratingRoadmap(false);
    }
  };

  const contentToCopy = (tab: Tab): string => {
    switch (tab) {
        case 'resume': return toolkit.resume;
        case 'coverLetter': return toolkit.coverLetter;
        case 'linkedin': return `Headline:\n${toolkit.linkedin.headline}\n\nBio:\n${toolkit.linkedin.bio}`;
        case 'interview': return `Intro:\n${toolkit.mockInterview.intro}\n\n${toolkit.mockInterview.questions.map((q, i) => `Q${i+1}: ${q.question}\nFeedback: ${q.feedback}`).join('\n\n')}\n\nOutro:\n${toolkit.mockInterview.outro}`;
        case 'roadmap': return `Learning:\n${toolkit.careerRoadmap.learning}\n\nProjects:\n${toolkit.careerRoadmap.projects}\n\nInternships:\n${toolkit.careerRoadmap.internships}\n\nNetworking:\n${toolkit.careerRoadmap.networking}\n\nMilestones:\n${toolkit.careerRoadmap.milestones}`;
        default: return '';
    }
  };

  const TemplateSelect = (
      <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-sm">
           <span className="text-xs font-semibold text-slate-500 mr-2 hidden sm:inline">TEMPLATE:</span>
           <select 
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
              className="text-xs sm:text-sm border-none focus:ring-0 text-slate-700 font-medium bg-transparent cursor-pointer outline-none"
           >
               <option value="Classic">Classic</option>
               <option value="Modern">Modern</option>
               <option value="Creative">Creative</option>
               <option value="Elegant">Elegant {isProMember ? '' : '👑'}</option>
               <option value="Executive">Executive {isProMember ? '' : '👑'}</option>
           </select>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-0 px-4 sm:px-0">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-x border-transparent'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
            {isProMember && (
                <span className="px-3 py-2 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                    <span>👑</span> ELITE MEMBER
                </span>
            )}
            <Tooltip text="Clear all inputs and start over" position="top">
                <button
                    onClick={onReset}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-200"
                >
                    <RefreshIcon className="h-4 w-4" />
                    <span>Start Over</span>
                </button>
            </Tooltip>
        </div>
      </div>

      <div className="relative bg-white p-6 sm:p-8 rounded-b-xl rounded-tr-xl rounded-tl-none shadow-lg mt-0 min-h-[500px]">
        {activeTab === 'resume' && (
            <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                     <ActionButtons 
                        textToCopy={contentToCopy(activeTab)} 
                        onDownloadPDF={() => handleDownloadPDF('resume')}
                        templateSelector={TemplateSelect}
                    />
                </div>
                
                {/* Pro AI Scanner Feature */}
                {isProMember ? (
                    <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                                    <span className="text-2xl">🤖</span> Deep AI Resume Audit
                                </h3>
                                <p className="text-sm text-slate-500">Target Role: <span className="font-semibold text-blue-600">{userInput.jobRoleTarget}</span></p>
                            </div>
                            <button 
                                onClick={handleAnalyzeResume} 
                                disabled={isAnalyzing}
                                className="mt-4 md:mt-0 text-sm font-bold bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                {isAnalyzing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Auditing...
                                    </span>
                                ) : "Run Deep Audit"}
                            </button>
                        </div>
                        
                        {resumeAnalysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                {/* Score & Prediction */}
                                <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                                     <div className="text-center">
                                         <div className="text-5xl font-black text-blue-600 mb-1">{resumeAnalysis.score}</div>
                                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">ATS Score</div>
                                     </div>
                                     <div className="h-12 w-px bg-slate-100"></div>
                                     <div className="text-center">
                                         <div className={`text-2xl font-bold mb-1 ${resumeAnalysis.jobFitPrediction === 'High' ? 'text-green-600' : resumeAnalysis.jobFitPrediction === 'Medium' ? 'text-amber-500' : 'text-red-500'}`}>
                                             {resumeAnalysis.jobFitPrediction || 'Medium'}
                                         </div>
                                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Interview Chance</div>
                                     </div>
                                </div>

                                {/* Missing Keywords */}
                                <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                                    <h4 className="font-bold text-red-900 text-sm mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Critical Missing Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {resumeAnalysis.missingKeywords?.map((k, i) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-red-200 text-red-700 text-xs rounded-md font-medium shadow-sm">
                                                {k}
                                            </span>
                                        )) || <span className="text-xs text-red-500">Analysis pending...</span>}
                                    </div>
                                </div>

                                {/* Strengths */}
                                <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                                    <h4 className="font-bold text-green-900 text-sm mb-2">✅ Top Strengths</h4>
                                    <ul className="space-y-2">
                                        {resumeAnalysis.strengths.map((s, i) => (
                                            <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                                                <span className="mt-0.5">•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                                    <h4 className="font-bold text-amber-900 text-sm mb-2">🔧 Action Plan</h4>
                                    <ul className="space-y-2">
                                        {resumeAnalysis.improvements.map((s, i) => (
                                            <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                                                <span className="mt-0.5">•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                        {!resumeAnalysis && !isAnalyzing && (
                            <p className="text-sm text-slate-500 italic mt-2">
                                * Click "Run Deep Audit" to detect missing keywords (e.g., Docker, SQL) and get a hiring probability score.
                            </p>
                        )}
                    </div>
                ) : null}

                {/* VISUAL RESUME RENDERER */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100/50 p-1 sm:p-4 shadow-inner">
                     <ResumePreview 
                        text={toolkit.resume} 
                        template={selectedTemplate} 
                        isBlurred={!isProMember && (selectedTemplate === 'Elegant' || selectedTemplate === 'Executive')}
                        onUnlock={handleRazorpayPayment}
                        userInput={userInput}
                    />
                </div>
                
                {!isProMember && (
                    <ProUpsellCard 
                        description="Unlock the 'Elegant' and 'Executive' elite templates, plus get a deep AI keyword audit to see exactly what your resume is missing for your target role." 
                        onUnlock={handleRazorpayPayment}
                    />
                )}
            </>
        )}
        {activeTab === 'coverLetter' && (
            <>
                <ActionButtons 
                    textToCopy={contentToCopy(activeTab)} 
                    onDownloadPDF={() => handleDownloadPDF('coverLetter')}
                    templateSelector={TemplateSelect}
                />
                <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 pt-8 sm:pt-0">{toolkit.coverLetter}</div>
                {!isProMember && (
                    <ProUpsellCard 
                        description="Download your personalized cover letter with premium matching templates." 
                        onUnlock={handleRazorpayPayment}
                    />
                )}
            </>
        )}
        {activeTab === 'linkedin' && (
          <div className="prose max-w-none space-y-6 relative">
            <ActionButtons textToCopy={contentToCopy(activeTab)} />
            <div>
              <h3 className="font-bold text-lg">🔗 LinkedIn Headline</h3>
              <p className="bg-slate-100 p-4 rounded-md italic">"{toolkit.linkedin.headline}"</p>
            </div>
            <div>
              <h3 className="font-bold text-lg">👤 About Me Bio</h3>
              <p className="whitespace-pre-wrap text-slate-700">{toolkit.linkedin.bio}</p>
            </div>
             <p className="text-sm text-slate-500 pt-4 border-t">{toolkit.linkedin.bio.split(" ").pop()}</p>
             {!isProMember && (
                <ProUpsellCard 
                    description="Auto-optimize your full LinkedIn profile with SEO keyword analysis." 
                    onUnlock={handleRazorpayPayment}
                />
             )}
          </div>
        )}
        {activeTab === 'interview' && (
          <div className="prose max-w-none relative">
            <ActionButtons textToCopy={contentToCopy(activeTab)} />
            <p className="text-slate-600">{toolkit.mockInterview.intro}</p>
            <div className="space-y-6 mt-6">
              {toolkit.mockInterview.questions.map((item, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-800">🎤 Question {index + 1}: {item.question}</p>
                  <p className="mt-2 text-sm text-slate-600 bg-green-50/50 p-2 rounded-md">💡 **Feedback:** {item.feedback}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 font-semibold text-slate-800 p-4 bg-blue-50 rounded-lg">{toolkit.mockInterview.outro}</p>
            {!isProMember && (
                <ProUpsellCard 
                    description="Practice with a real-time AI interview coach." 
                    onUnlock={handleRazorpayPayment}
                />
            )}
          </div>
        )}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <form onSubmit={handleRoadmapUpdate} className="flex flex-col gap-3">
                    <label htmlFor="newRole" className="block text-sm font-semibold text-blue-900">
                        Explore a different career path?
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                         <div className="flex-grow w-full">
                           <input 
                                type="text" 
                                id="newRole"
                                placeholder="Enter a specific niche (e.g. 'AI Ethics Researcher', 'Rust Systems Engineer')..."
                                className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={newRoleInput}
                                onChange={(e) => setNewRoleInput(e.target.value)}
                            />
                         </div>
                         
                         <Tooltip text={useThinkingModel ? "Using Deep Analysis (Slower, Detailed)" : "Using Fast Response"} position="top">
                             <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => setUseThinkingModel(!useThinkingModel)}>
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${useThinkingModel ? 'bg-purple-600' : 'bg-slate-300'}`}>
                                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${useThinkingModel ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                                <span className={`text-xs font-semibold ${useThinkingModel ? 'text-purple-600' : 'text-slate-500'}`}>Deep Think</span>
                             </div>
                         </Tooltip>

                         <button 
                            type="submit" 
                            disabled={isRegeneratingRoadmap || !newRoleInput.trim()}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
                        >
                            {isRegeneratingRoadmap ? 'Updating...' : 'Regenerate'}
                            {!isRegeneratingRoadmap && <ArrowRightIcon className="ml-2 h-4 w-4" />}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="prose max-w-none space-y-6 relative">
                 <ActionButtons textToCopy={contentToCopy(activeTab)} />
                {isRegeneratingRoadmap ? (
                    <div className="flex flex-col justify-center items-center h-48 space-y-3">
                         <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         {useThinkingModel && <p className="text-sm text-purple-600 animate-pulse font-medium">Deep Thinking in progress...</p>}
                    </div>
                ) : (
                    <>
                        {isProMember ? (
                             <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                                <h3 className="font-bold text-lg mb-4 text-center">🗺️ Pro Visual Roadmap</h3>
                                <div className="relative border-l-2 border-blue-300 ml-4 space-y-8 pl-6 py-2">
                                    <div className="relative">
                                        <div className="absolute -left-[33px] bg-blue-500 h-4 w-4 rounded-full border-4 border-white"></div>
                                        <h4 className="font-bold text-blue-900">Phase 1: Foundations</h4>
                                        <p className="text-sm text-slate-600 mt-1">{toolkit.careerRoadmap.learning.slice(0, 150)}...</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[33px] bg-blue-500 h-4 w-4 rounded-full border-4 border-white"></div>
                                        <h4 className="font-bold text-blue-900">Phase 2: Projects</h4>
                                        <p className="text-sm text-slate-600 mt-1">{toolkit.careerRoadmap.projects.slice(0, 150)}...</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[33px] bg-green-500 h-4 w-4 rounded-full border-4 border-white"></div>
                                        <h4 className="font-bold text-green-900">Phase 3: Career Launch</h4>
                                        <p className="text-sm text-slate-600 mt-1">{toolkit.careerRoadmap.milestones.slice(0, 150)}...</p>
                                    </div>
                                </div>
                             </div>
                        ) : null}

                        <div>
                        <h3 className="font-bold text-lg">🎓 Learning</h3>
                        <p className="whitespace-pre-wrap text-slate-700">{toolkit.careerRoadmap.learning}</p>
                        </div>
                        <div>
                        <h3 className="font-bold text-lg">🚀 Projects to Build</h3>
                        <p className="whitespace-pre-wrap text-slate-700">{toolkit.careerRoadmap.projects}</p>
                        </div>
                        <div>
                        <h3 className="font-bold text-lg">🏢 Internships + Freelancing</h3>
                        <p className="whitespace-pre-wrap text-slate-700">{toolkit.careerRoadmap.internships}</p>
                        </div>
                        <div>
                        <h3 className="font-bold text-lg">🤝 Networking</h3>
                        <p className="whitespace-pre-wrap text-slate-700">{toolkit.careerRoadmap.networking}</p>
                        </div>
                        <div>
                        <h3 className="font-bold text-lg">🏆 Resume + Interview Milestones</h3>
                        <p className="whitespace-pre-wrap text-slate-700">{toolkit.careerRoadmap.milestones}</p>
                        </div>
                        <p className="text-sm text-slate-500 pt-4 border-t">{toolkit.careerRoadmap.milestones.split(" ").pop()}</p>
                        
                        {!isProMember && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center opacity-75 grayscale hover:grayscale-0 transition-all cursor-pointer" onClick={handleRazorpayPayment}>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Career Flowchart (Pro)</h3>
                                <p className="text-slate-500 text-sm mb-4">Visual path representation locked</p>
                                <button className="text-blue-600 font-semibold hover:underline">Unlock to View Flowchart</button>
                            </div>
                        )}
                    </>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;