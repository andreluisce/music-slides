import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy-load API key and client to ensure env vars are loaded
function getApiKey(): string {
  return process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function getGenAI(): GoogleGenerativeAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API key not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function interpretLyricsQuery(userQuery: string): Promise<{
  title: string;
  artist: string;
  alternatives: Array<{ title: string; artist: string }>;
  confidence: number;
}> {
  try {
    const genAI = getGenAI();

    // Try gemini-pro first (most compatible with free tier)
    // If this fails, the manual parsing fallback will handle it
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

    const prompt = `You are a worship music expert specializing in gospel, evangelical, and church music (Portuguese and English).

User query: "${userQuery}"

IMPORTANT CONTEXT:
- This is for a church presentation system
- ALWAYS prioritize gospel/worship/evangelical music
- Common artists: Diante do Trono, Hillsong, Aline Barros, Gabriela Rocha, Chris Tomlin, Elevation Worship, etc.
- If query is ambiguous, assume it's a worship song

Analyze this query and extract:
1. Most likely worship/gospel song title
2. Most likely worship/gospel artist name
3. Up to 3 alternative interpretations (different artists/versions of the same worship song)
4. Confidence level (0-100)

Consider:
- Common misspellings
- Portuguese/English translations
- Partial information (theme, emotion, partial lyrics)
- Different versions of the same worship song by different artists
- Brazilian worship bands vs international worship bands

PRIORITIZE worship/gospel music ALWAYS, unless the user explicitly mentions a secular artist.

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

import type { Theme } from '../../lib/supabase';

export async function suggestTheme(): Promise<Theme> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an AI assistant specialized in generating modern and aesthetically pleasing themes for church presentation software, with a focus on Brazilian and Portuguese worship contexts.
Generate a theme that is suitable for worship lyrics projection.
The theme should include:
- A modern, readable font family (e.g., 'Roboto', 'Open Sans', 'Montserrat', 'Plus Jakarta Sans', 'Epilogue', 'DM Sans', 'Lato', 'Bebas Neue').
- A suitable font size (between 48 and 96).
- A font weight (e.g., 400, 500, 600, 700).
- A text color (hex code, e.g., '#FFFFFF').
- A text shadow for readability (e.g., '2px 2px 4px rgba(0,0,0,0.5)').
- A text outline (e.g., 'none' or '1px solid rgba(0,0,0,0.8)').
- A background position (e.g., 'center', 'top', 'bottom', 'left', 'right').
- An animation type ('fade', 'slide', 'zoom', 'none').
- A creative and appealing name for the theme.

Return ONLY valid JSON in this exact format, ensuring all fields are present and correctly typed:
{
  "name": "Creative Theme Name",
  "font_family": "Font Family Name",
  "font_size": 72,
  "font_weight": 700,
  "text_color": "#FFFFFF",
  "text_shadow": "2px 2px 4px rgba(0,0,0,0.5)",
  "text_outline": "none",
  "background_position": "center",
  "animation_type": "fade",
  "is_default": false
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const themeSuggestion: Theme = JSON.parse(jsonMatch[0]);
    console.log('🤖 AI suggested theme:', themeSuggestion);

    return themeSuggestion;
  } catch (error) {
    console.error('❌ AI theme suggestion failed:', error);
    throw error;
  }
}

export async function cleanLyrics(rawLyrics: string): Promise<string> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return rawLyrics; // Return as-is if no API key
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Clean and format these song lyrics professionally. The lyrics are for a worship song, likely in Portuguese.
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

export async function suggestBackgroundMedia(lyrics: string): Promise<string[]> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze the following song lyrics from a Brazilian/Portuguese worship context and suggest 3-5 search terms for royalty-free background videos or images. The terms should capture the main themes, mood, and imagery of the song.

    Lyrics:
    """${lyrics}"""

    Return ONLY a valid JSON array of strings.

    Example:
    ["ocean waves", "calm sea", "sunrise over water"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    console.log('🤖 AI suggested background media queries:', suggestions);

    return suggestions;
  } catch (error) {
    console.error('❌ AI background media suggestion failed:', error);
    return [];
  }
}

export async function suggestFontPairing(genre: string, mood: string): Promise<{ titleFont: string; bodyFont: string }> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Suggest a font pairing (one for titles/headers and one for the body text) that would be appropriate for a presentation with the following genre and mood, within a Brazilian/Portuguese worship context.
    The fonts should be from Google Fonts.

    Genre: ${genre}
    Mood: ${mood}

    Return ONLY a valid JSON object with the following structure:
    {
      "titleFont": "Name of Title Font",
      "bodyFont": "Name of Body Font"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    const fontPairing = JSON.parse(jsonMatch[0]);
    console.log('🤖 AI suggested font pairing:', fontPairing);

    return fontPairing;
  } catch (error) {
    console.error('❌ AI font pairing suggestion failed:', error);
    return { titleFont: 'Roboto', bodyFont: 'Open Sans' };
  }
}

export async function discoverSongs(query: string): Promise<{ title: string; artist: string }[]> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a worship music expert. Suggest 5-10 songs based on the following query. The query could be a theme, a mood, or a Bible verse.

    Query: "${query}"

    Return ONLY a valid JSON array of objects, where each object has 'title' and 'artist' properties.

    Example:
    [
      { "title": "Oceans (Where Feet May Fail)", "artist": "Hillsong UNITED" },
      { "title": "Amazing Grace", "artist": "John Newton" }
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const songs = JSON.parse(jsonMatch[0]);
    console.log('🤖 AI discovered songs:', songs);

    return songs;
  } catch (error) {
    console.error('❌ AI song discovery failed:', error);
    return [];
  }
}

export async function generateChords(lyrics: string): Promise<string> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze the following song lyrics, which are from a worship song (likely in Portuguese or English), and add chords in the Chord Pro format. Place the chords in square brackets directly before the corresponding word.

    Lyrics:
    """${lyrics}"""

    Example:
    [G]Amazing [C]grace, how [G]sweet the [D]sound

    Return ONLY the lyrics with embedded chords.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('❌ Chord generation failed:', error);
    return lyrics;
  }
}
