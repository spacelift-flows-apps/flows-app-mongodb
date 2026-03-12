import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const insertDocuments: AppBlock = {
  name: "Insert Documents",
  description: "Inserts multiple documents into a collection",
  category: "Bulk Operations",

  inputs: {
    default: {
      config: {
        collection: {
          name: "Collection",
          description: "Name of the collection to insert into",
          type: "string",
          required: true,
        },
        documents: {
          name: "Documents",
          description: "Array of documents to insert",
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: true,
        },
        ordered: {
          name: "Ordered",
          description:
            "If true, inserts stop on first error. If false, all valid documents are inserted.",
          type: "boolean",
          required: false,
          default: true,
        },
      },
      async onEvent(input) {
        const { collection, documents, ordered } = input.event.inputConfig;
        const db = await getDb(input.app.config);

        const docs = documents as Record<string, any>[];

        if (docs.length === 0) {
          await events.emit({
            insertedCount: 0,
            insertedIds: {},
            collection: collection as string,
          });
          return;
        }

        const result = await db
          .collection(collection as string)
          .insertMany(docs, { ordered: ordered as boolean });

        await events.emit({
          insertedCount: result.insertedCount,
          insertedIds: JSON.parse(JSON.stringify(result.insertedIds)),
          collection: collection as string,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Insert Result",
      description: "The result of the bulk insert operation",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          insertedCount: {
            type: "number",
            description: "Number of documents inserted",
          },
          insertedIds: {
            type: "object",
            description:
              'Map of array index to inserted document ID (e.g. { 0: "...", 1: "..." })',
          },
          collection: {
            type: "string",
            description: "The collection name where documents were inserted",
          },
        },
        required: ["insertedCount", "insertedIds", "collection"],
      },
    },
  },
};
