
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
  jobRoleTarget: string;
  company: string;
  whyThisRole: string;
  interests: string;
  currentYear: string;
}

export interface JobToolkit {
  resume: string;
  coverLetter: string;
  linkedin: {
    headline: string;
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
  careerRoadmap: {
    learning: string;
    projects: string;
    internships: string;
    networking: string;
    milestones: string;
  };
}

export interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  jobFitPrediction: string;
}
