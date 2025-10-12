import { searchByTitleAndArtist } from './letrasmusic.provider';

async function testSearch() {
  const artist = 'Diante do Trono';
  const title = 'Águas Purificadoras'; // A common song by Diante do Trono

  console.log(`Testing search for: ${artist} - ${title}`);

  try {
    const result = await searchByTitleAndArtist({ artist, title });

    if (result) {
      console.log('✅ Search successful!');
      console.log('Artist:', result.artist);
      console.log('Title:', result.title);
      console.log('Source:', result.source);
      console.log('Lyrics (first 200 chars):', result.lyrics.substring(0, 200) + '...');
    } else {
      console.log('❌ Search failed: No lyrics found.');
    }
  } catch (error) {
    console.error('An error occurred during the test:', error);
  } finally {
    // Playwright pages are closed internally by the provider
  }
}

testSearch();
