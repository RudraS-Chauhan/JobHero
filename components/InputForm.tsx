import React, { useState, useEffect } from 'react';
import { UserInput, ProjectDetails } from '../types';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { parseProfileData, fetchCompanyInsights } from '../services/geminiService';

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
  { code: "+65", country: "🇸🇬 SG" }
];

const InputField: React.FC<{ 
    id: string; 
    label: string; 
    placeholder: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    required?: boolean; 
    autoFocus?: boolean;
    rightElement?: React.ReactNode;
}> = ({ id, label, placeholder, value, onChange, required = false, autoFocus = false, rightElement }) => (
  <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
    <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
        <input
          type="text"
          name={id}
          id={id}
          autoFocus={autoFocus}
          className={`form-input block w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-0 sm:text-sm p-3 transition-all hover:border-slate-200 dark:hover:border-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium ${rightElement ? 'pr-14' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                {rightElement}
            </div>
        )}
        <style>{`
            .form-input::placeholder {
                font-style: italic;
                opacity: 0.7;
            }
        `}</style>
    </div>
  </div>
);

const TextareaField: React.FC<{ 
    id: string; 
    label: string; 
    placeholder: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
    rows?: number; 
    required?: boolean; 
    helpText?: string;
    autoFocus?: boolean;
}> = ({ id, label, placeholder, value, onChange, rows = 3, required = false, helpText, autoFocus = false }) => (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        autoFocus={autoFocus}
        className="block w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-0 sm:text-sm p-3 transition-all hover:border-slate-200 dark:hover:border-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium leading-relaxed"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {helpText && <p className="text-[9px] text-slate-400 font-bold italic uppercase tracking-wider px-1">💡 {helpText}</p>}
    </div>
);

const TagInput: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    placeholder?: string;
    helpText?: string;
    autoFocus?: boolean;
}> = ({ id, label, value, onChange, placeholder, helpText, autoFocus }) => {
    const [input, setInput] = useState('');
    const tags = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (input.trim()) {
                const newTags = [...tags, input.trim()];
                onChange({ target: { name: id, value: newTags.join(', ') } });
                setInput('');
            }
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            const newTags = tags.slice(0, -1);
            onChange({ target: { name: id, value: newTags.join(', ') } });
        }
    };

    const removeTag = (index: number) => {
        const newTags = tags.filter((_, i) => i !== index);
        onChange({ target: { name: id, value: newTags.join(', ') } });
    };

    return (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {label}
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
                {tags.map((tag, i) => (
                    <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-blue-100 dark:border-blue-800">
                        {tag}
                        <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500 transition-colors">×</button>
                    </span>
                ))}
                <input
                    id={id}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus={autoFocus}
                    className="flex-1 bg-transparent outline-none text-sm min-w-[120px] text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder={tags.length === 0 ? placeholder : 'Type & press Enter...'}
                />
            </div>
            {helpText && <p className="text-[9px] text-slate-400 font-bold italic uppercase tracking-wider px-1">💡 {helpText}</p>}
        </div>
    );
};

const ProjectTile: React.FC<{
    project: ProjectDetails;
    index: number;
    onChange: (id: string, field: keyof ProjectDetails, value: string) => void;
    onRemove: (id: string) => void;
}> = ({ project, index, onChange, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={`rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900 shadow-lg ring-1 ring-blue-500/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-blue-300'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {index + 1}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${!project.name ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white'}`}>
                            {project.name || 'Untitled Project'}
                        </h4>
                        {!isExpanded && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{project.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(project.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                        🗑️
                    </button>
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''} text-slate-400`}>▼</div>
                </div>
            </div>
            
            {isExpanded && (
                <div className="p-6 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField id={`p-name-${project.id}`} label="Project Name" placeholder="e.g. E-Commerce API" value={project.name} onChange={(e) => onChange(project.id, 'name', e.target.value)} />
                        <InputField id={`p-link-${project.id}`} label="Link (GitHub/Live)" placeholder="https://..." value={project.link} onChange={(e) => onChange(project.id, 'link', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField id={`p-start-${project.id}`} label="Start Date" placeholder="Jan 2024" value={project.startDate} onChange={(e) => onChange(project.id, 'startDate', e.target.value)} />
                        <InputField id={`p-end-${project.id}`} label="End Date" placeholder="Mar 2024" value={project.endDate} onChange={(e) => onChange(project.id, 'endDate', e.target.value)} />
                    </div>
                    <TextareaField id={`p-desc-${project.id}`} label="Description & Impact" placeholder="Built using React & Node.js. Improved performance by 30%..." rows={3} value={project.description} onChange={(e) => onChange(project.id, 'description', e.target.value)} helpText="Focus on metrics and tech stack." />
                </div>
            )}
        </div>
    );
};

const MOCK_PROFILES: UserInput[] = [
    {
        fullName: "Ananya Sharma",
        email: "ananya.sharma@example.com",
        phone: "+91 9876543210",
        linkedinGithub: "linkedin.com/in/ananya\ngithub.com/ananya-dev",
        careerObjective: "3rd year student passionate about building scalable AI products and frontend architectures.",
        education: "B.Tech CSE, IIT Mumbai (2025)",
        currentYear: "Final Year",
        skills: "React, Node.js, Python, TensorFlow, SQL, AWS",
        projects: "Legacy Project String",
        projectsList: [
            { id: '1', name: 'EduConnect Platform', link: 'github.com/ananya/edu', startDate: 'Jan 2024', endDate: 'Mar 2024', description: 'Built a peer-to-peer learning platform using React and Firebase. Reduced note-sharing time by 40% for 500+ students.' },
            { id: '2', name: 'StockPredict AI', link: 'github.com/ananya/stocks', startDate: 'Aug 2023', endDate: 'Dec 2023', description: 'Implemented LSTM models to forecast NIFTY 50 prices with 85% accuracy. Deployed via Flask API.' }
        ],
        internships: "SDE Intern at TechScale (Summer 2024): Built 15+ reusable UI components.",
        eventsAndCertifications: "1. AWS Cloud Practitioner Certified\n2. HackHarvard 2023 Winner\n3. Organizer, TechFest 2024",
        certifications: "",
        yearsOfExperience: "0-1 Years",
        jobRoleTarget: "Frontend Engineer",
        company: "Google / Innovative Startups",
        whyThisRole: "I thrive in cultures that prioritize technical excellence and user empathy.",
        interests: "Chess, Reading, Open Source",
        projectLink: "", projectStartDate: "", projectEndDate: "", customCSS: "",
        school12th: "DPS R.K. Puram (CBSE) - 94%",
        school10th: "St. Mary's School (ICSE) - 96%"
    },
    {
        fullName: "Rohan Mehta",
        email: "rohan.mehta@example.com",
        phone: "+91 9123456780",
        linkedinGithub: "linkedin.com/in/rohanm\ngithub.com/rohan-backend",
        careerObjective: "Backend developer focused on high-performance distributed systems and cloud infrastructure.",
        education: "B.E. Computer Science, BITS Pilani (2024)",
        currentYear: "Graduated",
        skills: "Java, Spring Boot, Kafka, Docker, Kubernetes, PostgreSQL",
        projects: "Legacy Project String",
        projectsList: [
            { id: '1', name: 'Distributed Cache System', link: 'github.com/rohan/cache', startDate: 'Feb 2024', endDate: 'Apr 2024', description: 'Designed a distributed caching system handling 10k RPS with eventual consistency.' },
            { id: '2', name: 'Payment Gateway Integration', link: 'github.com/rohan/pay', startDate: 'Sep 2023', endDate: 'Nov 2023', description: 'Integrated Stripe and Razorpay for a mock e-commerce site, ensuring PCI compliance.' }
        ],
        internships: "Backend Intern at FinTech Solutions (Spring 2024): Optimized API latency by 20%.",
        eventsAndCertifications: "1. Oracle Certified Professional: Java SE 11\n2. 2nd Place, CodeWars 2023",
        certifications: "",
        yearsOfExperience: "0-1 Years",
        jobRoleTarget: "Backend Engineer",
        company: "Amazon / Fintech Unicorns",
        whyThisRole: "I want to solve complex scalability challenges in financial systems.",
        interests: "Cycling, Sci-Fi Movies, System Design",
        projectLink: "", projectStartDate: "", projectEndDate: "", customCSS: "",
        school12th: "Modern School (CBSE) - 95%",
        school10th: "Don Bosco (ICSE) - 97%"
    },
    {
        fullName: "Sara Ali",
        email: "sara.ali@example.com",
        phone: "+91 9988776655",
        linkedinGithub: "linkedin.com/in/sara-ds\nkaggle.com/saraali",
        careerObjective: "Aspiring Data Scientist with a knack for deriving actionable insights from complex datasets.",
        education: "M.Sc Data Science, ISI Kolkata (2025)",
        currentYear: "Final Year",
        skills: "Python, R, Pandas, Scikit-learn, Tableau, SQL",
        projects: "Legacy Project String",
        projectsList: [
            { id: '1', name: 'Customer Churn Prediction', link: 'github.com/sara/churn', startDate: 'Jan 2024', endDate: 'Mar 2024', description: 'Built a churn prediction model for a telecom dataset with 92% AUC-ROC.' },
            { id: '2', name: 'Sales Dashboard', link: 'tableau.com/sara/sales', startDate: 'Oct 2023', endDate: 'Nov 2023', description: 'Created an interactive Tableau dashboard for retail sales analysis.' }
        ],
        internships: "Data Analyst Intern at RetailGiant (Summer 2024): Automated weekly reporting.",
        eventsAndCertifications: "1. Google Data Analytics Certificate\n2. Kaggle Notebook Expert",
        certifications: "",
        yearsOfExperience: "0-1 Years",
        jobRoleTarget: "Data Scientist",
        company: "Microsoft / Analytics Firms",
        whyThisRole: "Passionate about using data to drive business strategy and product improvements.",
        interests: "Painting, Sudoku, Blogging",
        projectLink: "", projectStartDate: "", projectEndDate: "", customCSS: "",
        school12th: "KV (CBSE) - 93%",
        school10th: "KV (CBSE) - 95%"
    },
    {
        fullName: "Vikram Singh",
        email: "vikram.singh@example.com",
        phone: "+91 8877665544",
        linkedinGithub: "linkedin.com/in/vikram-pm",
        careerObjective: "Product enthusiast aiming to build user-centric products that solve real-world problems.",
        education: "MBA, IIM Bangalore (2025)",
        currentYear: "Final Year",
        skills: "Product Management, Agile, Jira, Figma, User Research, SQL",
        projects: "Legacy Project String",
        projectsList: [
            { id: '1', name: 'Food Delivery App Revamp', link: 'figma.com/vikram/food', startDate: 'Feb 2024', endDate: 'Apr 2024', description: 'Redesigned the checkout flow, reducing cart abandonment by 15%.' },
            { id: '2', name: 'Market Entry Strategy', link: 'drive.google.com/vikram/strategy', startDate: 'Nov 2023', endDate: 'Dec 2023', description: 'Developed a go-to-market strategy for a SaaS product entering the SEA market.' }
        ],
        internships: "Product Intern at Swiggy (Summer 2024): Launched a new loyalty feature.",
        eventsAndCertifications: "1. Certified Scrum Product Owner (CSPO)\n2. Winner, Hult Prize Campus Round",
        certifications: "",
        yearsOfExperience: "1-3 Years",
        jobRoleTarget: "Product Manager",
        company: "Uber / Consumer Tech",
        whyThisRole: "I love bridging the gap between engineering, design, and business.",
        interests: "Traveling, Podcasts, Economics",
        projectLink: "", projectStartDate: "", projectEndDate: "", customCSS: "",
        school12th: "Army Public School (CBSE) - 91%",
        school10th: "Army Public School (CBSE) - 93%"
    },
    {
        fullName: "Priya Desai",
        email: "priya.desai@example.com",
        phone: "+91 7766554433",
        linkedinGithub: "linkedin.com/in/priya-ui\ndribbble.com/priya",
        careerObjective: "Creative UI/UX Designer focused on crafting intuitive and accessible digital experiences.",
        education: "B.Des, NID Ahmedabad (2024)",
        currentYear: "Graduated",
        skills: "Figma, Adobe XD, Prototyping, HTML/CSS, User Testing",
        projects: "Legacy Project String",
        projectsList: [
            { id: '1', name: 'Mental Health App Design', link: 'behance.net/priya/mind', startDate: 'Jan 2024', endDate: 'Mar 2024', description: 'Designed a mobile app for mental wellness with a focus on calming aesthetics.' },
            { id: '2', name: 'E-learning Dashboard', link: 'dribbble.com/priya/learn', startDate: 'Sep 2023', endDate: 'Oct 2023', description: 'Created a responsive dashboard for students to track progress.' }
        ],
        internships: "UX Intern at DesignStudio (Spring 2024): Conducted usability testing for a fintech app.",
        eventsAndCertifications: "1. Google UX Design Certificate\n2. Best UI Award, Designathon 2023",
        certifications: "",
        yearsOfExperience: "0-1 Years",
        jobRoleTarget: "UI/UX Designer",
        company: "Airbnb / Design Agencies",
        whyThisRole: "I believe good design makes technology accessible and enjoyable for everyone.",
        interests: "Sketching, Photography, Psychology",
        projectLink: "", projectStartDate: "", projectEndDate: "", customCSS: "",
        school12th: "Ryan International (CBSE) - 96%",
        school10th: "Ryan International (CBSE) - 98%"
    }
];

