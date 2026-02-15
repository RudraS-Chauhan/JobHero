import React, { useMemo, useState } from 'react';
import { UserInput, ResumeVersion } from '../types';
import { TechIcon } from './icons/TechIcons';

export type TemplateType = 'Classic' | 'Modern' | 'Creative' | 'Elegant' | 'Executive';

const parseResume = (text: string) => {
    const sections: Record<string, string> = {};
    const sectionMap: Record<string, string> = {
        'SUMMARY': 'SUMMARY', 'PROFESSIONAL SUMMARY': 'SUMMARY', 'EXECUTIVE SUMMARY': 'SUMMARY', 'ABOUT ME': 'SUMMARY', 'PROFILE': 'SUMMARY',
        'OBJECTIVE': 'OBJECTIVE', 'CAREER OBJECTIVE': 'OBJECTIVE',
        'EDUCATION': 'EDUCATION', 'ACADEMIC BACKGROUND': 'EDUCATION', 'ACADEMICS': 'EDUCATION',
        'SKILLS': 'SKILLS', 'TECHNICAL SKILLS': 'SKILLS', 'CORE COMPETENCIES': 'SKILLS', 'TECHNOLOGIES': 'SKILLS',
        'EXPERIENCE': 'EXPERIENCE', 'WORK EXPERIENCE': 'EXPERIENCE', 'PROFESSIONAL EXPERIENCE': 'EXPERIENCE', 'WORK HISTORY': 'EXPERIENCE', 'EMPLOYMENT HISTORY': 'EXPERIENCE',
        'PROJECTS': 'PROJECTS', 'KEY PROJECTS': 'PROJECTS', 'ACADEMIC PROJECTS': 'PROJECTS',
        'CERTIFICATIONS': 'CERTIFICATIONS', 'CERTIFICATES': 'CERTIFICATIONS', 'LICENSES': 'CERTIFICATIONS', 'AWARDS': 'CERTIFICATIONS', 'ACHIEVEMENTS': 'CERTIFICATIONS'
    };
    
    const icons = ['📝', '🎯', '🎓', '💡', '🚀', '🏢', '📜'];
    let currentSection = 'HEADER';
    const lines = text.split('\n');
    let buffer: string[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        // Remove markdown bold/header chars for key check
        const upper = trimmed.toUpperCase().replace(/[*#]/g, '').trim();
        const hasIcon = icons.some(icon => trimmed.includes(icon));
        // Check for exact match or match with colon (e.g., "Experience:")
        const isKeywordHeader = Object.keys(sectionMap).some(key => upper === key || upper === key + ':');

        if ((hasIcon || isKeywordHeader) && trimmed.length < 50) { // Limit length to avoid false positives on long lines happening to contain keywords
            let newSectionKey = '';
            for (const [key, value] of Object.entries(sectionMap)) {
                if (upper.includes(key)) { newSectionKey = value; break; }
            }
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
                if (buffer.length > 0) { 
                    const content = buffer.join('\n').trim();
                    if (content) sections[currentSection] = content;
                    buffer = []; 
                }
                currentSection = newSectionKey;
                return; 
            }
        }
        buffer.push(line);
    });
    
    // Flush remaining buffer
    if (buffer.length > 0) {
        const content = buffer.join('\n').trim();
        if (content) sections[currentSection] = content;
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
    const clean = (txt: string) => txt?.replace(/➤/g, '•').trim() || "";
    
    const [showVersionInput, setShowVersionInput] = useState(false);
    const [newVersionRole, setNewVersionRole] = useState('');

    const handleCreateVersion = () => {
        if (newVersionRole.trim() && onCreateVersion) {
            onCreateVersion(newVersionRole);
            setNewVersionRole('');
            setShowVersionInput(false);
        }
    };

    // Check if parsing failed (only HEADER detected and we have text)
    const hasParsedSections = Object.keys(sections).length > 1;
    const rawContentFallback = !hasParsedSections && sections['HEADER'] ? sections['HEADER'] : null;

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
        containerClass += " font-serif text-slate-800 border-t-8 border-amber-600 bg-amber-50/10";
        nameClass = "text-4xl font-serif text-slate-900 border-b border-slate-300 pb-4 mb-6";
        contactClass = "text-base font-medium text-amber-700 mb-8";
        sectionTitleClass = "text-lg font-bold text-slate-900 uppercase tracking-widest mt-8 mb-4 border-b border-amber-200 pb-1 text-amber-900";
        bodyClass += " text-slate-700 leading-7";
    } else if (template === 'Executive') {
        containerClass += " font-sans bg-slate-900 text-slate-200 border-l-8 border-slate-700";
        nameClass = "text-4xl font-bold text-white uppercase tracking-widest mb-2";
        contactClass = "text-xs font-bold text-slate-900 bg-slate-200 inline-block px-3 py-1 mb-8 mt-2 rounded-sm";
        sectionTitleClass = "font-black text-slate-900 bg-white px-2 py-1 uppercase text-sm mt-8 mb-4 inline-block tracking-wide transform -skew-x-12";
        bodyClass += " text-slate-300 font-light tracking-wide leading-relaxed";
    }

    const renderSection = (title: string, contentKey: string) => {
        const key = Object.keys(sections).find(k => k.includes(contentKey)) || "";
        if (!key || !sections[key]) return null;
        
        const content = clean(sections[key]);

        // Special rendering for SKILLS section to add icons
        if (contentKey === 'SKILLS') {
             const skillList = content.split(/,|•|\n/).map(s => s.trim()).filter(s => s.length > 0);
             return (
                 <div className="mb-4">
                     <h3 className={sectionTitleClass}>{title}</h3>
                     <div className="flex flex-wrap gap-2 mt-2">
                         {skillList.map((skill, idx) => (
                             <span key={idx} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-semibold transition-colors ${template === 'Executive' ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                 <TechIcon name={skill} className="w-4 h-4" />
                                 {skill}
                             </span>
                         ))}
                     </div>
                 </div>
             );
        }

        return (
            <div className="mb-4">
                <h3 className={sectionTitleClass}>{title}</h3>
                <div className={bodyClass}>{content}</div>
            </div>
        );
    };

    return (
        <div className="relative h-full flex flex-col" role="document">
            
            {/* Versioning UI Header */}
            {versions && versions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 p-2 flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 px-2">Versions:</span>
                    {versions.map(v => (
                        <button
                            key={v.id}
                            onClick={() => onVersionChange?.(v.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                activeVersionId === v.id
                                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                            }`}
                        >
                            {v.role}
                        </button>
                    ))}
                    
                    {!showVersionInput ? (
                        <button
                            onClick={() => setShowVersionInput(true)}
                            className="px-3 py-1.5 rounded-md text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            <span>+</span> New
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in slide-in-from-left-2 bg-white dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Target Role..." 
                                className="text-xs px-2 py-1 rounded bg-transparent focus:outline-none w-32"
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
            )}

            {/* Resume Content */}
            <div className={`${containerClass} ${isBlurred ? 'blur-md select-none overflow-hidden h-[600px] opacity-80' : 'h-full'}`}>
                <div className={`mb-6 ${template === 'Modern' || template === 'Elegant' ? "text-center" : ""}`}>
                     <div className={nameClass}>{userInput.fullName || 'Your Name'}</div>
                     <div className={contactClass}>
                        {userInput.email} | {userInput.phone}
                        {userInput.linkedinGithub && <span className="block sm:inline sm:ml-2">| {userInput.linkedinGithub}</span>}
                     </div>
                </div>

                {rawContentFallback ? (
                    <div className="mb-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-300 mb-4">
                            ⚠️ Auto-formatting partially failed. Displaying raw text.
                        </div>
                        <div className={bodyClass}>{clean(rawContentFallback)}</div>
                    </div>
                ) : (
                    <>
                        {renderSection('Summary', 'SUMMARY')}
                        {renderSection('Education', 'EDUCATION')}
                        {renderSection('Skills', 'SKILLS')}
                        {renderSection('Experience', 'EXPERIENCE')}
                        {renderSection('Projects', 'PROJECTS')}
                        {renderSection('Certifications', 'CERTIFICATIONS')}
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