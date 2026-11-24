import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WinstonCloudWatch = require('winston-cloudwatch');

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = combine(
  timestamp(),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const ctx = meta && meta.context ? `[${meta.context}] ` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level.toUpperCase()}: ${ctx}${message}${metaStr}`;
  })
);

const loggerTransports: any[] = [];

// Console transport (always)
loggerTransports.push(new winston.transports.Console({ format: combine(colorize(), consoleFormat) }));

// Optional CloudWatch transport — only enabled if explicitly requested.
// Set `ENABLE_CLOUDWATCH=true` in environment to enable CloudWatch transport.
if (process.env.ENABLE_CLOUDWATCH === 'true' && process.env.AWS_CLOUDWATCH_LOG_GROUP) {
  try {
    loggerTransports.push(new WinstonCloudWatch({
      logGroupName: process.env.AWS_CLOUDWATCH_LOG_GROUP,
      logStreamName: `${process.env.AWS_CLOUDWATCH_STREAM_PREFIX || 'tbt'}-${process.env.NODE_ENV || 'dev'}-${process.pid}`,
      awsRegion: process.env.AWS_REGION,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
      jsonMessage: true,
      uploadRate: 20000,
    }));
  } catch (e) {
    // ignore cloudwatch setup errors; fallback to console only
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize Winston CloudWatch transport', e);
  }
} else {
  // eslint-disable-next-line no-console
  console.info('CloudWatch transport disabled. Set ENABLE_CLOUDWATCH=true to enable CloudWatch logging.');
}

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: json(),
  transports: loggerTransports,
});

export class WinstonLogger implements LoggerService {
  log(message: any, context?: string) {
    winstonLogger.info(String(message), { context });
  }
  error(message: any, trace?: string, context?: string) {
    winstonLogger.error(String(message), { trace, context });
  }
  warn(message: any, context?: string) {
    winstonLogger.warn(String(message), { context });
  }
  debug?(message: any, context?: string) {
    winstonLogger.debug(String(message), { context });
  }
  verbose?(message: any, context?: string) {
    winstonLogger.verbose(String(message), { context });
  }
}

export default winstonLogger;
