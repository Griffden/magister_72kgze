import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const mentors = await ctx.db.query("mentors")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return Promise.all(
      mentors.map(async (mentor) => ({
        ...mentor,
        profileImageUrl: mentor.profileImage 
          ? await ctx.storage.getUrl(mentor.profileImage)
          : null,
      }))
    );
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) {
      throw new Error("Must be admin to list all mentors");
    }

    const mentors = await ctx.db.query("mentors").collect();

    return Promise.all(
      mentors.map(async (mentor) => ({
        ...mentor,
        profileImageUrl: mentor.profileImage 
          ? await ctx.storage.getUrl(mentor.profileImage)
          : null,
      }))
    );
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const mentors = await ctx.db.query("mentors")
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect();

    return Promise.all(
      mentors.map(async (mentor) => ({
        ...mentor,
        profileImageUrl: mentor.profileImage 
          ? await ctx.storage.getUrl(mentor.profileImage)
          : null,
      }))
    );
  },
});

export const getById = query({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const mentor = await ctx.db.get(args.mentorId);
    if (!mentor) return null;

    return {
      ...mentor,
      profileImageUrl: mentor.profileImage 
        ? await ctx.storage.getUrl(mentor.profileImage)
        : null,
    };
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const mentors = await ctx.db.query("mentors")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const filteredMentors = mentors.filter(mentor => 
      mentor.categories.includes(args.category)
    );

    return Promise.all(
      filteredMentors.map(async (mentor) => ({
        ...mentor,
        profileImageUrl: mentor.profileImage 
          ? await ctx.storage.getUrl(mentor.profileImage)
          : null,
      }))
    );
  },
});

export const generateMentorSuggestions = action({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to generate suggestions");
    }

    try {
      // Use your own OpenAI API
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
              content: `You are an AI assistant helping users create mentor profiles. Given a mentor name, generate appropriate bio, tags, and persona prompt suggestions.

IMPORTANT: Return ONLY a valid JSON object with this exact structure (no markdown formatting, no code blocks):
{
  "bio": "A concise 1-2 sentence bio (max 120 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "personaPrompt": "A detailed persona prompt describing how this mentor should behave, their expertise, communication style, and personality traits (200-500 words)"
}

Guidelines:
- Bio should be professional and highlight key expertise
- Tags should be relevant categories/skills (5-8 tags max)
- Persona prompt should be detailed and specific about:
  * Their background and expertise
  * Communication style and personality
  * How they help mentees
  * Specific knowledge areas
  * Approach to mentoring

Make the suggestions realistic and professional.`
            },
            {
              role: "user",
              content: `Generate mentor profile suggestions for: "${args.name}"`
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
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
      try {
        const suggestions = JSON.parse(cleanedContent);
        
        // Validate the structure
        if (!suggestions.bio || !suggestions.tags || !suggestions.personaPrompt) {
          throw new Error("Invalid response structure");
        }

        // Ensure tags is an array
        if (!Array.isArray(suggestions.tags)) {
          throw new Error("Tags must be an array");
        }

        // Truncate bio if too long
        if (suggestions.bio.length > 120) {
          suggestions.bio = suggestions.bio.substring(0, 117) + "...";
        }

        // Limit tags to 8 items
        if (suggestions.tags.length > 8) {
          suggestions.tags = suggestions.tags.slice(0, 8);
        }

        // Truncate persona prompt if too long
        if (suggestions.personaPrompt.length > 1000) {
          suggestions.personaPrompt = suggestions.personaPrompt.substring(0, 997) + "...";
        }

        return suggestions;
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw content:", content);
        console.error("Cleaned content:", cleanedContent);
        throw new Error("Failed to parse AI suggestions");
      }
    } catch (error) {
      console.error("Error generating mentor suggestions:", error);
      throw new Error("Failed to generate mentor suggestions. Please try again.");
    }
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    bio: v.string(),
    personaPrompt: v.string(),
    categories: v.array(v.string()),
    profileImage: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a mentor");
    }

    const mentorId = await ctx.db.insert("mentors", {
      name: args.name,
      bio: args.bio,
      personaPrompt: args.personaPrompt,
      categories: args.categories,
      profileImage: args.profileImage,
      isActive: true,
      chatCount: 0,
      createdBy: userId,
      rating: 0,
      ratingCount: 0,
    });

    return mentorId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to upload images");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const update = mutation({
  args: {
    mentorId: v.id("mentors"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    personaPrompt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    profileImage: v.optional(v.id("_storage")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const mentor = await ctx.db.get(args.mentorId);
    if (!mentor) {
      throw new Error("Mentor not found");
    }

    // Check if user is the creator or an admin
    const user = await ctx.db.get(userId);
    if (mentor.createdBy !== userId && !user?.isAdmin) {
      throw new Error("Not authorized to update this mentor");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.personaPrompt !== undefined) updates.personaPrompt = args.personaPrompt;
    if (args.categories !== undefined) updates.categories = args.categories;
    if (args.profileImage !== undefined) updates.profileImage = args.profileImage;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.mentorId, updates);
    return args.mentorId;
  },
});

export const deactivate = mutation({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) {
      throw new Error("Must be admin to deactivate mentors");
    }

    await ctx.db.patch(args.mentorId, { isActive: false });
    return args.mentorId;
  },
});

export const reactivate = mutation({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) {
      throw new Error("Must be admin to reactivate mentors");
    }

    await ctx.db.patch(args.mentorId, { isActive: true });
    return args.mentorId;
  },
});

export const delete_ = mutation({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const mentor = await ctx.db.get(args.mentorId);
    if (!mentor) {
      throw new Error("Mentor not found");
    }

    // Check if user is the creator or an admin
    const user = await ctx.db.get(userId);
    if (mentor.createdBy !== userId && !user?.isAdmin) {
      throw new Error("Not authorized to delete this mentor");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.mentorId, { isActive: false });
    return args.mentorId;
  },
});
