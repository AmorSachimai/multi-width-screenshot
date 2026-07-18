import type { CaptureRepository } from "../types/CaptureRepository";
import type { CaptureSettings, CaptureStatus } from "../types/capture";
import type { TabRepository } from "../types/TabRepository";
import type { ZipRepository } from "../types/ZipRepository";
import { generateImageName } from "../utils/naming";
import {
  viewportMetricsSchema,
  windowMetricsSchema,
} from "../utils/validation";

export const executeCapture = async (
  settings: CaptureSettings,
  tabRepo: TabRepository,
  captureRepo: CaptureRepository,
  zipRepo: ZipRepository,
  onStatusChange: (status: CaptureStatus) => void,
): Promise<void> => {
  const { id: tabId, windowId } = await tabRepo.getCurrentTab();

  // Guard: Check if tab is still active
  try {
    await chrome.tabs.get(tabId);
  } catch (_e) {
    throw new Error("対象のタブが見つかりません。撮影を中止します。");
  }

  const initialState = await tabRepo.getWindowState(windowId);
  console.log("Saved initial window state:", initialState);

  try {
    const title = await tabRepo.getTabTitle(tabId);
    const targetWidths = settings.selectedWidths;

    // 0. Calculate Frame Delta (Outer - Inner) to get borders/scrollbars width
    const { outerWidth, innerWidth } = await tabRepo.executeScript(
      tabId,
      () => ({
        outerWidth: window.outerWidth,
        innerWidth: window.innerWidth,
      }),
      [],
      (res) => windowMetricsSchema.parse(res),
    );
    const frameDelta = outerWidth - innerWidth;
    console.log(
      `Window frame delta: ${frameDelta}px (Outer: ${outerWidth}, Inner: ${innerWidth})`,
    );

    for (const [index, width] of targetWidths.entries()) {
      const progress = (index / targetWidths.length) * 100;

      onStatusChange({
        type: "PROCESSING",
        currentWidth: width,
        progress,
      });

      // 1. Resize (As a hint for layout engines/media queries)
      const targetOuterWidth = width + frameDelta;
      await tabRepo.resizeWindow(windowId, targetOuterWidth, 1080);

      // Verification: Wait and check if resize was successful
      await new Promise((r) => setTimeout(r, 300));
      const currentWindow = await tabRepo.getWindowState(windowId);
      const currentWidth = currentWindow.width ?? 0;
      if (Math.abs(currentWidth - targetOuterWidth) > 5) {
        console.warn(
          `Window resize precision issue: target ${targetOuterWidth}, actual ${currentWindow.width}`,
        );
        // If it's a Tiling Window Manager or Maximized, this might fail.
        // We continue but log it.
      }

      await tabRepo.reloadTab(tabId);
      // Wait for reload to complete (simple delay as a starting point)
      await new Promise((r) => setTimeout(r, 1000));

      // Get current viewport height for emulation
      const { innerHeight } = await tabRepo.executeScript(
        tabId,
        () => ({
          innerHeight: window.innerHeight,
        }),
        [],
        (res) => viewportMetricsSchema.parse(res),
      );

      // 2. Setup CDP Emulation (Hide scrollbars, lock width)
      await captureRepo.setupEmulation(tabId, width, innerHeight);

      try {
        // 3. Pre-Scroll (Lazy Load trigger) under emulation
        await preScroll(tabId, settings.scrollDelayMs, tabRepo);

        // 4. CDP Full Page Capture
        // Guard: Verify tab still exists before CDP call
        try {
          await chrome.tabs.get(tabId);
        } catch (_e) {
          throw new Error("撮影中にタブが閉じられました。");
        }

        const dataUrl = await captureRepo.captureFullPage(tabId, {
          format: settings.imageFormat,
          quality: settings.quality,
          width: width,
        });

        // Convert dataUrl to Blob
        const response = await fetch(dataUrl);
        const fullImageBlob = await response.blob();

        // 5. Add to ZIP
        const fileName = generateImageName(title, width, settings.imageFormat);
        await zipRepo.addFile(fileName, fullImageBlob);
      } finally {
        await captureRepo.cleanupEmulation(tabId);
      }
    }

    onStatusChange({ type: "ZIPPING", progress: 0 });
  } catch (error) {
    console.error(error);
    onStatusChange({
      type: "ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  } finally {
    console.log("Restoring window state:", initialState);
    // Restore original state
    if (
      initialState.state === "maximized" ||
      initialState.state === "fullscreen"
    ) {
      await tabRepo.updateWindow(windowId, {
        state: initialState.state,
      });
    } else {
      await tabRepo.updateWindow(windowId, {
        state: "normal",
        width: initialState.width,
        height: initialState.height,
        top: initialState.top,
        left: initialState.left,
      });
    }
  }
};

const preScroll = async (
  tabId: number,
  delayMs: number,
  tabRepo: TabRepository,
): Promise<void> => {
  await tabRepo.executeScript(
    tabId,
    async (delay: number) => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;

      // 1. Smooth Scroll to bottom to trigger lazy loading
      const steps = Math.ceil(scrollHeight / (viewportHeight / 2));
      for (const step of Array.from({ length: steps }).keys()) {
        const y = step * (viewportHeight / 2);
        window.scrollTo({ top: y, behavior: "smooth" });
        await new Promise((r) => setTimeout(r, delay / 2));
      }

      // 2. Return to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      await new Promise((r) => setTimeout(r, delay * 2));

      // 3. Wait for all images in the document to be loaded
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
            // Safety timeout for images that fail to load
            setTimeout(resolve, 2000);
          });
        }),
      );

      // Extra wait for layout stability
      await new Promise((r) => setTimeout(r, 500));
    },
    [delayMs],
    () => undefined,
  );
};
