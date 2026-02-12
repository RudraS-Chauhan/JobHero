import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, JobToolkit, ResumeAnalysis } from '../types';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    resume: { type: Type.STRING, description: "A clean, ATS-friendly, one-page resume text." },
    coverLetter: { type: Type.STRING, description: "A 150-200 word professional cover letter." },
    linkedin: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "A professional LinkedIn headline under 120 characters." },
        bio: { type: Type.STRING, description: "A LinkedIn 'About Me' bio under 250 words." },
      },
    },
    mockInterview: {
      type: Type.OBJECT,
      properties: {
        intro: { type: Type.STRING, description: "A greeting and explanation for the mock interview." },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              feedback: { type: Type.STRING, description: "Constructive feedback for a basic answer to the question." },
            },
          },
        },
        outro: { type: Type.STRING, description: "An overall score (1-10) and tips to improve, concluding the interview." },
      },
    },
    careerRoadmap: {
      type: Type.OBJECT,
      properties: {
        learning: { type: Type.STRING, description: "A checklist of courses and skills to master." },
        projects: { type: Type.STRING, description: "A checklist of projects to build." },
        internships: { type: Type.STRING, description: "A checklist of internship and freelancing tips." },
        networking: { type: Type.STRING, description: "A checklist for networking on LinkedIn and at events." },
        milestones: { type: Type.STRING, description: "A checklist for resume and interview milestones." },
      },
    },
  },
};

const roadmapSchema = {
  type: Type.OBJECT,
  properties: {
    learning: { type: Type.STRING, description: "A checklist of courses and skills to master." },
    projects: { type: Type.STRING, description: "A checklist of projects to build." },
    internships: { type: Type.STRING, description: "A checklist of internship and freelancing tips." },
    networking: { type: Type.STRING, description: "A checklist for networking on LinkedIn and at events." },
    milestones: { type: Type.STRING, description: "A checklist for resume and interview milestones." },
  },
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "A score out of 100 based on ATS best practices." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 things done well." },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 specific actionable improvements." },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 critical industry keywords missing from the resume for this role." },
    jobFitPrediction: { type: Type.STRING, description: "Prediction of job fit: 'High', 'Medium', or 'Low'." },
  },
};

const buildPrompt = (data: UserInput): string => {
  return `
    You are "JobHero AI", a professional career assistant.
    
    **CRITICAL RULE**: You must NOT hallucinate. You must NOT add any skills, tools, or experiences that are not explicitly listed in the USER DETAILS.
    
    --- USER DETAILS ---
    Full Name: ${data.fullName}
    Email: ${data.email}
    Phone: ${data.phone}
    LinkedIn/GitHub: ${data.linkedinGithub}
    Career Objective: ${data.careerObjective}
    Education: ${data.education}
    Skills: ${data.skills} (ONLY USE THESE. DO NOT ADD OTHERS.)
    Projects: ${data.projects}
    Internships: ${data.internships}
    Certifications: ${data.certifications}
    Job Role Target: ${data.jobRoleTarget}
    Company: ${data.company}
    Why this role: ${data.whyThisRole}
    Interests: ${data.interests}
    Current Year: ${data.currentYear}

    --- GENERATION RULES ---

    1.  **Resume**:
        - Create a clean, text-based, ATS-friendly resume.
        - **IMPORTANT FORMATTING**: You MUST use the following exact headers with icons for sections:
          📝 SUMMARY
          🎯 OBJECTIVE
          🎓 EDUCATION
          💡 SKILLS
          🚀 PROJECTS
          🏢 EXPERIENCE
          📜 CERTIFICATIONS
        - **SKILLS SECTION**: List ONLY the skills found in the "Skills" input above.
        - **EXPERIENCE/PROJECTS**: Use only the provided details.
        - Use "➤" for bullets.

    2.  **Cover Letter**:
        - Professional, 150-200 words.
        - Reference ONLY the provided skills and reasons for applying.

    3.  **LinkedIn**:
        - Headline: Under 120 chars, catchy.
        - Bio: Under 250 words, professional narrative using provided info.

    4.  **Mock Interview**:
        - 5 relevant technical/behavioral questions for the "Job Role Target".
        - Provide feedback assuming a basic student answer.

    5.  **Career Roadmap**:
        - 2-year checklist plan (Learning, Projects, Internships, Networking, Milestones).
        - Recommend currently popular and relevant technologies or certifications for 2025.

    Return ONLY a JSON object matching the schema.
  `;
};

const extractJson = (text: string): string => {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) {
    console.warn("JSON Extraction Failed. Raw Text:", text);
    throw new Error("Response did not contain valid JSON. The model might have been blocked or returned plain text. Check console for details.");
  }
  return text.substring(startIndex, endIndex + 1);
};

