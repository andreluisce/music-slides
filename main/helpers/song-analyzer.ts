import fse from 'fs-extra';
import { getSongFilePath } from './file-system';
import { formatLyrics } from './lyrics';
import { Slide } from '../shared/types';
import { supabase } from './supabase';

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
  return songPath.replace('.txt', '.json');
}

export async function getAnalyzedSlides(
  artist: string,
  title: string,
  lyrics: string
): Promise<Slide[]> {
  // 1. Check Supabase first
  const supabaseSong = await getSongFromSupabase(artist, title);
  if (supabaseSong?.ai_analysis) {
    console.log('🧠 Loading analyzed slides from Supabase:', `${artist} - ${title}`);
    return supabaseSong.ai_analysis.slides;
  }

  // 2. Check local file system cache
  const cachePath = getAnalysisCachePath(artist, title);
  try {
    if (await fse.pathExists(cachePath)) {
      console.log('🧠 Loading analyzed slides from local cache:', cachePath);
      const cachedData = await fse.readJson(cachePath);
      // Update Supabase in the background
      if (supabaseSong) {
        updateSongInSupabase(supabaseSong.id, cachedData);
      }
      return cachedData.slides;
    }
  } catch (error) {
    console.error('Error reading analysis cache:', error);
  }

  // 3. If no cache, generate, save, and return
  console.log('🤖 Generating new slide analysis for:', `${artist} - ${title}`);
  const slides = await formatLyrics(lyrics);
  const analysis = { slides, createdAt: new Date().toISOString() };

  try {
    await fse.writeJson(cachePath, analysis);
    console.log('✅ Saved new slide analysis to local cache:', cachePath);
    if (supabaseSong) {
      await updateSongInSupabase(supabaseSong.id, analysis);
      console.log('✅ Saved new slide analysis to Supabase:', `${artist} - ${title}`);
    }
  } catch (error) {
    console.error('Error saving analysis cache:', error);
  }

  return slides;
}
