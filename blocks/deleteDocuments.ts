import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";
import { collectionConfig } from "../utils/collections.ts";

export const deleteDocuments: AppBlock = {
  name: "Delete Documents",
  description: "Deletes documents from a collection matching a filter",
  category: "Basic",

  inputs: {
    default: {
      config: {
        collection: collectionConfig,
        operation: {
          name: "Operation",
          description: "Delete one matching document or all matching documents",
          type: {
            type: "string",
            enum: ["deleteOne", "deleteMany"],
          },
          required: true,
        },
        filter: {
          name: "Filter",
          description:
            'Query filter to match documents (e.g. { status: "inactive" })',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: true,
        },
        options: {
          name: "Options",
          description: "Additional settings for the delete operation",
          type: {
            type: "object",
            properties: {
              hint: {
                type: "object",
                description:
                  "Index hint to force a specific index (e.g. { _id: 1 })",
              },
              comment: {
                type: "string",
                description: "Comment to attach to the operation for profiling",
              },
            },
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { collection, operation, filter, options } =
          input.event.inputConfig;
        const db = await getDb(input.app.config);

        const col = db.collection(collection as string);
        const op = operation as string;
        const filterObj = filter as Record<string, any>;
        const optsObj = (options as Record<string, any>) || {};

        let res;
        switch (op) {
          case "deleteOne":
            res = await col.deleteOne(filterObj, optsObj);
            break;
          case "deleteMany":
            res = await col.deleteMany(filterObj, optsObj);
            break;
          default:
            throw new Error(`Unsupported operation: ${op}`);
        }

        await events.emit({
          operation: op,
          acknowledged: res.acknowledged,
          deletedCount: res.deletedCount,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Delete Result",
      description: "The result of the delete operation",
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
          deletedCount: {
            type: "number",
            description: "Number of documents deleted",
          },
        },
        required: ["operation", "acknowledged", "deletedCount"],
      },
    },
  },
};
