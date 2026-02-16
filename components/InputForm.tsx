import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { parseProfileData } from '../services/geminiService';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const COUNTRY_CODES = [
  { code: "+91", country: "🇮🇳 IN" },
  { code: "+1", country: "🇺🇸 US" },
  { code: "+44", country: "🇬🇧 UK" },
  { code: "+61", country: "🇦🇺 AU" },
  { code: "+81", country: "🇯🇵 JP" },
  { code: "+971", country: "🇦🇪 AE" },
  { code: "+65", country: "🇸🇬 SG" },
  { code: "+49", country: "🇩🇪 DE" },
  { code: "+33", country: "🇫🇷 FR" },
  { code: "+86", country: "🇨🇳 CN" },
  { code: "+55", country: "🇧🇷 BR" }
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
    autoFocus?: boolean;
}> = ({ id, label, placeholder, value, onChange, rows = 3, required = false, helpText, autoFocus = false }) => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        autoFocus={autoFocus}
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

const MOCK_PROFILES: UserInput[] = [
    {
        fullName: "Alex Johnson",
        email: "alex.tech@example.com",
        phone: "555 019 2834",
        linkedinGithub: "linkedin.com/in/alexj | github.com/alexj",
        careerObjective: "Aspiring Full Stack Developer passionate about building scalable, user-centric web applications and solving complex problems with code.",
        education: "B.Tech Computer Science, Tech University (2025)",
        currentYear: "Final Year",
        skills: "React, TypeScript, Node.js, Tailwind CSS, PostgreSQL, Python, Git, AWS (Basic)",
        projects: "1. TaskMaster AI: A productivity app using React & OpenAI API.\n2. ShopEasy: Full-stack E-commerce platform with Stripe integration.",
        projectLink: "github.com/alexj/taskmaster",
        internships: "Frontend Intern at StartupFlow (Summer 2024): Improved site performance by 40% and implemented new dashboard features.",
        yearsOfExperience: "0-1 Years",
        certifications: "Meta Frontend Developer Professional Certificate",
        jobRoleTarget: "Frontend Engineer",
        company: "Innovative Tech Startups or Product Companies",
        whyThisRole: "I love combining creativity with logic to build seamless user experiences.",
        interests: "Open Source Contributing, UI/UX Design, Hiking",
        customCSS: ""
    },
    {
        fullName: "Priya Patel",
        email: "priya.data@example.com",
        phone: "987 654 3210",
        linkedinGithub: "linkedin.com/in/priyadata | github.com/priyads",
        careerObjective: "Data Science enthusiast with a strong foundation in machine learning and statistical analysis, eager to uncover insights from big data.",
        education: "M.Sc. Data Science, City University (2024)",
        currentYear: "Graduated",
        skills: "Python, SQL, Pandas, Scikit-learn, TensorFlow, Tableau, Statistics, Jupyter",
        projects: "1. House Price Predictor: Regression model with 92% accuracy.\n2. Customer Churn Analysis: Analyzed telecom data to predict churn.",
        projectLink: "github.com/priyads/churn-analysis",
        internships: "Data Analyst Intern at FinCorp (6 Months): Automated reporting pipelines reducing manual work by 15 hours/week.",
        yearsOfExperience: "0-1 Years",
        certifications: "Google Data Analytics Professional Certificate",
        jobRoleTarget: "Data Scientist",
        company: "Data-driven Fintech or HealthTech",
        whyThisRole: "I want to apply my statistical knowledge to solve real-world business problems.",
        interests: "Chess, Reading Sci-Fi, Kaggle Competitions",
        customCSS: ""
    },
    {
        fullName: "Rahul Sharma",
        email: "rahul.design@example.com",
        phone: "998 877 6655",
        linkedinGithub: "linkedin.com/in/rahuldesign | behance.net/rahulcreates",
        careerObjective: "Creative UI/UX Designer focused on crafting intuitive digital experiences that delight users and achieve business goals.",
        education: "B.Des in Interaction Design, National Institute of Design (2025)",
        currentYear: "Final Year",
        skills: "Figma, Adobe XD, Prototyping, User Research, Wireframing, HTML/CSS Basics",
        projects: "1. EcoEat App: Designed a sustainable food delivery app interface.\n2. Portfolio Redesign: Revamped a local NGO's website for better accessibility.",
        projectLink: "behance.net/rahulcreates/ecoeat",
        internships: "UX Design Intern at CreativeStudio (Summer 2023): Conducted user testing and redesigned the mobile onboarding flow.",
        yearsOfExperience: "0-1 Years",
        certifications: "Google UX Design Certificate",
        jobRoleTarget: "Product Designer",
        company: "Top Consumer Apps or Design Agencies",
        whyThisRole: "I am passionate about empathy-driven design and solving user frustrations.",
        interests: "Sketching, Photography, Traveling",
        customCSS: ""
    }
];

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
            const parsed = JSON.parse(saved);
            // Ensure yearsOfExperience is present if loading legacy data
            return { 
                ...parsed, 
                yearsOfExperience: parsed.yearsOfExperience || '',
                projectLink: parsed.projectLink || '',
                customCSS: parsed.customCSS || ''
            };
        }
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

  // Initialize phone state from loaded data
  useEffect(() => {
      if (formData.phone) {
          // Attempt to split code and number if possible, else just put it in num
          const matchedCode = COUNTRY_CODES.find(c => formData.phone.startsWith(c.code));
          if (matchedCode) {
              setCountryCode(matchedCode.code);
              setPhoneNum(formData.phone.replace(matchedCode.code, "").trim());
          } else {
              setPhoneNum(formData.phone);
          }
      }
  }, []); // Run once on mount

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

  const handlePhoneChange = (num: string) => {
      setPhoneNum(num);
      setFormData(prev => ({ ...prev, phone: `${countryCode} ${num}`.trim() }));
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const code = e.target.value;
      setCountryCode(code);
      setFormData(prev => ({ ...prev, phone: `${code} ${phoneNum}`.trim() }));
  };

  const handleNext = () => {
      // Validation Logic
      const requiredFields: (keyof UserInput)[] = [];
      if (currentStep === 1) requiredFields.push('fullName', 'email', 'phone');
      if (currentStep === 2) requiredFields.push('education', 'skills');
      if (currentStep === 3) requiredFields.push('projects'); // Projects are MANDATORY for all levels
      if (currentStep === 4) requiredFields.push('jobRoleTarget', 'company', 'whyThisRole');

      // Check for missing fields
      const missing = requiredFields.find(field => {
          const val = formData[field];
          return !val || val.trim() === '';
      });

      if (missing) {
          alert(`⚠️ Please fill in the required field: ${missing.replace(/([A-Z])/g, ' $1').trim()}.`);
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
      // Randomly select a profile
      const randomProfile = MOCK_PROFILES[Math.floor(Math.random() * MOCK_PROFILES.length)];
      setFormData(randomProfile);
      
      // Attempt to set phone state from random profile (basic logic, assumes +1 or no code in mock data for now)
      // For simplicity in this demo, let's just set raw number and default code +91
      setPhoneNum(randomProfile.phone); 
      setCountryCode("+91"); 
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
          }));
          
          if (parsedData.phone) {
              setPhoneNum(parsedData.phone); // Simplify for import
          }

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
              education: '', skills: '', projects: '', internships: '', yearsOfExperience: '', certifications: '',
              jobRoleTarget: '', company: '', whyThisRole: '', interests: '', currentYear: '',
              projectLink: '', customCSS: ''
          };
          setFormData(emptyData);
          setPhoneNum("");
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
                    {/* Phone Input with Country Code */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <div className="flex gap-2">
                             <select 
                                value={countryCode} 
                                onChange={handleCountryCodeChange}
                                className="block w-24 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-all"
                             >
                                 {COUNTRY_CODES.map((c) => (
                                     <option key={c.code} value={c.code}>{c.country} {c.code}</option>
                                 ))}
                             </select>
                             <input 
                                type="tel"
                                id="phone"
                                value={phoneNum}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 transition-all placeholder:text-slate-400"
                                placeholder="98765 43210"
                                required
                             />
                        </div>
                    </div>
                    <InputField id="linkedinGithub" label="Links (LinkedIn / GitHub / Portfolio)" placeholder="Optional urls..." value={formData.linkedinGithub} onChange={handleChange} />
                 </div>
                 <TextareaField id="careerObjective" label="Career Objective / Bio" placeholder="Who are you? (e.g., '3rd year student passionate about AI')" value={formData.careerObjective} onChange={handleChange} rows={2} required helpText="Keep it punchy. We'll polish it." />
              </div>
          )}

          {/* STEP 2: ACADEMICS */}
          {currentStep === 2 && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="education" label="Degree / College" placeholder="e.g., B.Tech CSE, IIT Delhi" value={formData.education} onChange={handleChange} required autoFocus />
                    <InputField id="currentYear" label="Current Year / Status" placeholder="e.g., 2nd Year Student, 2025 Grad" value={formData.currentYear} onChange={handleChange} required />
                 </div>
                 <TextareaField id="skills" label="Your Skills Arsenal" placeholder="React, Python, Communication, Design..." value={formData.skills} onChange={handleChange} required rows={4} helpText="List everything you're good at. Don't be shy!" />
                 <InputField id="certifications" label="Certifications (Optional)" placeholder="Coursera, Udemy, Hackerrank badges?" value={formData.certifications} onChange={handleChange} />
              </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {currentStep === 3 && (
              <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4 border border-blue-100 dark:border-blue-800">
                      💡 <strong>Student Tip:</strong> If you don't have formal internships, list academic projects, hackathons, or freelance work!
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-3">
                          <TextareaField id="internships" label="Experience / Internships (Optional)" placeholder="Role, Company, Date. What did you achieve?" value={formData.internships} onChange={handleChange} rows={4} helpText="Leave empty if you are a 1st/2nd year student with no experience yet." autoFocus />
                      </div>
                      <div className="md:col-span-1">
                          <InputField id="yearsOfExperience" label="YOE (Optional)" placeholder="e.g. 0-1 Years" value={formData.yearsOfExperience} onChange={handleChange} />
                      </div>
                  </div>
                  <TextareaField id="projects" label="Key Projects (Mandatory)" placeholder="1. Project Name: Description... " value={formData.projects} onChange={handleChange} required rows={6} helpText="School/College projects COUNT! Describe what you built." />
                  <InputField id="projectLink" label="Main Project Link" placeholder="e.g. github.com/my-best-project" value={formData.projectLink || ''} onChange={handleChange} />
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