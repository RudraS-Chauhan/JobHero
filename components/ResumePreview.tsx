import React, { useMemo } from 'react';
import { UserInput } from '../types';

export type TemplateType = 'Classic' | 'Modern' | 'Creative' | 'Elegant' | 'Executive';

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
        
        const cleanUpper = upper.replace(/[*#]/g, '').trim();
        const hasIcon = icons.some(icon => trimmed.includes(icon));
        const isKeywordHeader = Object.keys(sectionMap).some(key => cleanUpper === key || cleanUpper === key + ':');

        if (hasIcon || isKeywordHeader) {
            let newSectionKey = '';
            for (const [key, value] of Object.entries(sectionMap)) {
                if (cleanUpper.includes(key)) {
                    newSectionKey = value;
                    break;
                }
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
                    sections[currentSection] = buffer.join('\n').trim();
                    buffer = [];
                }
                currentSection = newSectionKey;
                return; 
            }
        }
        
        buffer.push(line);
    });
    
    if (buffer.length > 0) sections[currentSection] = buffer.join('\n').trim();
    
    return sections;
};

interface ResumePreviewProps { 
    text: string; 
    template: TemplateType; 
    isBlurred?: boolean; 
    onUnlock?: () => void; 
    userInput: Partial<UserInput>; 
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ text, template, isBlurred, onUnlock, userInput }) => {
    const sections = useMemo(() => parseResume(text), [text]);
    
    const clean = (txt: string) => txt?.replace(/➤/g, '•').trim() || "";

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

    const renderSection = (title: string, contentKey: string) => {
        const key = Object.keys(sections).find(k => k.includes(contentKey)) || "";
        if (!key || !sections[key]) return null;
        
        return (
            <div className="mb-4">
                <h3 className={sectionTitleClass}>{title}</h3>
                <div className={bodyClass}>{clean(sections[key])}</div>
            </div>
        );
    };

    return (
        <div className="relative h-full">
            <div className={`${containerClass} ${isBlurred ? 'blur-md select-none overflow-hidden h-[600px]' : 'h-full'}`}>
                <div className={`mb-6 ${template === 'Modern' || template === 'Elegant' ? "text-center" : ""}`}>
                     <div className={nameClass}>{userInput.fullName || 'Your Name'}</div>
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