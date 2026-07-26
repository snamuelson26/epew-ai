import {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Media asset categories supported by IBOS.
 */
export type MediaAssetType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "banner"
  | "logo"
  | "icon"
  | "certificate"
  | "animation"
  | "other";

/**
 * Media source location.
 */
export type MediaSourceType =
  | "local"
  | "remote"
  | "storage"
  | "database"
  | "generated";

/**
 * Media loading state.
 */
export type MediaAssetStatus =
  | "available"
  | "loading"
  | "missing"
  | "processing"
  | "disabled"
  | "error";

/**
 * Media asset metadata.
 */
export interface MediaAsset {
  /**
   * Unique asset identifier.
   */
  id: string;

  /**
   * Human-readable asset name.
   */
  name: string;

  /**
   * Asset type.
   */
  type: MediaAssetType;

  /**
   * Main asset URL or path.
   */
  source: string;

  /**
   * Source classification.
   */
  sourceType: MediaSourceType;

  /**
   * Optional language or locale.
   */
  locale?: string;

  /**
   * Optional content category.
   *
   * Examples:
   * "homepage"
   * "campaign"
   * "certificate"
   * "entrepreneur"
   */
  category?: string;

  /**
   * Optional media variant.
   *
   * Examples:
   * "desktop"
   * "mobile"
   * "thumbnail"
   * "hero"
   */
  variant?: string;

  /**
   * Alternative text for accessibility.
   */
  alt?: string;

  /**
   * Optional caption.
   */
  caption?: string;

  /**
   * MIME type.
   */
  mimeType?: string;

  /**
   * File size in bytes.
   */
  sizeBytes?: number;

  /**
   * Image or video width.
   */
  width?: number;

  /**
   * Image or video height.
   */
  height?: number;

  /**
   * Video or audio duration in seconds.
   */
  durationSeconds?: number;

  /**
   * Current asset status.
   */
  status: MediaAssetStatus;

  /**
   * Optional fallback asset identifier.
   */
  fallbackAssetId?: string;

  /**
   * Optional creation date.
   */
  createdAt?: string;

  /**
   * Optional last update date.
   */
  updatedAt?: string;

  /**
   * Additional metadata.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Request used to resolve a media asset.
 */
export interface MediaAssetRequest {
  /**
   * Unique asset identifier when already known.
   */
  id?: string;

  /**
   * Asset name.
   */
  name?: string;

  /**
   * Asset category.
   */
  category?: string;

  /**
   * Asset type.
   */
  type?: MediaAssetType;

  /**
   * Requested locale.
   */
  locale?: string;

  /**
   * Requested display variant.
   */
  variant?: string;

  /**
   * Whether fallback resolution is allowed.
   */
  allowFallback?: boolean;
}

/**
 * Media asset registration input.
 */
export interface MediaAssetRegistration {
  id: string;
  name: string;
  type: MediaAssetType;
  source: string;
  sourceType?: MediaSourceType;
  locale?: string;
  category?: string;
  variant?: string;
  alt?: string;
  caption?: string;
  mimeType?: string;
  fallbackAssetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Media transformation options.
 */
export interface MediaTransformationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "original" | "webp" | "png" | "jpeg" | "avif";
  crop?: "none" | "cover" | "contain" | "fill";
  position?: "center" | "top" | "bottom" | "left" | "right";
}

/**
 * Result returned after resolving a media asset.
 */
export interface MediaResolutionResult {
  success: boolean;
  asset?: MediaAsset;
  usedFallback: boolean;
  requestedLocale?: string;
  resolvedLocale?: string;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Media engine configuration.
 */
export interface MediaEngineConfig extends EngineConfig {
  /**
   * Default language used for media fallback.
   */
  defaultLocale: string;

  /**
   * Fallback language used when localized media is missing.
   */
  fallbackLocale: string;

  /**
   * Default fallback asset identifier.
   */
  defaultFallbackAssetId?: string;

  /**
   * Base URL or storage path for assets.
   */
  basePath?: string;

  /**
   * Whether localized media lookup is enabled.
   */
  localizationEnabled?: boolean;

  /**
   * Whether transformed asset URLs may be generated.
   */
  transformationsEnabled?: boolean;

  /**
   * Whether missing assets should be logged.
   */
  logMissingAssets?: boolean;
}

/**
 * IBOS Global Media Engine Contract.
 *
 * The Media Engine resolves, registers, localizes, transforms,
 * and manages images, videos, audio, documents, banners,
 * certificates, and other enterprise media assets.
 */
export interface IMediaEngine extends IEngine<MediaEngineConfig> {
  /**
   * Resolve the best matching media asset.
   *
   * The engine should consider:
   * - asset identifier
   * - category
   * - type
   * - locale
   * - variant
   * - fallback rules
   */
  resolveAsset(
    request: MediaAssetRequest,
  ): Promise<MediaResolutionResult>;

  /**
   * Retrieve an asset by its unique identifier.
   */
  getAsset(assetId: string): MediaAsset | undefined;

  /**
   * Retrieve all registered media assets.
   */
  getAssets(): MediaAsset[];

  /**
   * Retrieve assets matching a category.
   */
  getAssetsByCategory(category: string): MediaAsset[];

  /**
   * Retrieve assets matching a media type.
   */
  getAssetsByType(type: MediaAssetType): MediaAsset[];

  /**
   * Register a new media asset.
   */
  registerAsset(
    asset: MediaAssetRegistration,
  ): Promise<EngineOperationResult>;

  /**
   * Register multiple media assets.
   */
  registerAssets(
    assets: MediaAssetRegistration[],
  ): Promise<EngineOperationResult>;

  /**
   * Update an existing media asset.
   */
  updateAsset(
    assetId: string,
    updates: Partial<MediaAssetRegistration>,
  ): Promise<EngineOperationResult>;

  /**
   * Remove a registered asset.
   */
  unregisterAsset(
    assetId: string,
  ): Promise<EngineOperationResult>;

  /**
   * Determine whether an asset is registered.
   */
  hasAsset(assetId: string): boolean;

  /**
   * Resolve a localized version of an asset.
   */
  resolveLocalizedAsset(
    assetId: string,
    locale: string,
    variant?: string,
  ): Promise<MediaResolutionResult>;

  /**
   * Return the fallback asset for a missing or unavailable asset.
   */
  getFallbackAsset(
    request?: MediaAssetRequest,
  ): MediaAsset | undefined;

  /**
   * Generate a transformed asset URL or path.
   */
  transformAsset(
    assetId: string,
    options: MediaTransformationOptions,
  ): Promise<string>;

  /**
   * Preload one or more assets.
   */
  preloadAssets(
    assetIds: string[],
  ): Promise<EngineOperationResult>;

  /**
   * Clear cached asset resolutions.
   */
  clearCache(): Promise<EngineOperationResult>;

  /**
   * Reset media state to the configured defaults.
   */
  reset(): Promise<EngineOperationResult>;
}