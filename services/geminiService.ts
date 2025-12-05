import { GoogleGenAI } from "@google/genai";
import { ReviewResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Shared analysis logic for both scraped content and raw text
const performAnalysis = async (content: string): Promise<ReviewResponse> => {
  const analysisInstructions = `
    Please perform the following steps:
    1. **The Assertions**: Cut through the noise. What is the author actually claiming? Be brief.
    2. **The Reality Check**: Use Google Search to ruthlessly verify these claims against **at least 10 major, reputable news outlets** (e.g., AP, Reuters, NYT, BBC, Nature, Science, The Economist, etc.). Call out unsupported assertions, exaggerations, or factual errors directly.
    3. **The Counter-Point**: Provide a sharp, informed counter-perspective based on the facts found. Be assertive. **Crucial: Cite your sources inline (e.g., [Source Name]) for every counter-claim or fact check.**
    4. **Questions for the Author**: List 3-5 hard-hitting, specific questions the author needs to answer to substantiate their position.
    
    Format the output clearly in Markdown with these headers:
    ## The Assertions
    ## The Reality Check
    ## The Counter-Point
    ## Questions for the Author
    
    Tone: Witty, sharp, and concise. No filler.
  `;

  const prompt = `
    Task: Analyze the following text and provide a critical review.

    ${analysisInstructions}
    
    **Input Text**:
    """
    ${content}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const markdown = response.text || "No analysis could be generated. The AI might be having trouble processing this text.";
    
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "External Source",
          uri: chunk.web.uri,
        });
      }
    });

    const uniqueSources = sources.filter((source, index, self) =>
      index === self.findIndex((s) => s.uri === source.uri)
    );

    return {
      markdown,
      sources: uniqueSources,
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Analysis failed. The AI service may be temporarily unavailable.");
  }
};

// Helper to fetch and parse Substack content via a proxy
const fetchSubstackContent = async (url: string): Promise<string | null> => {
  try {
    const urlObj = new URL(url);
    const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

    // Use allorigins as proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}&disableCache=true`;
    
    let response;
    try {
      response = await fetch(proxyUrl);
    } catch (networkError) {
      console.warn("Network error fetching via proxy:", networkError);
      return null;
    }

    const data = await response.json();
    
    if (!data.contents) {
      console.warn("Proxy returned no content");
      return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    // Robust Selectors for Substack
    const contentNode = 
      doc.querySelector('.body.markup') || 
      doc.querySelector('.available-content') || 
      doc.querySelector('.post-content') || 
      doc.querySelector('.portable-archive-post') ||
      doc.querySelector('div.single-post') ||
      doc.querySelector('article') || 
      doc.querySelector('main') ||
      doc.body;

    if (!contentNode) return null;
    
    // Aggressive cleaning of noise/modals
    const elementsToRemove = contentNode.querySelectorAll(
      'script, style, svg, button, nav, footer, iframe, .subscribe-widget, .share-dialog, .modal, [class*="subscribe"], [id*="subscribe"], .post-footer, .comments-section'
    );
    elementsToRemove.forEach(el => el.remove());

    const textContent = contentNode.textContent || "";
    const cleanText = textContent.replace(/\s+/g, ' ').trim();

    // Heuristics for failed scrapes or paywalls
    const isPaywall = /sign in to read|subscribe to read|upgrade to paid/i.test(cleanText.substring(0, 500));
    const isTooShort = cleanText.length < 300;

    if (isTooShort || isPaywall) {
      console.warn("Extracted text is too short or indicates a paywall.");
      return null;
    }

    return cleanText.slice(0, 50000); 

  } catch (error) {
    console.warn("Scraping failed safely:", error);
    return null;
  }
};

export const analyzeSubstackPost = async (url: string): Promise<ReviewResponse> => {
  const postContent = await fetchSubstackContent(url);
  
  if (!postContent) {
    throw new Error("Unable to extract content from this URL automatically. Please copy the text and use the 'Paste Text' tab instead.");
  }

  return performAnalysis(postContent);
};

export const analyzeRawText = async (text: string): Promise<ReviewResponse> => {
  if (text.trim().length < 50) {
    throw new Error("The text provided is too short to analyze.");
  }
  return performAnalysis(text);
};
