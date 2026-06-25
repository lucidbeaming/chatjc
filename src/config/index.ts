import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z
  .object({
    LLM_BACKEND: z
      .enum(["mistral-langchain", "openai-langchain", "openai-responses"])
      .default("mistral-langchain"),
    MISTRAL_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    API_KEY: z.string().min(1, "API_KEY is required"),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default("127.0.0.1"),
    DB_PATH: z.string().default("./data/chatjc.db"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    RATE_LIMIT_MAX: z.coerce.number().default(20),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    MAX_INPUT_LENGTH: z.coerce.number().default(500),
    MAX_RESPONSE_LENGTH: z.coerce.number().default(2000),
    MAX_RESPONSE_TOKENS: z.coerce.number().default(600),
    MISTRAL_CHAT_MODEL: z.string().default("mistral-small-latest"),
    MISTRAL_EMBED_MODEL: z.string().default("mistral-embed"),
    OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
    OPENAI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
    CONTEXT_DIR: z.string().default("./context/mock"),
    RAG_CHUNK_SIZE: z.coerce.number().default(1000),
    RAG_CHUNK_OVERLAP: z.coerce.number().default(200),
    RAG_TOP_K: z.coerce.number().default(4),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_BACKEND === "mistral-langchain" && !data.MISTRAL_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MISTRAL_API_KEY"],
        message: "MISTRAL_API_KEY is required when LLM_BACKEND=mistral-langchain",
      });
    }
    if (data.LLM_BACKEND !== "mistral-langchain" && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message:
          "OPENAI_API_KEY is required when LLM_BACKEND is openai-langchain or openai-responses",
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

let _appConfig: EnvConfig | null = null;

export const appConfig: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop) {
    if (!_appConfig) {
      try {
        _appConfig = envSchema.parse(process.env);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const missing = error.issues.map((i) => i.path.join(".")).join(", ");
          console.error(`Configuration error: ${missing}`);
          process.exit(1);
        }
        throw error;
      }
    }
    return _appConfig[prop as keyof EnvConfig];
  },
});
