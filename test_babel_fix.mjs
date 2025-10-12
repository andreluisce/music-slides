import { chromium } from 'playwright';

async function testBabelFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const searchUrl = `https://www.letras.mus.br/?q=${encodeURIComponent('diante do trono')}`;
    
    await page.goto(searchUrl);
    
    // Handle consent modal
    try {
      await page.waitForSelector('button:has-text("Consent")', { timeout: 5000 });
      await page.click('button:has-text("Consent")');
      await page.waitForTimeout(2000);
    } catch (e) {
      // No consent modal
    }
    
    // Wait for results
    await page.waitForSelector('.gs-title', { timeout: 15000 });
    
    // Test the corrected parsing logic (same as the provider now uses)
    const results = await page.$$eval('a.gs-title', links => {
      const BASE_URL = 'https://www.letras.mus.br';
      const validResults = [];
      
      for (let i = 0; i < Math.min(links.length, 10); i++) {
        const link = links[i];
        const url = link.getAttribute('href') || '';
        const titleText = link.textContent ? link.textContent.trim() : '';
        
        // Skip empty results
        if (!titleText || !url) {
          continue;
        }
        
        // Parse title text - format can be:
        // "Song Title - Artist - LETRAS.MUS.BR" or "Artist - LETRAS.MUS.BR"
        let title = '';
        let artist = '';
        
        // Remove "- LETRAS.MUS.BR" suffix
        const cleanText = titleText.replace(/\\s*-\\s*LETRAS\\.MUS\\.BR.*$/i, '').trim();
        const parts = cleanText.split(' - ');
        
        if (parts.length >= 2) {
          // Format: "Song Title - Artist" 
          title = parts[0].trim();
          artist = parts[1].trim();
        } else if (parts.length === 1 && parts[0]) {
          // Format: "Artist" (artist page)
          artist = parts[0].trim();
          // For artist pages, indicate it's the artist's page
          title = 'Página do artista: ' + artist;
        }
        
        // Clean up the URL
        const cleanUrl = url.indexOf('http') === 0 ? url : BASE_URL + url;
        
        validResults.push({
          title: title || 'Música sem título',
          artist: artist || 'Artista desconhecido',
          url: cleanUrl,
        });
      }
      
      return validResults;
    });
    
    console.log('🎵 Test results (should work without Babel errors):');
    results.forEach((result, index) => {
      console.log(`${index + 1}. "${result.title}" por ${result.artist}`);
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

testBabelFix().then(results => {
  if (results.length > 0) {
    console.log(`\\n✅ SUCCESS! Found ${results.length} results without Babel errors!`);
  } else {
    console.log('\\n❌ FAILED! Still getting errors.');
  }
});