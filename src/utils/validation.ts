import { z } from "zod";

/**
 * 撮影設定のバリデーションスキーマ
 */
export const captureSettingsSchema = z.object({
  availableWidths: z.array(z.number()),
  selectedWidths: z.array(z.number()),
  scrollDelayMs: z.number(),
  imageFormat: z.enum(["jpeg", "png"]),
  quality: z.number().min(0).max(1),
});

/**
 * 進行状況のバリデーションスキーマ
 */
export const captureStatusSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("IDLE") }),
  z.object({
    type: z.literal("PROCESSING"),
    currentWidth: z.number(),
    progress: z.number(),
  }),
  z.object({
    type: z.literal("ZIPPING"),
    progress: z.number(),
  }),
  z.object({
    type: z.literal("ERROR"),
    message: z.string(),
  }),
  z.object({ type: z.literal("SUCCESS") }),
]);

/**
 * メッセージのバリデーションスキーマ
 */
export const statusUpdatedMessageSchema = z.object({
  type: z.literal("STATUS_UPDATED"),
  status: captureStatusSchema,
});

/**
 * CDP Layout Metrics のバリデーションスキーマ
 */
export const layoutMetricsSchema = z.object({
  contentSize: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  cssContentSize: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

/**
 * CDP Capture Screenshot のバリデーションスキーマ
 */
export const captureScreenshotSchema = z.object({
  data: z.string(),
});

/**
 * ウィンドウ状態のバリデーションスキーマ
 */
export const windowStateSchema = z.enum([
  "normal",
  "minimized",
  "maximized",
  "fullscreen",
]);

/**
 * window.outerWidth/innerWidth のバリデーションスキーマ
 */
export const windowMetricsSchema = z.object({
  outerWidth: z.number(),
  innerWidth: z.number(),
});

/**
 * window.innerHeight のバリデーションスキーマ
 */
export const viewportMetricsSchema = z.object({
  innerHeight: z.number(),
});
