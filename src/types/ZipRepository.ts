/**
 * ZIP作成に関するリポジトリインターフェース
 */
export interface ZipRepository {
  /**
   * 画像を追加する
   */
  addFile(name: string, data: Blob): Promise<void>;

  /**
   * ZIPを生成し、Blobとして返す
   */
  generateZip(onProgress?: (percent: number) => void): Promise<Blob>;
}
