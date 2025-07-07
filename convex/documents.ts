import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const uploadDocument = mutation({
  args: {
    mentorId: v.id("mentors"),
    title: v.string(),
    content: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Check if user owns the mentor
    const mentor = await ctx.db.get(args.mentorId);
    if (!mentor || mentor.createdBy !== userId) {
      throw new Error("Not authorized to add documents to this mentor");
    }

    const documentId = await ctx.db.insert("documents", {
      mentorId: args.mentorId,
      title: args.title,
      content: args.content,
      fileType: args.fileType,
      uploadedBy: userId,
      isActive: true,
    });

    return documentId;
  },
});

export const listByMentor = query({
  args: { mentorId: v.id("mentors") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("mentorId"), args.mentorId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return documents;
  },
});

export const searchDocuments = action({
  args: {
    mentorId: v.id("mentors"),
    query: v.string(),
  },
  handler: async (ctx, args): Promise<Array<{title: string, content: string}>> => {
    // Simple text search - in production you'd use vector embeddings
    const documents: any = await ctx.runQuery(api.documents.listByMentor, {
      mentorId: args.mentorId,
    });

    const queryLower = args.query.toLowerCase();
    const relevantDocs: any = documents
      .filter((doc: any) => 
        doc.title.toLowerCase().includes(queryLower) ||
        doc.content.toLowerCase().includes(queryLower)
      )
      .slice(0, 3); // Limit to top 3 results

    return relevantDocs.map((doc: any) => ({
      title: doc.title,
      content: doc.content.substring(0, 500) + "...", // Truncate for context
    }));
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user owns the document
    if (document.uploadedBy !== userId) {
      throw new Error("Not authorized to delete this document");
    }

    await ctx.db.patch(args.documentId, { isActive: false });
    return args.documentId;
  },
});
