import crypto from "node:crypto";
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const getMongoClientPromise = () => {
  if (global.__mongoClientPromise) {
    return global.__mongoClientPromise;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  const mongoClient = new MongoClient(mongoUri, {
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });

  global.__mongoClientPromise = mongoClient.connect();
  return global.__mongoClientPromise;
};

const getDatabaseName = () => {
  const mongoUri = process.env.MONGO_URI || "";
  try {
    const uri = new URL(mongoUri);
    const databaseName = uri.pathname.replace(/^\//, "");
    return databaseName || process.env.MONGO_DB_NAME || "mrisa";
  } catch {
    return process.env.MONGO_DB_NAME || "mrisa";
  }
};

let initializationPromise: Promise<void> | null = null;

const hashPassword = (password: string, salt = crypto.randomBytes(16).toString("hex")) => {
  const iterations = 120000;
  const keyLength = 32;
  const digest = "sha256";
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `pbkdf2$${digest}$${iterations}$${salt}$${derivedKey}`;
};

const getBootstrapAdminCredentials = () => {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return { email, password };
};

const ensureCollections = async () => {
  const db = await getMongoDbConnection();

  const existingCollections = await db.listCollections().toArray();
  const collectionNames = new Set(existingCollections.map((collection) => collection.name));

  const ensureCollection = async (name: string) => {
    if (!collectionNames.has(name)) {
      await db.createCollection(name);
      collectionNames.add(name);
    }
  };

  await Promise.all([
    ensureCollection("admin_users"),
    ensureCollection("events"),
    ensureCollection("winners"),
    ensureCollection("registrations"),
    ensureCollection("contact_messages"),
  ]);

  await Promise.all([
    db.collection("events").createIndex({ date: -1, status: 1 }),
    db.collection("events").createIndex({ status: 1, date: -1 }),
    db.collection("winners").createIndex({ event_id: 1, rank: 1 }),
    db.collection("winners").createIndex({ event_id: 1 }),
    db.collection("registrations").createIndex({ event_id: 1, created_at: -1 }),
    db.collection("contact_messages").createIndex({ created_at: -1 }),
  ]);

  const credentials = getBootstrapAdminCredentials();
  if (credentials) {
    const adminUsers = db.collection("admin_users");
    const existingCount = await adminUsers.countDocuments();
    if (existingCount === 0) {
      const now = new Date().toISOString();
      await adminUsers.insertOne({
        email: credentials.email.toLowerCase().trim(),
        full_name: process.env.ADMIN_BOOTSTRAP_FULL_NAME || "Admin",
        role: "admin",
        password_hash: hashPassword(credentials.password),
        created_at: now,
        updated_at: now,
      });
    }
  }
};

const getMongoDbConnection = async () => {
  const client = await getMongoClientPromise();
  return client.db(getDatabaseName());
};

export const getMongoDb = async () => {
  if (!initializationPromise) {
    initializationPromise = ensureCollections().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
  return getMongoDbConnection();
};
