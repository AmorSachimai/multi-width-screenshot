import { executeCapture } from "./services/CaptureExecutor";
import { chromeCaptureService } from "./services/ChromeCaptureService";
import { chromeSettingsService } from "./services/ChromeSettingsService";
import { chromeTabService } from "./services/ChromeTabService";
import { createZipService } from "./services/ZipService";
import type { CaptureSettings, CaptureStatus } from "./types/capture";

// --- State Management ---
let currentStatus: CaptureStatus = { type: "IDLE" };

const getStatus = (): CaptureStatus => currentStatus;

const updateStatus = (newStatus: CaptureStatus) => {
  currentStatus = newStatus;
  chrome.runtime
    .sendMessage({ type: "STATUS_UPDATED", status: currentStatus })
    .catch(() => {});
};

// --- Message Listeners ---
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "RESET_STATUS") {
    updateStatus({ type: "IDLE" });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "GET_STATUS") {
    sendResponse(getStatus());
    return false;
  }

  if (message.type === "LOAD_SETTINGS") {
    chromeSettingsService.load().then(sendResponse);
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    chromeSettingsService
      .save(message.settings)
      .then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "START_CAPTURE") {
    updateStatus({
      type: "PROCESSING",
      currentWidth: 0,
      progress: 0,
    });
    handleStartCapture(message.widths).catch((err) => {
      console.error(err);
      updateStatus({ type: "ERROR", message: err.message });
    });
    sendResponse({ success: true });
    return false;
  }
});

// --- Logic functions ---
const handleStartCapture = async (customWidths?: number[]) => {
  try {
    const settings = await chromeSettingsService.load();
    const activeWidths = customWidths || settings.selectedWidths;

    if (activeWidths.length === 0) {
      throw new Error("No widths selected for capture.");
    }

    const captureSettings: CaptureSettings = {
      ...settings,
      selectedWidths: activeWidths,
    };

    const zipService = createZipService();

    await executeCapture(
      captureSettings,
      chromeTabService,
      chromeCaptureService,
      zipService,
      async (status: CaptureStatus) => {
        updateStatus(status);

        // Trigger ZIP and Download when executor signals it started zipping
        if (status.type === "ZIPPING" && status.progress === 0) {
          await startZippingAndDownload(zipService);
        }
      },
    );
  } catch (err) {
    console.error("Capture failed:", err);
    updateStatus({
      type: "ERROR",
      message: err instanceof Error ? err.message : "Capture failed",
    });
  }
};

const startZippingAndDownload = async (
  zipRepo: ReturnType<typeof createZipService>,
) => {
  try {
    const { id: tabId } = await chromeTabService.getCurrentTab();
    const title = await chromeTabService.getTabTitle(tabId);

    console.log("Starting ZIP generation...");
    const blob = await zipRepo.generateZip((percent: number) => {
      updateStatus({
        type: "ZIPPING",
        progress: Math.round(percent),
      });
    });
    console.log("ZIP generation complete, size:", blob.size);

    // Convert to Data URL (Blob URLs are not supported in Service Workers)
    const dataUrl = await blobToDataUrl(blob);

    console.log("Initiating download from background...");
    await chrome.downloads.download({
      url: dataUrl,
      filename: `${title.replace(/[\\/:*?"<>|]/g, "_")}.zip`,
      saveAs: true,
    });

    console.log("Download initiated successfully");
    // Now really success
    updateStatus({ type: "SUCCESS" });
  } catch (err) {
    console.error("Download/ZIP failed:", err);
    updateStatus({
      type: "ERROR",
      message:
        err instanceof Error
          ? err.message
          : "ZIPの生成またはダウンロードに失敗しました。",
    });
  }
};

const blobToDataUrl = async (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(
          new Error(
            "データの変換に失敗しました（メモリ不足の可能性があります）。",
          ),
        );
      }
    };
    reader.onerror = () =>
      reject(new Error("データの読み込みエラーが発生しました。"));
    reader.readAsDataURL(blob);
  });
};
