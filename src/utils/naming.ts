/**
 * ファイル名に使用できない禁止文字をアンダースコアに置換する
 */
export function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

/**
 * ZIPファイル名を生成する
 */
export function generateZipName(title: string): string {
  return `${sanitize(title)}.zip`;
}

/**
 * 画像ファイル名を生成する
 */
export function generateImageName(
  title: string,
  width: number,
  format: "jpeg" | "png",
): string {
  const extension = format === "jpeg" ? "jpg" : "png";
  return `${sanitize(title)}_${width}px.${extension}`;
}
