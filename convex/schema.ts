import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Additional user profile fields
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    goals: v.optional(v.string()),
    interests: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
    isAdmin: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  settings: defineTable({
    key: v.string(),
    logoImage: v.optional(v.id("_storage")),
  })
    .index("by_key", ["key"]),

  mentors: defineTable({
    name: v.string(),
    bio: v.string(),
    categories: v.array(v.string()),
    personaPrompt: v.string(),
    profileImage: v.optional(v.id("_storage")),
    isActive: v.optional(v.boolean()),
  }),

  chats: defineTable({
    userId: v.id("users"),
    mentorId: v.id("mentors"),
    title: v.string(),
    isActive: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_mentor", ["userId", "mentorId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
    mentorId: v.id("mentors"),
    content: v.string(),
    isFromUser: v.boolean(),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  })
    .index("by_chat", ["chatId"]),

  memories: defineTable({
    userId: v.id("users"),
    mentorId: v.id("mentors"),
    keyPoints: v.array(v.string()),
    lastUpdated: v.number(),
    conversationCount: v.number(),
  })
    .index("by_user_and_mentor", ["userId", "mentorId"]),

  feedback: defineTable({
    message: v.string(),
    email: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    isResolved: v.optional(v.boolean()),
  })
    .index("by_resolved", ["isResolved"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
