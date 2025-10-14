import fse from 'fs-extra';
import { getSongFilePath } from './file-system';
import { formatLyrics } from './lyrics';
import { Slide, SongAnalysis } from '../shared/types';
import { supabase } from './supabase';
import { generateAdvancedMetadata } from './advanced-lyrics-analyzer';

async function getSongFromSupabase(artist: string, title: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('id, ai_analysis')
    .ilike('artist', artist)
    .ilike('title', title)
    .single();

  if (error) {
    console.error('Error getting song from Supabase:', error);
    return null;
  }
  return data;
}

async function updateSongInSupabase(id: string, analysis: any) {
  const { error } = await supabase
    .from('songs')
    .update({ ai_analysis: analysis })
    .eq('id', id);

  if (error) {
    console.error('Error updating song in Supabase:', error);
  }
}

function getAnalysisCachePath(artist: string, title: string): string {
  const songPath = getSongFilePath(artist, title);
  // Since we always use JSON files now, just ensure .json extension
  return songPath.endsWith('.json') ? songPath : songPath.replace(/\.[^.]+$/, '.json');
}

export async function getAnalyzedSlides(
  artist: string,
  title: string,
  lyrics: string
): Promise<Slide[]> {
  try {
    const analysis = await getAdvancedSongAnalysis(artist, title, lyrics);
    
    if (!analysis || !analysis.slides || !Array.isArray(analysis.slides)) {
      console.error('❌ Advanced analysis failed, falling back to basic formatting');
      // Fallback to basic formatting
      const { formatLyrics } = await import('./lyrics');
      return await formatLyrics(lyrics);
    }
    
    return analysis.slides;
  } catch (error) {
    console.error('❌ Error in getAnalyzedSlides:', (error as Error).message);
    console.log('🔄 Falling back to basic lyrics formatting...');
    
    try {
      // Fallback to basic formatting
      const { formatLyrics } = await import('./lyrics');
      return await formatLyrics(lyrics);
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', (fallbackError as Error).message);
      // Last resort: basic text splitting
      return lyrics.split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          id: `fallback-slide-${index}-${Date.now()}`,
          text: line.trim(),
          section: 'Verse',
          emotion: 'neutral',
          intensity: 5,
          timing: {
            startTime: index * 5,
            endTime: (index + 1) * 5,
            bpm: 120,
            emphasis: 'middle'
          },
          visual: {
            backgroundColor: ['#1a365d', '#2d3748'],
            textColor: '#ffffff',
            fontSize: 'large',
            fontWeight: 'normal',
            textAlign: 'center',
            animation: {
              type: 'fade',
              direction: 'in',
              duration: 1.5,
              delay: 0
            },
            backgroundMedia: {
              type: 'gradient',
              opacity: 0.8
            }
          },
          layoutSuggestion: 'default',
          duration: 5,
          isEditable: true,
        }));
    }
  }
}

