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

// Core Schema: Essential tools for immediate display
const coreResponseSchema = {
  type: Type.OBJECT,
  properties: {
    resume: { 
        type: Type.STRING, 
        description: "A clean, ATS-friendly, one-page resume text. CRITICAL: You MUST use standard Markdown Headers (e.g., '### EXPERIENCE') on their own new lines. Do NOT use inline headers or bullet points as separators. Ensure every section (Summary, Education, Skills, Experience, Projects) starts on a NEW LINE." 
    },
    coverLetter: { 
        type: Type.STRING, 
        description: "A formal 3-paragraph business cover letter with header. IMPORTANT: You MUST include '[Date]', '[Hiring Manager Name]', and '[Company Address]' in the header section as placeholders." 
    },
    linkedin: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "A professional, high-impact LinkedIn headline." },
        alternativeHeadlines: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "5 alternative, keyword-optimized headlines." 
        },
        bio: { type: Type.STRING, description: "A highly professional, executive-level 'About Me' narrative (150-200 words) focusing on value proposition and unique strengths." },
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
              feedback: { type: Type.STRING, description: "A brief guideline on what a strong answer should include." },
            },
          },
        },
        outro: { type: Type.STRING },
      },
    },
    careerRoadmap: roadmapSchema,
  },
};

// Elite Schema: Advanced strategies generated on demand
const eliteResponseSchema = {
  type: Type.OBJECT,
  properties: {
    recruiterPsychology: { type: Type.STRING, description: "Deep psychological analysis of the profile's perception." },
    salaryNegotiation: { type: Type.STRING, description: "A professional script to negotiate salary." },
    coldEmail: { type: Type.STRING, description: "A short, punchy cold email to a Founder/CEO." },
    hrEmail: { type: Type.STRING, description: "A formal yet engaging cold email specifically for HR/Recruiters." },
    linkedinPitch: { type: Type.STRING, description: "A short (under 300 chars) connection request message for LinkedIn." },
    followUpEmail: { type: Type.STRING, description: "A polite follow-up email after applying or no response." },
    referralEmail: { type: Type.STRING, description: "A template to ask a connection/alumni for a referral." },
    suggestedCourses: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                provider: { type: Type.STRING, description: "e.g. Coursera, Udemy, AWS" },
                reason: { type: Type.STRING, description: "Why this certification boosts this specific resume." }
            }
        }
    }
  }
};

