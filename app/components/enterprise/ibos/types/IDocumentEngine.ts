/**
 * Minimal engine base types.
 * The original IEngine module is not exported as a module in the project
 * environment where this file is consumed, so provide lightweight
 * local definitions to satisfy type references.
 */
export interface EngineConfig {
  id?: string;
  name?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface EngineOperationResult {
  success: boolean;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
  data?: unknown;
}

export interface IEngine<Config extends EngineConfig = EngineConfig> {
  configure(config: Partial<Config>): Promise<EngineOperationResult> | EngineOperationResult;
  getConfig(): Config | undefined;
  start?(): Promise<EngineOperationResult> | EngineOperationResult;
  stop?(): Promise<EngineOperationResult> | EngineOperationResult;
}

/**
 * Document formats supported by IBOS.
 */
export type DocumentFormat =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "txt"
  | "html"
  | "json"
  | "xml"
  | "image"
  | "other";

/**
 * Enterprise document categories.
 */
export type DocumentType =
  | "certificate"
  | "report"
  | "agreement"
  | "contract"
  | "letter"
  | "invoice"
  | "receipt"
  | "application"
  | "form"
  | "statement"
  | "presentation"
  | "export"
  | "template"
  | "other";

/**
 * Current document lifecycle status.
 */
export type DocumentStatus =
  | "draft"
  | "generating"
  | "generated"
  | "processing"
  | "published"
  | "archived"
  | "failed"
  | "revoked"
  | "deleted";

/**
 * Document visibility classification.
 */
export type DocumentVisibility =
  | "public"
  | "private"
  | "restricted"
  | "internal";

/**
 * Document storage location.
 */
export type DocumentStorageProvider =
  | "local"
  | "supabase"
  | "database"
  | "remote"
  | "temporary"
  | "external";

/**
 * Document signature status.
 */
export type DocumentSignatureStatus =
  | "notRequired"
  | "pending"
  | "partiallySigned"
  | "signed"
  | "declined"
  | "expired";

/**
 * A person or organization associated with a document.
 */
export interface DocumentParty {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  organization?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Document file information.
 */
export interface DocumentFile {
  id?: string;
  name: string;
  format: DocumentFormat;
  url?: string;
  path?: string;
  storageProvider?: DocumentStorageProvider;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Document attachment.
 */
export interface DocumentAttachment {
  id?: string;
  name: string;
  file: DocumentFile;
  description?: string;
}

/**
 * Enterprise document record.
 */
export interface EnterpriseDocument {
  id: string;

  /**
   * Human-readable document title.
   */
  title: string;

  /**
   * Enterprise document category.
   */
  type: DocumentType;

  /**
   * Output format.
   */
  format: DocumentFormat;

  /**
   * Current lifecycle status.
   */
  status: DocumentStatus;

  /**
   * Document access level.
   */
  visibility: DocumentVisibility;

  /**
   * Language or locale of the document.
   */
  locale?: string;

  /**
   * Template used to generate the document.
   */
  templateId?: string;

  /**
   * Main generated file.
   */
  file?: DocumentFile;

  /**
   * Optional document number.
   *
   * Examples:
   * BLC-2026-000021
   * INV-2026-000154
   */
  documentNumber?: string;

  /**
   * Optional authentication or verification identifier.
   */
  authenticationId?: string;

  /**
   * Optional verification URL.
   */
  verificationUrl?: string;

  /**
   * Optional QR code URL or data.
   */
  qrCode?: string;

  /**
   * Document owner.
   */
  ownerId?: string;

  /**
   * Person or business the document relates to.
   */
  subjectId?: string;

  /**
   * People or organizations associated with the document.
   */
  parties?: DocumentParty[];

  /**
   * Supporting attachments.
   */
  attachments?: DocumentAttachment[];

  /**
   * Current electronic signature status.
   */
  signatureStatus?: DocumentSignatureStatus;

  /**
   * Document issue date.
   */
  issuedAt?: string;

  /**
   * Document expiration date.
   */
  expiresAt?: string;

