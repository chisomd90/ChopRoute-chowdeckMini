import pino, { type Logger } from 'pino'
import { env } from './keys.js'
import { pinoHttp } from "pino-http";


const isDev = env.NODE_ENV === 'development'

const logger: Logger = pino({
  level: env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: {
    pid: process.pid,
    env: env.NODE_ENV,
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
        },
      }
    : undefined,
})

// Helper functions to log erros with context

export const logError = (error: Error | unknown, context?: string, metadata?: Record<string, unknown>): void => {
  const errorInfo =
    error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { message: String(error) }

  logger.error(
    {
      err: errorInfo,
      context,
      ...metadata,
    },
    context || 'An error occurred'
  )
}


export const httpLogger = pinoHttp({
  logger,
  // Customise what information gets logged out of the request object
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress, // Automatically grabs the IP
      };
    },
  },
  // Automatically outputs a clean text message next to the JSON payload
  customSuccessMessage: (req) => `${req.method} ${req.url}`,
  customErrorMessage: (req) => `${req.method} ${req.url} failed`,
});


// // Helper function to log http request
// export const logRequest = (
//   req: {
//     method: string
//     url: string
//     ip?: string
//     userId?: string
//   },
//   metadata?: Record<string, unknown>
// ): void => {
//   logger.info(
//     {
//       method: req.method,
//       url: req.url,
//       ip: req.ip,
//       userId: req.userId,
//       ...metadata,
//     },
//     `${req.method} ${req.url}`
//   )
// }

export default logger