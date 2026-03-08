/**
 * キャプチャ操作に関するリポジトリインターフェース
 */
export interface CaptureRepository {
  /**
   * エミュレーション（サイズ、スクロールバー非表示など）を開始する
   */
  setupEmulation(tabId: number, width: number, height: number): Promise<void>;

  /**
   * フルページスクリーンショットを撮影する（setupEmulation が呼び出されている前提）
   */
  captureFullPage(
    tabId: number,
    options: {
      format: "jpeg" | "png";
      quality: number;
      width: number;
    },
  ): Promise<string>;

  /**
   * エミュレーションを解除する
   */
  cleanupEmulation(tabId: number): Promise<void>;
}
