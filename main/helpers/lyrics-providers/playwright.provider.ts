import { chromium, Browser, Page } from 'playwright';

export interface LyricsProvider {
  url: string;
  getLyrics(page: Page, title: string, artist: string): Promise<string | null>;
}

/**
 * Singleton browser instance for Playwright scraping
 * Reusing the same browser improves performance
 */
let browserInstance: Browser | null = null;

/**
 * Gets or creates a browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🌐 Launching Playwright browser...');
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('✅ Browser launched');
  }
  return browserInstance;
}

/**
 * Closes the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
    console.log('🔒 Browser closed');
  }
}

/**
 * Creates a new page with common settings
 */
export async function createPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Set default timeout - reduced for faster responses
  page.setDefaultTimeout(10000);

  return page;
}

/**
 * Safely extracts text content from an element
 */
export async function safeTextContent(page: Page, selector: string): Promise<string | null> {
  try {
    const element = await page.locator(selector).first();
    const text = await element.textContent();
    return text?.trim() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Safely extracts inner text from an element (better for formatted text)
 */
export async function safeInnerText(page: Page, selector: string): Promise<string | null> {
  try {
    const element = await page.locator(selector).first();
    const text = await element.innerText();
    return text?.trim() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Safely gets an attribute value
 */
export async function safeAttribute(
  page: Page,
  selector: string,
  attribute: string
): Promise<string | null> {
  try {
    const element = await page.locator(selector).first();
    return await element.getAttribute(attribute);
  } catch (error) {
    return null;
  }
}

/**
 * Waits for a selector with timeout handling
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Navigate to URL with retry logic
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries = 2
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Navigating to ${url} (attempt ${attempt}/${maxRetries})`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000, // Reduced from 15s to 10s
      });
      return true;
    } catch (error) {
      console.error(`❌ Navigation failed (attempt ${attempt}):`, error.message);
      if (attempt === maxRetries) {
        return false;
      }
      // Wait before retry - reduced from 1s to 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}

/**
 * Takes a screenshot of the current page.
 */
export async function takeScreenshot(page: Page, path: string): Promise<void> {
  try {
    await page.screenshot({ path });
    console.log(`📸 Screenshot saved to ${path}`);
  } catch (error) {
    console.error(`❌ Failed to take screenshot: ${error.message}`);
  }
}

/**
 * Attempts to handle and close an ad-blocker modal if present.
 */
export async function handleAdBlockerModal(page: Page): Promise<void> {
  const modalSelector = '.fc-ab-root';
  const closeButtonSelector = '.fc-close';

  try {
    console.log('🔍 Checking for ad-blocker modal...');

    // Check if the modal is visible - reduced timeout
    const isModalVisible = await waitForSelector(page, modalSelector, 2000);

    if (isModalVisible) {
      console.log(' detected ad-blocker modal. Attempting to close...');

      const closeButton = page.locator(closeButtonSelector).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('✅ Ad-blocker modal closed.');
        // Wait for the modal to disappear
        await page.waitForSelector(modalSelector, { state: 'hidden', timeout: 3000 }).catch(() => {});
      } else {
        console.log('❌ Close button not visible in ad-blocker modal.');
      }
    } else {
      console.log('✅ No ad-blocker modal detected.');
    }
  } catch (error) {
    console.error('❌ Error handling ad-blocker modal:', error.message);
  }
}

/**
 * Attempts to handle and close a consent modal if present.
 */
export async function handleConsentModal(page: Page): Promise<void> {
  // Try multiple consent button selectors
  const consentButtonSelectors = [
    'button:has-text("Consent")',
    'button:has-text("Consentir")',
    'button:has-text("Accept")',
    'button:has-text("Aceitar")',
    'button:has-text("Continuar")',
    'button[class*="consent"]',
    '[data-action="consent"]',
    '.fc-cta-consent', // Common consent button class
    'button[aria-label*="Accept"]',
    'button[aria-label*="Aceitar"]'
  ];

  try {
    console.log('🔍 Checking for consent modal...');

    let consentButtonFound = false;
    for (const selector of consentButtonSelectors) {
      const isVisible = await waitForSelector(page, selector, 1500);
      if (isVisible) {
        console.log(' detected consent modal with selector:', selector);

        const consentButton = page.locator(selector).first();
        if (await consentButton.isVisible()) {
          await consentButton.click();
          console.log('✅ Consent modal handled.');
          consentButtonFound = true;
          // Wait for the modal to disappear - reduced timeout
          await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
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

/**
 * Clean up lyrics text
 */
export function cleanLyricsText(text: string): string {
  return (
    text
      // Remove multiple blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim()
  );
}
