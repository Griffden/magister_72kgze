import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const deleteAllChatsWithMentor = mutation({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get all chats with this mentor
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_and_mentor", (q) => 
        q.eq("userId", userId).eq("mentorId", args.mentorId)
      )
      .collect();
    
    // Delete all messages and chats
    for (const chat of chats) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();
      
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      
      await ctx.db.delete(chat._id);
    }
    
    // Also delete the memory for this user-mentor pair
    const memory = await ctx.db
      .query("memories")
      .withIndex("by_user_and_mentor", (q) => 
        q.eq("userId", userId).eq("mentorId", args.mentorId)
      )
      .unique();
    
    if (memory) {
      await ctx.db.delete(memory._id);
    }
  },
});
