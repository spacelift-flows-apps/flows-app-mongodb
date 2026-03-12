import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const updateDocuments: AppBlock = {
  name: "Update Documents",
  description:
    "Updates or replaces documents in a collection matching a filter",
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
          description: "The update operation to perform",
          type: {
            type: "string",
            enum: ["updateOne", "updateMany", "replaceOne"],
          },
          required: true,
        },
        filter: {
          name: "Filter",
          description: 'Query filter to match documents (e.g. { _id: "abc" })',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: true,
        },
        update: {
          name: "Update",
          description:
            'Update operators for updateOne/updateMany (e.g. { $set: { status: "active" } }) or replacement document for replaceOne',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: true,
        },
        options: {
          name: "Options",
          description:
            "Additional options (e.g. { upsert: true } to insert if no match found)",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { collection, operation, filter, update, options } =
          input.event.inputConfig;
        const db = await getDb(input.app.config);

        const col = db.collection(collection as string);
        const op = operation as string;
        const filterObj = filter as Record<string, any>;
        const updateObj = update as Record<string, any>;
        const optsObj = (options as Record<string, any>) || {};

        let res;
        switch (op) {
          case "updateOne":
            res = await col.updateOne(filterObj, updateObj, optsObj);
            break;
          case "updateMany":
            res = await col.updateMany(filterObj, updateObj, optsObj);
            break;
          case "replaceOne":
            res = await col.replaceOne(filterObj, updateObj, optsObj);
            break;
          default:
            throw new Error(`Unsupported operation: ${op}`);
        }

        await events.emit({
          operation: op,
          acknowledged: res.acknowledged,
          matchedCount: res.matchedCount,
          modifiedCount: res.modifiedCount,
          upsertedId: res.upsertedId
            ? JSON.parse(JSON.stringify(res.upsertedId))
            : null,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Update Result",
      description: "The result of the update operation",
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
          matchedCount: {
            type: "number",
            description: "Number of documents matched by the filter",
          },
          modifiedCount: {
            type: "number",
            description: "Number of documents modified",
          },
          upsertedId: {
            description:
              "ID of the upserted document (when upsert option is used and no match found)",
          },
        },
        required: [
          "operation",
          "acknowledged",
          "matchedCount",
          "modifiedCount",
        ],
      },
    },
  },
};
