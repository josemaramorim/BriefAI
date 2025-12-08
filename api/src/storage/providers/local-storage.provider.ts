import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadMetadata,
  UploadResult,
  FileInfo,
} from '../interfaces/storage-provider.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.basePath = this.configService.get<string>('STORAGE_LOCAL_PATH', './uploads');
    this.baseUrl = this.configService.get<string>('STORAGE_LOCAL_BASE_URL', 'http://localhost:3000/uploads');
    
    // Ensure base directory exists
    this.ensureDirectory(this.basePath);
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.log(`Created directory: ${dirPath}`);
    }
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  private getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key.replace(/\\/g, '/')}`;
  }

  async upload(file: Buffer, key: string, metadata?: UploadMetadata): Promise<UploadResult> {
    const fullPath = this.getFullPath(key);
    const directory = path.dirname(fullPath);

    // Ensure subdirectories exist
    await this.ensureDirectory(directory);

    // Write file
    await fs.writeFile(fullPath, file);

    this.logger.log(`File uploaded: ${key} (${file.length} bytes)`);

    return {
      key,
      url: this.getPublicUrl(key),
      size: file.length,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key);

    try {
      const buffer = await fs.readFile(fullPath);
      this.logger.log(`File downloaded: ${key}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file: ${key}`, error);
      throw new Error(`File not found: ${key}`);
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    // For local storage, just return public URL (no signing needed)
    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);

    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new Error(`Failed to delete file: ${key}`);
    }
  }

  async listFiles(prefix?: string): Promise<FileInfo[]> {
    const searchPath = prefix ? this.getFullPath(prefix) : this.basePath;
    
    try {
      const files = await this.readDirectoryRecursive(searchPath, this.basePath);
      return files;
    } catch (error) {
      this.logger.error(`Failed to list files in: ${searchPath}`, error);
      return [];
    }
  }

  private async readDirectoryRecursive(dir: string, baseDir: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.readDirectoryRecursive(fullPath, baseDir);
          files.push(...subFiles);
        } else {
          const stats = await fs.stat(fullPath);
          const relativePath = path.relative(baseDir, fullPath);

          files.push({
            key: relativePath,
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    return existsSync(fullPath);
  }
}
