export interface UploadMetadata {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url?: string;
  size: number;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified?: Date;
  contentType?: string;
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   */
  upload(file: Buffer, key: string, metadata?: UploadMetadata): Promise<UploadResult>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<Buffer>;

  /**
   * Get a signed/public URL for accessing the file
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * List files with a given prefix
   */
  listFiles(prefix?: string): Promise<FileInfo[]>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;
}
