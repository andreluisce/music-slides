const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export const getGeminiResponse = async (params: { prompt: string }) => {
  if (!API_KEY) {
    console.error('❌ Gemini API Key is not set. Please set GOOGLE_GEMINI_API_KEY in your .env file.');
    throw new Error('Gemini API Key is not configured.');
  }

  try {
    console.log('Gemini Prompt:', params.prompt.substring(0, 200) + '...'); // Log first 200 chars of prompt

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error response:", response.status, response.statusText, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      console.error("❌ Gemini API: No candidates found in response:", data);
      throw new Error("Gemini API: No candidates found in response.");
    }
    const text = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini Response (first 200 chars):', text.substring(0, 200) + '...');
    return text;
  } catch (error) {
    console.error('❌ Gemini API request failed:', error);
    throw error; // Re-throw to be caught by calling function
  }
};