import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface StorageAdapter {
  save(file: File): Promise<string>;
  getUrl(filePath: string): string;
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || process.env.UPLOAD_DIR || "./public/uploads";
  }

  async save(file: File): Promise<string> {
    if (!ALLOWED_MIME.includes(file.type)) {
      throw new Error(`Dateityp nicht erlaubt: ${file.type}`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error("Datei zu groß (max 10MB)");
    }

    const ext = file.name.split(".").pop() || "jpg";
    const safeName = `${uuidv4()}.${ext.replace(/[^a-zA-Z0-9]/g, "")}`;
    const dir = path.resolve(this.uploadDir);

    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(dir, safeName);
    await writeFile(filePath, buffer);

    return `/uploads/${safeName}`;
  }

  getUrl(filePath: string): string {
    return filePath;
  }
}

// Singleton for convenience
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new LocalStorageAdapter();
  }
  return storageInstance;
}