const internshipSchema = {
  type: Type.OBJECT,
  properties: {
    searchQueries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 advanced boolean search strings for finding internships and hackathons on Google/LinkedIn." },
    platforms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 specific platforms or job boards." },
    strategy: { type: Type.STRING, description: "A unique, actionable 'Hack' or strategy to stand out." }
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
     // Try to find array bracket if object braces aren't found (for roadmap array response)
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

// Helper function to retry with a fallback model if the primary fails
const generateWithFallback = async (
    primaryModel: string, 
    fallbackModel: string, 
    contents: string, 
    config: any
) => {
    // According to guidelines, API key must be process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    You are "JobHero AI", a Senior Staff Engineer and Hiring Manager mentor.
    
    **GOAL**: Create a professional career toolkit that feels bespoke and non-generic.
    
    **CRITICAL GUIDELINES**:
    1. **Resume**: STRICTLY use standard Markdown Headers (e.g., '### EXPERIENCE') on their own new lines. Do NOT use inline headers or bullet points as separators. Ensure every section (Summary, Education, Skills, Experience, Projects) starts on a NEW LINE.
    2. **Roadmap**: Create a "Gap Analysis" flowchart. Compare the user's current skills (${data.skills}) with the requirements for the target role (${data.jobRoleTarget}). Define specific, logical phases to bridge this gap. Don't teach them what they already know.
    3. **Mock Interview**: Generate 10 diverse questions ranging from behavioral to advanced technical/system design concepts appropriate for the role.
    4. **Tone**: Authoritative, encouraging, and specific. Avoid robotic phrasing.

    Return JSON matching the schema.
  `;

  const userContent = `
    Name: ${data.fullName} | Role: ${data.jobRoleTarget} | Company: ${data.company}
    Skills: ${data.skills} | Exp: ${data.internships} | YOE: ${data.yearsOfExperience}
    Projects: ${data.projects} ${data.projectLink ? `| Project Link: ${data.projectLink}` : ''} 
    Edu: ${data.education} | Bio: ${data.careerObjective}
    Certs: ${data.certifications}
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: coreResponseSchema,
    temperature: 0.4,
    systemInstruction: systemInstruction,
  };
  
  try {
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
    return JSON.parse(extractJson(response.text || "{}")) as JobToolkit;
  } catch (error: any) {
    throw new Error(error.message || "AI Generation failed");
  }
};

export const generateTargetedResume = async (data: UserInput, targetRole: string): Promise<string> => {
  const systemInstruction = `
    You are an expert resume writer. Rewrite the resume specifically for the role: "${targetRole}".
    Focus on transferable skills and relevant projects from the user's background.
    **CRITICAL**: Output ONLY the resume text. Use standard headers on new lines: SUMMARY, EDUCATION, SKILLS, EXPERIENCE, PROJECTS, CERTIFICATIONS. Use "➤" for bullet points.
    Do NOT use inline headers. Each section must be on a new line.
    Do not include markdown code blocks or JSON. Just the clean text.
  `;

  const userContent = `
    Name: ${data.fullName}
    Original Role: ${data.jobRoleTarget}
    Target Role: ${targetRole}
    Skills: ${data.skills}
    Experience: ${data.internships}
    Projects: ${data.projects}
    Education: ${data.education}
    Bio: ${data.careerObjective}
  `;

  const config = {
      temperature: 0.4,
      systemInstruction: systemInstruction,
  };

  try {
      const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
      return response.text || "";
  } catch (error: any) {
      throw new Error("Failed to generate targeted resume: " + error.message);
  }
};

export const regenerateLinkedInBio = async (currentBio: string, tone: 'Professional' | 'Storyteller' | 'Executive'): Promise<string> => {
    const systemInstruction = `Rewrite the following LinkedIn Bio to match the tone: "${tone}".
    
    Tones:
    - **Professional**: Clean, standard, keyword-rich.
    - **Storyteller**: Engaging, narrative-driven, personal.
    - **Executive**: High-level, authoritative, focus on impact and leadership.
    
    Output ONLY the new bio text. No markdown formatting.`;

    const config = {
        temperature: 0.7,
        systemInstruction: systemInstruction,
    };

    try {
        const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", `Current Bio: ${currentBio}`, config);
        return response.text || "";
    } catch (error: any) {
        throw new Error("Failed to regenerate bio: " + error.message);
    }
};

export const generateEliteTools = async (data: UserInput): Promise<Partial<JobToolkit>> => {
    const systemInstruction = `
      You are "JobHero AI Elite". Generate a comprehensive suite of advanced career strategies and templates.
      
      **OUTPUTS**:
      1. **Recruiter Psychology**: Deep analysis of how a recruiter perceives this profile.
      2. **Salary Negotiation**: Professional script for negotiating salary.
      3. **Cold Email (Founder)**: Direct to decision maker.
      4. **HR Email**: Tailored for Talent Acquisition.
      5. **LinkedIn Pitch**: Short connection request (<300 chars).
      6. **Follow-Up Email**: Polite nudge after no response.
      7. **Referral Request**: Asking a contact for a referral.
      8. **Suggested Courses**: Recommend 3 high-impact certifications or courses to fill skill gaps.
      
      Return JSON matching the elite response schema.
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

export const generateInternshipFinder = async (data: UserInput, resumeText: string): Promise<JobToolkit['internshipHunter']> => {
    const systemInstruction = `
      You are an expert career hacker. Generate a search strategy for internships and hackathons.
      Analyze the candidate's resume and target role.
      
      Output:
      1. **Search Queries**: 5 advanced boolean search strings to find hidden opportunities on Google/LinkedIn.
      2. **Platforms**: 3-5 specific platforms (e.g., YC Work at a Startup, LinkedIn, Wellfound, Devpost).
      3. **Strategy**: A unique, unconventional "hack" to get an interview (e.g., "The Permissionless Project" strategy).
    `;

    const userContent = `
      Target Role: ${data.jobRoleTarget}
      Resume Summary: ${resumeText.substring(0, 1000)}...
      Skills: ${data.skills}
    `;

    const config = {
        responseMimeType: "application/json",
        responseSchema: internshipSchema,
        temperature: 0.5,
        systemInstruction: systemInstruction,
    };

    try {
        const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", userContent, config);
        return JSON.parse(extractJson(response.text || "{}"));
    } catch (error: any) {
        throw new Error("Internship Finder failed: " + error.message);
    }
};

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinkingModel: boolean = false): Promise<JobToolkit['careerRoadmap']> => {
  const primaryModel = useThinkingModel ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
  
  const target = newRole.trim() || data.jobRoleTarget;

  const systemInstruction = `
    You are an expert Technical Career Coach. Create a highly detailed, step-by-step career flowchart roadmap for the user to become a "${target}".
    
    **GAP ANALYSIS**:
    1. **Current State**: User currently has these skills: ${data.skills}.
    2. **Target State**: The role of "${target}" requires specific advanced skills they might lack.
    3. **The Bridge**: Create phases that specifically bridge this gap. **Do not** recommend basics if the user already lists them in skills. Focus on the delta.
    
    **FORMAT**:
    - **Phase**: e.g., "Month 1-2: Advanced React Patterns" (Be specific, not just "Learn React").
    - **Milestones**: 3-4 concrete tasks (e.g. "Deploy a serverless API", "Contribute to 1 Open Source repo").
    - **Resources**: specific, high-quality books/courses.
    
    Return a JSON ARRAY of step objects.
  `;

  const userContent = `Current Profile: ${data.education}, ${data.yearsOfExperience} YOE. Current Skills: ${data.skills}. Target: ${target}`;

  const config: any = {
      responseMimeType: "application/json",
      responseSchema: roadmapSchema,
      systemInstruction: systemInstruction,
  };

  if (useThinkingModel) config.thinkingConfig = { thinkingBudget: 16000 }; 

  try {
    const response = await generateWithFallback(primaryModel, "gemini-3-flash-preview", userContent, config);
    const jsonText = extractJson(response.text || "[]");
    const parsed = JSON.parse(jsonText);
    
    // Robust parsing: sometimes the model wraps the array in an object key like "careerRoadmap"
    if (!Array.isArray(parsed) && typeof parsed === 'object') {
        const values = Object.values(parsed);
        const arrayValue = values.find(v => Array.isArray(v));
        if (arrayValue) return arrayValue as JobToolkit['careerRoadmap'];
    }
    
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    throw new Error("Failed to regenerate roadmap: " + error.message);
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

export const evaluateInterviewAnswer = async (question: string, answer: string, role: string): Promise<string> => {
  const systemInstruction = `You are a strict but helpful interview coach. Analyze the candidate's answer for the role of "${role}".
  
  Question: "${question}"
  Candidate Answer: "${answer}"
  
  Provide feedback in this format:
  **Rating**: [1-5 Stars]
  **Analysis**: [2-3 sentences on clarity, conciseness, and impact]
  **Improvement**: [1 specific actionable tip]`;

  const config = {
      temperature: 0.2,
      systemInstruction: systemInstruction,
  };

  try {
      const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", `Evaluate this answer.`, config);
      return response.text || "Could not generate feedback.";
  } catch (error: any) {
      throw new Error("Feedback generation failed: " + error.message);
  }
};