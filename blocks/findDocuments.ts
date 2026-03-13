import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";
import { collectionConfig } from "../utils/collections.ts";

export const findDocuments: AppBlock = {
  name: "Find Documents",
  description: "Queries documents from a collection using a filter",
  category: "Basic",

  inputs: {
    default: {
      config: {
        collection: collectionConfig,
        filter: {
          name: "Filter",
          description:
            'MongoDB query filter object (e.g. { status: "active", age: { $gt: 18 } }). Empty object {} returns all documents.',
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
            "Fields to include or exclude (e.g. { name: 1, email: 1 } or { password: 0 })",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
        sort: {
          name: "Sort",
          description:
            "Sort order (e.g. { createdAt: -1 } for descending by createdAt)",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
        limit: {
          name: "Limit",
          description: "Maximum number of documents to return (0 for no limit)",
          type: "number",
          required: false,
          default: 0,
        },
        skip: {
          name: "Skip",
          description: "Number of documents to skip",
          type: "number",
          required: false,
          default: 0,
        },
      },
      async onEvent(input) {
        const { collection, filter, projection, sort, limit, skip } =
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

        if (skip) {
          cursor = cursor.skip(skip as number);
        }

        if (limit) {
          cursor = cursor.limit(limit as number);
        }

        const rawDocuments = await cursor.toArray();

        // Serialize BSON types to plain JSON
        const documents = JSON.parse(JSON.stringify(rawDocuments));

        await events.emit({
          documents,
          count: documents.length,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Query Result",
      description: "The documents matching the query",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            description: "Array of matching documents",
            items: {
              type: "object",
            },
          },
          count: {
            type: "number",
            description: "Number of documents returned",
          },
        },
        required: ["documents", "count"],
      },
    },
  },
};
