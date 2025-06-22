import { internalMutation, internalAction, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const getMemory = internalQuery({
  args: {
    userId: v.id("users"),
    mentorId: v.id("mentors"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("memories")
      .withIndex("by_user_and_mentor", (q) => 
        q.eq("userId", args.userId).eq("mentorId", args.mentorId)
      )
      .unique();
    
    return memory;
  },
});

export const updateMemory = internalMutation({
  args: {
    userId: v.id("users"),
    mentorId: v.id("mentors"),
    keyPoints: v.array(v.string()),
    conversationCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existingMemory = await ctx.db
      .query("memories")
      .withIndex("by_user_and_mentor", (q) => 
        q.eq("userId", args.userId).eq("mentorId", args.mentorId)
      )
      .unique();

    if (existingMemory) {
      await ctx.db.patch(existingMemory._id, {
        keyPoints: args.keyPoints,
        lastUpdated: Date.now(),
        conversationCount: args.conversationCount,
      });
    } else {
      await ctx.db.insert("memories", {
        userId: args.userId,
        mentorId: args.mentorId,
        keyPoints: args.keyPoints,
        lastUpdated: Date.now(),
        conversationCount: args.conversationCount,
      });
    }
  },
});

export const extractMemoryFromChat = internalAction({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    mentorId: v.id("mentors"),
  },
  handler: async (ctx, args): Promise<void> => {
    // Get the chat history
    const chat = await ctx.runQuery(internal._internal.chats.getChatHistory, {
      chatId: args.chatId,
    });
    
    if (!chat || !chat.messages || chat.messages.length < 4) {
      // Not enough conversation to extract meaningful memory
      return;
    }

    // Get existing memory
    const existingMemory = await ctx.runQuery(internal._internal.memory.getMemory, {
      userId: args.userId,
      mentorId: args.mentorId,
    });

    // Extract user messages from this chat
    const userMessages = chat.messages
      .filter((msg: any) => msg.isFromUser)
      .map((msg: any) => msg.content)
      .join("\n");

    if (!userMessages.trim()) return;

    // Build context for memory extraction
    const existingKeyPoints = existingMemory?.keyPoints || [];
    const existingMemoryText = existingKeyPoints.length > 0 
      ? `\nExisting memory about this user:\n${existingKeyPoints.map(point => `- ${point}`).join('\n')}`
      : "";

    const prompt = `Extract key information about this user that would be valuable for future conversations. Focus on:
- Business ideas, projects, or ventures they're working on
- Professional goals and aspirations
- Challenges or problems they're facing
- Personal interests relevant to mentorship
- Important context about their background or situation
- Recurring themes or topics they discuss

User's messages from this conversation:
${userMessages}${existingMemoryText}

Return 3-5 concise bullet points of the most important information to remember about this user. Each point should be specific and actionable for future mentorship. If there's overlap with existing memory, consolidate or update the information.

Format as a simple list, one point per line, without bullet symbols:`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert at extracting and summarizing key information for mentorship contexts." },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error("Failed to extract memory:", response.statusText);
        return;
      }

      const data: any = await response.json();
      const memoryText = data.choices[0].message.content.trim();
      
      // Parse the response into key points
      const newKeyPoints = memoryText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 5); // Limit to 5 key points

      if (newKeyPoints.length > 0) {
        const conversationCount = (existingMemory?.conversationCount || 0) + 1;
        
        await ctx.runMutation(internal._internal.memory.updateMemory, {
          userId: args.userId,
          mentorId: args.mentorId,
          keyPoints: newKeyPoints,
          conversationCount,
        });
      }
    } catch (error) {
      console.error("Error extracting memory:", error);
    }
  },
});

export const buildMemoryContext = internalQuery({
  args: {
    userId: v.id("users"),
    mentorId: v.id("mentors"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("memories")
      .withIndex("by_user_and_mentor", (q) => 
        q.eq("userId", args.userId).eq("mentorId", args.mentorId)
      )
      .unique();

    if (!memory || memory.keyPoints.length === 0) {
      return "";
    }

    return `
Previous Context (from ${memory.conversationCount} past conversation${memory.conversationCount !== 1 ? 's' : ''}):
${memory.keyPoints.map(point => `- ${point}`).join('\n')}

Use this context to provide more personalized and relevant advice. Reference past discussions when appropriate, but don't overwhelm the user by mentioning everything at once.`;
  },
});
