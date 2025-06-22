import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submit = mutation({
  args: {
    message: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    if (!args.message.trim()) {
      throw new Error("Feedback message cannot be empty");
    }

    await ctx.db.insert("feedback", {
      message: args.message.trim(),
      email: args.email?.trim() || undefined,
      userId: userId || undefined,
      isResolved: false,
    });
  },
});

export const list = query({
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

    const feedback = await ctx.db
      .query("feedback")
      .order("desc")
      .collect();

    return Promise.all(
      feedback.map(async (item) => {
        let userName = null;
        if (item.userId) {
          const user = await ctx.db.get(item.userId);
          userName = user?.name || user?.username || "Unknown User";
        }

        return {
          ...item,
          userName,
        };
      })
    );
  },
});

export const markResolved = mutation({
  args: {
    feedbackId: v.id("feedback"),
    isResolved: v.boolean(),
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

    await ctx.db.patch(args.feedbackId, {
      isResolved: args.isResolved,
    });
  },
});

export const deleteFeedback = mutation({
  args: {
    feedbackId: v.id("feedback"),
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

    await ctx.db.delete(args.feedbackId);
  },
});
