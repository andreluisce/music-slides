import { getGeminiResponse } from './gemini';
import { SongAnalysis, SongMetadata, Slide, TimingInfo, VisualSuggestion } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates advanced metadata for lyrics using AI
 * Creates detailed timing, visual, and emotional analysis
 */
export async function generateAdvancedMetadata(
  artist: string,
  title: string,
  lyrics: string,
  estimatedDuration?: number
): Promise<SongAnalysis> {
  console.log('🧠 Generating advanced metadata for:', `${artist} - ${title}`);

  try {
    // Step 1: Generate overall song metadata
    const songMetadata = await generateSongMetadata(artist, title, lyrics);
    
    // Step 2: Generate detailed slide analysis
    const slides = await generateAdvancedSlides(lyrics, songMetadata, estimatedDuration);
    
    // Step 3: Analyze song structure
    const structure = analyzeStructure(slides);
    
    const analysis: SongAnalysis = {
      metadata: {
        ...songMetadata,
        structure,
        totalDuration: estimatedDuration || calculateTotalDuration(slides),
      },
      slides,
      version: '2.0',
      generatedBy: 'ai',
      lastAnalyzed: new Date().toISOString(),
    };

    console.log('✅ Advanced metadata generated successfully');
    return analysis;
    
  } catch (error) {
    console.error('❌ Error generating advanced metadata:', error);
    // Fallback to basic analysis
    return generateFallbackAnalysis(artist, title, lyrics);
  }
}

/**
 * Generates song-level metadata
 */
