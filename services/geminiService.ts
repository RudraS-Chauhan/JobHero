import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis } from '../types';

const roadmapSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
        phase: { type: Type.STRING },
        duration: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        depthLevel: { type: Type.STRING, enum: ['Foundational', 'Intermediate', 'Elite'] },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        milestones: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-4 industry-standard milestones."
        },
        weeklyBreakdown: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A week-by-week actionable plan for this phase."
        },
        resources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["Course", "Book", "Tool"] }
                }
            }
        }
    },
    required: ["phase", "title", "description", "depthLevel", "milestones", "weeklyBreakdown"]
  }
};

const coreResponseSchema = {
  type: Type.OBJECT,
  properties: {
    resume: { type: Type.STRING },
    coverLetter: { type: Type.STRING },
    linkedin: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        alternativeHeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
        bio: { type: Type.STRING },
        structuredBio: {
            type: Type.OBJECT,
            properties: {
                hook: { type: Type.STRING, description: "Professional attention-grabbing opening." },
                expertise: { type: Type.STRING, description: "Core skills and specialized domain knowledge." },
                impact: { type: Type.STRING, description: "Quantifiable achievements and unique value." },
                cta: { type: Type.STRING, description: "Professional invitation to connect." }
            }
        }
      },
    },
    mockInterview: {
      type: Type.OBJECT,
      properties: {
        intro: { type: Type.STRING },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              feedback: { type: Type.STRING },
            },
          },
        },
        outro: { type: Type.STRING },
      },
    },
    careerRoadmap: roadmapSchema,
  },
};

const eliteResponseSchema = {
  type: Type.OBJECT,
  properties: {
    recruiterPsychology: { type: Type.STRING },
    salaryNegotiation: { type: Type.STRING },
    coldEmail: { type: Type.STRING },
    hrEmail: { type: Type.STRING },
    linkedinPitch: { type: Type.STRING },
    followUpEmail: { type: Type.STRING },
    referralEmail: { type: Type.STRING },
    suggestedCourses: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                provider: { type: Type.STRING },
                reason: { type: Type.STRING }
            }
        }
    }
  }
};

const extractJson = (text: string): string => {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1) {
     const arrayStart = text.indexOf('[');
     const arrayEnd = text.lastIndexOf(']');
     if (arrayStart !== -1 && arrayEnd !== -1) return text.substring(arrayStart, arrayEnd + 1);
  }
  if (startIndex === -1 || endIndex === -1) throw new Error("Response did not contain valid JSON.");
  return text.substring(startIndex, endIndex + 1);
};

const generateWithFallback = async (primaryModel: string, contents: any, config: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.models.generateContent({
        model: primaryModel,
        contents: contents,
        config: config,
    });
};

export const parseProfileData = async (text: string): Promise<Partial<UserInput>> => {
    const profileSchema = {
        type: Type.OBJECT,
        properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            linkedinGithub: { type: Type.STRING },
            careerObjective: { type: Type.STRING },
            education: { type: Type.STRING },
            skills: { type: Type.STRING },
            projects: { type: Type.STRING },
            internships: { type: Type.STRING },
            certifications: { type: Type.STRING },
            interests: { type: Type.STRING },
            currentYear: { type: Type.STRING },
        }
    };
    
    const config = { 
        responseMimeType: "application/json", 
        responseSchema: profileSchema, 
        systemInstruction: "You are an expert recruitment assistant. Extract candidate profile details from the provided raw text and return them as structured JSON.", 
        temperature: 0.1 
    };
    
    const response = await generateWithFallback("gemini-3-flash-preview", text, config);
    return JSON.parse(extractJson(response.text || "{}"));
};

