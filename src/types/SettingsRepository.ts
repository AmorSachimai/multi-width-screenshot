import type { CaptureSettings } from "./capture";

/**
 * Repository Interface
 * インターフェースには "I" を付けない
 */
export interface SettingsRepository {
  save(settings: CaptureSettings): Promise<void>;
  load(): Promise<CaptureSettings>;
}
