import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../.mongodb-data');
const downloadDir = path.resolve(__dirname, '../../node_modules/.cache/mongodb-memory-server');
const LOCAL_URI = 'mongodb://127.0.0.1:27017/lifequest';

let embeddedServer;
let connectPromise;

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function findCachedMongod() {
  const dirs = [downloadDir, path.join(process.env.HOME || '', '.cache/mongodb-binaries')];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const binary = fs.readdirSync(dir).find((file) => {
      if (!file.startsWith('mongod')) return false;
      if (file.endsWith('.md5') || file.includes('.tgz') || file.includes('.downloading')) return false;
      return fs.statSync(path.join(dir, file)).isFile();
    });
    if (!binary) continue;
    const fullPath = path.join(dir, binary);
    try {
      fs.accessSync(fullPath, fs.constants.X_OK);
      return fullPath;
    } catch {
      continue;
    }
  }
  return undefined;
}

async function connectUri(uri) {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: isServerless() ? 15000 : 2500,
    maxPoolSize: isServerless() ? 5 : 10,
  });
  return conn.connection.host;
}

async function startEmbedded() {
  if (isServerless()) {
    throw new Error('Embedded MongoDB is not available on Vercel. Set MONGODB_URI to MongoDB Atlas.');
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(dataDir, { recursive: true });

  const systemBinary = findCachedMongod();
  const mongod = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
      dbName: 'lifequest',
      dbPath: dataDir,
      storageEngine: 'wiredTiger',
    },
    binary: systemBinary
      ? { systemBinary }
      : { version: '8.2.6', downloadDir },
  });
  embeddedServer = mongod;

  const uri = mongod.getUri('lifequest');
  const host = await connectUri(uri);
  console.log(
    systemBinary
      ? `Using embedded MongoDB (${systemBinary})`
      : 'Using embedded MongoDB (data in .mongodb-data/)',
  );
  console.log(`MongoDB connected: ${host}`);
}

/**
 * Cached connect safe for Vercel/serverless cold starts.
 * Never calls process.exit — callers decide how to handle failure.
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const uri = process.env.MONGODB_URI || LOCAL_URI;
    const allowEmbedded = !isServerless() && process.env.NODE_ENV !== 'production';

    try {
      const host = await connectUri(uri);
      console.log(`MongoDB connected: ${host}`);
      return mongoose.connection;
    } catch (error) {
      console.warn(`Could not reach configured MongoDB (${error.code || error.name}): ${error.message}`);

      if (isServerless() || process.env.NODE_ENV === 'production') {
        const hint = process.env.MONGODB_URI
          ? 'Check that MONGODB_URI Atlas allows Vercel and the password is URL-encoded.'
          : 'Set MONGODB_URI to a MongoDB Atlas connection string in the Vercel project env.';
        throw new Error(`Database unavailable. ${hint}`);
      }
    }

    if (uri !== LOCAL_URI) {
      try {
        const host = await connectUri(LOCAL_URI);
        console.log(`MongoDB connected (local): ${host}`);
        return mongoose.connection;
      } catch {
        // fall through to embedded
      }
    }

    if (!allowEmbedded) {
      throw new Error('Database unavailable. Set MONGODB_URI.');
    }

    console.warn('Starting embedded MongoDB (first run may download a binary)...');
    await startEmbedded();
    return mongoose.connection;
  })().catch((error) => {
    connectPromise = null;
    throw error;
  });

  return connectPromise;
};

export default connectDB;
export { embeddedServer };
