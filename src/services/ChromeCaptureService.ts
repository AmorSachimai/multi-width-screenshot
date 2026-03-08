import type { CaptureRepository } from "../types/CaptureRepository";
import {
  captureScreenshotSchema,
  layoutMetricsSchema,
} from "../utils/validation";

export const chromeCaptureService: CaptureRepository = {
  setupEmulation: async (
    tabId: number,
    width: number,
    height: number,
  ): Promise<void> => {
    const target = { tabId };
    await chrome.debugger.attach(target, "1.3");

    // Set device metrics override to ensure exact viewport size
    await chrome.debugger.sendCommand(
      target,
      "Emulation.setDeviceMetricsOverride",
      {
        width,
        height,
        deviceScaleFactor: 1, // We use CSS dimensions for consistency
        mobile: false,
        fitWindow: false,
      },
    );

    // Hide scrollbars to avoid width discrepancy
    await chrome.debugger.sendCommand(target, "Emulation.setScrollbarsHidden", {
      hidden: true,
    });

    // Wait a bit for the page to settle (layout, etc.)
    await new Promise((resolve) => setTimeout(resolve, 200));
  },

  captureFullPage: async (
    tabId: number,
    options: {
      format: "jpeg" | "png";
      quality: number;
      width: number;
    },
  ): Promise<string> => {
    const target = { tabId };

    // Get the actual page dimensions (assumes setupEmulation was called)
    const response = await chrome.debugger.sendCommand(
      target,
      "Page.getLayoutMetrics",
    );
    const metrics = layoutMetricsSchema.parse(response);

    const contentSize = metrics.contentSize || metrics.cssContentSize;
    if (!contentSize) {
      throw new Error("Failed to get content size from metrics");
    }

    console.log(
      `Capturing with metrics: width=${options.width}, height=${contentSize.height}`,
    );

    // Page.captureScreenshot with explicit clipping
    const screenshotResponse = await chrome.debugger.sendCommand(
      target,
      "Page.captureScreenshot",
      {
        format: options.format,
        quality: Math.round(options.quality * 100),
        fromSurface: true,
        captureBeyondViewport: true, // Keep this but use clip for precision
        clip: {
          x: 0,
          y: 0,
          width: options.width,
          height: contentSize.height,
          scale: 1,
        },
      },
    );
    const result = captureScreenshotSchema.parse(screenshotResponse);

    return `data:image/${options.format};base64,${result.data}`;
  },

  cleanupEmulation: async (tabId: number): Promise<void> => {
    const target = { tabId };
    try {
      // Restore scrollbars
      await chrome.debugger
        .sendCommand(target, "Emulation.setScrollbarsHidden", {
          hidden: false,
        })
        .catch(() => {});
      // Restore default metrics
      await chrome.debugger
        .sendCommand(target, "Emulation.clearDeviceMetricsOverride", {})
        .catch(() => {});
      await chrome.debugger.detach(target);
    } catch (e) {
      console.warn("Cleanup failed (possibly already detached):", e);
    }
  },
};
