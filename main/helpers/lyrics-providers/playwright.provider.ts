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
    await takeScreenshot(page, './debug_screenshots/before_modal_check.png');
    console.log('🔍 Checking for ad-blocker modal...');

    // Check if the modal is visible
    const isModalVisible = await waitForSelector(page, modalSelector, 5000); // Shorter timeout for modal check

    if (isModalVisible) {
      console.log(' detected ad-blocker modal. Attempting to close...');
      await takeScreenshot(page, './debug_screenshots/modal_detected.png');

      const closeButton = page.locator(closeButtonSelector).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        console.log('✅ Ad-blocker modal closed.');
        // Wait for the modal to disappear
        await page.waitForSelector(modalSelector, { state: 'hidden', timeout: 5000 }).catch(() => {});
        await takeScreenshot(page, './debug_screenshots/modal_closed.png');
      } else {
        console.log('❌ Close button not visible in ad-blocker modal.');
        await takeScreenshot(page, './debug_screenshots/close_button_not_visible.png');
      }
    } else {
      console.log('✅ No ad-blocker modal detected.');
    }
  } catch (error) {
    console.error('❌ Error handling ad-blocker modal:', error.message);
    await takeScreenshot(page, './debug_screenshots/error_handling_modal.png');
  }
}

/**
 * Attempts to handle and close a consent modal if present.
 */
export async function handleConsentModal(page: Page): Promise<void> {
  const consentButtonSelector = 'button:has-text("Consentir")';

  try {
    console.log('🔍 Checking for consent modal...');
    const isConsentButtonVisible = await waitForSelector(page, consentButtonSelector, 5000);

    if (isConsentButtonVisible) {
      console.log(' detected consent modal. Attempting to consent...');
      await takeScreenshot(page, './debug_screenshots/consent_modal_detected.png');

      const consentButton = page.locator(consentButtonSelector).first();
      if (await consentButton.isVisible()) {
        await consentButton.click();
        console.log('✅ Consent modal handled.');
        // Wait for the modal to disappear (assuming it does after clicking consent)
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
        await takeScreenshot(page, './debug_screenshots/consent_modal_handled.png');
      } else {
        console.log('❌ Consent button not visible in consent modal.');
        await takeScreenshot(page, './debug_screenshots/consent_button_not_visible.png');
      }
    } else {
      console.log('✅ No consent modal detected.');
    }
  } catch (error) {
    console.error('❌ Error handling consent modal:', error.message);
    await takeScreenshot(page, './debug_screenshots/error_handling_consent_modal.png');
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
