import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Service } from './s3.service';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly s3: S3Service) {}

  async generateDump(): Promise<Buffer> {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || '';

    if (!database) throw new InternalServerErrorException('DB_NAME is not configured');

    // Pass password via env var to avoid exposing it in process list
    const env = { ...process.env, MYSQL_PWD: password };
    const cmd = `mysqldump -h ${host} -P ${port} -u ${user} ${database}`;

    this.logger.log(`Starting database dump for ${database}@${host}`);
    try {
      const { stdout } = await execAsync(cmd, { env, maxBuffer: 1024 * 1024 * 200 });
      this.logger.log('Database dump completed');
      return Buffer.from(stdout, 'utf-8');
    } catch (err: any) {
      this.logger.error(`mysqldump failed: ${err?.message}`);
      throw new InternalServerErrorException(`Database backup failed: ${err?.message}`);
    }
  }

  private getFilename(): string {
    const now = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    const db = process.env.DB_NAME || 'backup';
    return `${db}_${now}.sql`;
  }

  async downloadBackup(): Promise<{ buffer: Buffer; filename: string }> {
    const buffer = await this.generateDump();
    return { buffer, filename: this.getFilename() };
  }

  async backupToS3(): Promise<{ key: string; url: string; filename: string; sizeKb: number }> {
    const { buffer, filename } = await this.downloadBackup();
    const key = this.s3.generateObjectKey('db-backups', filename);
    const result = await this.s3.uploadBuffer({ buffer, contentType: 'application/sql', key });
    return { ...result, filename, sizeKb: Math.round(buffer.length / 1024) };
  }
}
