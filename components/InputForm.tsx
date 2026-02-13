import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

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
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      name={id}
      id={id}
      autoFocus={autoFocus}
      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-all hover:border-blue-300"
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
}> = ({ id, label, placeholder, value, onChange, rows = 3, required = false, helpText }) => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-all hover:border-blue-300"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {helpText && <p className="mt-1 text-xs text-slate-500 italic">💡 {helpText}</p>}
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
    <div className="bg-white rounded-2xl shadow-xl max-w-3xl mx-auto overflow-hidden border border-slate-100 relative">
      {/* Progress Bar */}
      <div className="h-2 bg-slate-100 w-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
      </div>

      <div className="p-6 sm:p-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="text-4xl">{STEPS[currentStep - 1].icon}</span>
                    {STEPS[currentStep - 1].title}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                    <p className="text-slate-500 font-medium">{STEPS[currentStep - 1].description}</p>
                    {isSaved && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full animate-pulse">✓ Auto-saved</span>}
                </div>
            </div>
            <div className="text-right hidden sm:block">
                 <div className="flex flex-col gap-2 items-end">
                    <button 
                        type="button"
                        onClick={handleMagicFill}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                        title="Fill with dummy data for testing"
                    >
                        ✨ Magic Fill
                    </button>
                    <button
                        type="button"
                        onClick={handleClearProgress}
                        className="text-xs text-slate-400 hover:text-red-500 hover:underline transition-colors"
                    >
                        Clear Progress
                    </button>
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
                  <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
                        <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Dream Job Details</h3>
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
          <div className="pt-6 border-t border-slate-100 flex justify-between items-center mt-8">
            
            {/* Mobile Actions */}
             <div className="sm:hidden flex gap-2">
                 <button 
                    type="button"
                    onClick={handleMagicFill}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-full"
                >
                    ✨ Fill
                </button>
                 <button 
                    type="button"
                    onClick={handleClearProgress}
                    className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-full"
                >
                    Clear
                </button>
             </div>

            <div className="flex gap-3 ml-auto">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Back
                    </button>
                )}

                {currentStep < STEPS.length ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="px-8 py-2.5 rounded-lg font-bold text-white bg-slate-900 hover:bg-black transition-all flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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