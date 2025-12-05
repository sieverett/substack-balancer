import { GoogleGenAI } from "@google/genai";
import { ReviewResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to fetch and parse Substack content via a proxy to avoid CORS
const fetchSubstackContent = async (url: string): Promise<string> => {
  try {
    // 1. Clean the URL to remove tracking params which might trigger different server behavior
    const urlObj = new URL(url);
    const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

    // 2. Use allorigins as proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}&disableCache=true`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error("No content received from proxy.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    // 3. Robust Selectors for Substack
    // Substack structure varies, but usually content is in .body.markup or .available-content
    const contentNode = 
      doc.querySelector('.body.markup') || 
      doc.querySelector('.available-content') || 
      doc.querySelector('.post-content') || 
      doc.querySelector('article') || 
      doc.querySelector('main') ||
      doc.body;

    // 4. Aggressive cleaning of non-content elements
    if (!contentNode) {
      throw new Error("Could not find content section in the page.");
    }
    
    // Remove scripts, styles, svgs, buttons, navs to reduce noise
    const elementsToRemove = contentNode.querySelectorAll('script, style, svg, button, nav, footer, iframe, .subscribe-widget, .share-dialog');
    elementsToRemove.forEach(el => el.remove());

    const textContent = contentNode.textContent || "";
    const cleanText = textContent.replace(/\s+/g, ' ').trim();

    if (cleanText.length < 100) {
      throw new Error("Extracted content is too short to analyze.");
    }

    // Truncate to avoid extremely large contexts, though Gemini 2.5 handles a lot.
    return cleanText.slice(0, 30000); 

  } catch (error) {
    console.error("Error fetching Substack content:", error);
    throw new Error("Failed to extract content from the URL. Ensure it is a valid public Substack post.");
  }
};

export const analyzeSubstackPost = async (url: string): Promise<ReviewResponse> => {
  // 1. Fetch text content from the URL
  const postContent = await fetchSubstackContent(url);

  // 2. Construct the prompt
  const prompt = `
    You are a critical reviewer and fact-checker. 
    Analyze the following text extracted from a Substack post. 
    Identify the main claims, arguments, and assertions. 
    Verify these claims using Google Search to check their accuracy against major, trusted news outlets and official data sources.

    Provide a "Critical Review" that:
    1. Summarizes the main argument of the post briefly.
    2. Highlights specific claims that are controversial, misleading, or factually incorrect, or confirms if they are accurate.
    3. Provides evidence from trusted sources to support your analysis.
    4. Concludes with a balanced, constructive counter-perspective or additional context that the original post might lack.

    The output must be in Markdown format. Use bolding for key points.
    
    Post Content:
    "${postContent}"
  `;

  try {
    // 3. Call Gemini with Google Search Tool
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT compatible with googleSearch tool
      },
    });

    const markdown = response.text || "No analysis could be generated.";
    
    // 4. Extract sources from grounding chunks
    const sources: Array<{ title: string; uri: string }> = [];
    
    // Check if grounding metadata exists and map to source objects
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "External Source",
          uri: chunk.web.uri,
        });
      }
    });

    // Remove duplicate URIs
    const uniqueSources = sources.filter((source, index, self) =>
      index === self.findIndex((s) => s.uri === source.uri)
    );

    return {
      markdown,
      sources: uniqueSources,
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the post with AI. Please try again later.");
  }
};