import { chromium } from 'playwright';

// Import the fixed function (simulated)
async function createPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  page.setDefaultTimeout(15000);
  return { page, browser };
}

async function navigateWithRetry(page, url, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Navigating to ${url} (attempt ${attempt}/${maxRetries})`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      return true;
    } catch (error) {
      console.error(`❌ Navigation failed (attempt ${attempt}):`, error.message);
      if (attempt === maxRetries) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function waitForSelector(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch (error) {
    return false;
  }
}

async function handleConsentModal(page) {
  const consentButtonSelectors = [
    'button:has-text("Consent")',
    'button:has-text("Consentir")', 
    'button:has-text("Accept")',
    'button:has-text("Aceitar")',
    'button[class*="consent"]',
    '[data-action="consent"]'
  ];

  try {
    console.log('🔍 Checking for consent modal...');
    
    let consentButtonFound = false;
    for (const selector of consentButtonSelectors) {
      const isVisible = await waitForSelector(page, selector, 2000);
      if (isVisible) {
        console.log('✅ detected consent modal with selector:', selector);

        const consentButton = page.locator(selector).first();
        if (await consentButton.isVisible()) {
          await consentButton.click();
          console.log('✅ Consent modal handled.');
          consentButtonFound = true;
          await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
          break;
        }
      }
    }
    
    if (!consentButtonFound) {
      console.log('✅ No consent modal detected.');
    }
  } catch (error) {
    console.error('❌ Error handling consent modal:', error.message);
  }
}

async function testFindByAnyParameter(searchTerm) {
  const { page, browser } = await createPage();
  
  try {
    const BASE_URL = 'https://www.letras.mus.br';
    const searchUrl = `${BASE_URL}/?q=${encodeURIComponent(searchTerm)}`;

    console.log('🔍 Testing findByAnyParameter for:', searchTerm);

    const navigated = await navigateWithRetry(page, searchUrl);
    if (!navigated) {
      return [];
    }

    await handleConsentModal(page);

    // Wait for Google Custom Search results
    console.log('🔍 Waiting for .gs-title selector...');
    const hasResults = await waitForSelector(page, '.gs-title', 15000);
    if (!hasResults) {
      console.log('❌ No Google Custom Search results found');
      return [];
    }

    console.log('✅ Found Google Custom Search results');
    
    // Get Google Custom Search results
    const results = await page.$$eval('a.gs-title', links => {
      return links.slice(0, 10).map(link => {
        const url = link.getAttribute('href') || '';
        const titleText = link.textContent?.trim() || '';
        
        // Parse title text - usually format is "Title - Artist - LETRAS.MUS.BR"
        const parts = titleText.split(' - ');
        let title = '';
        let artist = '';
        
        if (parts.length >= 2) {
          // If format is "Title - Artist - LETRAS.MUS.BR", take first two parts
          if (parts.length >= 3 && parts[parts.length - 1].includes('LETRAS.MUS.BR')) {
            title = parts[0].trim();
            artist = parts[1].trim();
          } else {
            // If format is "Artist - LETRAS.MUS.BR" or similar
            artist = parts[0].trim();
            title = parts[1].replace(/\\s*-\\s*LETRAS.MUS.BR.*$/i, '').trim();
          }
        } else {
          // Fallback: use the whole text as title
          title = titleText.replace(/\\s*-\\s*LETRAS.MUS.BR.*$/i, '').trim();
        }
        
        // Clean up the URL
        const BASE_URL = 'https://www.letras.mus.br';
        const cleanUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
        
        return {
          title: title || 'Unknown Title',
          artist: artist || 'Unknown Artist',
          url: cleanUrl,
        };
      });
    });

    console.log(`✅ Found ${results.length} results:`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.title}" by ${result.artist}`);
      console.log(`     URL: ${result.url}`);
    });

    return results.map(result => ({
      ...result,
      source: 'letrasmusic',
    }));

  } catch (error) {
    console.error('❌ Search error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// Test with "diante do trono"
testFindByAnyParameter('diante do trono').then(results => {
  if (results.length > 0) {
    console.log(`\\n🎉 Test PASSED! Found ${results.length} search results for "diante do trono"`);
  } else {
    console.log('\\n💥 Test FAILED! No results found.');
  }
}).catch(error => {
  console.error('💥 Unexpected error:', error);
});