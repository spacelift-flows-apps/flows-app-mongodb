import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const streamDocuments: AppBlock = {
  name: "Stream Documents",
  description:
    "Queries documents and streams results in batches as separate events for large datasets",
  category: "Bulk Operations",

  inputs: {
    default: {
      config: {
        collection: {
          name: "Collection",
          description: "Name of the collection to query",
          type: "string",
          required: true,
        },
        filter: {
          name: "Filter",
          description:
            "MongoDB query filter object. Empty object {} returns all documents.",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
          default: {},
        },
        projection: {
          name: "Projection",
          description:
            "Fields to include or exclude (e.g. { name: 1, email: 1 })",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
        sort: {
          name: "Sort",
          description: "Sort order (e.g. { createdAt: -1 })",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
        batchSize: {
          name: "Batch Size",
          description: "Number of documents per batch event",
          type: "number",
          required: false,
          default: 100,
        },
      },
      async onEvent(input) {
        const { collection, filter, projection, sort, batchSize } =
          input.event.inputConfig;
        const db = await getDb(input.app.config);

        let cursor = db
          .collection(collection as string)
          .find((filter as Record<string, any>) || {});

        if (projection) {
          cursor = cursor.project(projection as Record<string, any>);
        }

        if (sort) {
          cursor = cursor.sort(sort as Record<string, any>);
        }

        cursor = cursor.batchSize(batchSize as number);

        let batchNumber = 0;
        let currentBatch: any[] = [];

        for await (const doc of cursor) {
          // Serialize BSON types to plain JSON
          currentBatch.push(JSON.parse(JSON.stringify(doc)));

          if (currentBatch.length >= (batchSize as number)) {
            await events.emit({
              batchNumber,
              documents: currentBatch,
              documentCount: currentBatch.length,
              hasMore: true,
            });
            batchNumber++;
            currentBatch = [];
          }
        }

        // Emit any remaining documents
        if (currentBatch.length > 0) {
          await events.emit({
            batchNumber,
            documents: currentBatch,
            documentCount: currentBatch.length,
            hasMore: false,
          });
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Batch",
      description: "Emitted for each batch of documents",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          batchNumber: {
            type: "number",
            description: "Sequential batch number starting from 0",
          },
          documents: {
            type: "array",
            description: "Array of documents in this batch",
            items: {
              type: "object",
            },
          },
          documentCount: {
            type: "number",
            description: "Number of documents in this batch",
          },
          hasMore: {
            type: "boolean",
            description: "Whether more batches are expected",
          },
        },
        required: ["batchNumber", "documents", "documentCount", "hasMore"],
      },
    },
  },
};
