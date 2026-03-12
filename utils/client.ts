import { MongoClient, Db, MongoClientOptions } from "mongodb";
import crypto from "crypto";

// Global client instance
let globalClient: MongoClient | null = null;
let currentConfigHash: string | null = null;
let clientInitializationPromise: Promise<MongoClient> | null = null;

/**
 * Creates a hash of the configuration to detect changes
 */
function getConfigHash(appConfig: any): string {
  const configForHash = {
    connectionString: appConfig.connectionString,
    database: appConfig.database,
    tls: appConfig.tls,
    caCertificate: appConfig.caCertificate,
    connectionTimeout: appConfig.connectionTimeout,
    selectionTimeout: appConfig.selectionTimeout,
  };
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(configForHash))
    .digest("hex");
}

/**
 * Creates MongoClient options from app config
 */
export function createClientOptions(appConfig: any): MongoClientOptions {
  const options: MongoClientOptions = {
    connectTimeoutMS: (appConfig.connectionTimeout as number) * 1000,
    serverSelectionTimeoutMS: (appConfig.selectionTimeout as number) * 1000,
  };

  if (appConfig.tls) {
    options.tls = true;
    if (appConfig.caCertificate) {
      options.ca = appConfig.caCertificate as string;
    }
  }

  return options;
}

/**
 * Gets or creates the global MongoClient instance.
 * This ensures all blocks share the same client and handles config changes.
 */
export async function getClient(appConfig: any): Promise<MongoClient> {
  const configHash = getConfigHash(appConfig);

  // If config hasn't changed and we have a client, return it
  if (globalClient && currentConfigHash === configHash) {
    return globalClient;
  }

  // If initialization is already in progress, wait for it
  if (clientInitializationPromise && currentConfigHash === configHash) {
    return clientInitializationPromise;
  }

  // Start initialization (this prevents multiple simultaneous initializations)
  clientInitializationPromise = (async () => {
    try {
      // Close the old client if config changed
      if (globalClient && currentConfigHash !== configHash) {
        console.log("MongoDB config changed, recreating client");
        try {
          await globalClient.close();
        } catch (error) {
          console.error("Error closing old client:", error);
        }
        globalClient = null;
      }

      // Create new client
      const options = createClientOptions(appConfig);
      const newClient = new MongoClient(
        appConfig.connectionString as string,
        options,
      );

      await newClient.connect();

      // Store the new client and config hash
      globalClient = newClient;
      currentConfigHash = configHash;

      return newClient;
    } finally {
      // Clear the initialization promise when done
      clientInitializationPromise = null;
    }
  })();

  return clientInitializationPromise;
}

/**
 * Gets a Db instance for the configured database.
 * Convenience wrapper around getClient().
 */
export async function getDb(appConfig: any): Promise<Db> {
  const client = await getClient(appConfig);
  return client.db(appConfig.database as string);
}
