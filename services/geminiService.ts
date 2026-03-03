import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis } from "../types";

// Helper to access the window.aistudio object for API key management
const getAIStudio = () => (window as any).aistudio;

export const ensureApiKey = async (): Promise<boolean> => {
  const aistudio = getAIStudio();
  if (aistudio) {
    return await aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const selectApiKey = async (): Promise<void> => {
  const aistudio = getAIStudio();
  if (aistudio) {
    await aistudio.openSelectKey();
  }
};

/**
 * Step 1: Analyze the product and generate content based on URL and User Instructions.
 */
export const analyzeProductUrl = async (
  url: string, 
  affiliateLink?: string,
  userInstructions?: string
): Promise<ProductAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const userContext = userInstructions
    ? `\n\nCRITICAL USER INSTRUCTIONS:\nThe user has explicitly requested the following emphasis for this campaign: "${userInstructions}".\nEnsure all generated assets strictly follow these instructions.`
    : "";

  const disclosureText = "This post contains affiliate links. I may earn a commission if you purchase through my link.";
  
  const additionalLinks = `
    - Music Video Generator (for epic product clips): https://vidmuse.ai?referral=06DYN8K3RCZF0NQ2J885QH9CSS
    - AI Automation (to scale your workflow): https://codewords.agemo.ai/r/CMK56N44?utm_source=copy_link&utm_medium=referral&utm_campaign=user_invite&utm_content=CMK56N44&ref=cmk56n44k000cwefdc7lvimvf
  `;

  const linkInclusion = affiliateLink 
    ? `IMPORTANT: You MUST include this affiliate link for the product: "${affiliateLink}" naturally in the post text (EXCEPT for Pinterest).`
    : "If no affiliate link is provided, use a generic placeholder like [Insert Link Here] where appropriate (EXCEPT for Pinterest).";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the product at this URL: ${url}.${userContext}
    
    1. Research the product details using Google Search.
    2. Identify a clear, concise productName.
    3. Extract a detailed visual description for high-quality image generation.
    4. Create a short, punchy selling hook (max 12 words) that acts as a headline for a Pinterest ad.
    5. Generate two distinct photorealistic video prompts:
       - soraVideoScript: A detailed narrative 30s script for Sora.
       - veoVideoPrompt: A cinematic, high-fidelity prompt for Google Veo 3.
    6. Generate social media posts for:
       - **General Rules**: 
         - ${linkInclusion}
         - MANDATORY: Integrate these two tools in every post as high-value recommendations with engaging hooks: ${additionalLinks} (EXCEPT for Pinterest).
         - All hashtags MUST be lowercase (e.g., #handcrafted, #tech).
         - You MUST add this exact text as the ABSOLUTE LAST sentence of EVERY social post: "${disclosureText}"
       - **YouTube**: Click-worthy Title and detailed Description with SEO keywords, the links, and lowercase hashtags.
       - **Facebook**: Engaging post with emojis, the links, and disclosure.
       - **Instagram**: Captivating caption, emojis, "Link in first comment" mention, tool links, block of lowercase hashtags, and disclosure.
       - **TikTok**: Trendy short caption, tool links, lowercase hashtags, and disclosure.
       - **Threads**: Conversational thread starter, emojis, the links, hashtags, and disclosure.
       - **Pinterest**: Pin Title and a Pin Description optimized for SEO. 
         - CRITICAL: The Pinterest description MUST NOT include ANY URLs, links, or mention of links. 
         - MANDATORY: Include a dense block of relevant lowercase SEO hashtags at the end of the Pinterest description.
         - Still include the mandatory disclosure text at the very end.

    Output result strictly in JSON. 
    CRITICAL: For all text fields (descriptions, posts, scripts), you MUST use "\n" to represent newlines and preserve paragraph breaks. Do not return a single block of text; use multiple paragraphs for readability.
    
    JSON Structure:
    - productName: string
    - visualDescription: string
    - pinterestHook: string
    - soraVideoScript: string
    - veoVideoPrompt: string
    - socialPosts: {
        youtube: { title: string, description: string },
        facebook: string,
        instagram: string,
        tiktok: string,
        threads: string,
        pinterest: { title: string, description: string }
      }
    
    Do not use Markdown code blocks. Just return the valid JSON string.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title || 'Source',
    url: chunk.web?.uri || ''
  })).filter(item => item.url) || [];

  let text = response.text || "";
  if (!text) throw new Error("No analysis generated");
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    text = jsonMatch[0];
  } else {
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  try {
    const parsed = JSON.parse(text);
    parsed.groundingUrls = groundingUrls;

    const stringPlatforms = ['facebook', 'instagram', 'tiktok', 'threads'] as const;
    stringPlatforms.forEach(p => {
        if (typeof parsed.socialPosts[p] === 'string' && !parsed.socialPosts[p].includes(disclosureText)) {
            parsed.socialPosts[p] = parsed.socialPosts[p].trim() + `\n\n${disclosureText}`;
        }
    });
    if (!parsed.socialPosts.youtube.description.includes(disclosureText)) {
        parsed.socialPosts.youtube.description = parsed.socialPosts.youtube.description.trim() + `\n\n${disclosureText}`;
    }
    if (!parsed.socialPosts.pinterest.description.includes(disclosureText)) {
        parsed.socialPosts.pinterest.description = parsed.socialPosts.pinterest.description.trim() + `\n\n${disclosureText}`;
    }
    return parsed as ProductAnalysis;
  } catch (e: any) {
    console.error("JSON parse failed", text);
    if (e.message?.includes("Requested entity was not found")) {
      await selectApiKey();
    }
    throw new Error("Failed to parse product analysis.");
  }
};

export const generateProductImage = async (
  visualDescription: string,
  aspectRatio: "16:9" | "1:1" | "9:16",
  context: "hero" | "ad" | "pinterest",
  referenceImageBase64?: string,
  referenceMimeType?: string,
  hookText?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let promptModifier = "";
  
  switch (context) {
    case "hero": 
      promptModifier = "Cinematic high-end commercial photography, professional studio lighting, clean elegant background."; 
      break;
    case "ad": 
      promptModifier = "Dynamic social media advertisement, vibrant colors, clean and modern composition."; 
      break;
    case "pinterest": 
      promptModifier = `High-conversion Pinterest Pin graphic design. Vertical lifestyle layout with professional typography and marketing overlays. The image should look like a viral editorial ad. Include a clean, readable text overlay/headline that says: "${hookText || 'Shop Now'}". Elegant composition, aspirational vibe.`; 
      break;
  }

  const finalPrompt = referenceImageBase64 
    ? `Strictly maintain the exact product design, label, colors, and shape from the provided reference image. Generate a new high-quality ${aspectRatio} marketing image. Scene Style: ${promptModifier} Scene Details: ${visualDescription}. Place the product from the reference photo naturally but prominently in this new setting.`
    : `${promptModifier} Product: ${visualDescription}`;

  const parts: any[] = [];
  
  if (referenceImageBase64 && referenceMimeType) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: referenceMimeType,
      },
    });
  }
  
  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts },
      config: { 
        imageConfig: { 
          aspectRatio, 
          imageSize: "1K" 
        } 
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image data found from the model.");
  } catch (e: any) {
    if (e.message?.includes("Requested entity was not found")) {
      await selectApiKey();
    }
    throw e;
  }
};