/**
 * 撮影設定のドメインモデル
 */
export type CaptureSettings = {
  readonly availableWidths: number[];
  readonly selectedWidths: number[];
  readonly scrollDelayMs: number;
  readonly imageFormat: "jpeg" | "png";
  readonly quality: number; // 0.0 to 1.0
};

/**
 * 進行状況の判別共用体
 */
export type CaptureStatus =
  | { readonly type: "IDLE" }
  | {
      readonly type: "PROCESSING";
      readonly currentWidth: number;
      readonly progress: number;
    }
  | { readonly type: "ZIPPING"; readonly progress: number }
  | { readonly type: "ERROR"; readonly message: string }
  | { readonly type: "SUCCESS" };
