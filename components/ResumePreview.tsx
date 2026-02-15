import React, { useMemo, useState } from 'react';
import { UserInput, ResumeVersion } from '../types';
import { TechIcon } from './icons/TechIcons';

export type TemplateType = 'Classic' | 'Modern' | 'Creative' | 'Elegant' | 'Executive';

const parseResume = (text: string) => {
    const sections: Record<string, string> = {};
    
    // Normalize headers: Regex to find common headers (case insensitive, robust to markdown)
    // Captures: 1. Header Name
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

    // Split text by headers
    let match;
    let lastIndex = 0;
    let lastHeader = 'HEADER'; // Default for content before first header (like Name/Contact)

    // Helper to map found header to standard key
    const getStandardKey = (rawHeader: string) => {
        const upper = rawHeader.toUpperCase().trim();
        return sectionMap[upper] || upper;
    };

    // Execute Regex Loop
    while ((match = headerRegex.exec(text)) !== null) {
        // Content belonging to the previous header is from lastIndex to match.index
        const content = text.substring(lastIndex, match.index).trim();
        
        if (content) {
            if (sections[lastHeader]) {
                sections[lastHeader] += '\n' + content;
            } else {
                sections[lastHeader] = content;
            }
        }

        // Set up for next iteration
        lastHeader = getStandardKey(match[2]); // match[2] is the capture group for the header name
        lastIndex = match.index + match[0].length;
    }

    // Capture the final section after the last header match
    const finalContent = text.substring(lastIndex).trim();
    if (finalContent) {
         if (sections[lastHeader]) {
            sections[lastHeader] += '\n' + finalContent;
        } else {
            sections[lastHeader] = finalContent;
        }
    }
    
    return sections;
};

