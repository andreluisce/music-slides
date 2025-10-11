import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export async function interpretLyricsQuery(userQuery: string): Promise<{
  title: string;
  artist: string;
  alternatives: Array<{ title: string; artist: string }>;
  confidence: number;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a music expert. The user wants to find song lyrics.

User query: "${userQuery}"

Analyze this query and extract:
1. Most likely song title
2. Most likely artist name
3. Up to 3 alternative interpretations (different spellings, translations, similar songs)
4. Confidence level (0-100)

Consider:
- Common misspellings
- Portuguese/English translations
- Partial information
- Context clues (genre, theme, partial lyrics)
- Religious/worship songs if context suggests

Return ONLY valid JSON in this exact format:
{
  "title": "exact song title",
  "artist": "exact artist name",
  "alternatives": [
    {"title": "alternative title", "artist": "alternative artist"},
    {"title": "another option", "artist": "another artist"}
  ],
  "confidence": 85
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (remove markdown code blocks if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const interpretation = JSON.parse(jsonMatch[0]);
    console.log('🤖 AI interpreted query:', interpretation);

    return interpretation;
  } catch (error) {
    console.error('❌ AI interpretation failed:', error);
    // Fallback: basic parsing
    return {
      title: userQuery,
      artist: '',
      alternatives: [],
      confidence: 30
    };
  }
}

export async function cleanLyrics(rawLyrics: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Clean and format these song lyrics professionally:
- Fix capitalization
- Remove extra whitespace
- Keep the original structure (verses, chorus, bridge)
- DO NOT translate
- DO NOT change the lyrics content
- Only fix formatting issues

Lyrics:
${rawLyrics}

Return ONLY the cleaned lyrics, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('❌ Lyrics cleaning failed:', error);
    return rawLyrics; // Return original if AI fails
  }
}