async function generateSongMetadata(
  artist: string, 
  title: string, 
  lyrics: string
): Promise<SongMetadata> {
  
  const prompt = `Analyze the following worship song lyrics and provide comprehensive metadata. Return a JSON object with the following structure:

{
  "title": "${title}",
  "artist": "${artist}",
  "genre": "worship", // or more specific genre if applicable
  "language": "pt" | "en" | "es" | "other",
  "overallTheme": "brief theme description",
  "overallEmotion": "dominant emotional tone",
  "suggestedColors": ["#color1", "#color2", "#color3", "#color4", "#color5"],
  "suggestedBibleVerses": [
    {"book": "John", "chapter": 3, "verse": 16, "text": "optional verse text"},
    {"book": "Psalm", "chapter": 23, "verse": 1, "text": "optional verse text"}
  ],
  "bpm": 120, // estimated BPM for the song
  "key": "C" // estimated musical key
}

Focus on:
- Identifying the primary spiritual themes
- Suggesting complementary colors that match the mood
- Finding relevant Bible verses that align with the message
- Estimating musical characteristics

Lyrics:
"""
${lyrics}
"""

Return valid JSON only.`;

  const response = await getGeminiResponse({ prompt });
  
  try {
    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = response.match(jsonRegex);
    
    let metadata;
    if (match && match[1]) {
      metadata = JSON.parse(match[1]);
    } else {
      metadata = JSON.parse(response);
    }
    
    return {
      ...metadata,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('Error parsing song metadata:', error);
    // Fallback metadata
    return {
      id: uuidv4(),
      title,
      artist,
      genre: 'worship',
      language: 'pt',
      overallTheme: 'worship',
      overallEmotion: 'peaceful',
      suggestedColors: ['#1a365d', '#2d3748', '#4a5568'],
      structure: { verses: [], choruses: [] },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
  }
}

/**
 * Generates detailed slides with advanced metadata
 */
async function generateAdvancedSlides(
  lyrics: string, 
  songMetadata: SongMetadata,
  estimatedDuration?: number
): Promise<Slide[]> {
  
  const prompt = `Analyze the following worship song lyrics and create detailed presentation slides with advanced metadata. Each slide should be optimized for visual presentation and include timing and animation suggestions.

REQUIREMENTS:
- Each slide: 2-4 lines maximum, 12 words maximum per slide
- Include precise timing information
- Suggest appropriate animations and visual styles
- Identify emotional intensity and themes for each section
- Provide detailed visual styling suggestions

Return a JSON array of slide objects with this structure:

[
  {
    "id": "unique-id",
    "text": "Line 1\\nLine 2",
    "section": "Verse 1" | "Chorus" | "Bridge" | "Outro" | "Intro",
    "subsection": "optional subsection like Pre-Chorus",
    "emotion": "joyful" | "reflective" | "powerful" | "peaceful" | "triumphant" | "intimate",
    "intensity": 1-10, // emotional intensity scale
    "theme": "worship" | "gratitude" | "hope" | "surrender" | "praise" | "love",
    "keywords": ["key", "words", "in", "slide"],
    "timing": {
      "startTime": 0.0, // seconds from song start
      "endTime": 6.0, // seconds from song start  
      "bpm": ${songMetadata.bpm || 120},
      "emphasis": "start" | "middle" | "end"
    },
    "visual": {
      "backgroundColor": ["#primary", "#secondary"], // gradient colors
      "textColor": "#ffffff",
      "fontSize": "medium" | "large" | "extra-large",
      "fontWeight": "normal" | "bold",
      "textAlign": "center" | "left" | "right",
      "animation": {
        "type": "fade" | "slide" | "zoom" | "bounce" | "typewriter" | "pulse",
        "direction": "up" | "down" | "in" | "out",
        "duration": 1.5, // animation duration in seconds
        "delay": 0 // delay before animation starts
      },
      "backgroundMedia": {
        "type": "gradient" | "image",
        "opacity": 0.3
      }
    },
    "layoutSuggestion": "centered-large-font", // legacy field
    "duration": 6.0, // legacy field
    "notes": "optional presentation notes",
    "isEditable": true
  }
]

Song Metadata Context:
- Overall theme: ${songMetadata.overallTheme}
- Overall emotion: ${songMetadata.overallEmotion}
- Suggested colors: ${songMetadata.suggestedColors?.join(', ')}
- Estimated BPM: ${songMetadata.bpm}

Lyrics:
"""
${lyrics}
"""

Calculate timing to distribute evenly across ${estimatedDuration ? `${estimatedDuration} seconds` : 'the song duration'}. 
Make sure animations and visual styles match the emotional content of each section.

Return valid JSON array only.`;

  const response = await getGeminiResponse({ prompt });
  
  try {
    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = response.match(jsonRegex);
    
    let slides;
    if (match && match[1]) {
      slides = JSON.parse(match[1]);
    } else {
      slides = JSON.parse(response);
    }
    
    // Ensure all slides have required fields and proper IDs
    return slides.map((slide: any, index: number) => ({
      ...slide,
      id: slide.id || uuidv4(),
      timing: slide.timing || {
        startTime: index * 6,
        endTime: (index + 1) * 6,
        bpm: songMetadata.bpm || 120,
        emphasis: 'middle'
      },
      visual: slide.visual || generateDefaultVisual(slide.emotion, songMetadata),
      isEditable: true,
    }));
    
  } catch (error) {
    console.error('Error parsing advanced slides:', error);
    // Fallback to basic slide generation
    return lyrics.split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        id: uuidv4(),
        text: line.trim(),
        section: 'Verse',
        emotion: 'peaceful',
        intensity: 5,
        timing: {
          startTime: index * 6,
          endTime: (index + 1) * 6,
          bpm: songMetadata.bpm || 120,
          emphasis: 'middle' as const
        },
        visual: generateDefaultVisual('peaceful', songMetadata),
        layoutSuggestion: 'centered-large-font',
        duration: 6,
        isEditable: true,
      }));
  }
}

/**
 * Generates default visual styling
 */
function generateDefaultVisual(emotion: string, metadata: SongMetadata): VisualSuggestion {
  const colors = metadata.suggestedColors || ['#1a365d', '#2d3748'];
  
  return {
    backgroundColor: colors.slice(0, 2),
    textColor: '#ffffff',
    fontSize: 'large',
    fontWeight: 'normal',
    textAlign: 'center',
    animation: {
      type: emotion === 'powerful' ? 'zoom' : 'fade',
      direction: 'in',
      duration: 1.5,
      delay: 0
    },
    backgroundMedia: {
      type: 'gradient',
      opacity: 0.8
    }
  };
}

