import JSZip from "jszip";
import type { ZipRepository } from "../types/ZipRepository";

export const createZipService = (): ZipRepository => {
  let zip = new JSZip();

  return {
    addFile: async (name: string, data: Blob): Promise<void> => {
      zip.file(name, data);
    },

    generateZip: async (
      onProgress?: (percent: number) => void,
    ): Promise<Blob> => {
      const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        if (onProgress) {
          onProgress(metadata.percent);
        }
      });
      // Reset for next use
      zip = new JSZip();
      return blob;
    },
  };
};
