import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

export const generateStreamingResponse = action({
  args: {
    chatId: v.id("chats"),
    userMessage: v.string(),
  },
  handler: async (ctx, args): Promise<{ messageId: string }> => {
    const chat: any = await ctx.runQuery(internal._internal.chats.getByIdInternal, { chatId: args.chatId });
    if (!chat) throw new Error("Chat not found");

    const mentor: any = await ctx.runQuery(api.mentors.getById, { mentorId: chat.mentorId });
    if (!mentor) throw new Error("Mentor not found");

    const messages = await ctx.runQuery(internal._internal.chats.getMessagesInternal, { chatId: args.chatId });
    const recentMessages = messages.slice(-10);

    const relevantDocs = await ctx.runAction(api.documents.searchDocuments, {
      mentorId: chat.mentorId,
      query: args.userMessage,
    });

    let contextPrompt = `You are ${mentor.name}, an AI mentor. ${mentor.personaPrompt}\n\n`;
    
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

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const messageId = await ctx.runMutation(internal._internal.chats.sendMessageInternal, {
      chatId: args.chatId,
      content: "",
      isFromUser: false,
    });

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: contextPrompt },
          { role: "user", content: args.userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      });

      let fullResponse = "";
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          await ctx.runMutation(internal._internal.chats.updateMessageContent, {
            messageId: messageId,
            content: fullResponse,
          });
        }
      }

      if (!fullResponse) {
        throw new Error("No response content from OpenAI");
      }

      return { messageId };
    } catch (error) {
      console.error("Error generating streaming AI response:", error);
      
      // Update the message with an error
      await ctx.runMutation(internal._internal.chats.updateMessageContent, {
        messageId: messageId,
        content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
      });
      
      throw error;
    }
  },
});
