import { v } from "convex/values";
import { mutation, query, action, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

export const create = mutation({
  args: {
    mentorId: v.id("mentors"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a chat");
    }

    const chatId = await ctx.db.insert("chats", {
      userId,
      mentorId: args.mentorId,
      title: args.title,
      isActive: true,
      lastMessageTime: Date.now(),
    });

    return chatId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    return Promise.all(
      chats.map(async (chat) => {
        const mentor = await ctx.db.get(chat.mentorId);
        return {
          ...chat,
          mentorName: mentor?.name || "Unknown Mentor",
          mentorProfileImageUrl: mentor?.profileImage 
            ? await ctx.storage.getUrl(mentor.profileImage)
            : null,
        };
      })
    );
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runQuery(api.chats.list);
  },
});

export const getById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      return null;
    }

    const mentor = await ctx.db.get(chat.mentorId);
    return {
      ...chat,
      mentorName: mentor?.name || "Unknown Mentor",
      mentorProfileImageUrl: mentor?.profileImage 
        ? await ctx.storage.getUrl(mentor.profileImage)
        : null,
    };
  },
});

export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    isFromUser: v.boolean(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to send messages");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    let imageUrl: string | undefined;
    if (args.imageId) {
      imageUrl = (await ctx.storage.getUrl(args.imageId)) || undefined;
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      userId,
      mentorId: chat.mentorId,
      content: args.content,
      isFromUser: args.isFromUser,
      imageId: args.imageId,
      imageUrl,
      timestamp: Date.now(),
    });

    // Update chat's last message time
    await ctx.db.patch(args.chatId, {
      lastMessageTime: Date.now(),
    });

    // If this is a user message, schedule streaming AI response generation
    if (args.isFromUser) {
      await ctx.scheduler.runAfter(0, api.streaming.generateStreamingResponse, {
        chatId: args.chatId,
        userMessage: args.content,
      });
    }

    return messageId;
  },
});

export const getMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return Promise.all(
      messages.map(async (message) => ({
        ...message,
        imageUrl: message.imageId 
          ? await ctx.storage.getUrl(message.imageId)
          : message.imageUrl,
      }))
    );
  },
});

export const generateResponse = action({
  args: {
    chatId: v.id("chats"),
    userMessage: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Note: Auth state doesn't propagate to scheduled jobs, so we use internal functions
    
    // Get chat and mentor info using internal functions
    const chat: any = await ctx.runQuery(internal._internal.chats.getByIdInternal, { chatId: args.chatId });
    if (!chat) {
      throw new Error("Chat not found");
    }

    const mentor: any = await ctx.runQuery(api.mentors.getById, { mentorId: chat.mentorId });
    if (!mentor) {
      throw new Error("Mentor not found");
    }

    // Get recent messages for context using internal function
    const messages = await ctx.runQuery(internal._internal.chats.getMessagesInternal, { chatId: args.chatId });
    const recentMessages = messages.slice(-10); // Last 10 messages

    // Search knowledge base for relevant documents
    const relevantDocs = await ctx.runAction(api.documents.searchDocuments, {
      mentorId: chat.mentorId,
      query: args.userMessage,
    });

    // Build context for AI
    let contextPrompt: string = `You are ${mentor.name}, an AI mentor. ${mentor.personaPrompt}\n\n`;
    
    if (relevantDocs.length > 0) {
      contextPrompt += "Relevant knowledge from your knowledge base:\n";
      relevantDocs.forEach((doc: any, index: number) => {
        contextPrompt += `${index + 1}. ${doc.title}: ${doc.content}\n`;
      });
      contextPrompt += "\n";
    }

    contextPrompt += "Recent conversation:\n";
    recentMessages.forEach((msg: any) => {
      const role = msg.isFromUser ? "User" : mentor.name;
      contextPrompt += `${role}: ${msg.content}\n`;
    });

    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.");
      }

      // Initialize OpenAI client with your API key
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: contextPrompt,
          },
          {
            role: "user",
            content: args.userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response content from OpenAI");
      }

      // Save AI response as a message using internal function
      await ctx.runMutation(internal._internal.chats.sendMessageInternal, {
        chatId: args.chatId,
        content: aiResponse,
        isFromUser: false,
      });

      return aiResponse;
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          throw new Error("OpenAI API key not configured. Please set your OPENAI_API_KEY in environment variables.");
        } else if (error.message.includes("401")) {
          throw new Error("Invalid OpenAI API key. Please check your OPENAI_API_KEY in environment variables.");
        } else if (error.message.includes("429")) {
          throw new Error("OpenAI API rate limit exceeded. Please try again in a moment.");
        } else if (error.message.includes("500")) {
          throw new Error("OpenAI API is experiencing issues. Please try again later.");
        }
      }
      
      throw new Error("Failed to generate response. Please try again.");
    }
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

export const updateTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    await ctx.db.patch(args.chatId, { title: args.title });
    return args.chatId;
  },
});

export const delete_ = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.chatId, { isActive: false });
    return args.chatId;
  },
});
