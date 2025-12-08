import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { GoogleDriveStorageProvider } from './providers/google-drive-storage.provider';
import { STORAGE_PROVIDER } from './storage.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('STORAGE_PROVIDER', 'local');

        switch (provider.toLowerCase()) {
          case 'google_drive':
          case 'googledrive':
            return new GoogleDriveStorageProvider(configService);
          case 'local':
          default:
            return new LocalStorageProvider(configService);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
