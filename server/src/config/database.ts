import mongoose, {ConnectOptions} from 'mongoose'
import { env } from './keys.js'
import logger, {logError} from './logger.js'


let connectionPromise: Promise<typeof mongoose> | null = null
const connectionOptions: ConnectOptions = {
  dbName: env.DATABASE_NAME,
  serverSelectionTimeoutMS: 45000,
  socketTimeoutMS: 5000,
  retryReads: true,
  retryWrites: true,
  maxPoolSize: 50,
  minPoolSize: 1,
  monitorCommands: env.NODE_ENV === 'development',
}

export const connectDB = async (): Promise<void> => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    logger.info('Using existing MongoDB connection')
    return
  }

  // Connection already in progress
  if (mongoose.connection.readyState === 2) {
    logger.info('MongoDB connection already in progress')
    return
  }

  try {
    

    if (!connectionPromise) {
  connectionPromise = mongoose.connect(
    env.MONGO_URI,
    connectionOptions
  )
}

    const conn = await connectionPromise

    logger.info(`MongoDB Connected: ${conn.connection.host}`)

    // Register listeners only once
    if (mongoose.connection.listenerCount('error') === 0) {
      mongoose.connection.on('error', err => {
        logger.error('MongoDB connection error', err)
      })

     
    mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
    connectionPromise = null
})
    }
  
  } catch (error) {
  connectionPromise = null
  logError(error, 'MongoDB connection failed')
  throw error
}
}

// Close MongoDB connection gracefully
export const gracefulShutDown = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      logger.info('MongoDB connection closed')
    }
  } catch (error) {
    logError(error, 'Error during database disconnection')
  }
}
