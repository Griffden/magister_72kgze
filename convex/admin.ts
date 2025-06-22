import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listMemories = query({
  args: {
    userId: v.optional(v.id("users")),
    mentorId: v.optional(v.id("mentors")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db.get(currentUserId);
    if (!user?.isAdmin) {
      throw new Error("Not authorized");
    }

    let query = ctx.db.query("memories");
    
    if (args.userId && args.mentorId) {
      const memories = await query
        .withIndex("by_user_and_mentor", (q) => 
          q.eq("userId", args.userId!).eq("mentorId", args.mentorId!)
        )
        .collect();
      return memories;
    }
    
    const memories = await query.collect();
    
    return Promise.all(
      memories.map(async (memory) => {
        const user = await ctx.db.get(memory.userId);
        const mentor = await ctx.db.get(memory.mentorId);
        
        return {
          ...memory,
          userName: user?.name || user?.username || "Unknown User",
          mentorName: mentor?.name || "Unknown Mentor",
        };
      })
    );
  },
});

export const getMemoryStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db.get(currentUserId);
    if (!user?.isAdmin) {
      throw new Error("Not authorized");
    }

    const memories = await ctx.db.query("memories").collect();
    
    const stats = {
      totalMemories: memories.length,
      totalConversations: memories.reduce((sum, m) => sum + m.conversationCount, 0),
      averageKeyPoints: memories.length > 0 
        ? memories.reduce((sum, m) => sum + m.keyPoints.length, 0) / memories.length 
        : 0,
      mostActiveUsers: memories
        .sort((a, b) => b.conversationCount - a.conversationCount)
        .slice(0, 5)
        .map(m => ({
          userId: m.userId,
          mentorId: m.mentorId,
          conversationCount: m.conversationCount,
        })),
    };
    
    return stats;
  },
});

export const getLogo = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "app_logo"))
      .unique();
    
    if (!settings?.logoImage) {
      return null;
    }
    
    const logoUrl = await ctx.storage.getUrl(settings.logoImage);
    return logoUrl;
  },
});

export const updateLogo = mutation({
  args: { logoImage: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) {
      throw new Error("Not authorized");
    }
    
    const existingSettings = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "app_logo"))
      .unique();
    
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        logoImage: args.logoImage,
      });
    } else {
      await ctx.db.insert("settings", {
        key: "app_logo",
        logoImage: args.logoImage,
      });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) {
      throw new Error("Not authorized");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});
