import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

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
    try {
      // Get mentor information
      const mentor = await ctx.runQuery(api.mentors.getById, { mentorId: args.mentorId });
      if (!mentor) {
        throw new Error("Mentor not found");
      }

      // Get current user to check authorization
      const userId = await ctx.runQuery(api.auth.loggedInUser);
      if (!userId || mentor.createdBy !== userId._id) {
        throw new Error("Not authorized to generate knowledge base for this mentor");
      }

      // Create prompt for generating knowledge base documents
      const existingDocsContext = args.documents.length > 0 
        ? `\n\nExisting documents:\n${args.documents.map(doc => `- ${doc.title}: ${doc.content.substring(0, 200)}...`).join('\n')}`
        : "";

      const prompt = `You are helping to create a comprehensive knowledge base for an AI mentor named "${mentor.name}".

Mentor Bio: ${mentor.bio}
Mentor Categories: ${mentor.categories.join(', ')}
Mentor Persona: ${mentor.personaPrompt}${existingDocsContext}

Generate 3-5 diverse knowledge base documents that would help this mentor provide better guidance. Each document should be substantial (300-800 words) and cover different aspects of the mentor's expertise.

Return your response as a JSON array with this exact format:
[
  {
    "title": "Document Title",
    "content": "Detailed content here..."
  }
]

Focus on practical advice, frameworks, methodologies, case studies, and insights that align with the mentor's expertise and persona.`;

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert knowledge curator. Generate comprehensive, well-structured documents that would be valuable for an AI mentor's knowledge base. Always respond with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
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

      // Parse the JSON response
      let generatedDocs;
      try {
        generatedDocs = JSON.parse(content);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedDocs = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }

      if (!Array.isArray(generatedDocs)) {
        throw new Error("AI response is not an array");
      }

      // Add each generated document to the knowledge base
      let addedCount = 0;
      for (const doc of generatedDocs) {
        if (doc.title && doc.content) {
          try {
            await ctx.runMutation(api.documents.uploadDocument, {
              mentorId: args.mentorId,
              title: doc.title,
              content: doc.content,
              fileType: "ai-generated",
            });
            addedCount++;
          } catch (error) {
            console.error(`Failed to add document "${doc.title}":`, error);
          }
        }
      }

      return `Successfully generated and added ${addedCount} documents to the knowledge base!`;

    } catch (error) {
      console.error("Error generating knowledge base:", error);
      throw new Error("Failed to generate knowledge base. Please ensure your OpenAI API key is configured.");
    }
  },
});
