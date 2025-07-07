import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const generateKnowledgeBase = action({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Check if user owns the mentor
    const mentor = await ctx.runQuery(api.mentors.getById, { mentorId: args.mentorId });
    if (!mentor || mentor.createdBy !== userId) {
      throw new Error("Not authorized to generate knowledge base for this mentor");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant helping to generate knowledge base documents for a mentor named "${mentor.name}".

Based on the mentor's information:
- Name: ${mentor.name}
- Bio: ${mentor.bio}
- Categories: ${mentor.categories.join(", ")}
- Persona: ${mentor.personaPrompt}

Generate 3-5 comprehensive knowledge base documents that would help this mentor provide better guidance. Each document should be practical, actionable, and relevant to their expertise areas.

IMPORTANT: Return ONLY a valid JSON array with this exact structure (no markdown formatting, no code blocks):
[
  {
    "title": "Document title (concise but descriptive)",
    "content": "Detailed content (500-1000 words) with practical advice, frameworks, best practices, or methodologies relevant to the mentor's expertise"
  }
]

Make the content specific, actionable, and valuable. Include frameworks, methodologies, best practices, common challenges and solutions, step-by-step guides, or other practical knowledge that would help the mentor provide better guidance.`
            },
            {
              role: "user",
              content: `Generate knowledge base documents for ${mentor.name} who specializes in: ${mentor.categories.join(", ")}`
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
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

      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      if (cleanedContent.startsWith('```')) {
        const lines = cleanedContent.split('\n');
        // Remove first line if it's ```json or ```
        if (lines[0].match(/^```(json)?$/)) {
          lines.shift();
        }
        // Remove last line if it's ```
        if (lines[lines.length - 1] === '```') {
          lines.pop();
        }
        cleanedContent = lines.join('\n').trim();
      }

      // Parse the JSON response
      let documents;
      try {
        documents = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw content:", content);
        console.error("Cleaned content:", cleanedContent);
        throw new Error("Failed to parse AI response");
      }

      if (!Array.isArray(documents)) {
        throw new Error("Invalid response format - expected array");
      }

      // Create documents in the database
      let documentsCreated = 0;
      for (const doc of documents) {
        if (doc.title && doc.content) {
          await ctx.runMutation(api.documents.uploadDocument, {
            mentorId: args.mentorId,
            title: doc.title,
            content: doc.content,
            fileType: "generated",
          });
          documentsCreated++;
        }
      }

      return { documentsCreated };
    } catch (error) {
      console.error("Error generating knowledge base:", error);
      throw new Error("Failed to generate knowledge base. Please ensure your OpenAI API key is configured.");
    }
  },
});
