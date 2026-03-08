/**
 * タブ操作に関するリポジトリインターフェース
 */
export interface TabRepository {
  /**
   * ウィンドウサイズを変更する
   */
  resizeWindow(windowId: number, width: number, height: number): Promise<void>;

  /**
   * タブをリロードし、完了まで待機する
   */
  reloadTab(tabId: number): Promise<void>;

  /**
   * タブのタイトルを取得する
   */
  getTabTitle(tabId: number): Promise<string>;

  /**
   * コンテンツスクリプトを実行する
   */
  executeScript<T, Args extends unknown[]>(
    tabId: number,
    func: (...args: Args) => T,
    args: Args,
    validator: (val: unknown) => T,
  ): Promise<T>;

  /**
   * 現在のアクティブなタブ情報を取得する
   */
  getCurrentTab(): Promise<{ id: number; windowId: number }>;

  /**
   * ウィンドウの状態（最大化など）を取得する
   */
  getWindowState(windowId: number): Promise<WindowInfo>;

  /**
   * ウィンドウの状態を更新する
   */
  updateWindow(windowId: number, info: Partial<WindowInfo>): Promise<void>;
}

export interface WindowInfo {
  state?: "normal" | "minimized" | "maximized" | "fullscreen";
  width?: number;
  height?: number;
  top?: number;
  left?: number;
}
