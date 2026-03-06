import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  MISTRAL_API_KEY: z.string().min(1, "MISTRAL_API_KEY is required"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DB_PATH: z.string().default("./data/chatjc.db"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CORS_ORIGIN: z.string().default("https://joshuacurry.dev"),
  RATE_LIMIT_MAX: z.coerce.number().default(20),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  MAX_INPUT_LENGTH: z.coerce.number().default(500),
  MAX_RESPONSE_LENGTH: z.coerce.number().default(1000),
  MISTRAL_CHAT_MODEL: z.string().default("mistral-small-latest"),
  MISTRAL_EMBED_MODEL: z.string().default("mistral-embed"),
  CONTEXT_DIR: z.string().default("./context/mock"),
  RAG_CHUNK_SIZE: z.coerce.number().default(1000),
  RAG_CHUNK_OVERLAP: z.coerce.number().default(200),
  RAG_TOP_K: z.coerce.number().default(4),
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
