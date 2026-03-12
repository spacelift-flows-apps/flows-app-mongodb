import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";
import { collectionConfig } from "../utils/collections.ts";

export const createIndex: AppBlock = {
  name: "Create Index",
  description: "Creates an index on a collection",
  category: "Utility",

  inputs: {
    default: {
      config: {
        collection: collectionConfig,
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
          description: "Additional settings for the index",
          type: {
            type: "object",
            properties: {
              unique: {
                type: "boolean",
                description: "Create a unique index",
              },
              sparse: {
                type: "boolean",
                description:
                  "Only index documents that contain the indexed fields",
              },
              name: {
                type: "string",
                description:
                  "Custom index name (auto-generated if not specified)",
              },
              expireAfterSeconds: {
                type: "number",
                description:
                  "TTL index — automatically delete documents this many seconds after the indexed date field value",
              },
              background: {
                type: "boolean",
                description: "Build the index in the background",
              },
            },
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
