import { chromium, Browser, Page } from 'playwright';

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

  // Set default timeout
  page.setDefaultTimeout(15000);

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
        timeout: 15000,
      });
      return true;
    } catch (error) {
      console.error(`❌ Navigation failed (attempt ${attempt}):`, error.message);
      if (attempt === maxRetries) {
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
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
