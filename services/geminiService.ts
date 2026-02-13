import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis } from '../types';

// Core Schema: Essential tools for immediate display
const coreResponseSchema = {
  type: Type.OBJECT,
  properties: {
    resume: { type: Type.STRING, description: "A clean, ATS-friendly, one-page resume text." },
    coverLetter: { type: Type.STRING, description: "A formal 3-paragraph business cover letter with header." },
    linkedin: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "A professional, high-impact LinkedIn headline." },
        alternativeHeadlines: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "5 alternative, keyword-optimized headlines." 
        },
        bio: { type: Type.STRING, description: "A compelling 'About Me' narrative (150-200 words)." },
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
    careerRoadmap: {
      type: Type.ARRAY,
      description: "A chronological career progression plan.",
      items: {
        type: Type.OBJECT,
        properties: {
            phase: { type: Type.STRING },
            duration: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
  },
};

// Elite Schema: Advanced strategies generated on demand
const eliteResponseSchema = {
  type: Type.OBJECT,
  properties: {
    coldEmail: { type: Type.STRING, description: "A short, punchy cold email to a recruiter/founder." },
    salaryNegotiation: { type: Type.STRING, description: "A professional script to negotiate salary." },
    recruiterPsychology: { type: Type.STRING, description: "Deep psychological analysis of the profile." },
    internshipHunter: {
        type: Type.OBJECT,
        properties: {
            searchQueries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 boolean search strings." },
            platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategy: { type: Type.STRING, description: "One actionable 'Hack'." }
        }
    }
  }
};

const roadmapSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
        phase: { type: Type.STRING },
        duration: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  }
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "ATS Score 0-100." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    jobFitPrediction: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
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
     if (arrayStart !== -1 && arrayEnd !== -1) {
         return text.substring(arrayStart, arrayEnd + 1);
     }
  }

  if (startIndex === -1 || endIndex === -1) {
    console.warn("JSON Extraction Failed. Raw Text:", text);
    throw new Error("Response did not contain valid JSON.");
  }
  return text.substring(startIndex, endIndex + 1);
};

const getApiKey = (): string | undefined => {
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
    }
  } catch (e) {}
  return undefined;
};

// Helper function to retry with a fallback model if the primary fails
const generateWithFallback = async (
    primaryModel: string, 
    fallbackModel: string, 
    contents: string, 
    config: any
) => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing API Key.");
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: contents,
            config: config,
        });
        return response;
    } catch (error: any) {
        console.warn(`Primary model ${primaryModel} failed.`, error.message);
        
        const isQuotaError = error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('503');

        if (isQuotaError && fallbackModel) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { thinkingConfig, ...fallbackConfig } = config;
            const response = await ai.models.generateContent({
                model: fallbackModel,
                contents: contents,
                config: fallbackConfig,
            });
            return response;
        }
        throw error;
    }
};

export const parseProfileData = async (text: string): Promise<Partial<UserInput>> => {
    const systemInstruction = `Extract career profile info into JSON. Return empty strings if missing.`;
    const config = { responseMimeType: "application/json", responseSchema: profileImportSchema, systemInstruction, temperature: 0.1 };

    try {
      const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", text, config);
      return JSON.parse(extractJson(response.text || "{}"));
    } catch (error) {
      throw new Error("Could not extract data.");
    }
};

export const generateJobToolkit = async (data: UserInput): Promise<JobToolkit> => {
  const systemInstruction = `
    You are "JobHero AI". Generate a professional career toolkit.
    
    **DATA INTEGRITY**: Use ONLY provided details. No hallucinations.
    
    **OUTPUTS**:
    1. **Resume**: Professional headers, bullet points (➤). Omit empty sections.
    2. **Cover Letter**: 3-paragraph business format.
    3. **LinkedIn**: Viral headline + 5 alternatives + Bio.
    4. **Mock Interview**: 3 Q&A pairs + Intro/Outro.
    5. **Career Roadmap**: 4-6 step chronological plan to master the role.

    Return JSON matching the schema.
  `;

  const userContent = `
    Name: ${data.fullName} | Role: ${data.jobRoleTarget} | Company: ${data.company}
    Skills: ${data.skills} | Exp: ${data.internships} | YOE: ${data.yearsOfExperience}
    Projects: ${data.projects} | Edu: ${data.education} | Bio: ${data.careerObjective}
    Certs: ${data.certifications}
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: coreResponseSchema,
    temperature: 0.3,
    systemInstruction: systemInstruction,
  };
  
  try {
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
    return JSON.parse(extractJson(response.text || "{}")) as JobToolkit;
  } catch (error: any) {
    throw new Error("AI Generation failed: " + error.message);
  }
};

export const generateEliteTools = async (data: UserInput): Promise<Partial<JobToolkit>> => {
    const systemInstruction = `
      You are "JobHero AI Elite". Generate advanced career strategies.
      
      **OUTPUTS**:
      1. **Cold Email**: Subject + Body for a recruiter.
      2. **Salary Negotiation**: Professional script.
      3. **Recruiter Psychology**: Deep analysis of the profile's perception.
      4. **Internship Hunter**: Search strings, platforms, and hacks.
      
      Return JSON.
    `;
  
    const userContent = `Role: ${data.jobRoleTarget}. Skills: ${data.skills}. Bio: ${data.careerObjective}`;
  
    const config = {
      responseMimeType: "application/json",
      responseSchema: eliteResponseSchema,
      temperature: 0.4,
      systemInstruction: systemInstruction,
    };
    
    try {
      const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
      return JSON.parse(extractJson(response.text || "{}"));
    } catch (error: any) {
      throw new Error("Elite Tools generation failed: " + error.message);
    }
  };

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinkingModel: boolean = false): Promise<JobToolkit['careerRoadmap']> => {
  const primaryModel = useThinkingModel ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  
  const systemInstruction = `
    Create a step-by-step career roadmap to become a "${newRole}" in 2025.
    Return a JSON array of steps (Phase, Duration, Title, Description, Tools).
  `;

  const userContent = `Current Skills: ${data.skills}. Target: ${newRole}`;

  const config: any = {
      responseMimeType: "application/json",
      responseSchema: roadmapSchema,
      systemInstruction: systemInstruction,
  };

  if (useThinkingModel) config.thinkingConfig = { thinkingBudget: 16000 }; 

  try {
    const response = await generateWithFallback(primaryModel, "gemini-3-flash-preview", userContent, config);
    const jsonText = extractJson(response.text || "[]");
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error("Failed to regenerate roadmap.");
  }
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
  const systemInstruction = `
    Act as an ATS algorithm. Analyze the resume for: "${jobRole}".
    Return JSON: score (0-100), strengths (array), improvements (array), missingKeywords (array), jobFitPrediction (High/Med/Low).
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: analysisSchema,
    systemInstruction: systemInstruction,
    temperature: 0.1,
  };

  try {
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-3-flash-preview", resumeText, config);
    return JSON.parse(extractJson(response.text || "{}")) as ResumeAnalysis;
  } catch (error) {
    throw new Error("Resume analysis failed.");
  }
};
