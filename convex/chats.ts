import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect();
    
    return Promise.all(
      chats.map(async (chat) => {
        const mentor = await ctx.db.get(chat.mentorId);
        return {
          ...chat,
          mentor: mentor ? {
            ...mentor,
            profileImageUrl: mentor.profileImage 
              ? await ctx.storage.getUrl(mentor.profileImage)
              : null,
          } : null,
        };
      })
    );
  },
});

export const getById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId || chat.isActive === false) {
      return null;
    }
    
    const mentor = await ctx.db.get(chat.mentorId);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    // Add image URLs to messages
    const messagesWithImages = await Promise.all(
      messages.map(async (message) => ({
        ...message,
        imageUrl: message.imageId ? await ctx.storage.getUrl(message.imageId) : null,
      }))
    );
    
    return {
      ...chat,
      mentor: mentor ? {
        ...mentor,
        profileImageUrl: mentor.profileImage 
          ? await ctx.storage.getUrl(mentor.profileImage)
          : null,
      } : null,
      messages: messagesWithImages,
    };
  },
});

export const create = mutation({
  args: { 
    mentorId: v.id("mentors"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const mentor = await ctx.db.get(args.mentorId);
    if (!mentor) {
      throw new Error("Mentor not found");
    }
    
    return await ctx.db.insert("chats", {
      userId,
      mentorId: args.mentorId,
      title: args.title || `Chat with ${mentor.name}`,
      isActive: true,
    });
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
      throw new Error("Not authenticated");
    }
    
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or not authorized");
    }
    
    await ctx.db.patch(args.chatId, { title: args.title });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendMessage = action({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get chat and verify ownership
    const chat = await ctx.runQuery(api.chats.getById, { chatId: args.chatId });
    if (!chat || !chat.mentor) {
      throw new Error("Chat not found");
    }
    
    // Get user profile for context
    const user = await ctx.runQuery(api.users.getProfile, {});
    
    // Save user message
    await ctx.runMutation(internal._internal.chats.saveMessage, {
      chatId: args.chatId,
      userId,
      mentorId: chat.mentorId,
      content: args.content,
      isFromUser: true,
      imageId: args.imageId,
    });
    
    // Generate AI response
    const response = await ctx.runAction(internal._internal.chats.generateAIResponse, {
      chatId: args.chatId,
      userMessage: args.content,
      mentor: chat.mentor,
      user,
      userId,
      mentorId: chat.mentorId,
      imageId: args.imageId,
    });
    
    // Save AI response
    await ctx.runMutation(internal._internal.chats.saveMessage, {
      chatId: args.chatId,
      userId,
      mentorId: chat.mentorId,
      content: response,
      isFromUser: false,
    });
    
    // Auto-generate title if this is the first message
    if (chat.messages.length === 0) {
      await ctx.runAction(internal._internal.chats.generateChatTitle, {
        chatId: args.chatId,
        firstMessage: args.content,
      });
    }
    
    // Extract and update memory after every few messages
    const totalMessages = chat.messages.length + 2; // +2 for the messages we just added
    if (totalMessages >= 6 && totalMessages % 4 === 0) {
      // Extract memory every 4 messages after the first 6
      await ctx.runAction(internal._internal.memory.extractMemoryFromChat, {
        chatId: args.chatId,
        userId,
        mentorId: chat.mentorId,
      });
    }
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or not authorized");
    }
    
    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});
