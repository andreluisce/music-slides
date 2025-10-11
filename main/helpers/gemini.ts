import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiResponse = async (params: { prompt: string }) => {
  try {
    console.log('Gemini Prompt:', params.prompt);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(params.prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};
