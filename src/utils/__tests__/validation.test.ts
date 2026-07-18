import { describe, expect, it } from "vitest";
import {
  captureSettingsSchema,
  captureStatusSchema,
  layoutMetricsSchema,
} from "../validation";

describe("Validation Schemas", () => {
  describe("captureSettingsSchema", () => {
    it("should validate correct settings", () => {
      const valid = {
        availableWidths: [375, 768, 1440],
        selectedWidths: [375, 1440],
        scrollDelayMs: 1000,
        imageFormat: "png",
        quality: 0.8,
      };
      expect(captureSettingsSchema.parse(valid)).toEqual(valid);
    });

    it("should fail on invalid quality", () => {
      const invalid = {
        availableWidths: [375],
        selectedWidths: [375],
        scrollDelayMs: 1000,
        imageFormat: "png",
        quality: 1.5,
      };
      expect(() => captureSettingsSchema.parse(invalid)).toThrow();
    });
  });

  describe("layoutMetricsSchema", () => {
    it("should validate contentSize", () => {
      const valid = {
        contentSize: { width: 1000, height: 5000 },
      };
      expect(layoutMetricsSchema.parse(valid)).toEqual(valid);
    });

    it("should validate cssContentSize", () => {
      const valid = {
        cssContentSize: { width: 1000, height: 5000 },
      };
      expect(layoutMetricsSchema.parse(valid)).toEqual(valid);
    });
  });

  describe("captureStatusSchema", () => {
    it("should validate PROCESSING state", () => {
      const status = {
        type: "PROCESSING",
        currentWidth: 375,
        progress: 50,
      };
      expect(captureStatusSchema.parse(status)).toEqual(status);
    });

    it("should validate ERROR state", () => {
      const status = {
        type: "ERROR",
        message: "Failed to capture",
      };
      expect(captureStatusSchema.parse(status)).toEqual(status);
    });
  });
});
