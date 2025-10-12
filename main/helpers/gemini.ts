const API_KEY = process.env.GEMINI_API_KEY;

export const getGeminiResponse = async (params: { prompt: string }) => {
  try {
    console.log('Gemini Prompt:', params.prompt);

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
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return null;
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};