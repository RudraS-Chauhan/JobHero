
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
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  title: string;
  description: string;
  tools: string[];
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
  // Elite / Premium Tools
  recruiterPsychology?: string;
  salaryNegotiation?: string;
  coldEmail?: string; // Founder/General
  hrEmail?: string;
  linkedinPitch?: string;
  followUpEmail?: string;
  referralEmail?: string;
  internshipHunter?: InternshipHunter;
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