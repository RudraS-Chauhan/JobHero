import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { parseProfileData } from '../services/geminiService';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const COUNTRY_CODES = [
  { code: "+91", country: "🇮🇳" },
  { code: "+1", country: "🇺🇸" },
  { code: "+44", country: "🇬🇧" },
  { code: "+61", country: "🇦🇺" },
  { code: "+81", country: "🇯🇵" },
  { code: "+971", country: "🇦🇪" },
  { code: "+65", country: "🇸🇬" }
];

const InputField: React.FC<{ 
    id: keyof UserInput; 
    label: string; 
    placeholder: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    required?: boolean; 
    autoFocus?: boolean;
}> = ({ id, label, placeholder, value, onChange, required = false, autoFocus = false }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      name={id}
      id={id}
      autoFocus={autoFocus}
      className="block w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-0 sm:text-sm p-4 transition-all hover:border-slate-200 dark:hover:border-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  </div>
);

const TextareaField: React.FC<{ 
    id: keyof UserInput; 
    label: string; 
    placeholder: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
    rows?: number; 
    required?: boolean; 
    helpText?: string;
    autoFocus?: boolean;
}> = ({ id, label, placeholder, value, onChange, rows = 3, required = false, helpText, autoFocus = false }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        autoFocus={autoFocus}
        className="block w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-0 sm:text-sm p-4 transition-all hover:border-slate-200 dark:hover:border-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium leading-relaxed"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {helpText && <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-wider px-1">💡 {helpText}</p>}
    </div>
);

const STEPS = [
    { id: 1, title: 'Identity', icon: '👤', description: "Profile basics" },
    { id: 2, title: 'Expertise', icon: '🎓', description: "Skills & Education" },
    { id: 3, title: 'Portfolio', icon: '🚀', description: "Work & Projects" },
    { id: 4, title: 'Mission', icon: '🎯', description: "Career goals" },
];

const STORAGE_KEY_DATA = 'jobHero_formData';
const STORAGE_KEY_STEP = 'jobHero_currentStep';

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_STEP);
        return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [formData, setFormData] = useState<UserInput>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_DATA);
        if (saved) return JSON.parse(saved);
    }
    return {
        fullName: '', email: '', phone: '', linkedinGithub: '', careerObjective: '',
        education: '', skills: '', projects: '', internships: '', yearsOfExperience: '', certifications: '',
        jobRoleTarget: '', company: '', whyThisRole: '', interests: '', currentYear: '',
        projectLink: '', customCSS: ''
    };
  });

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNum, setPhoneNum] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(formData));
    localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
  }, [formData, currentStep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (num: string) => {
      setPhoneNum(num);
      setFormData(prev => ({ ...prev, phone: `${countryCode} ${num}`.trim() }));
  };

  const handleNext = () => {
      const requiredFields: (keyof UserInput)[] = [];
      if (currentStep === 1) requiredFields.push('fullName', 'email');
      if (currentStep === 2) requiredFields.push('education', 'skills');
      if (currentStep === 3) requiredFields.push('projects');
      if (currentStep === 4) requiredFields.push('jobRoleTarget', 'company');

      const missing = requiredFields.find(field => !formData[field] || formData[field].trim() === '');
      if (missing) {
          alert(`Required: ${missing.replace(/([A-Z])/g, ' $1').trim()}`);
          return;
      }
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

  const handleImport = async () => {
      if (!importText.trim()) return;
      setIsImporting(true);
      try {
          const parsedData = await parseProfileData(importText);
          setFormData(prev => ({ ...prev, ...parsedData }));
          setShowImportModal(false);
          setImportText('');
      } catch (e) {
          alert("Import failed. Paste raw text clearly.");
      } finally {
          setIsImporting(false);
      }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-500">
      
      {showImportModal && (
          <div className="absolute inset-0 z-[70] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
                  <button onClick={() => setShowImportModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Synthesize Profile</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium">Paste your raw resume or LinkedIn text. Gemini will extract data points.</p>
                  <textarea 
                    className="w-full h-64 p-5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-mono mb-6 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none"
                    placeholder="Paste text here..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setShowImportModal(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                      <button 
                        onClick={handleImport}
                        disabled={isImporting || !importText.trim()}
                        className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                          {isImporting ? <span className="animate-spin text-xl">⌛</span> : '✨'} 
                          {isImporting ? 'Processing...' : 'Auto-Fill Form'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Modern Horizontal Steps */}
      <div className="bg-slate-50 dark:bg-slate-950/50 p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
              {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <button 
                        onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all duration-500 ${
                            currentStep === step.id 
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-110' 
                                : currentStep > step.id 
                                    ? 'bg-green-500 text-white shadow-lg' 
                                    : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-700 border-2 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                          {currentStep > step.id ? '✓' : step.icon}
                      </button>
                      <div className="text-center hidden sm:block">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-blue-600' : 'text-slate-400'}`}>Step 0{step.id}</p>
                          <p className={`text-xs font-bold ${currentStep === step.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step.title}</p>
                      </div>
                      {idx < STEPS.length - 1 && (
                          <div className={`hidden sm:block absolute top-6 left-1/2 w-full h-0.5 -z-10 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                      )}
                  </div>
              ))}
          </div>
      </div>

      <div className="p-8 sm:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between items-end mb-4 border-b border-slate-50 dark:border-slate-800 pb-6">
              <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {STEPS[currentStep - 1].title} Details
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">{STEPS[currentStep - 1].description}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowImportModal(true)} 
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-xl"
              >
                  Quick Import
              </button>
          </div>

          <div className="min-h-[320px] animate-in fade-in slide-in-from-right-4 duration-500">
              {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputField id="fullName" label="Full Name" placeholder="e.g., Rudra Singh" value={formData.fullName} onChange={handleChange} required autoFocus />
                      <InputField id="email" label="Email Address" placeholder="e.g., rudra@example.com" value={formData.email} onChange={handleChange} required />
                      <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Number</label>
                          <div className="flex gap-2">
                              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-24 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm font-bold">
                                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.country} {c.code}</option>)}
                              </select>
                              <input type="tel" value={phoneNum} onChange={e => handlePhoneChange(e.target.value)} className="flex-1 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm font-medium" placeholder="9876543210" />
                          </div>
                      </div>
                      <InputField id="linkedinGithub" label="Digital Footprint" placeholder="LinkedIn, Github, Portfolio urls..." value={formData.linkedinGithub} onChange={handleChange} />
                  </div>
              )}

              {currentStep === 2 && (
                  <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <InputField id="education" label="Academic Institution" placeholder="e.g., B.Tech CSE, IIT Mumbai" value={formData.education} onChange={handleChange} required autoFocus />
                          <InputField id="currentYear" label="Academic Stage" placeholder="e.g., Final Year, 2025 Grad" value={formData.currentYear} onChange={handleChange} required />
                      </div>
                      <TextareaField id="skills" label="Core Competencies" placeholder="React, Python, Deep Learning, SQL, Figma..." value={formData.skills} onChange={handleChange} required rows={4} helpText="Separate by commas for better parsing." />
                      <InputField id="certifications" label="Global Certifications" placeholder="AWS, Google Cloud, Meta Certs..." value={formData.certifications} onChange={handleChange} />
                  </div>
              )}

              {currentStep === 3 && (
                  <div className="space-y-8">
                      <TextareaField id="projects" label="Impactful Projects" placeholder="1. Project Name: Detail accomplishments..." value={formData.projects} onChange={handleChange} required rows={5} helpText="Focus on 'built X to solve Y using Z'." autoFocus />
                      <InputField id="projectLink" label="Primary Project URL" placeholder="Github or live demo link" value={formData.projectLink || ''} onChange={handleChange} />
                      <TextareaField id="internships" label="Professional Experience" placeholder="Roles at companies or internships..." value={formData.internships} onChange={handleChange} rows={3} helpText="If none, focus on freelance or open source." />
                  </div>
              )}

              {currentStep === 4 && (
                  <div className="space-y-8 bg-blue-50/30 dark:bg-blue-900/10 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-900/40">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <InputField id="jobRoleTarget" label="Target Job Role" placeholder="e.g., Frontend Engineer II" value={formData.jobRoleTarget} onChange={handleChange} required autoFocus />
                          <InputField id="company" label="Aspirant Company" placeholder="e.g., Google, Tesla, Atlassian" value={formData.company} onChange={handleChange} required />
                      </div>
                      <TextareaField id="whyThisRole" label="Aspiration & Motivation" placeholder="Tell us why you are a cultural fit..." value={formData.whyThisRole} onChange={handleChange} rows={3} required />
                      <InputField id="interests" label="Cultural Interests" placeholder="e.g., Chess, Open Source, Hiking" value={formData.interests} onChange={handleChange} required />
                  </div>
              )}
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-slate-50 dark:border-slate-800">
                <button 
                    type="button" 
                    onClick={handleBack} 
                    disabled={currentStep === 1}
                    className={`px-8 py-3 text-sm font-black uppercase tracking-widest transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Back
                </button>

                <div className="flex gap-4">
                    {currentStep < STEPS.length ? (
                        <button 
                            type="button" 
                            onClick={handleNext} 
                            className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Continue
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                        >
                            {isLoading ? 'Synthesizing...' : 'Generate Toolkit'}
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputForm;