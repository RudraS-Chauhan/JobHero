
export interface UserInput {
  fullName: string;
  email: string;
  phone: string;
  linkedinGithub: string;
  careerObjective: string;
  education: string;
  skills: string;
  projects: string;
  internships: string;
  certifications: string;
  yearsOfExperience: string;
  jobRoleTarget: string;
  company: string;
  whyThisRole: string;
  interests: string;
  currentYear: string;
  projectLink?: string;
  customCSS?: string;
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  title: string;
  description: string;
  tools: string[];
  milestones: string[];
  weeklyBreakdown?: string[];
  depthLevel: 'Foundational' | 'Intermediate' | 'Elite';
  resources: { title: string; type: 'Course' | 'Book' | 'Tool'; link?: string }[];
}

export interface InternshipHunter {
    searchQueries: string[];
    platforms: string[];
    strategy: string;
}

export interface JobToolkit {
  resume: string;
  coverLetter: string;
  linkedin: {
    headline: string;
    alternativeHeadlines: string[];
    bio: string;
    structuredBio?: {
        hook: string;
        expertise: string;
        impact: string;
        cta: string;
    };
  };
  mockInterview: {
    intro: string;
    questions: {
      question: string;
      feedback: string;
    }[];
    outro: string;
  };
  careerRoadmap: RoadmapStep[];
  recruiterPsychology?: string;
  salaryNegotiation?: string;
  coldEmail?: string;
  hrEmail?: string;
  linkedinPitch?: string;
  followUpEmail?: string;
  referralEmail?: string;
  internshipHunter?: InternshipHunter;
  suggestedCourses?: { title: string; provider: string; reason: string }[];
}

export interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  jobFitPrediction: string;
}

export interface ResumeVersion {
    id: string;
    role: string;
    content: string;
    timestamp: number;
}
