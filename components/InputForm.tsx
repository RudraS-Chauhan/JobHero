import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { parseProfileData } from '../services/geminiService';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const InputField: React.FC<{ 
    id: keyof UserInput; 
    label: string; 
    placeholder: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    required?: boolean; 
    autoFocus?: boolean;
}> = ({ id, label, placeholder, value, onChange, required = false, autoFocus = false }) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
    </label>
    <input
      type="text"
      name={id}
      id={id}
      autoFocus={autoFocus}
      className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-all hover:border-blue-300 dark:hover:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      aria-required={required}
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
}> = ({ id, label, placeholder, value, onChange, rows = 3, required = false, helpText }) => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-all hover:border-blue-300 dark:hover:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
      />
      {helpText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">💡 {helpText}</p>}
    </div>
);

const MOCK_DATA: UserInput = {
    fullName: "Alex Johnson",
    email: "alex.tech@example.com",
    phone: "+1 555 019 2834",
    linkedinGithub: "linkedin.com/in/alexj | github.com/alexj",
    careerObjective: "Aspiring Full Stack Developer passionate about building scalable, user-centric web applications and solving complex problems with code.",
    education: "B.Tech Computer Science, Tech University (2025)",
    currentYear: "Final Year",
    skills: "React, TypeScript, Node.js, Tailwind CSS, PostgreSQL, Python, Git, AWS (Basic)",
    projects: "1. TaskMaster AI: A productivity app using React & OpenAI API. [Demo: taskmaster.app]\n2. ShopEasy: Full-stack E-commerce platform with Stripe integration. [Repo: github.com/alexj/shopeasy]",
    internships: "Frontend Intern at StartupFlow (Summer 2024): Improved site performance by 40% and implemented new dashboard features.",
    certifications: "Meta Frontend Developer Professional Certificate",
    jobRoleTarget: "Frontend Engineer",
    company: "Innovative Tech Startups or Product Companies",
    whyThisRole: "I love combining creativity with logic to build seamless user experiences.",
    interests: "Open Source Contributing, UI/UX Design, Hiking"
};

const STEPS = [
    { id: 1, title: 'Identity', icon: '👤', description: "Let's start with the basics." },
    { id: 2, title: 'Academics', icon: '🎓', description: "What do you know?" },
    { id: 3, title: 'Experience', icon: '🚀', description: "What have you built?" },
    { id: 4, title: 'Target', icon: '🎯', description: "Where are you going?" },
];

const STORAGE_KEY_DATA = 'jobHero_formData';
const STORAGE_KEY_STEP = 'jobHero_currentStep';

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  // Load state from localStorage or default
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
        if (saved) {
            return JSON.parse(saved);
        }
    }
    return {
        fullName: '', email: '', phone: '', linkedinGithub: '', careerObjective: '',
        education: '', skills: '', projects: '', internships: '', certifications: '',
        jobRoleTarget: '', company: '', whyThisRole: '', interests: '', currentYear: '',
    };
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(formData));
    localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
    
    // Simple visual feedback trigger
    setIsSaved(true);
    const timer = setTimeout(() => setIsSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
      // Basic validation for current step
      const requiredFields: (keyof UserInput)[] = [];
      if (currentStep === 1) requiredFields.push('fullName', 'email', 'phone');
      if (currentStep === 2) requiredFields.push('education', 'currentYear', 'skills');
      if (currentStep === 3) requiredFields.push('projects');
      if (currentStep === 4) requiredFields.push('jobRoleTarget', 'company', 'whyThisRole');

      const missing = requiredFields.find(field => !formData[field]);
      if (missing) {
          alert(`Please fill in the required field: ${missing}`);
          return;
      }
      
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
      setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleMagicFill = () => {
      setFormData(MOCK_DATA);
  };

  const handleImport = async () => {
      if (!importText.trim()) return;
      setIsImporting(true);
      try {
          const parsedData = await parseProfileData(importText);
          setFormData(prev => ({
              ...prev,
              ...parsedData,
              // Keep default values if parsing returned empty for specific fields
              fullName: parsedData.fullName || prev.fullName,
              email: parsedData.email || prev.email,
              phone: parsedData.phone || prev.phone,
          }));
          setShowImportModal(false);
          setImportText('');
          alert("Data imported successfully! Please review the fields.");
      } catch (e) {
          alert("Failed to parse text. Please fill manually.");
      } finally {
          setIsImporting(false);
      }
  };
  
  const handleClearProgress = () => {
      if (confirm("Are you sure you want to clear your progress? This cannot be undone.")) {
          const emptyData = {
              fullName: '', email: '', phone: '', linkedinGithub: '', careerObjective: '',
              education: '', skills: '', projects: '', internships: '', certifications: '',
              jobRoleTarget: '', company: '', whyThisRole: '', interests: '', currentYear: '',
          };
          setFormData(emptyData);
          setCurrentStep(1);
          localStorage.removeItem(STORAGE_KEY_DATA);
          localStorage.removeItem(STORAGE_KEY_STEP);
      }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl mx-auto overflow-hidden border border-slate-100 dark:border-slate-700 relative transition-colors duration-300">
      
      {/* IMPORT MODAL */}
      {showImportModal && (
          <div 
            className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-6 w-full max-w-lg relative">
                  <button 
                    onClick={() => setShowImportModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Close modal"
                  >
                      ✕
                  </button>
                  <h3 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">📥 Import from Text</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Paste your entire Resume or LinkedIn Profile text (CTRL+A, CTRL+C) below. Our AI will extract the details.</p>
                  <textarea 
                    className="w-full h-48 p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono mb-4 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    placeholder="Paste raw text here..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleImport}
                        disabled={isImporting || !importText.trim()}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                          {isImporting ? <span className="animate-spin">⌛</span> : '✨'} 
                          {isImporting ? 'Extracting...' : 'Auto-Fill Form'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Progress Bar */}
      <div 
        className="h-2 bg-slate-100 dark:bg-slate-700 w-full"
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
      </div>

      <div className="p-6 sm:p-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <span className="text-4xl">{STEPS[currentStep - 1].icon}</span>
                    {STEPS[currentStep - 1].title}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{STEPS[currentStep - 1].description}</p>
                    {isSaved && <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full animate-pulse">✓ Auto-saved</span>}
                </div>
            </div>
            <div className="text-right hidden sm:block">
                 <div className="flex flex-col gap-2 items-end">
                    <button 
                        type="button"
                        onClick={() => setShowImportModal(true)}
                        className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-1.5 rounded-full transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                    >
                        📥 Import Resume/LinkedIn
                    </button>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={handleMagicFill}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                        >
                            ✨ Magic Fill
                        </button>
                        <button
                            type="button"
                            onClick={handleClearProgress}
                            className="text-xs text-slate-400 hover:text-red-500 hover:underline transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                 </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">Step {currentStep} of {STEPS.length}</div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 min-h-[300px]">
          
          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
              <div className="grid grid-cols-1 gap-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="fullName" label="Full Name" placeholder="e.g., Ananya Sharma" value={formData.fullName} onChange={handleChange} required autoFocus />
                    <InputField id="email" label="Email" placeholder="e.g., ananya@example.com" value={formData.email} onChange={handleChange} required />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="phone" label="Phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} required />
                    <InputField id="linkedinGithub" label="Links (LinkedIn / GitHub / Portfolio)" placeholder="Optional urls..." value={formData.linkedinGithub} onChange={handleChange} />
                 </div>
                 <TextareaField id="careerObjective" label="Career Objective" placeholder="A short summary of who you are and what you want." value={formData.careerObjective} onChange={handleChange} rows={2} helpText="Keep it punchy. We'll polish it." />
              </div>
          )}

          {/* STEP 2: ACADEMICS */}
          {currentStep === 2 && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="education" label="Degree / College" placeholder="e.g., B.Tech CSE, IIT Delhi" value={formData.education} onChange={handleChange} required autoFocus />
                    <InputField id="currentYear" label="Current Year" placeholder="e.g., 3rd Year / 2025 Grad" value={formData.currentYear} onChange={handleChange} required />
                 </div>
                 <TextareaField id="skills" label="Your Skills Arsenal" placeholder="React, Python, Communication, Design..." value={formData.skills} onChange={handleChange} required rows={4} helpText="List everything you're good at. Don't be shy!" />
                 <InputField id="certifications" label="Certifications (Optional)" placeholder="Any extra courses or badges?" value={formData.certifications} onChange={handleChange} />
              </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {currentStep === 3 && (
              <div className="space-y-6">
                  <TextareaField id="projects" label="Key Projects" placeholder="1. Project Name: Description... [Link: example.com]" value={formData.projects} onChange={handleChange} required rows={6} helpText="Include links (GitHub/Demo) if possible! It proves your work is real." autoFocus />
                  <TextareaField id="internships" label="Experience / Internships" placeholder="Role, Company, Date. What did you achieve?" value={formData.internships} onChange={handleChange} rows={4} helpText="If none, type 'Fresher - Looking for first opportunity'." />
              </div>
          )}

          {/* STEP 4: TARGET */}
          {currentStep === 4 && (
              <div className="space-y-6">
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-4">
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm uppercase tracking-wide">Dream Job Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField id="jobRoleTarget" label="Target Role" placeholder="e.g., SDE, Product Manager" value={formData.jobRoleTarget} onChange={handleChange} required autoFocus />
                            <InputField id="company" label="Target Company" placeholder="e.g., Google, Startups" value={formData.company} onChange={handleChange} required />
                        </div>
                        <TextareaField id="whyThisRole" label="Why them?" placeholder="I admire the innovative culture..." value={formData.whyThisRole} onChange={handleChange} rows={2} required />
                  </div>
                  <InputField id="interests" label="Personal Interests" placeholder="e.g., AI, Gaming, Cricket" value={formData.interests} onChange={handleChange} required />
              </div>
          )}

          {/* Footer / Navigation */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-8">
            
            {/* Mobile Actions */}
             <div className="sm:hidden flex gap-2">
                 <button 
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-full"
                >
                    📥 Import
                </button>
                 <button 
                    type="button"
                    onClick={handleMagicFill}
                    className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-full"
                >
                    ✨ Fill
                </button>
             </div>

            <div className="flex gap-3 ml-auto">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Back
                    </button>
                )}

                {currentStep < STEPS.length ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="px-8 py-2.5 rounded-lg font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 transition-all flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Crafting Magic...
                            </span>
                        ) : (
                            <>
                                Generate Toolkit <ArrowRightIcon className="ml-2 h-5 w-5" />
                            </>
                        )}
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