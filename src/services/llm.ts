import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from "openai";
import { appConfig } from "../config/index.js";

type LangChainChatModel = ChatMistralAI | ChatOpenAI;
type LangChainEmbeddings = MistralAIEmbeddings | OpenAIEmbeddings;

let chatModel: LangChainChatModel;
let embeddings: LangChainEmbeddings;
let openAIClient: OpenAI;

// Used by the "mistral-langchain" and "openai-langchain" backends, where the
// chat call runs inside a LangChain RunnableSequence. Not used by
// "openai-responses", which calls the OpenAI client directly.
export function getChatModel(): LangChainChatModel {
  if (!chatModel) {
    chatModel =
      appConfig.LLM_BACKEND === "openai-langchain"
        ? new ChatOpenAI({
            model: appConfig.OPENAI_CHAT_MODEL,
            apiKey: appConfig.OPENAI_API_KEY,
            temperature: 0.3,
            maxTokens: appConfig.MAX_RESPONSE_TOKENS,
          })
        : new ChatMistralAI({
            model: appConfig.MISTRAL_CHAT_MODEL,
            apiKey: appConfig.MISTRAL_API_KEY,
            temperature: 0.3,
            maxTokens: appConfig.MAX_RESPONSE_TOKENS,
          });
  }
  return chatModel;
}

// RAG retrieval always goes through a LangChain embeddings model, regardless
// of which backend generates the chat response.
export function getEmbeddings(): LangChainEmbeddings {
  if (!embeddings) {
    embeddings =
      appConfig.LLM_BACKEND === "mistral-langchain"
        ? new MistralAIEmbeddings({
            model: appConfig.MISTRAL_EMBED_MODEL,
            apiKey: appConfig.MISTRAL_API_KEY,
          })
        : new OpenAIEmbeddings({
            model: appConfig.OPENAI_EMBED_MODEL,
            apiKey: appConfig.OPENAI_API_KEY,
          });
  }
  return embeddings;
}

// Used only by the "openai-responses" backend, which calls OpenAI's
// Responses API directly instead of going through LangChain.
export function getOpenAIClient(): OpenAI {
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: appConfig.OPENAI_API_KEY });
  }
  return openAIClient;
}