const getApiKey = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    if (process.env.NEXT_PUBLIC_API_KEY) return process.env.NEXT_PUBLIC_API_KEY;
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
  }
  try {
     // @ts-ignore
     if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
       // @ts-ignore
       if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
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
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        console.log(`Attempting with primary model: ${primaryModel}`);
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: contents,
            config: config,
        });
        return response;
    } catch (error: any) {
        console.warn(`Primary model ${primaryModel} failed. Error:`, error.message);
        
        // Check if error is related to quota or availability
        const isQuotaError = error.message?.includes('429') || 
                             error.message?.includes('Quota') || 
                             error.message?.includes('Resource exhausted') ||
                             error.message?.includes('503');

        if (isQuotaError && fallbackModel) {
            console.log(`Quota Hit. Waiting 2s before falling back to: ${fallbackModel}`);
            // Wait 2 seconds to let the API breathe
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Remove thinking config for fallback if it's a lite model
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

export const generateJobToolkit = async (data: UserInput): Promise<JobToolkit> => {
  const prompt = buildPrompt(data);
  const primaryModel = "gemini-3-flash-preview"; // Fast, high quota
  const fallbackModel = "gemini-flash-lite-latest"; // Very fast, backup

  const config = {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.2,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };
  
  try {
    const response = await generateWithFallback(primaryModel, fallbackModel, prompt, config);
    const jsonText = extractJson(response.text || "{}");
    return JSON.parse(jsonText) as JobToolkit;

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    let msg = error.message || error.toString();
    if (msg.includes("429") || msg.includes("Quota") || msg.includes("Resource exhausted")) {
        throw new Error("API Limit Reached. Please wait a minute or try again.");
    }
    throw new Error("AI Generation failed. " + (msg.length < 100 ? msg : "Please try again later."));
  }
};

export const regenerateCareerRoadmap = async (data: UserInput, newRole: string, useThinkingModel: boolean = false): Promise<JobToolkit['careerRoadmap']> => {
  // Using Flash instead of Pro to prevent 429 Quota errors during demos
  const primaryModel = "gemini-3-flash-preview";
  const fallbackModel = "gemini-flash-lite-latest";
  
  const prompt = `
    Act as a specialized career coach for the niche field of: "${newRole}".
    
    The user is a student (Status: ${data.education}, Year: ${data.currentYear}) looking to specifically break into this role.
    
    GENERATE A HIGHLY TAILORED, GRANULAR 2-YEAR ROADMAP:
    
    1. **Learning Path (Be Specific)**: Do not just say "Learn Python". List specific tools, libraries, and frameworks that are industry standard for "${newRole}" in 2025. (e.g., "Master Pytorch & HuggingFace" instead of "AI").
    2. **Projects (Portfolio-Grade)**: Suggest 2-3 specific project ideas that show mastery of these niche skills. Explain what problem they solve.
    3. **Experience Strategy**: What specific kind of internships or contributions (Open Source/Freelance) matter most for "${newRole}"?
    4. **Niche Networking**: Where do experts in this specific field hang out? (e.g. specific Subreddits, Discords, Conferences, or following specific people).
    5. **Milestones**: Concrete goals for Month 3, Month 6, Year 1, and Year 2.
    
    Return JSON with fields: learning, projects, internships, networking, milestones.
  `;

  const config: any = {
      responseMimeType: "application/json",
      responseSchema: roadmapSchema,
      safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
  };

  // Thinking config is available on 3-flash-preview
  if (useThinkingModel) {
      config.thinkingConfig = { thinkingBudget: 4096 }; 
  } else {
      config.temperature = 0.4;
  }

  try {
    const response = await generateWithFallback(primaryModel, fallbackModel, prompt, config);
    const jsonText = extractJson(response.text || "{}");
    return JSON.parse(jsonText) as JobToolkit['careerRoadmap'];
  } catch (error: any) {
    console.error("Error regenerating roadmap:", error);
    let msg = error.message || error.toString();
    if (msg.includes("429") || msg.includes("Quota")) {
        throw new Error("Quota exceeded. Falling back to lite model...");
    }
    throw new Error("Failed to regenerate roadmap.");
  }
};

export const analyzeResume = async (resumeText: string, jobRole: string): Promise<ResumeAnalysis> => {
  const prompt = `
    Analyze the following resume text specifically for the target job role: "${jobRole}".
    
    Act as a strict hiring manager.
    1. Provide an ATS Score (0-100).
    2. List 3 key strengths.
    3. List 3 critical improvements.
    4. **Keyword Gap Analysis**: Identify 3-5 specific industry standard keywords/skills for "${jobRole}" that are MISSING from this resume.
    5. **Job Fit Prediction**: Predict if this candidate has "High", "Medium", or "Low" chances of getting an interview based purely on content relevance.
    
    Resume Text:
    ${resumeText.substring(0, 5000)}
  `;

  const config = {
    responseMimeType: "application/json",
    responseSchema: analysisSchema,
    temperature: 0.2,
  };

  try {
    const response = await generateWithFallback("gemini-3-flash-preview", "gemini-flash-lite-latest", prompt, config);
    const jsonText = extractJson(response.text || "{}");
    return JSON.parse(jsonText) as ResumeAnalysis;
  } catch (error) {
    console.error("Analysis failed", error);
    throw new Error("Failed to analyze resume.");
  }
};