  /**
   * Document publication date.
   */
  publishedAt?: string;

  /**
   * Document archive date.
   */
  archivedAt?: string;

  /**
   * Record creation date.
   */
  createdAt: string;

  /**
   * Record update date.
   */
  updatedAt?: string;

  /**
   * Additional enterprise metadata.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Reusable document template.
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  format: DocumentFormat;
  locale?: string;
  version?: string;
  description?: string;

  /**
   * Template source or markup.
   */
  content?: string;

  /**
   * Remote or stored template path.
   */
  source?: string;

  /**
   * Variables accepted by the template.
   */
  variables?: DocumentTemplateVariable[];

  /**
   * Whether the template is available for generation.
   */
  enabled: boolean;

  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Variable supported by a document template.
 */
export interface DocumentTemplateVariable {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  type?:
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "currency"
    | "image"
    | "url"
    | "object"
    | "array";
}

/**
 * Request used to generate a document.
 */
export interface DocumentGenerationRequest {
  /**
   * Document title.
   */
  title: string;

  /**
   * Enterprise document category.
   */
  type: DocumentType;

  /**
   * Desired output format.
   */
  format: DocumentFormat;

  /**
   * Template used for generation.
   */
  templateId?: string;

  /**
   * Requested document language.
   */
  locale?: string;

  /**
   * Access level.
   */
  visibility?: DocumentVisibility;

  /**
   * Template values and document data.
   */
  data: Record<string, unknown>;

  /**
   * Optional owner identifier.
   */
  ownerId?: string;

  /**
   * Optional subject identifier.
   */
  subjectId?: string;

  /**
   * Optional document number supplied by the caller.
   */
  documentNumber?: string;

  /**
   * Whether the engine should generate a QR code.
   */
  generateQrCode?: boolean;

  /**
   * Whether a permanent verification record is required.
   */
  createVerificationRecord?: boolean;

  /**
   * Whether the generated document should be published immediately.
   */
  publishImmediately?: boolean;

  /**
   * Whether electronic signatures are required.
   */
  signatureRequired?: boolean;

  /**
   * Parties associated with the document.
   */
  parties?: DocumentParty[];

  /**
   * Supporting attachments.
   */
  attachments?: DocumentAttachment[];

  /**
   * Additional generation settings.
   */
  options?: DocumentGenerationOptions;