/**
 * Analyzes song structure from slides
 */
function analyzeStructure(slides: Slide[]) {
  const structure = {
    intro: [] as number[],
    verses: [] as number[][],
    choruses: [] as number[][],
    bridge: [] as number[],
    outro: [] as number[]
  };
  
  let currentVerse: number[] = [];
  let currentChorus: number[] = [];
  
  slides.forEach((slide, index) => {
    const section = slide.section.toLowerCase();
    
    if (section.includes('intro')) {
      structure.intro.push(index);
    } else if (section.includes('verse')) {
      currentVerse.push(index);
    } else if (section.includes('chorus') || section.includes('refrão')) {
      currentChorus.push(index);
    } else if (section.includes('bridge') || section.includes('ponte')) {
      structure.bridge.push(index);
    } else if (section.includes('outro') || section.includes('final')) {
      structure.outro.push(index);
    }
    
    // Handle verse transitions
    if (currentVerse.length > 0 && (!section.includes('verse') || index === slides.length - 1)) {
      if (currentVerse.length > 0) {
        structure.verses.push([...currentVerse]);
        currentVerse = [];
      }
    }
    
    // Handle chorus transitions  
    if (currentChorus.length > 0 && (!section.includes('chorus') && !section.includes('refrão') || index === slides.length - 1)) {
      if (currentChorus.length > 0) {
        structure.choruses.push([...currentChorus]);
        currentChorus = [];
      }
    }
  });
  
  return structure;
}

/**
 * Calculates total duration from slides
 */
function calculateTotalDuration(slides: Slide[]): number {
  if (slides.length === 0) return 0;
  
  const lastSlide = slides[slides.length - 1];
  return lastSlide.timing?.endTime || lastSlide.duration || slides.length * 6;
}

/**
 * Generates fallback analysis when AI fails
 */
function generateFallbackAnalysis(artist: string, title: string, lyrics: string): SongAnalysis {
  const slides = lyrics.split('\n')
    .filter(line => line.trim())
    .map((line, index) => ({
      id: uuidv4(),
      text: line.trim(),
      section: 'Verse',
      emotion: 'peaceful',
      intensity: 5,
      timing: {
        startTime: index * 6,
        endTime: (index + 1) * 6,
        bpm: 120,
        emphasis: 'middle' as const
      },
      visual: {
        backgroundColor: ['#1a365d', '#2d3748'],
        textColor: '#ffffff',
        fontSize: 'large' as const,
        fontWeight: 'normal' as const,
        textAlign: 'center' as const,
        animation: {
          type: 'fade' as const,
          direction: 'in' as const,
          duration: 1.5,
          delay: 0
        },
        backgroundMedia: {
          type: 'gradient' as const,
          opacity: 0.8
        }
      },
      layoutSuggestion: 'centered-large-font',
      duration: 6,
      isEditable: true,
    }));

  return {
    metadata: {
      id: uuidv4(),
      title,
      artist,
      genre: 'worship',
      language: 'pt',
      overallTheme: 'worship',
      overallEmotion: 'peaceful',
      suggestedColors: ['#1a365d', '#2d3748', '#4a5568'],
      structure: { verses: [], choruses: [] },
      totalDuration: slides.length * 6,
      bpm: 120,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
    slides,
    version: '2.0',
    generatedBy: 'ai',
    lastAnalyzed: new Date().toISOString(),
  };
}

/**
 * Updates existing analysis with manual edits
 */
export function updateAnalysisMetadata(
  analysis: SongAnalysis, 
  updates: Partial<SongAnalysis>
): SongAnalysis {
  return {
    ...analysis,
    ...updates,
    metadata: {
      ...analysis.metadata,
      ...updates.metadata,
      lastModified: new Date().toISOString(),
    },
    generatedBy: 'hybrid',
  };
}