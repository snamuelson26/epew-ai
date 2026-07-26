import type {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Artificial intelligence providers supported by the IBOS contract.
 */
export type AIProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "azure"
  | "local"
  | "custom";

/**
 * General AI task categories.
 */
export type AITaskType =
  | "conversation"
  | "completion"
  | "classification"
  | "summarization"
  | "translation"
  | "content_generation"
  | "recommendation"
  | "analysis"
  | "extraction"
  | "moderation"
  | "embedding"
  | "workflow_assistance"
  | "decision_support"
  | "custom";

/**
 * Supported AI message roles.
 */
export type AIMessageRole =
  | "system"
  | "user"
  | "assistant"
  | "tool";

/**
 * AI engine configuration.
 */
export interface AIEngineConfig extends EngineConfig {
  provider?: AIProvider;
  model?: string;
  apiEndpoint?: string;
  temperature?: number;
  maximumTokens?: number;
  timeoutMs?: number;
  retries?: number;
  moderationEnabled?: boolean;
  loggingEnabled?: boolean;
}

/**
 * A single message in an AI conversation.
 */
export interface AIMessage {
  id?: string;
  role: AIMessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI token-usage information.
 */
export interface AIUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  currency?: string;
}

/**
 * Request sent to the AI engine.
 */
export interface AIRequest {
  task: AITaskType;
  messages?: AIMessage[];
  prompt?: string;
  model?: string;
  temperature?: number;
  maximumTokens?: number;
  responseFormat?: "text" | "json";
  instructions?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * AI response returned by the engine.
 */
export interface AIResponse {
  success: boolean;
  id?: string;
  task: AITaskType;
  content?: string;
  data?: unknown;
  model?: string;
  provider?: AIProvider;
  usage?: AIUsage;
  finishReason?: string;
  createdAt: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI conversation definition.
 */
export interface AIConversation {
  id: string;
  title?: string;
  identityId?: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input used to classify content.
 */
export interface AIClassificationRequest {
  content: string;
  labels: string[];
  instructions?: string;
  context?: Record<string, unknown>;
}

/**
 * Classification result.
 */
export interface AIClassificationResult {
  label: string;
  confidence: number;
  scores?: Record<string, number>;
  explanation?: string;
}

/**
 * Input used to summarize content.
 */
export interface AISummarizationRequest {
  content: string;
  maximumLength?: number;
  format?: "paragraph" | "bullets" | "executive_summary";
  language?: string;
  instructions?: string;
}

/**
 * Input used to extract structured information.
 */
export interface AIExtractionRequest {
  content: string;
  schema?: Record<string, unknown>;
  fields?: string[];
  instructions?: string;
}

/**
 * Content moderation request.
 */
export interface AIModerationRequest {
  content: string;
  identityId?: string;
  context?: Record<string, unknown>;
}

/**
 * Content moderation result.
 */
export interface AIModerationResult {
  allowed: boolean;
  flagged: boolean;
  categories: Record<string, boolean>;
  scores?: Record<string, number>;
  reason?: string;
}

/**
 * Embedding request.
 */
export interface AIEmbeddingRequest {
  input: string | string[];
  model?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Embedding response.
 */
export interface AIEmbeddingResult {
  embeddings: number[][];
  model?: string;
  usage?: AIUsage;
}

/**
 * Enterprise artificial-intelligence contract used by IBOS.
 */
export interface IAIEngine extends IEngine<AIEngineConfig> {
  execute(request: AIRequest): Promise<AIResponse>;

  complete(
    prompt: string,
    options?: Partial<AIRequest>,
  ): Promise<AIResponse>;

  chat(
    messages: AIMessage[],
    options?: Partial<AIRequest>,
  ): Promise<AIResponse>;

  createConversation(
    title?: string,
    identityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<AIConversation>;

  getConversation(
    conversationId: string,
  ): Promise<AIConversation | null>;

  addMessage(
    conversationId: string,
    message: AIMessage,
  ): Promise<AIConversation>;

  deleteConversation(
    conversationId: string,
  ): Promise<EngineOperationResult>;

  classify(
    request: AIClassificationRequest,
  ): Promise<AIClassificationResult>;

  summarize(
    request: AISummarizationRequest,
  ): Promise<AIResponse>;

  extract(
    request: AIExtractionRequest,
  ): Promise<AIResponse>;

  moderate(
    request: AIModerationRequest,
  ): Promise<AIModerationResult>;

  createEmbeddings(
    request: AIEmbeddingRequest,
  ): Promise<AIEmbeddingResult>;
}