import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { appConfig } from "../config/index.js";

let chatModel: ChatMistralAI;
let embeddings: MistralAIEmbeddings;

export function getChatModel(): ChatMistralAI {
  if (!chatModel) {
    chatModel = new ChatMistralAI({
      model: appConfig.MISTRAL_CHAT_MODEL,
      apiKey: appConfig.MISTRAL_API_KEY,
      temperature: 0.3,
      maxTokens: appConfig.MAX_RESPONSE_LENGTH,
    });
  }
  return chatModel;
}

export function getEmbeddings(): MistralAIEmbeddings {
  if (!embeddings) {
    embeddings = new MistralAIEmbeddings({
      model: appConfig.MISTRAL_EMBED_MODEL,
      apiKey: appConfig.MISTRAL_API_KEY,
    });
  }
  return embeddings;
}