const STEPS = [
    { id: 1, title: 'Identity', icon: '👤', description: "Let's start with the basics." },
    { id: 2, title: 'Education', icon: '🎓', description: "Academic background." },
    { id: 3, title: 'Portfolio', icon: '🚀', description: "Showcase your work." },
    { id: 4, title: 'Skills', icon: '⚡', description: "Your technical arsenal." },
    { id: 5, title: 'Dream Job', icon: '🎯', description: "Role & Company Strategy." },
];

const STORAGE_KEY_DATA = 'jobHero_formData_v3';
const STORAGE_KEY_STEP = 'jobHero_currentStep_v3';

const parseDate = (str: string) => {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    if (['present', 'ongoing', 'current', 'now', 'today'].some(k => s.includes(k))) return new Date();
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STEP);
    const step = saved ? parseInt(saved, 10) : 1;
    return Math.min(step, STEPS.length);
  });

  const [formData, setFormData] = useState<UserInput>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) return JSON.parse(saved);
    return {
        fullName: '', email: '', phone: '', linkedinGithub: '', careerObjective: '',
        education: '', school12th: '', school10th: '',
        skills: '', projects: '', projectsList: [], internships: '', eventsAndCertifications: '', yearsOfExperience: '', certifications: '',
        jobRoleTarget: '', company: '', whyThisRole: '', interests: '', currentYear: '',
        projectLink: '', projectStartDate: '', projectEndDate: '', customCSS: ''
    };
  });

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNum, setPhoneNum] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Company Insights State
  const [companyInsights, setCompanyInsights] = useState<{ text: string, sources: string[] } | null>(null);
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(formData));
    localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
  }, [formData, currentStep]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg(null);
  };

  const handlePhoneChange = (num: string) => {
      setPhoneNum(num);
      setFormData(prev => ({ ...prev, phone: `${countryCode} ${num}`.trim() }));
  };

  const handleProjectChange = (id: string, field: keyof ProjectDetails, value: string) => {
      setFormData(prev => ({
          ...prev,
          projectsList: prev.projectsList.map(p => p.id === id ? { ...p, [field]: value } : p)
      }));
      setErrorMsg(null);
  };

  const addProject = () => {
      setFormData(prev => ({
          ...prev,
          projectsList: [...prev.projectsList, { id: Date.now().toString(), name: '', link: '', startDate: '', endDate: '', description: '' }]
      }));
  };

  const removeProject = (id: string) => {
      setFormData(prev => ({
          ...prev,
          projectsList: prev.projectsList.filter(p => p.id !== id)
      }));
  };

  const validateDates = (): boolean => {
      for (const p of formData.projectsList) {
          if (p.startDate && p.endDate) {
              const start = parseDate(p.startDate);
              const end = parseDate(p.endDate);
              if (start && end && end < start) {
                  setErrorMsg(`Date Error in "${p.name || 'Project'}": End date cannot be earlier than start date.`);
                  return false;
              }
          }
      }
      return true;
  };

  // Central Validation Function
  const validateStep = (step: number): boolean => {
      setErrorMsg(null);
      const req: (keyof UserInput)[] = [];
      
      if (step === 1) req.push('fullName', 'email', 'careerObjective');
      if (step === 2) req.push('education', 'currentYear');
      if (step === 4) req.push('skills');
      if (step === 5) req.push('jobRoleTarget', 'company', 'whyThisRole', 'interests');

      const missing = req.find(f => !formData[f] || (typeof formData[f] === 'string' && formData[f].trim() === ''));
      if (missing) { 
          setErrorMsg(`Required Field Missing: ${missing.replace(/([A-Z])/g, ' $1')}`); 
          return false; 
      }

      if (step === 3 && !validateDates()) return false;
      
      return true;
  };

  const handleNext = () => {
      if (validateStep(currentStep)) {
          setCurrentStep(p => Math.min(p + 1, STEPS.length));
          // Scroll to top of the form container instead of window
          const formContainer = document.querySelector('.bg-white.dark\\:bg-slate-900');
          if (formContainer) {
              formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }
      }
  };

  const handleBack = () => {
      setErrorMsg(null);
      setCurrentStep(p => Math.max(p - 1, 1));
      // Scroll to top on back as well
      const formContainer = document.querySelector('.bg-white.dark\\:bg-slate-900');
      if (formContainer) {
          formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      // CRITICAL FIX: Prevent premature submission on intermediate steps
      if (currentStep < STEPS.length) {
          handleNext();
          return;
      }
      // Validate the final step before submitting
      if (!validateStep(currentStep)) return;
      if (!isLoading) onSubmit(formData); 
  };
  
  const handleMagicFill = () => { 
      // Randomly select a profile from MOCK_PROFILES
      const randomIndex = Math.floor(Math.random() * MOCK_PROFILES.length);
      const mock = MOCK_PROFILES[randomIndex];
      
      setFormData(mock);
      // Extract phone number if it exists in the mock data, otherwise use default
      const mockPhone = mock.phone.split(' ')[1] || "9876543210";
      setPhoneNum(mockPhone);
      
      setErrorMsg(null);
      
      // Optional: Visual feedback for magic fill
      const btn = document.activeElement as HTMLElement;
      if(btn) {
          const originalText = btn.innerText;
          btn.innerText = "✨ Filled!";
          setTimeout(() => btn.innerText = originalText, 1000);
      }
  };

  const handleClear = (e: React.MouseEvent) => { 
      e.preventDefault();
      if(confirm("Start Fresh? This will permanently delete all entered data and reset the application.")) { 
          localStorage.removeItem(STORAGE_KEY_DATA);
          localStorage.removeItem(STORAGE_KEY_STEP);
          
          // Reset state to ensure clean slate before reload
          setFormData({
              fullName: '', email: '', phone: '', linkedinGithub: '', careerObjective: '',
              education: '', school12th: '', school10th: '', previousDegree: '', previousDegreeScore: '',
              skills: '', projects: '', projectsList: [], internships: '', eventsAndCertifications: '', otherInfo: '', yearsOfExperience: '', certifications: '',
              jobRoleTarget: '', company: '', whyThisRole: '', interests: '', currentYear: '',
              projectLink: '', projectStartDate: '', projectEndDate: '', customCSS: ''
          });
          setCurrentStep(1);
          
          window.location.reload();
      } 
  };

  const handleImport = async () => {
      if (!importText.trim()) return;
      setIsImporting(true);
      try {
          const parsedData = await parseProfileData(importText);
          setFormData(prev => ({ ...prev, ...parsedData }));
          setShowImportModal(false);
          setImportText('');
      } catch (e) { alert("Parsing failed. Paste raw text clearly."); }
      finally { setIsImporting(false); }
  };

  const handleFetchInsights = async () => {
    if (!formData.company) return;
    setIsFetchingInsights(true);
    try {
        const data = await fetchCompanyInsights(formData.company);
        setCompanyInsights(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsFetchingInsights(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-4xl mx-auto overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-500 relative">
      
      {showImportModal && (
          <div className="absolute inset-0 z-[70] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
                  <button onClick={() => setShowImportModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Magic Auto-fill</h3>
                  <p className="text-sm text-slate-500 mb-6">Paste your resume or LinkedIn text. AI will sync it to the form.</p>
                  <textarea className="w-full h-64 p-5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-mono mb-6 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none" placeholder="Paste raw text here..." value={importText} onChange={(e) => setImportText(e.target.value)} />
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setShowImportModal(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                      <button onClick={handleImport} disabled={isImporting || !importText.trim()} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20">{isImporting ? 'Parsing...' : 'Sync Profile'}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Progress Line */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
      </div>

      <div className="p-8 sm:p-12 relative">
        <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-5">
                <div className="text-5xl animate-in zoom-in duration-500">{STEPS[currentStep - 1].icon}</div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{STEPS[currentStep - 1].title}</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">{STEPS[currentStep - 1].description}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <button onClick={() => setShowImportModal(true)} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 shadow-lg">📥 Import Profile</button>
                <div className="flex gap-2">
                    <button type="button" onClick={handleMagicFill} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline">✨ Magic Fill</button>
                    <button type="button" onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Reset Form">
                        <span>🗑️</span> Clear
                    </button>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Step {currentStep} of {STEPS.length}</div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 min-h-[340px]">
          {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-xl text-sm font-bold border border-red-100 dark:border-red-800/50 animate-in fade-in slide-in-from-top-2">
                  ⚠️ {errorMsg}
              </div>
          )}

          {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputField id="fullName" label="Full Name" placeholder="e.g., Ananya Sharma" value={formData.fullName} onChange={handleChange} required autoFocus />
                      <InputField id="email" label="Email" placeholder="e.g., ananya@example.com" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number *</label>
                      <div className="flex gap-2">
                          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-28 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 text-sm font-bold shadow-sm">
                              {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.country} {c.code}</option>)}
                          </select>
                          <input type="tel" value={phoneNum} onChange={e => handlePhoneChange(e.target.value)} className="flex-1 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 text-sm font-medium shadow-sm" placeholder="98765 43210" required />
                      </div>
                  </div>
                  <TextareaField 
                      id="linkedinGithub" 
                      label="Professional Links (LinkedIn / GitHub / Portfolio)" 
                      placeholder="https://linkedin.com/in/you&#10;https://github.com/you&#10;Portfolio URL" 
                      value={formData.linkedinGithub} 
                      onChange={handleChange} 
                      rows={2}
                      helpText="Enter multiple links separated by new lines."
                  />
                  <TextareaField id="careerObjective" label="Career Objective / Bio *" placeholder="Who are you? (e.g., '3rd year student passionate about AI')" value={formData.careerObjective} onChange={handleChange} rows={2} required helpText="Keep it punchy. We'll polish it." />
              </div>
          )}

          {currentStep === 2 && (
              <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputField id="education" label="Degree / College *" placeholder="e.g., B.Tech CSE, IIT Delhi" value={formData.education} onChange={handleChange} required autoFocus />
                      <InputField id="currentYear" label="Current Year / Status *" placeholder="e.g., 2nd Year, 2025 Grad" value={formData.currentYear} onChange={handleChange} required />
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Advanced Education (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                          <InputField id="previousDegree" label="Previous Degree / Masters / PhD" placeholder="e.g., M.Tech, B.Sc, Diploma" value={formData.previousDegree || ''} onChange={handleChange} />
                          <InputField id="previousDegreeScore" label="Year & Score" placeholder="e.g., 2023 - 8.5 CGPA" value={formData.previousDegreeScore || ''} onChange={handleChange} />
                      </div>
                      
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Schooling (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <InputField id="school12th" label="Class 12th / Diploma" placeholder="e.g., DPS R.K. Puram (CBSE) - 92%" value={formData.school12th} onChange={handleChange} />
                          <InputField id="school10th" label="Class 10th" placeholder="e.g., St. Mary's School (ICSE) - 95%" value={formData.school10th} onChange={handleChange} />
                      </div>
                  </div>
              </div>
          )}

          {currentStep === 3 && (
              <div className="space-y-8">
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Key Projects</label>
                          <button type="button" onClick={addProject} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors">+ Add Project Tile</button>
                      </div>
                      {formData.projectsList.length === 0 && (
                          <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                              <p className="text-sm text-slate-400 mb-4">No projects added yet.</p>
                              <button type="button" onClick={addProject} className="text-sm font-bold text-white bg-slate-900 dark:bg-slate-700 px-4 py-2 rounded-lg">Add Your First Project</button>
                          </div>
                      )}
                      <div className="grid grid-cols-1 gap-4">
                          {formData.projectsList.map((project, index) => (
                              <ProjectTile key={project.id} project={project} index={index} onChange={handleProjectChange} onRemove={removeProject} />
                          ))}
                      </div>
                  </div>
                  <TextareaField id="internships" label="Experience / Internships" placeholder="Role, Company, Achievements..." value={formData.internships} onChange={handleChange} rows={3} helpText="Academic projects count too!" />
                  <TextareaField id="eventsAndCertifications" label="Events & Certifications" placeholder="e.g., Hackathon Winner 2024, AWS Certified, Volunteer Lead..." value={formData.eventsAndCertifications} onChange={handleChange} rows={3} />
                  
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Additional Information (Optional)</h3>
                      <TextareaField id="otherInfo" label="Other Achievements / Hobbies / Volunteer Work" placeholder="Anything else you'd like to add? e.g. Languages known, Volunteer experience, etc." value={formData.otherInfo || ''} onChange={handleChange} rows={2} />
                  </div>
              </div>
          )}

          {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">⚡ Technical Skills</h3>
                     <TagInput 
                        id="skills" 
                        label="Your Skills Arsenal *" 
                        placeholder="Type skill & hit Enter (e.g. React, Python)" 
                        value={formData.skills} 
                        onChange={handleChange} 
                        helpText="List languages, frameworks, and tools. We'll categorize them automatically." 
                        autoFocus 
                     />
                  </div>
              </div>
          )}

          {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 bg-blue-50/20 dark:bg-blue-900/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/40">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">🎯 Dream Job & Strategy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <InputField id="jobRoleTarget" label="Target Job Role *" placeholder="e.g., SDE, Frontend II" value={formData.jobRoleTarget} onChange={handleChange} required autoFocus />
                      <InputField 
                        id="company" 
                        label="Dream Company *" 
                        placeholder="e.g., Google, Tesla" 
                        value={formData.company} 
                        onChange={handleChange} 
                        required 
                        rightElement={
                            <button 
                                type="button" 
                                onClick={handleFetchInsights}
                                disabled={isFetchingInsights || !formData.company}
                                className="p-1.5 text-xs font-bold bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors shadow-sm"
                                title="Analyze Company"
                            >
                                {isFetchingInsights ? '⏳' : '🔍 Info'}
                            </button>
                        }
                      />
                  </div>
                  
                  {companyInsights && (
                    <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm animate-in fade-in slide-in-from-top-2 relative">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">🏢 Corporate Intelligence</h4>
                            <button onClick={() => setCompanyInsights(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {companyInsights.text}
                        </div>
                        {companyInsights.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Sources:</span>
                                {companyInsights.sources.slice(0, 3).map((src, i) => (
                                    <a key={i} href={src} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline truncate max-w-[150px]">{new URL(src).hostname}</a>
                                ))}
                            </div>
                        )}
                    </div>
                  )}
                  
                  <TextareaField id="whyThisRole" label="Motivation & Culture Fit *" placeholder="Why this specific company and role?" value={formData.whyThisRole} onChange={handleChange} rows={3} required helpText="This helps us tailor behavioral interview questions." />
                  <div className="mt-6">
                    <TagInput 
                        id="interests" 
                        label="Cultural Interests *" 
                        placeholder="Type interest & hit Enter (e.g. AI, Gaming)" 
                        value={formData.interests} 
                        onChange={handleChange} 
                        helpText="Hobbies and interests help with culture fit questions."
                    />
                  </div>
              </div>
          )}

          <div className="flex justify-between items-center pt-8 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={handleBack} disabled={currentStep === 1} className={`px-8 py-3 text-sm font-black uppercase tracking-widest transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Back</button>
                <div className="flex gap-4">
                    {currentStep < STEPS.length ? (
                        <button type="button" onClick={handleNext} className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Next Step</button>
                    ) : (
                        <button type="submit" className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">Generate Toolkit <ArrowRightIcon className="w-5 h-5" /></button>
                    )}
                </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputForm;