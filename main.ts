import { defineApp } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";
import { MongoClient } from "mongodb";
import { createClientOptions } from "./utils/client.ts";

export const app = defineApp({
  name: "MongoDB",
  installationInstructions:
    "Connect your MongoDB database to Spacelift Flows.\n\nTo install:\n1. Provide your MongoDB connection string and database name\n2. Click 'Confirm' to test the connection\n3. Start using the MongoDB blocks in your flows",

  blocks,

  config: {
    connectionString: {
      name: "Connection String",
      description:
        "MongoDB connection URI (e.g. mongodb://user:pass@host:27017 or mongodb+srv://...)",
      type: "string",
      required: true,
      sensitive: true,
    },
    database: {
      name: "Database",
      description: "Default database name",
      type: "string",
      required: true,
    },
    tls: {
      name: "TLS",
      description: "Enable TLS/SSL for the connection",
      type: "boolean",
      required: false,
      default: false,
    },
    caCertificate: {
      name: "CA Certificate",
      description:
        "PEM-encoded CA certificate for verifying the server certificate (e.g., AWS DocumentDB CA bundle)",
      type: "string",
      required: false,
      sensitive: true,
    },
    connectionTimeout: {
      name: "Connection Timeout",
      description: "Connection timeout in seconds",
      type: "number",
      required: false,
      default: 10,
    },
    selectionTimeout: {
      name: "Server Selection Timeout",
      description: "Server selection timeout in seconds",
      type: "number",
      required: false,
      default: 30,
    },
  },

  async onSync(input) {
    const config = input.app.config;

    const options = createClientOptions(config);
    // Use a single connection for testing
    options.maxPoolSize = 1;

    const client = new MongoClient(config.connectionString as string, options);

    try {
      await client.connect();

      const db = client.db(config.database as string);

      // Verify connectivity
      await db.command({ ping: 1 });

      // Check permissions by listing collections
      await db.listCollections({}, { nameOnly: true }).toArray();

      await client.close();

      return {
        newStatus: "ready" as const,
      };
    } catch (error: any) {
      await client.close().catch(() => {});

      console.error("MongoDB connection test failed:", error.message);

      let statusDescription = "Connection failed";
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        statusDescription = "Cannot reach database server";
      } else if (
        error.codeName === "AuthenticationFailed" ||
        error.code === 18
      ) {
        statusDescription = "Authentication failed";
      } else if (error.name === "MongoServerSelectionError") {
        statusDescription = "Cannot reach database server";
      } else if (error.name === "MongoNetworkError") {
        statusDescription = "Network error connecting to database server";
      } else if (error.codeName === "Unauthorized" || error.code === 13) {
        statusDescription = "Insufficient database permissions";
      }

      return {
        newStatus: "failed" as const,
        customStatusDescription: statusDescription,
      };
    }
  },
});
