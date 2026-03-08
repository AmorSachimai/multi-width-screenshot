import { useEffect, useState } from "react";
import type { CaptureSettings, CaptureStatus } from "../types/capture";
import {
  captureSettingsSchema,
  captureStatusSchema,
  statusUpdatedMessageSchema,
} from "../utils/validation";

export function useCaptureStatus() {
  const [status, setStatus] = useState<CaptureStatus>({ type: "IDLE" });
  const [settings, setSettings] = useState<CaptureSettings | null>(null);

  useEffect(() => {
    // Initial status fetch
    chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
      const result = captureStatusSchema.safeParse(response);
      if (result.success) setStatus(result.data);
    });

    // Load settings
    chrome.runtime.sendMessage({ type: "LOAD_SETTINGS" }, (response) => {
      const result = captureSettingsSchema.safeParse(response);
      if (result.success) setSettings(result.data);
    });

    // Listen for updates
    const listener = (message: unknown) => {
      const result = statusUpdatedMessageSchema.safeParse(message);
      if (result.success) {
        setStatus(result.data.status);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const saveSettings = (newSettings: CaptureSettings) => {
    setSettings(newSettings);
    chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      settings: newSettings,
    });
  };

  const startCapture = () => {
    if (!settings || settings.selectedWidths.length === 0) return;

    chrome.runtime.sendMessage({
      type: "START_CAPTURE",
      widths: settings.selectedWidths,
    });
    // Proactively set status
    setStatus({
      type: "PROCESSING",
      currentWidth: settings.selectedWidths[0],
      progress: 0,
    });
  };

  const resetStatus = () => {
    chrome.runtime.sendMessage({ type: "RESET_STATUS" });
    setStatus({ type: "IDLE" });
  };

  return { status, settings, saveSettings, startCapture, resetStatus };
}