interface ResumePreviewProps { 
    text: string; 
    template: TemplateType; 
    isBlurred?: boolean; 
    onUnlock?: () => void; 
    userInput: Partial<UserInput>;
    // Versioning props
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
    userInput,
    versions,
    activeVersionId,
    onVersionChange,
    onCreateVersion,
    isGeneratingVersion
}) => {
    const sections = useMemo(() => parseResume(text), [text]);
    
    // Clean bullet points and excessive markdown
    const clean = (txt: string) => {
        if (!txt) return "";
        return txt
            .replace(/➤/g, '•')
            .replace(/\*\*/g, '') // remove bolding asterisks for cleaner raw text display if needed
            .trim();
    };
    
    const [showVersionInput, setShowVersionInput] = useState(false);
    const [newVersionRole, setNewVersionRole] = useState('');

    const handleCreateVersion = () => {
        if (newVersionRole.trim() && onCreateVersion) {
            onCreateVersion(newVersionRole);
            setNewVersionRole('');
            setShowVersionInput(false);
        }
    };

    // Parsing fallback: if we only have HEADER, try to display everything in a clean way
    // The new regex parser is robust, so this should trigger less often.
    const hasParsedSections = Object.keys(sections).length > 1;
    const rawContentFallback = !hasParsedSections && sections['HEADER'] ? sections['HEADER'] : null;

    let containerClass = "p-10 min-h-[800px] shadow-sm bg-white text-slate-800 text-sm leading-relaxed transition-all duration-300 relative";
    let nameClass = "text-3xl font-bold uppercase tracking-wide";
    let contactClass = "text-sm text-slate-600 mt-1";
    let sectionTitleClass = "text-base font-bold uppercase mt-6 mb-3 border-b border-slate-300 pb-1";
    let bodyClass = "whitespace-pre-line text-slate-700 leading-relaxed";

    if (template === 'Classic') {
        containerClass += " font-serif text-slate-900 max-w-[850px] mx-auto";
        nameClass = "text-4xl font-serif text-center mb-2 tracking-tight text-slate-900";
        contactClass = "text-sm text-slate-600 text-center mb-8 font-serif separator-dots";
        sectionTitleClass = "text-lg font-serif font-bold border-b border-slate-900 mt-6 mb-3 uppercase tracking-wider text-slate-900";
        bodyClass += " font-serif";
    } else if (template === 'Modern') {
        containerClass += " font-sans max-w-[850px] mx-auto";
        nameClass = "text-5xl font-extrabold text-blue-800 mb-2 tracking-tight";
        contactClass = "text-sm font-medium text-blue-600/80 mb-8 flex gap-3 items-center";
        sectionTitleClass = "text-blue-800 font-bold text-lg mt-8 mb-3 uppercase tracking-widest flex items-center gap-2 before:content-[''] before:w-1 before:h-5 before:bg-blue-600 before:mr-2";
    } else if (template === 'Creative') {
        containerClass += " font-sans bg-slate-50 max-w-[850px] mx-auto";
        nameClass = "text-5xl font-black text-purple-700 mb-1";
        contactClass = "text-sm font-semibold text-purple-900/60 mb-8";
        sectionTitleClass = "text-white font-bold text-sm mt-8 mb-4 bg-purple-600 px-4 py-1.5 rounded-r-full inline-block shadow-sm";
    } else if (template === 'Elegant') {
        containerClass += " font-serif text-slate-800 border-t-[12px] border-amber-700 bg-[#fffdf5] max-w-[850px] mx-auto";
        nameClass = "text-5xl font-serif text-amber-900 mb-4 pb-4 border-b border-amber-200/50";
        contactClass = "text-base font-medium text-amber-800/70 mb-8";
        sectionTitleClass = "text-xl font-serif font-bold text-amber-900 mt-8 mb-4 border-b border-amber-200 pb-2 flex justify-between items-end";
        bodyClass += " text-amber-950/80 leading-7";
    } else if (template === 'Executive') {
        containerClass += " font-sans bg-slate-900 text-slate-300 border-l-[16px] border-slate-800 max-w-[850px] mx-auto";
        nameClass = "text-5xl font-bold text-white uppercase tracking-widest mb-2";
        contactClass = "text-xs font-bold text-slate-900 bg-slate-200 inline-block px-4 py-1.5 mb-10 mt-2 rounded-sm tracking-wider";
        sectionTitleClass = "font-black text-slate-900 bg-white px-3 py-1 uppercase text-sm mt-10 mb-5 inline-block tracking-widest transform -skew-x-12 shadow-[4px_4px_0px_rgba(255,255,255,0.2)]";
        bodyClass += " text-slate-300 font-light tracking-wide leading-7";
    }

    const renderSection = (title: string, contentKey: string) => {
        const key = Object.keys(sections).find(k => k.includes(contentKey)) || "";
        if (!key || !sections[key]) return null;
        
        const content = clean(sections[key]);

        // Special rendering for SKILLS section to add icons
        if (contentKey === 'SKILLS') {
             const skillList = content.split(/,|•|\n/).map(s => s.trim()).filter(s => s.length > 0);
             return (
                 <div className="mb-6 resume-section section-skills">
                     <h3 className={`${sectionTitleClass} resume-section-title`}>{title}</h3>
                     <div className="flex flex-wrap gap-2 mt-3">
                         {skillList.map((skill, idx) => (
                             <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-semibold transition-colors ${template === 'Executive' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>
                                 <TechIcon name={skill} className="w-3.5 h-3.5" />
                                 {skill}
                             </span>
                         ))}
                     </div>
                 </div>
             );
        }

        return (
            <div className={`mb-6 resume-section section-${contentKey.toLowerCase()}`}>
                <h3 className={`${sectionTitleClass} resume-section-title`}>{title}</h3>
                <div className={`${bodyClass} resume-section-body`}>{content}</div>
            </div>
        );
    };

    return (
        <div className="relative h-full flex flex-col" role="document">
            {/* Inject Custom CSS */}
            {userInput.customCSS && (
                <style>
                    {`
                        #resume-preview-container {
                            ${userInput.customCSS}
                        }
                    `}
                </style>
            )}
            
            {/* Versioning UI Header (DROPDOWN) */}
            {versions && versions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                         <label htmlFor="version-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Version:</label>
                         <div className="relative">
                             <select 
                                id="version-select"
                                value={activeVersionId}
                                onChange={(e) => onVersionChange?.(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-1.5 pl-3 pr-8 rounded-md text-sm font-semibold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                             >
                                 {versions.map(v => (
                                     <option key={v.id} value={v.id}>{v.role} ({new Date(v.timestamp).toLocaleDateString()})</option>
                                 ))}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                             </div>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {!showVersionInput ? (
                            <button
                                onClick={() => setShowVersionInput(true)}
                                className="px-3 py-1.5 rounded-md text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                                <span>+</span> Create Version
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 bg-white dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Role (e.g. SDE II)..." 
                                    className="text-xs px-2 py-1 rounded bg-transparent focus:outline-none w-32 dark:text-white"
                                    value={newVersionRole}
                                    onChange={e => setNewVersionRole(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateVersion()}
                                />
                                <button 
                                    onClick={handleCreateVersion}
                                    disabled={isGeneratingVersion}
                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isGeneratingVersion ? '...' : 'Go'}
                                </button>
                                <button 
                                    onClick={() => setShowVersionInput(false)}
                                    className="text-slate-400 hover:text-slate-600 px-1"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Resume Content */}
            <div id="resume-preview-container" className={`${containerClass} ${isBlurred ? 'blur-md select-none overflow-hidden h-[600px] opacity-80' : 'h-full'}`}>
                {/* Loading Overlay */}
                {isGeneratingVersion && (
                    <div className="absolute inset-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg animate-in fade-in duration-300">
                        <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">Rewriting Resume...</span>
                            <span className="text-xs text-slate-500 mt-1">Tailoring for target role</span>
                        </div>
                    </div>
                )}

                <div className={`mb-8 resume-header ${template === 'Classic' || template === 'Elegant' ? "text-center" : ""}`}>
                     <div className={nameClass}>{userInput.fullName || 'Your Name'}</div>
                     <div className={contactClass}>
                        {userInput.email} <span className="opacity-50 mx-1">|</span> {userInput.phone}
                        {userInput.linkedinGithub && (
                            <>
                                <span className="opacity-50 mx-1">|</span> 
                                <span className="break-all">{userInput.linkedinGithub}</span>
                            </>
                        )}
                        {userInput.projectLink && (
                            <>
                                <span className="opacity-50 mx-1">|</span> 
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{userInput.projectLink}</span>
                            </>
                        )}
                     </div>
                </div>

                {/* Content Parsing Logic */}
                {rawContentFallback ? (
                    <div className="mb-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-300 mb-4 flex gap-2">
                           <span>⚠️</span> 
                           <div>
                               <strong>Format Warning:</strong> The AI returned unstructured text. We are displaying the raw content below.
                           </div>
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
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-sm rounded-lg transition-all animate-in fade-in">
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl text-center max-w-sm border border-slate-700 text-white transform hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                            <span className="text-2xl" aria-hidden="true">🔒</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Elite Template Locked</h3>
                        <p className="text-slate-400 mb-6 text-sm">Unlock the <strong>{template}</strong> design and advanced AI analysis tools.</p>
                        <button onClick={onUnlock} className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-[1.02]">
                            Unlock Everything - ₹25
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};