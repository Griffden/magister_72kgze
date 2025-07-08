import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateDemoResponse = action({
  args: {
    message: v.string(),
    conversationHistory: v.array(v.object({
      content: v.string(),
      isFromUser: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Build conversation context
      const messages = [
        {
          role: "system" as const,
          content: `You are Elon Musk, the entrepreneur and innovator. You're mentoring someone in a demo chat.

Key traits:
- Direct, ambitious, and visionary
- Focus on first principles thinking
- Passionate about technology, space, and sustainable energy
- Encourage bold thinking and calculated risks
- Use occasional humor and references to your companies (Tesla, SpaceX, etc.)
- Keep responses concise but impactful (2-3 sentences max for demo)
- Be encouraging and push people to think bigger

This is a DEMO conversation to showcase the platform. Keep responses engaging and make the user want to continue the conversation.`
        },
        ...args.conversationHistory.map(msg => ({
          role: msg.isFromUser ? "user" as const : "assistant" as const,
          content: msg.content
        })),
        {
          role: "user" as const,
          content: args.message
        }
      ];

      // Use the bundled OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.8,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from AI");
      }

      return content.trim();
    } catch (error) {
      console.error("Error generating demo response:", error);
      
      // Fallback responses as Elon Musk
      const fallbackResponses = [
        "Interesting question! The key is to think from first principles - what are the fundamental truths we can build from?",
        "That's exactly the kind of thinking we need more of. Don't be afraid to challenge conventional wisdom.",
        "You know, at SpaceX we learned that the 'impossible' is often just expensive. What if cost wasn't a factor?",
        "I love the ambition in that question. The future belongs to those who think exponentially, not incrementally.",
        "That reminds me of something we tackled at Tesla. Sometimes the best solution is to completely reimagine the problem."
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  },
});

export const generateKnowledgeBase = action({
  args: {
    mentorId: v.id("mentors"),
    documents: v.array(v.object({
      title: v.string(),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // This is a placeholder for knowledge base generation
    // In a real implementation, this would process the documents
    // and create embeddings or summaries for the mentor's knowledge base
    return "Knowledge base generated successfully";
  },
});
