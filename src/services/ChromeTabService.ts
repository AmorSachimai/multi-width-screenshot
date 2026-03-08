import type { TabRepository } from "../types/TabRepository";
import { windowStateSchema } from "../utils/validation";

export const chromeTabService: TabRepository = {
  resizeWindow: async (
    windowId: number,
    width: number,
    height: number,
  ): Promise<void> => {
    console.log(`Resizing window ${windowId} to ${width}x${height}`);
    await chrome.windows.update(windowId, { width, height, state: "normal" });
  },

  reloadTab: async (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
      chrome.tabs.reload(tabId, {}, () => {
        chrome.tabs.onUpdated.addListener(function listener(id, info) {
          if (id === tabId && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
      });
    });
  },

  getTabTitle: async (tabId: number): Promise<string> => {
    const tab = await chrome.tabs.get(tabId);
    return tab.title ?? "untitled";
  },

  executeScript: async <T, Args extends unknown[]>(
    tabId: number,
    func: (...args: Args) => T,
    args: Args,
    validator: (val: unknown) => T,
  ): Promise<T> => {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args,
      world: "MAIN",
    });
    const result = results[0].result;
    return validator(result);
  },

  getCurrentTab: async (): Promise<{ id: number; windowId: number }> => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id || !tab?.windowId) {
      throw new Error("No active tab found");
    }
    return { id: tab.id, windowId: tab.windowId };
  },

  getWindowState: async (
    windowId: number,
  ): Promise<{
    state: "normal" | "minimized" | "maximized" | "fullscreen";
    width?: number;
    height?: number;
    top?: number;
    left?: number;
  }> => {
    const win = await chrome.windows.get(windowId);
    return {
      state: windowStateSchema.parse(win.state),
      width: win.width,
      height: win.height,
      top: win.top,
      left: win.left,
    };
  },

  updateWindow: async (
    windowId: number,
    info: chrome.windows.UpdateInfo,
  ): Promise<void> => {
    await chrome.windows.update(windowId, info);
  },
};
