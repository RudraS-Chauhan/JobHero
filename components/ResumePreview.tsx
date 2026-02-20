import React, { useMemo, useState } from 'react';
import { UserInput, ResumeVersion } from '../types';
import { TechIcon } from './icons/TechIcons';

export type TemplateType = 'Classic' | 'Modern' | 'Minimalist' | 'Creative' | 'Elegant' | 'Executive' | 'Professional' | 'Startup';

const parseResume = (text: string) => {
    const sections: Record<string, string> = {};
    const headerRegex = /(?:^|\n)(#{1,3}\s*)?(SUMMARY|PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|ABOUT ME|PROFILE|OBJECTIVE|CAREER OBJECTIVE|EDUCATION|ACADEMIC BACKGROUND|ACADEMICS|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|TECHNOLOGIES|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|PROJECTS|KEY PROJECTS|ACADEMIC PROJECTS|CERTIFICATIONS|CERTIFICATES|LICENSES|AWARDS|ACHIEVEMENTS)(?:\s*:?)(?=\n|$)/gmi;

    const sectionMap: Record<string, string> = {
        'SUMMARY': 'SUMMARY', 'PROFESSIONAL SUMMARY': 'SUMMARY', 'EXECUTIVE SUMMARY': 'SUMMARY', 'ABOUT ME': 'SUMMARY', 'PROFILE': 'SUMMARY',
        'OBJECTIVE': 'OBJECTIVE', 'CAREER OBJECTIVE': 'OBJECTIVE',
        'EDUCATION': 'EDUCATION', 'ACADEMIC BACKGROUND': 'EDUCATION', 'ACADEMICS': 'EDUCATION',
        'SKILLS': 'SKILLS', 'TECHNICAL SKILLS': 'SKILLS', 'CORE COMPETENCIES': 'SKILLS', 'TECHNOLOGIES': 'SKILLS',
        'EXPERIENCE': 'EXPERIENCE', 'WORK EXPERIENCE': 'EXPERIENCE', 'PROFESSIONAL EXPERIENCE': 'EXPERIENCE', 'WORK HISTORY': 'EXPERIENCE', 'EMPLOYMENT HISTORY': 'EXPERIENCE',
        'PROJECTS': 'PROJECTS', 'KEY PROJECTS': 'PROJECTS', 'ACADEMIC PROJECTS': 'PROJECTS',
        'CERTIFICATIONS': 'CERTIFICATIONS', 'CERTIFICATES': 'CERTIFICATIONS', 'LICENSES': 'CERTIFICATIONS', 'AWARDS': 'CERTIFICATIONS', 'ACHIEVEMENTS': 'CERTIFICATIONS'
    };

    let match;
    let lastIndex = 0;
    let lastHeader = 'HEADER';

    const getStandardKey = (rawHeader: string) => {
        const upper = rawHeader.toUpperCase().trim();
        return sectionMap[upper] || upper;
    };

    while ((match = headerRegex.exec(text)) !== null) {
        const content = text.substring(lastIndex, match.index).trim();
        if (content) {
            if (sections[lastHeader]) sections[lastHeader] += '\n' + content;
            else sections[lastHeader] = content;
        }
        lastHeader = getStandardKey(match[2]);
        lastIndex = match.index + match[0].length;
    }

    const finalContent = text.substring(lastIndex).trim();
    if (finalContent) {
         if (sections[lastHeader]) sections[lastHeader] += '\n' + finalContent;
         else sections[lastHeader] = finalContent;
    }
    return sections;
};

interface ResumePreviewProps { 
    text: string; 
    template: TemplateType; 
    isBlurred?: boolean; 
    onUnlock?: () => void; 
    userInput: Partial<UserInput>;
    versions?: ResumeVersion[];
    activeVersionId?: string;
    onVersionChange?: (id: string) => void;
    onCreateVersion?: (role: string) => void;
    isGeneratingVersion?: boolean;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
    text, 
    template, 
    isBlurred, 
    onUnlock, 
    userInput
}) => {
    const sections = useMemo(() => parseResume(text), [text]);
    const clean = (txt: string) => {
        if (!txt) return "";
        return txt.replace(/➤/g, '•').replace(/\*\*/g, '').trim();
    };

    const hasParsedSections = Object.keys(sections).length > 1;
    const rawContentFallback = !hasParsedSections && sections['HEADER'] ? sections['HEADER'] : null;

    // Reduced base sizes
    let containerClass = "p-6 min-h-[800px] shadow-sm bg-white text-slate-800 text-[11px] leading-relaxed transition-all duration-300 relative";
    let nameClass = "text-xl font-bold uppercase tracking-wide";
    let contactClass = "text-[10px] text-slate-600 mt-1 flex flex-wrap gap-x-3 items-center";
    let sectionTitleClass = "text-xs font-bold uppercase mt-4 mb-2 border-b border-slate-300 pb-1";
    let bodyClass = "whitespace-pre-line text-slate-700 text-[10px] leading-5";

    if (template === 'Classic') {
        containerClass += " font-serif text-slate-900 max-w-[850px] mx-auto";
        nameClass = "text-2xl font-serif text-center mb-1 tracking-tight text-slate-900";
        contactClass = "text-[10px] text-slate-600 justify-center mb-5 font-serif flex flex-wrap gap-x-4";
        sectionTitleClass = "text-xs font-serif font-bold border-b border-slate-900 mt-4 mb-2 uppercase tracking-wider text-slate-900";
        bodyClass += " font-serif";
    } else if (template === 'Modern') {
        containerClass += " font-sans max-w-[850px] mx-auto";
        nameClass = "text-3xl font-extrabold text-blue-800 mb-1 tracking-tight";
        contactClass = "text-[10px] font-medium text-blue-600/80 mb-5 flex flex-wrap gap-x-4 items-center";
        sectionTitleClass = "text-blue-800 font-bold text-xs mt-5 mb-2 uppercase tracking-widest flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-blue-600 before:mr-1";
    } else if (template === 'Minimalist') {
        // Clean sans-serif, ample whitespace, limited palette
        containerClass += " font-sans max-w-[850px] mx-auto border border-slate-100 bg-white";
        nameClass = "text-2xl font-light text-slate-900 mb-1 tracking-wide";
        contactClass = "text-[9px] text-slate-500 mb-6 flex flex-wrap gap-x-4 items-center tracking-wide";
        sectionTitleClass = "text-[10px] font-black text-slate-800 mt-6 mb-3 uppercase tracking-[0.2em] border-none";
        bodyClass += " text-slate-600 text-[10px] leading-5";
    } else if (template === 'Creative') {
        // Modern typography, bolder color scheme
        containerClass += " font-sans bg-slate-50 max-w-[850px] mx-auto";
        nameClass = "text-4xl font-black text-purple-700 mb-1 tracking-tighter";
        contactClass = "text-[11px] font-bold text-purple-900/70 mb-6 flex flex-wrap gap-x-4";
        sectionTitleClass = "text-white font-bold text-[10px] mt-6 mb-3 bg-purple-600 px-3 py-1 rounded-r-full inline-block shadow-lg shadow-purple-200 transform -translate-x-6 pl-6";
    } else if (template === 'Elegant') {
        containerClass += " font-serif bg-[#FFFCF5] text-stone-800 border-y-[6px] border-double border-amber-800/20 max-w-[850px] mx-auto";
        nameClass = "text-3xl font-serif text-amber-900 mb-2 pb-2 border-b border-amber-900/10 text-center";
        contactClass = "text-[10px] font-medium text-amber-800/70 mb-6 flex flex-wrap gap-x-4 justify-center italic";
        sectionTitleClass = "text-sm font-serif font-bold text-amber-900 mt-5 mb-2 border-b border-amber-900/20 pb-1 flex items-center gap-2 before:content-['◆'] before:text-[8px] before:text-amber-500/50";
        bodyClass += " text-stone-700 leading-5 font-serif text-[10px]";
    } else if (template === 'Executive') {
        containerClass += " font-sans bg-slate-900 text-slate-300 border-l-[6px] border-blue-600 max-w-[850px] mx-auto shadow-2xl";
        nameClass = "text-2xl font-black text-white uppercase tracking-widest mb-1";
        contactClass = "text-[9px] font-bold text-slate-900 bg-white inline-flex px-3 py-1 mb-6 mt-2 tracking-wider gap-3 uppercase";
        sectionTitleClass = "font-black text-blue-400 text-[10px] mt-6 mb-3 uppercase tracking-[0.25em] flex items-center after:content-[''] after:flex-1 after:h-px after:bg-slate-700 after:ml-4";
        bodyClass += " text-slate-400 font-light tracking-wide leading-5 text-[10px]";
    } else if (template === 'Professional') {
        // Classic serif, balanced traditional layout
        containerClass += " font-serif bg-white text-slate-800 max-w-[850px] mx-auto border-t-[6px] border-slate-800 shadow-md";
        nameClass = "text-3xl font-bold text-slate-900 uppercase tracking-tight mb-1";
        contactClass = "text-[11px] text-slate-600 mb-6 flex flex-wrap gap-x-4 items-center border-b border-slate-200 pb-4";
        sectionTitleClass = "text-sm font-bold text-slate-900 uppercase tracking-widest mt-6 mb-3 border-b-2 border-slate-900 pb-1 inline-block w-full";
        bodyClass += " text-slate-800 text-[11px] leading-5 text-justify";
    } else if (template === 'Startup') {
        // Modern, clean, tech-focused
        containerClass += " font-mono bg-slate-50 text-slate-800 max-w-[850px] mx-auto border-l-4 border-emerald-500 shadow-lg";
        nameClass = "text-4xl font-black text-slate-900 mb-2 tracking-tighter";
        contactClass = "text-[10px] font-bold text-emerald-600 mb-6 flex flex-wrap gap-x-4 uppercase tracking-wider";
        sectionTitleClass = "text-xs font-black text-slate-900 uppercase tracking-tight mt-6 mb-3 flex items-center gap-2 before:content-['#'] before:text-emerald-500";
        bodyClass += " text-slate-600 text-[11px] leading-relaxed tracking-tight";
    }

    const renderSection = (title: string, contentKey: string) => {
        const key = Object.keys(sections).find(k => k.includes(contentKey)) || "";
        if (!key || !sections[key]) return null;
        const content = clean(sections[key]);
        if (contentKey === 'SKILLS') {
             const skillList = content.split(/,|•|\n/).map(s => s.trim()).filter(s => s.length > 0);
             return (
                 <div className="mb-3 resume-section section-skills">
                     <h3 className={`${sectionTitleClass} resume-section-title`}>{title}</h3>
                     <div className="flex flex-wrap gap-1 mt-1.5">
                         {skillList.map((skill, idx) => (
                             <span key={idx} className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[9px] font-semibold transition-colors ${template === 'Executive' ? 'bg-slate-800 border-slate-700 text-slate-300' : (template === 'Elegant' ? 'bg-amber-50/50 border-amber-100 text-amber-900' : 'bg-white border-slate-200 text-slate-700 shadow-sm')}`}>
                                 <TechIcon name={skill} className="w-2.5 h-2.5" />
                                 {skill}
                             </span>
                         ))}
                     </div>
                 </div>
             );
        }
        return (
            <div className={`mb-3 resume-section section-${contentKey.toLowerCase()}`}>
                <h3 className={`${sectionTitleClass} resume-section-title`}>{title}</h3>
                <div className={`${bodyClass} resume-section-body`}>{content}</div>
            </div>
        );
    };

    return (
        <div className="relative h-full flex flex-col" role="document">
            {userInput.customCSS && <style>{`#resume-preview-container { ${userInput.customCSS} }`}</style>}
            
            <div id="resume-preview-container" className={`${containerClass} ${isBlurred ? 'blur-sm select-none overflow-hidden h-[600px] opacity-90' : 'h-full'}`}>
                <div className={`mb-4 resume-header`}>
                     <div className={nameClass}>{userInput.fullName || 'Your Name'}</div>
                     <div className={contactClass}>
                        <span className="flex items-center gap-1 whitespace-nowrap">📧 {userInput.email}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">📱 {userInput.phone}</span>
                        {userInput.linkedinGithub && <span className="break-all">{userInput.linkedinGithub}</span>}
                        {userInput.projectLink && <span className="font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{userInput.projectLink}</span>}
                     </div>
                </div>
                {rawContentFallback ? (
                    <div className="mb-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-[10px] text-amber-800 dark:text-amber-300 mb-3 flex gap-2">
                           <span>⚠️</span> <div><strong>Format Warning:</strong> Raw AI text.</div>
                        </div>
                        <div className={bodyClass}>{clean(rawContentFallback)}</div>
                    </div>
                ) : (
                    <>
                        {renderSection('Professional Summary', 'SUMMARY')}
                        {renderSection('Education', 'EDUCATION')}
                        {renderSection('Technical Skills', 'SKILLS')}
                        {renderSection('Experience', 'EXPERIENCE')}
                        {renderSection('Projects', 'PROJECTS')}
                        {renderSection('Certifications & Awards', 'CERTIFICATIONS')}
                    </>
                )}
            </div>

            {isBlurred && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-[2px] rounded-lg animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl text-center max-w-xs border border-slate-100 dark:border-slate-700 transform hover:scale-105 transition-transform duration-300">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30 -rotate-3"><span className="text-2xl" aria-hidden="true">🔒</span></div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 tracking-tight">Premium Template</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs font-medium leading-relaxed">Unlock the <strong>{template}</strong> design.</p>
                        <button onClick={onUnlock} className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transform transition active:scale-95">Unlock Now • ₹29</button>
                    </div>
                </div>
            )}
        </div>
    );
};