// Custom AI Provider using OpenRouter API
export const ai = {
  generate: async ({ prompt, model, history }: any) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        return {
          text: 'AI features are currently disabled. Please add your OPENROUTER_API_KEY to the .env.local file.',
        };
      }

      // Convert history to OpenRouter (OpenAI-compatible) format
      const messages: { role: string; content: string }[] = [];
      
      if (history && history.length > 0) {
        for (const msg of history) {
          if (msg.role && Array.isArray(msg.content)) {
            const historyText = msg.content
              .filter((c: any) => c.text)
              .map((c: any) => c.text)
              .join('\n');
            if (historyText) {
              messages.push({ role: msg.role, content: historyText });
            }
          }
        }
      }

      if (prompt) {
        messages.push({ role: 'user', content: prompt });
      }

      // Using a free, reliable model from OpenRouter
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Campus Connect", 
        },
        body: JSON.stringify({
          model: "google/gemma-3-12b-it:free",
          messages: messages,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenRouter API Error:", response.status, errorData);
        throw new Error(`OpenRouter API responded with ${response.status}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.",
      };
    } catch (error: any) {
      console.error("AI generation error:", error);
      return {
        text: 'Sorry, I am having trouble connecting to the OpenRouter AI service. Please try again later.',
      };
    }
  },
  definePrompt: (config: any) => {
    return async (input: any) => {
      return {
        output: { summary: 'Summary feature currently disabled.' },
      };
    };
  },
  defineFlow: (config: any, handler: any) => {
    // Just return the handler directly
    return handler;
  },
};
