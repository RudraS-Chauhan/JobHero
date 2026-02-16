import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis } from '../types';

// Shared Schema Definitions
const roadmapSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
        phase: { type: Type.STRING },
        duration: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        milestones: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-4 highly specific, actionable tasks to complete this phase (e.g., 'Build a JWT Auth System', not just 'Learn Auth')."
        },
        resources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Specific book title, course name, or tool." },
                    type: { type: Type.STRING, enum: ["Course", "Book", "Tool"] }
                }
            }
        }
    }
  }
};

const coreResponseSchema = {
  type: Type.OBJECT,
  properties: {
    resume: { type: Type.STRING, description: "A clean, ATS-friendly resume markdown text." },
    coverLetter: { type: Type.STRING, description: "A formal cover letter with placeholders." },
    linkedin: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        alternativeHeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
        bio: { type: Type.STRING },
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
    recruiterPsychology: { type: Type.STRING, description: "Psychological analysis of the candidate's perception." },
    salaryNegotiation: { type: Type.STRING, description: "Tailored negotiation script." },
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
                title: { type: Type.STRING, description: "Course name." },
                provider: { type: Type.STRING, description: "Platform name (e.g. Coursera, Udemy)." },
                reason: { type: Type.STRING, description: "Why this bridges their specific skill gap." }
            }
        }
    }
  }
};

const internshipSchema = {
  type: Type.OBJECT,
  properties: {
    searchQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
    platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
    strategy: { type: Type.STRING }
  }
};

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

const profileImportSchema = {
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

const generateWithFallback = async (primaryModel: string, fallbackModel: string, contents: string, config: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: contents,
            config: config,
        });
        return response;
    } catch (error: any) {
        const isRetryable = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('Quota');
        if (isRetryable && fallbackModel) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await ai.models.generateContent({
                model: fallbackModel,
                contents: contents,
                config: { ...config, thinkingConfig: undefined },
            });
        }
        throw error;
    }
};

export const parseProfileData = async (text: string): Promise<Partial<UserInput>> => {
    const config = { responseMimeType: "application/json", responseSchema: profileImportSchema, systemInstruction: "Extract career profile info into JSON.", temperature: 0.1 };
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", text, config);
    return JSON.parse(extractJson(response.text || "{}"));
};

export const generateJobToolkit = async (data: UserInput): Promise<JobToolkit> => {
  const systemInstruction = `You are "JobHero AI", an elite Hiring Manager. Create a professional toolkit. Return JSON. Resume: Use headers on NEW LINES. Roadmap: Gap analysis. Mock Interview: 10 diverse questions. Tone: Professional and bespoke.`;
  const userContent = `Name: ${data.fullName} | Role: ${data.jobRoleTarget} | Skills: ${data.skills} | Projects: ${data.projects} | Exp: ${data.internships} | Current Year: ${data.currentYear}`;
  const config = { responseMimeType: "application/json", responseSchema: coreResponseSchema, temperature: 0.4, systemInstruction };
  const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
  return JSON.parse(extractJson(response.text || "{}")) as JobToolkit;
};

export const generateTargetedResume = async (data: UserInput, targetRole: string): Promise<string> => {
  const systemInstruction = `Expert resume writer. Rewrite for: "${targetRole}". Return ONLY clean text. Headers on new lines. Bullet points: ➤.`;
  const userContent = `Target: ${targetRole}. Bio: ${data.careerObjective}. Skills: ${data.skills}. Exp: ${data.internships}. Projects: ${data.projects}`;
  const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, { temperature: 0.4, systemInstruction });
  return response.text || "";
};

export const regenerateLinkedInBio = async (currentBio: string, tone: string): Promise<string> => {
    const systemInstruction = `Rewrite LinkedIn Bio to tone: "${tone}". Output ONLY the text.`;
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", currentBio, { temperature: 0.7, systemInstruction });
    return response.text || "";
};

export const generateEliteTools = async (data: UserInput): Promise<Partial<JobToolkit>> => {
    const systemInstruction = `
      You are "JobHero AI Elite Strategy Engine". 
      Generate a bespoke career advancement kit.
      
      CRITICAL: Analyze the user's current skills (${data.skills}) and education (${data.education}) 
      against their target role of "${data.jobRoleTarget}" at "${data.company}".
      
      1. Identify 3 high-impact skills they are missing for a top-tier role.
      2. Suggest 3 specific, recognized courses or certifications (e.g., AWS Certified Developer, Meta React Professional, etc.) 
         that would bridge this gap. Include provider (Coursera, Udemy, etc.) and a compelling reason why.
      3. Generate deep Recruiter Psychology analysis.
      4. Create salary negotiation scripts and high-conversion networking emails.
      
      Return JSON matching the eliteResponseSchema.
    `;
    const userContent = `User: ${data.fullName}. Targeting: ${data.jobRoleTarget} at ${data.company}. Skills: ${data.skills}. Exp: ${data.internships}. Year: ${data.currentYear}`;
    const config = { responseMimeType: "application/json", responseSchema: eliteResponseSchema, temperature: 0.4, systemInstruction };
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
    return JSON.parse(extractJson(response.text || "{}"));
};

export const generateInternshipFinder = async (data: UserInput, resumeText: string): Promise<JobToolkit['internshipHunter']> => {
    const systemInstruction = `Expert Career Hacker. Generate Universal Search strategy for ${data.currentYear} students seeking ${data.jobRoleTarget} roles. Return JSON with 5 boolean queries, platforms, and 1 high-impact hack.`;
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", `Resume: ${resumeText}`, { responseMimeType: "application/json", responseSchema: internshipSchema, temperature: 0.5, systemInstruction });
    return JSON.parse(extractJson(response.text || "{}"));
};

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinkingModel: boolean = false): Promise<JobToolkit['careerRoadmap']> => {
  const model = useThinkingModel ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  const config: any = { responseMimeType: "application/json", responseSchema: roadmapSchema, systemInstruction: `Expert Coach. Create detailed roadmap to become "${newRole}". Return JSON Array.` };
  if (useThinkingModel) config.thinkingConfig = { thinkingBudget: 8000 };
  const response = await generateWithFallback(model, "gemini-3-flash-preview", `Target: ${newRole}. Current Skills: ${data.skills}`, config);
  return JSON.parse(extractJson(response.text || "[]"));
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
  const config = { responseMimeType: "application/json", responseSchema: analysisSchema, systemInstruction: `ATS Algorithm. Analyze for "${jobRole}". Return JSON.`, temperature: 0.1 };
  const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", resumeText, config);
  return JSON.parse(extractJson(response.text || "{}")) as ResumeAnalysis;
};

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string): Promise<string> => {
  const systemInstruction = `Strict Interview Coach. Evaluate answer for "${role}". Format: Rating, Analysis, Improvement.`;
  const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", `Q: ${question} A: ${answer}`, { temperature: 0.2, systemInstruction });
  return response.text || "Could not generate feedback.";
};