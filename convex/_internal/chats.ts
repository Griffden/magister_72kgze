import { internalMutation, internalAction, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const saveMessage = internalMutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    mentorId: v.id("mentors"),
    content: v.string(),
    isFromUser: v.boolean(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", args);
  },
});

export const generateAIResponse = internalAction({
  args: {
    chatId: v.id("chats"),
    userMessage: v.string(),
    mentor: v.any(),
    user: v.any(),
    userId: v.id("users"),
    mentorId: v.id("mentors"),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get recent chat history
    const chat = await ctx.runQuery(internal._internal.chats.getChatHistory, {
      chatId: args.chatId,
    });
    
    const messages = chat?.messages || [];
    const recentMessages = messages.slice(-10); // Last 10 messages for context
    
    // Build conversation history
    const conversationHistory = recentMessages.map((msg: any) => ({
      role: msg.isFromUser ? "user" as const : "assistant" as const,
      content: msg.content,
    }));
    
    // Get memory context for this user-mentor pair
    const memoryContext = await ctx.runQuery(internal._internal.memory.buildMemoryContext, {
      userId: args.userId,
      mentorId: args.mentorId,
    });
    
    // Build system prompt with user context and memory
    const userContext = args.user ? `
User Profile:
- Name: ${args.user.username || args.user.name || "User"}
- Bio: ${args.user.bio || "Not provided"}
- Goals: ${args.user.goals || "Not specified"}
- Interests: ${args.user.interests || "Not specified"}
` : "";
    
    let imageContext = "";
    if (args.imageId) {
      imageContext = "\n\nThe user has shared an image with their message. Please acknowledge the image and provide relevant feedback or analysis based on what you can see in the image.";
    }
    
    const systemPrompt = `${args.mentor.personaPrompt}

${userContext}${memoryContext}${imageContext}

Remember to stay in character and provide valuable, actionable advice based on your expertise, the user's background, and your previous conversations with them.`;
    
    // Prepare messages for OpenAI
    const openAIMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ];
    
    // Add the current user message with image if present
    if (args.imageId) {
      // Get image URL for vision analysis
      const imageUrl = await ctx.storage.getUrl(args.imageId);
      if (imageUrl) {
        openAIMessages.push({
          role: "user",
          content: [
            { type: "text", text: args.userMessage },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        });
      } else {
        openAIMessages.push({ role: "user", content: args.userMessage });
      }
    } else {
      openAIMessages.push({ role: "user", content: args.userMessage });
    }
    
    // Call OpenAI with vision model if image is present
    const model = args.imageId ? "gpt-4o" : "gpt-4o-mini";
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: openAIMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data: any = await response.json();
    return data.choices[0].message.content;
  },
});

export const generateChatTitle = internalAction({
  args: {
    chatId: v.id("chats"),
    firstMessage: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate a short, descriptive title (max 6 words) for a chat conversation based on the first message. Return only the title, no quotes or extra text.",
          },
          {
            role: "user",
            content: args.firstMessage,
          },
        ],
        max_tokens: 20,
        temperature: 0.3,
      }),
    });
    
    if (response.ok) {
      const data: any = await response.json();
      const title = data.choices[0].message.content.trim();
      
      await ctx.runMutation(internal._internal.chats.updateChatTitle, {
        chatId: args.chatId,
        title,
      });
    }
  },
});

export const getChatHistory = internalQuery({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    return { ...chat, messages };
  },
});

export const updateChatTitle = internalMutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, { title: args.title });
  },
});
