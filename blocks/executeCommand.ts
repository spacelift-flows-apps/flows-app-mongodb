import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const executeCommand: AppBlock = {
  name: "Execute Command",
  description:
    "Executes a write operation (insert, update, delete, replace) on a collection",
  category: "Basic",

  inputs: {
    default: {
      config: {
        collection: {
          name: "Collection",
          description: "Name of the collection to operate on",
          type: "string",
          required: true,
        },
        operation: {
          name: "Operation",
          description: "The write operation to perform",
          type: {
            type: "string",
            enum: [
              "insertOne",
              "updateOne",
              "updateMany",
              "deleteOne",
              "deleteMany",
              "replaceOne",
            ],
          },
          required: true,
        },
        filter: {
          name: "Filter",
          description:
            'Query filter for update/delete/replace operations (e.g. { _id: "abc" })',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
        document: {
          name: "Document",
          description:
            'Document for insert/replace, or update operators for update (e.g. { $set: { status: "active" } })',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
        options: {
          name: "Options",
          description:
            "Additional operation options (e.g. { upsert: true } for update operations)",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { collection, operation, filter, document, options } =
          input.event.inputConfig;
        const db = await getDb(input.app.config);

        const col = db.collection(collection as string);
        const op = operation as string;
        const filterObj = (filter as Record<string, any>) || {};
        const docObj = (document as Record<string, any>) || {};
        const optsObj = (options as Record<string, any>) || {};

        let result: any;

        switch (op) {
          case "insertOne": {
            const res = await col.insertOne(docObj, optsObj);
            result = {
              operation: op,
              acknowledged: res.acknowledged,
              insertedId: JSON.parse(JSON.stringify(res.insertedId)),
            };
            break;
          }
          case "updateOne": {
            const res = await col.updateOne(filterObj, docObj, optsObj);
            result = {
              operation: op,
              acknowledged: res.acknowledged,
              matchedCount: res.matchedCount,
              modifiedCount: res.modifiedCount,
              upsertedId: res.upsertedId
                ? JSON.parse(JSON.stringify(res.upsertedId))
                : null,
            };
            break;
          }
          case "updateMany": {
            const res = await col.updateMany(filterObj, docObj, optsObj);
            result = {
              operation: op,
              acknowledged: res.acknowledged,
              matchedCount: res.matchedCount,
              modifiedCount: res.modifiedCount,
              upsertedId: res.upsertedId
                ? JSON.parse(JSON.stringify(res.upsertedId))
                : null,
            };
            break;
          }
          case "deleteOne": {
            const res = await col.deleteOne(filterObj, optsObj);
            result = {
              operation: op,
              acknowledged: res.acknowledged,
              deletedCount: res.deletedCount,
            };
            break;
          }
          case "deleteMany": {
            const res = await col.deleteMany(filterObj, optsObj);
            result = {
              operation: op,
              acknowledged: res.acknowledged,
              deletedCount: res.deletedCount,
            };
            break;
          }
          case "replaceOne": {
            const res = await col.replaceOne(filterObj, docObj, optsObj);
            result = {
              operation: op,
              acknowledged: res.acknowledged,
              matchedCount: res.matchedCount,
              modifiedCount: res.modifiedCount,
              upsertedId: res.upsertedId
                ? JSON.parse(JSON.stringify(res.upsertedId))
                : null,
            };
            break;
          }
          default:
            throw new Error(`Unsupported operation: ${op}`);
        }

        await events.emit(result);
      },
    },
  },

  outputs: {
    default: {
      name: "Command Result",
      description: "The result of the write operation",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            description: "The operation that was performed",
          },
          acknowledged: {
            type: "boolean",
            description: "Whether the operation was acknowledged by the server",
          },
          insertedId: {
            description: "ID of the inserted document (for insertOne)",
          },
          matchedCount: {
            type: "number",
            description:
              "Number of documents matched (for update/replace operations)",
          },
          modifiedCount: {
            type: "number",
            description:
              "Number of documents modified (for update/replace operations)",
          },
          deletedCount: {
            type: "number",
            description: "Number of documents deleted (for delete operations)",
          },
          upsertedId: {
            description:
              "ID of the upserted document (for update/replace with upsert)",
          },
        },
        required: ["operation", "acknowledged"],
      },
    },
  },
};
