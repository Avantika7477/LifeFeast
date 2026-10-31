import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../.mongodb-data');
const downloadDir = path.resolve(__dirname, '../../node_modules/.cache/mongodb-memory-server');

let embeddedServer;

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
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
  return conn.connection.host;
}

async function startEmbedded() {
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

const LOCAL_URI = 'mongodb://127.0.0.1:27017/lifequest';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || LOCAL_URI;
  try {
    const host = await connectUri(uri);
    console.log(`MongoDB connected: ${host}`);
    return;
  } catch (error) {
    console.warn(`Could not reach configured MongoDB (${error.code || error.name})`);
    if (process.env.NODE_ENV === 'production') {
      console.error('Set MONGODB_URI to a MongoDB Atlas connection string in production.');
      process.exit(1);
    }
  }

  if (uri !== LOCAL_URI) {
    try {
      const host = await connectUri(LOCAL_URI);
      console.log(`MongoDB connected (local): ${host}`);
      return;
    } catch {
      // fall through to embedded
    }
  }

  console.warn('Starting embedded MongoDB (first run may download a binary)...');
  try {
    await startEmbedded();
  } catch (embeddedErr) {
    console.error(`Embedded MongoDB failed: ${embeddedErr.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { embeddedServer };
