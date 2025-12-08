import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  UploadMetadata,
  UploadResult,
  FileInfo,
} from '../interfaces/storage-provider.interface';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(GoogleDriveStorageProvider.name);
  private drive!: drive_v3.Drive;
  private folderId!: string;

  constructor(private configService: ConfigService) {
    this.initializeGoogleDrive();
  }

  private async initializeGoogleDrive(): Promise<void> {
    try {
      const credentials = this.configService.get<string>('GOOGLE_DRIVE_CREDENTIALS');
      this.folderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID', 'root');

      if (!credentials) {
        this.logger.warn('Google Drive credentials not configured');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive', error);
      throw new Error('Failed to initialize Google Drive storage');
    }
  }

  private bufferToStream(buffer: Buffer): Readable {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    return readable;
  }

  async upload(file: Buffer, key: string, metadata?: UploadMetadata): Promise<UploadResult> {
    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: key.split('/').pop(),
        parents: [this.folderId],
      };

      const media = {
        mimeType: metadata?.contentType || 'application/octet-stream',
        body: this.bufferToStream(file),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, size, webViewLink, webContentLink',
      });

      const fileId = response.data.id!;
      
      // Make file publicly readable (optional)
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      this.logger.log(`File uploaded to Google Drive: ${key} (${file.length} bytes)`);

      return {
        key: fileId,
        url: (response.data.webViewLink || response.data.webContentLink) || '',
        size: parseInt(response.data.size || '0', 10),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to Google Drive: ${key}`, error);
      throw new Error(`Failed to upload file: ${key}`);
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get(
        { fileId: key, alt: 'media' },
        { responseType: 'arraybuffer' },
      );

      this.logger.log(`File downloaded from Google Drive: ${key}`);
      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      this.logger.error(`Failed to download file from Google Drive: ${key}`, error);
      throw new Error(`File not found: ${key}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Get file metadata to retrieve webViewLink
      const response = await this.drive.files.get({
        fileId: key,
        fields: 'webViewLink, webContentLink',
      });

      // Google Drive doesn't support expiring URLs like S3, but we can return direct link
      return (response.data.webContentLink || response.data.webViewLink) || '';
    } catch (error) {
      this.logger.error(`Failed to get URL for file: ${key}`, error);
      throw new Error(`Failed to get URL for file: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId: key });
      this.logger.log(`File deleted from Google Drive: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from Google Drive: ${key}`, error);
      throw new Error(`Failed to delete file: ${key}`);
    }
  }

  async listFiles(prefix?: string): Promise<FileInfo[]> {
    try {
      const query = prefix
        ? `'${this.folderId}' in parents and name contains '${prefix}' and trashed=false`
        : `'${this.folderId}' in parents and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, size, modifiedTime, mimeType)',
        pageSize: 1000,
      });

      return (response.data.files || []).map((file) => ({
        key: file.id || '',
        size: parseInt(file.size || '0', 10),
        lastModified: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
        contentType: file.mimeType || undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to list files in Google Drive`, error);
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.drive.files.get({ fileId: key, fields: 'id' });
      return true;
    } catch (error) {
      return false;
    }
  }
}