export const generateJobToolkit = async (data: UserInput): Promise<JobToolkit> => {
  const systemInstruction = `
    You are "JobHero AI", an Elite Career Architect. 
    Create a high-impact toolkit for a ${data.currentYear} student targeting ${data.jobRoleTarget} at ${data.company}.
    
    ROLE-DEPENDENT PERSONALIZATION RULES:
    1. ANALYZE BASELINE: Review the user's CURRENT SKILLS (${data.skills}) and EXPERIENCE (${data.internships}).
    2. THE ROADMAP MUST BE UNIQUE:
       - DO NOT suggest learning tools they already list as skills.
       - Focus the roadmap on bridging the EXACT gap between their current level and the target role "${data.jobRoleTarget}".
       - If they are a fresher, emphasize projects and certifications.
       - If they have experience, focus on leadership, scale, and high-friction industry problems.
    3. THE RESUME & COVER LETTER: Must use terminology specific to "${data.jobRoleTarget}".
    
    Return pure JSON matching the coreResponseSchema.
  `;
  const userContent = `Candidate: ${data.fullName} | Goal: ${data.jobRoleTarget} | Skills: ${data.skills} | Experience: ${data.internships} | Projects: ${data.projects}`;
  const config = { responseMimeType: "application/json", responseSchema: coreResponseSchema, temperature: 0.3, systemInstruction };
  const response = await generateWithFallback("gemini-3-flash-preview", userContent, config);
  return JSON.parse(extractJson(response.text || "{}")) as JobToolkit;
};

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinkingModel: boolean = false): Promise<JobToolkit['careerRoadmap']> => {
  const model = useThinkingModel ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  const systemInstruction = `
    Expert Executive Coach. Create a PRECISE, DEEP career roadmap to pivot/excel as a "${newRole}".
    CONSIDER USER'S BASELINE: ${data.skills}. 
    Don't suggest learning what they already know. Focus on high-ROI activities like Open Source in "${newRole}" domain, high-friction certifications, and deep-tech portfolio building.
    Each phase MUST have a 'weeklyBreakdown' that is specific to the role "${newRole}".
  `;
  const config: any = { responseMimeType: "application/json", responseSchema: roadmapSchema, systemInstruction, temperature: 0.4 };
  if (useThinkingModel) config.thinkingConfig = { thinkingBudget: 12000 };
  const response = await generateWithFallback(model, `Target Role: ${newRole}. Profile Context: ${data.skills} | Experience: ${data.internships}`, config);
  return JSON.parse(extractJson(response.text || "[]"));
};

export const generateEliteTools = async (data: UserInput): Promise<Partial<JobToolkit>> => {
    const systemInstruction = "Generate Elite networking kit, Recruiter Psychology report, and course bridges. Return JSON.";
    const config = { responseMimeType: "application/json", responseSchema: eliteResponseSchema, temperature: 0.5, systemInstruction };
    const response = await generateWithFallback("gemini-3-flash-preview", `Profile: ${data.skills} | Target: ${data.jobRoleTarget}`, config);
    return JSON.parse(extractJson(response.text || "{}"));
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        jobFitPrediction: { type: Type.STRING },
      },
    };
    const config = { responseMimeType: "application/json", responseSchema: analysisSchema, systemInstruction: `ATS Scan for ${jobRole}.`, temperature: 0.1 };
    const response = await generateWithFallback("gemini-3-flash-preview", resumeText, config);
    return JSON.parse(extractJson(response.text || "{}")) as ResumeAnalysis;
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string): Promise<string> => {
  const response = await generateWithFallback("gemini-3-flash-preview", `Q: ${question} A: ${answer}`, { temperature: 0.2, systemInstruction: `Interview feedback for ${role}.` });
  return response.text || "";
};

export const regenerateLinkedInBio = async (currentBio: string, tone: string): Promise<string> => {
    const response = await generateWithFallback("gemini-3-flash-preview", currentBio, { temperature: 0.7, systemInstruction: `Rewrite LinkedIn Bio to ${tone} tone.` });
    return response.text || "";
};

export const generateInternshipFinder = async (data: UserInput, resumeText: string): Promise<JobToolkit['internshipHunter']> => {
    const internshipSchema = {
      type: Type.OBJECT,
      properties: {
        searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
        platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
        strategy: { type: Type.STRING }
      }
    };
    const response = await generateWithFallback("gemini-3-flash-preview", `Resume: ${resumeText}`, { responseMimeType: "application/json", responseSchema: internshipSchema, systemInstruction: "Generate search queries for internships." });
    return JSON.parse(extractJson(response.text || "{}"));
};

export const generateTargetedResume = async (data: UserInput, targetRole: string): Promise<string> => {
    const response = await generateWithFallback("gemini-3-flash-preview", `Role: ${targetRole}. Profile: ${data.skills}`, { systemInstruction: "Rewrite resume for target role." });
    return response.text || "";
};
