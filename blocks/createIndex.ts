import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const createIndex: AppBlock = {
  name: "Create Index",
  description: "Creates an index on a collection",
  category: "Utility",

  inputs: {
    default: {
      config: {
        collection: {
          name: "Collection",
          description: "Name of the collection to create the index on",
          type: "string",
          required: true,
        },
        keys: {
          name: "Index Keys",
          description:
            'Field specification (e.g. { email: 1 } for ascending, { location: "2dsphere" } for geospatial)',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: true,
        },
        options: {
          name: "Options",
          description:
            'Index options (e.g. { unique: true, name: "email_unique", sparse: true })',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { collection, keys, options } = input.event.inputConfig;
        const db = await getDb(input.app.config);

        const indexName = await db
          .collection(collection as string)
          .createIndex(
            keys as Record<string, any>,
            (options as Record<string, any>) || {},
          );

        await events.emit({
          indexName,
          collection: collection as string,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Index Created",
      description: "The result of the index creation",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          indexName: {
            type: "string",
            description: "Name of the created index",
          },
          collection: {
            type: "string",
            description: "The collection the index was created on",
          },
        },
        required: ["indexName", "collection"],
      },
    },
  },
};
