import {
  EngineConfig,
  EngineOperationResult,
  IEngine,
} from "./IEngine";

/**
 * Supported IBOS language.
 */
export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
  enabled: boolean;
}

/**
 * Translation request.
 */
export interface TranslationRequest {
  key: string;
  values?: Record<string, string | number>;
  defaultValue?: string;
}

/**
 * Translation resource.
 */
export interface TranslationResource {
  locale: string;
  namespace: string;
  entries: Record<string, string>;
}

/**
 * Language Engine configuration.
 */
export interface LanguageEngineConfig extends EngineConfig {
  defaultLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
}

/**
 * IBOS Global Language Engine Contract.
 */
export interface ILanguageEngine
  extends IEngine<LanguageEngineConfig> {

  /**
   * Current active language.
   */
  getCurrentLanguage(): string;

  /**
   * Change current language.
   */
  setLanguage(
    language: string
  ): Promise<EngineOperationResult>;

  /**
   * Available languages.
   */
  getSupportedLanguages(): SupportedLanguage[];

  /**
   * Returns true if language exists.
   */
  isSupported(language: string): boolean;

  /**
   * Translate a resource key.
   */
  translate(
    request: TranslationRequest
  ): string;

  /**
   * Register language resources.
   */
  registerResource(
    resource: TranslationResource
  ): Promise<void>;

  /**
   * Remove language resources.
   */
  unregisterResource(
    locale: string,
    namespace: string
  ): Promise<void>;

  /**
   * Detect browser/user language.
   */
  detectLanguage(): Promise<string>;

  /**
   * Reset to default language.
   */
  reset(): Promise<EngineOperationResult>;
}