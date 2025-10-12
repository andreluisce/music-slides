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
    console.error('❌ Error in getAnalyzedSlides:', error.message);
    console.log('🔄 Falling back to basic lyrics formatting...');
    
    try {
      // Fallback to basic formatting
      const { formatLyrics } = await import('./lyrics');
      return await formatLyrics(lyrics);
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError.message);
      // Last resort: basic text splitting
      return lyrics.split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          text: line.trim(),
          section: 'Verse',
          emotion: 'neutral',
          layoutSuggestion: 'default',
          duration: 5
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
      
      // Check if it's the new format with advanced metadata
      if (cachedData.version === '2.0') {
        // Update Supabase in the background
        if (supabaseSong) {
          updateSongInSupabase(supabaseSong.id, cachedData);
        }
        return cachedData;
      } else {
        console.log('🔄 Old cache format found, regenerating with advanced metadata');
      }
    }
  } catch (error) {
    console.error('Error reading analysis cache:', error);
  }

  // 3. Generate new advanced analysis (ONLY FIRST TIME)
  console.log('🤖 Generating new ADVANCED analysis for:', `${artist} - ${title}`);
  
  try {
    const analysis = await generateAdvancedMetadata(artist, title, lyrics, estimatedDuration);
    
    if (!analysis || !analysis.slides) {
      throw new Error('Advanced metadata generation returned invalid data');
    }

    try {
      await fse.writeJson(cachePath, analysis);
      console.log('✅ Saved advanced analysis to local cache:', cachePath);
      
      if (supabaseSong) {
        await updateSongInSupabase(supabaseSong.id, analysis);
        console.log('✅ Saved advanced analysis to Supabase:', `${artist} - ${title}`);
      }
    } catch (cacheError) {
      console.error('Error saving advanced analysis cache:', cacheError);
      // Don't fail if cache save fails, just return the analysis
    }

    return analysis;
  } catch (aiError) {
    console.error('❌ Advanced metadata generation failed:', aiError.message);
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

    // Update the ai_analysis field with the new analysis
    const updatedSongData = {
      ...existingSongData,
      ai_analysis: finalAnalysis,
    };

    // Save to local cache
    await fse.writeJson(cachePath, updatedSongData);
    console.log('✅ Updated analysis in local cache:', cachePath);

    // Update Supabase
    const supabaseSong = await getSongFromSupabase(artist, title);
    if (supabaseSong) {
      await updateSongInSupabase(supabaseSong.id, finalAnalysis);
      console.log('✅ Updated analysis in Supabase:', `${artist} - ${title}`);
    }
  } catch (error) {
    console.error('Error updating analysis:', error);
    throw error;
  }
}
