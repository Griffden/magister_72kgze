import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const mentors = await ctx.db
      .query("mentors")
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect();

    return Promise.all(
      mentors.map(async (mentor) => {
        let profileImageUrl = null;
        if (mentor.profileImage) {
          profileImageUrl = await ctx.storage.getUrl(mentor.profileImage);
        }

        return {
          ...mentor,
          profileImageUrl,
        };
      })
    );
  },
});

export const listAll = query({
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

    const mentors = await ctx.db
      .query("mentors")
      .collect();

    return Promise.all(
      mentors.map(async (mentor) => {
        let profileImageUrl = null;
        if (mentor.profileImage) {
          profileImageUrl = await ctx.storage.getUrl(mentor.profileImage);
        }

        return {
          ...mentor,
          profileImageUrl,
        };
      })
    );
  },
});

export const getById = query({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const mentor = await ctx.db.get(args.mentorId);
    if (!mentor || mentor.isActive === false) {
      return null;
    }

    let profileImageUrl = null;
    if (mentor.profileImage) {
      profileImageUrl = await ctx.storage.getUrl(mentor.profileImage);
    }

    return {
      ...mentor,
      profileImageUrl,
    };
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const mentors = await ctx.db
      .query("mentors")
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect();

    // Filter mentors that actually contain the category
    const filteredMentors = mentors.filter(mentor =>
      mentor.categories.some(cat =>
        cat.toLowerCase().includes(args.category.toLowerCase()) ||
        args.category.toLowerCase().includes(cat.toLowerCase())
      )
    );

    return Promise.all(
      filteredMentors.map(async (mentor) => {
        let profileImageUrl = null;
        if (mentor.profileImage) {
          profileImageUrl = await ctx.storage.getUrl(mentor.profileImage);
        }

        return {
          ...mentor,
          profileImageUrl,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    bio: v.string(),
    categories: v.array(v.string()),
    personaPrompt: v.string(),
    profileImage: v.optional(v.id("_storage")),
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

    return await ctx.db.insert("mentors", {
      name: args.name,
      bio: args.bio,
      categories: args.categories,
      personaPrompt: args.personaPrompt,
      profileImage: args.profileImage,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    mentorId: v.id("mentors"),
    name: v.string(),
    bio: v.string(),
    categories: v.array(v.string()),
    personaPrompt: v.string(),
    profileImage: v.optional(v.id("_storage")),
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

    await ctx.db.patch(args.mentorId, {
      name: args.name,
      bio: args.bio,
      categories: args.categories,
      personaPrompt: args.personaPrompt,
      profileImage: args.profileImage,
    });
  },
});

export const deactivate = mutation({
  args: {
    mentorId: v.id("mentors"),
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

    await ctx.db.patch(args.mentorId, {
      isActive: false,
    });
  },
});

export const reactivate = mutation({
  args: {
    mentorId: v.id("mentors"),
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

    await ctx.db.patch(args.mentorId, {
      isActive: true,
    });
  },
});

export const generateUploadUrl = mutation({
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

    return await ctx.storage.generateUploadUrl();
  },
});
