import type { CaptureSettings } from "../types/capture";
import type { SettingsRepository } from "../types/SettingsRepository";
import { captureSettingsSchema } from "../utils/validation";

const KEY = "capture_settings";

export const chromeSettingsService: SettingsRepository = {
  save: async (settings: CaptureSettings): Promise<void> => {
    await chrome.storage.local.set({
      [KEY]: settings,
    });
  },

  load: async (): Promise<CaptureSettings> => {
    const result = await chrome.storage.local.get(KEY);
    const settings = result[KEY];

    if (settings && typeof settings === "object") {
      // Migration: if old 'widths' exists, map to new structure
      if ("widths" in settings && !("availableWidths" in settings)) {
        // Use type-safe property access without 'as'
        const legacyWidths =
          "widths" in settings && Array.isArray(settings.widths)
            ? settings.widths
            : [375, 768, 1280, 1920];

        const safeWidths = Array.isArray(legacyWidths)
          ? legacyWidths.filter((w): w is number => typeof w === "number")
          : [375, 768, 1280, 1920];

        const migrated: CaptureSettings = {
          availableWidths: safeWidths,
          selectedWidths: safeWidths,
          scrollDelayMs:
            "scrollDelayMs" in settings &&
            typeof settings.scrollDelayMs === "number"
              ? settings.scrollDelayMs
              : 500,
          imageFormat:
            "imageFormat" in settings &&
            (settings.imageFormat === "jpeg" || settings.imageFormat === "png")
              ? settings.imageFormat
              : "jpeg",
          quality:
            "quality" in settings && typeof settings.quality === "number"
              ? settings.quality
              : 0.8,
        };
        return migrated;
      }

      const parseResult = captureSettingsSchema.safeParse(settings);
      if (parseResult.success) {
        return parseResult.data;
      }
    }

    // Default settings
    return {
      availableWidths: [375, 768, 1280, 1920],
      selectedWidths: [375, 768, 1280, 1920],
      scrollDelayMs: 500,
      imageFormat: "jpeg",
      quality: 0.8,
    };
  },
};