  /**
   * Additional enterprise metadata.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Document generation settings.
 */
export interface DocumentGenerationOptions {
  orientation?: "portrait" | "landscape";
  pageSize?:
    | "letter"
    | "legal"
    | "a4"
    | "a3"
    | "custom";
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  passwordProtected?: boolean;
  watermark?: string;
  compression?: boolean;
  printOptimized?: boolean;
}

/**
 * Result returned after generating or processing a document.
 */
export interface DocumentOperationResult {
  success: boolean;
  status: DocumentStatus;
  document?: EnterpriseDocument;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Document search filters.
 */
export interface DocumentSearchFilters {
  query?: string;
  type?: DocumentType;
  format?: DocumentFormat;
  status?: DocumentStatus;
  visibility?: DocumentVisibility;
  locale?: string;
  ownerId?: string;
  subjectId?: string;
  templateId?: string;
  createdFrom?: string;
  createdTo?: string;
  includeArchived?: boolean;
}

/**
 * Document listing result.
 */
export interface DocumentSearchResult {
  documents: EnterpriseDocument[];
  total: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

/**
 * Document Engine configuration.
 */
export interface DocumentEngineConfig extends EngineConfig {
  defaultFormat: DocumentFormat;
  defaultLocale: string;
  defaultVisibility: DocumentVisibility;
  defaultStorageProvider?: DocumentStorageProvider;
  baseStoragePath?: string;
  temporaryStoragePath?: string;
  verificationEnabled?: boolean;
  qrCodeEnabled?: boolean;
  electronicSignaturesEnabled?: boolean;
  documentNumberingEnabled?: boolean;
  autoArchiveEnabled?: boolean;
  retentionDays?: number;
  maxFileSizeBytes?: number;
}

/**
 * IBOS Enterprise Document Engine Contract.
 *
 * The Document Engine generates, stores, publishes, verifies,
 * signs, prints, exports, and archives official enterprise
 * documents across the EPEW-EDE-IBOS platform.
 */
export interface IDocumentEngine
  extends IEngine<DocumentEngineConfig> {

  /**
   * Generate a new enterprise document.
   */
  generate(
    request: DocumentGenerationRequest,
  ): Promise<DocumentOperationResult>;

  /**
   * Retrieve a document by its unique identifier.
   */
  getDocument(
    documentId: string,
  ): Promise<EnterpriseDocument | undefined>;

  /**
   * Retrieve a document using its official document number.
   */
  getDocumentByNumber(
    documentNumber: string,
  ): Promise<EnterpriseDocument | undefined>;

  /**
   * Search and filter documents.
   */
  searchDocuments(
    filters?: DocumentSearchFilters,
  ): Promise<DocumentSearchResult>;

  /**
   * Publish a generated document.
   */
  publish(
    documentId: string,
  ): Promise<DocumentOperationResult>;

  /**
   * Archive a document.
   */
  archive(
    documentId: string,
  ): Promise<DocumentOperationResult>;

  /**
   * Restore an archived document.
   */
  restore(
    documentId: string,
  ): Promise<DocumentOperationResult>;

  /**
   * Revoke an official document.
   */
  revoke(
    documentId: string,
    reason?: string,
  ): Promise<DocumentOperationResult>;

  /**
   * Permanently or logically delete a document.
   */
  deleteDocument(
    documentId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Duplicate an existing document.
   */
  duplicate(
    documentId: string,
    overrides?: Partial<DocumentGenerationRequest>,
  ): Promise<DocumentOperationResult>;

  /**
   * Convert an existing document into another format.
   */
  convert(
    documentId: string,
    format: DocumentFormat,
  ): Promise<DocumentOperationResult>;

  /**
   * Regenerate a document using updated data.
   */
  regenerate(
    documentId: string,
    data?: Record<string, unknown>,
  ): Promise<DocumentOperationResult>;

  /**
   * Generate a print-ready version.
   */
  prepareForPrint(
    documentId: string,
  ): Promise<DocumentOperationResult>;

  /**
   * Generate or retrieve a downloadable file.
   */
  download(
    documentId: string,
  ): Promise<DocumentFile>;

  /**
   * Create or update a permanent verification record.
   */
  createVerificationRecord(
    documentId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Verify a document using a document number,
   * authentication ID, QR value, or verification token.
   */
  verify(
    verificationValue: string,
  ): Promise<DocumentOperationResult>;

  /**
   * Request electronic signatures.
   */
  requestSignatures(
    documentId: string,
    parties: DocumentParty[],
  ): Promise<DocumentOperationResult>;

  /**
   * Retrieve the current signature status.
   */
  getSignatureStatus(
    documentId: string,
  ): Promise<DocumentSignatureStatus>;

  /**
   * Register a reusable document template.
   */
  registerTemplate(
    template: DocumentTemplate,
  ): Promise<EngineOperationResult>;

  /**
   * Update an existing document template.
   */
  updateTemplate(
    templateId: string,
    updates: Partial<DocumentTemplate>,
  ): Promise<EngineOperationResult>;

  /**
   * Remove a document template.
   */
  unregisterTemplate(
    templateId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Retrieve a registered template.
   */
  getTemplate(
    templateId: string,
  ): DocumentTemplate | undefined;

  /**
   * Retrieve all registered templates.
   */
  getTemplates(): DocumentTemplate[];

  /**
   * Determine whether a template is registered.
   */
  hasTemplate(templateId: string): boolean;

  /**
   * Clear cached templates and document resources.
   */
  clearCache(): Promise<EngineOperationResult>;

  /**
   * Reset the Document Engine to its configured defaults.
   */
  reset(): Promise<EngineOperationResult>;
}