export async function getAdvancedSongAnalysis(
  artist: string,
  title: string,
  lyrics: string,
  estimatedDuration?: number
): Promise<SongAnalysis> {
  // 1. Check Supabase first
  const supabaseSong = await getSongFromSupabase(artist, title);
  if (supabaseSong?.ai_analysis?.version === '2.0') {
    console.log('🧠 Loading advanced analysis from Supabase:', `${artist} - ${title}`);
    return supabaseSong.ai_analysis;
  }

  // 2. Check local file system cache
  const cachePath = getAnalysisCachePath(artist, title);
  try {
    if (await fse.pathExists(cachePath)) {
      console.log('🧠 Loading analysis from local cache:', cachePath);
      const cachedData = await fse.readJson(cachePath);

      // Check if we have ai_analysis field (new structure)
      if (cachedData.ai_analysis?.version === '2.0') {
        console.log('✅ Loading from ai_analysis field');
        // Update Supabase in the background
        if (supabaseSong) {
          updateSongInSupabase(supabaseSong.id, cachedData.ai_analysis);
        }
        return cachedData.ai_analysis;
      }

      // Check if it's the old format with data at root level
      if (cachedData.version === '2.0' && !cachedData.ai_analysis) {
        console.log('✅ Loading from root level (old format)');
        // Update Supabase in the background
        if (supabaseSong) {
          updateSongInSupabase(supabaseSong.id, cachedData);
        }
        return cachedData;
      }

      console.log('🔄 Old cache format found, regenerating with advanced metadata');
    }
  } catch (error) {
    console.error('Error reading analysis cache:', error as Error);
  }

  // 3. Generate new advanced analysis (ONLY FIRST TIME)
  console.log('🤖 Generating new ADVANCED analysis for:', `${artist} - ${title}`);
  
  try {
    const analysis = await generateAdvancedMetadata(artist, title, lyrics, estimatedDuration);
    
    if (!analysis || !analysis.slides) {
      throw new Error('Advanced metadata generation returned invalid data');
    }

    try {
      // Read existing file to preserve lyrics and other data
      let existingData = {};
      if (await fse.pathExists(cachePath)) {
        existingData = await fse.readJson(cachePath);
      }

      // Save with both root-level fields AND ai_analysis field
      const dataToSave = {
        ...existingData,
        // Root level fields for backwards compatibility
        metadata: analysis.metadata,
        slides: analysis.slides,
        version: analysis.version,
        generatedBy: analysis.generatedBy,
        lastAnalyzed: analysis.lastAnalyzed,
        // ai_analysis field (new structure)
        ai_analysis: analysis,
      };

      await fse.writeJson(cachePath, dataToSave);
      console.log('✅ Saved advanced analysis to local cache (both root and ai_analysis):', cachePath);

      if (supabaseSong) {
        await updateSongInSupabase(supabaseSong.id, analysis);
        console.log('✅ Saved advanced analysis to Supabase:', `${artist} - ${title}`);
      }
    } catch (cacheError) {
      console.error('Error saving advanced analysis cache:', cacheError as Error);
      // Don't fail if cache save fails, just return the analysis
    }

    return analysis;
  } catch (aiError) {
    console.error('❌ Advanced metadata generation failed:', (aiError as Error).message);
    console.log('🔄 Falling back to basic analysis generation...');
    
    // Fallback to basic analysis
    const { formatLyrics } = await import('./lyrics');
    const slides = await formatLyrics(lyrics);
    
    const fallbackAnalysis = {
      metadata: {
        id: `fallback-${Date.now()}`,
        title,
        artist,
        genre: 'Gospel',
        language: 'pt',
        overallTheme: 'worship',
        overallEmotion: 'peaceful',
        suggestedColors: ['#1a365d', '#2d3748', '#4a5568'],
        structure: { verses: [], choruses: [] },
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      slides,
      version: '2.0',
      generatedBy: 'fallback' as const,
      lastAnalyzed: new Date().toISOString(),
    };
    
    return fallbackAnalysis;
  }
}

/**
 * Updates song analysis (for manual edits in library)
 */
export async function updateSongAnalysis(
  artist: string,
  title: string,
  updatedAnalysis: SongAnalysis
): Promise<void> {
  const cachePath = getAnalysisCachePath(artist, title);

  // Mark as manually edited
  const finalAnalysis = {
    ...updatedAnalysis,
    generatedBy: 'hybrid' as const,
    metadata: {
      ...updatedAnalysis.metadata,
      lastModified: new Date().toISOString(),
    }
  };

  try {
    // Read the existing song file
    const existingSongData = await fse.readJson(cachePath);

    // Update BOTH the ai_analysis field (new structure)
    // AND root-level fields (for backwards compatibility)
    const updatedSongData = {
      ...existingSongData,
      // Update root level fields for backwards compatibility
      metadata: finalAnalysis.metadata,
      slides: finalAnalysis.slides,
      version: finalAnalysis.version,
      generatedBy: finalAnalysis.generatedBy,
      lastAnalyzed: finalAnalysis.lastAnalyzed,
      // Update ai_analysis field (new structure)
      ai_analysis: finalAnalysis,
    };

    // Save to local cache
    await fse.writeJson(cachePath, updatedSongData);
    console.log('✅ Updated analysis in local cache (both root and ai_analysis):', cachePath);

    // Update Supabase
    const supabaseSong = await getSongFromSupabase(artist, title);
    if (supabaseSong) {
      await updateSongInSupabase(supabaseSong.id, finalAnalysis);
      console.log('✅ Updated analysis in Supabase:', `${artist} - ${title}`);
    }
  } catch (error) {
    console.error('Error updating analysis:', error as Error);
    throw error;
  }
}
