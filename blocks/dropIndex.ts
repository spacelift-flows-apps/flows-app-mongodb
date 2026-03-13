import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";
import { collectionConfig } from "../utils/collections.ts";

export const dropIndex: AppBlock = {
  name: "Drop Index",
  description: "Drops an index from a collection by name",
  category: "Utility",

  inputs: {
    default: {
      config: {
        collection: collectionConfig,
        indexName: {
          name: "Index Name",
          description:
            'Name of the index to drop (use Get Collection Info to list indexes). Use "*" to drop all non-_id indexes.',
          type: "string",
          required: true,
        },
      },
      async onEvent(input) {
        const { collection, indexName } = input.event.inputConfig;
        const db = await getDb(input.app.config);

        const col = db.collection(collection as string);
        const name = indexName as string;

        if (name === "*") {
          await col.dropIndexes();
        } else {
          await col.dropIndex(name);
        }

        await events.emit({
          indexName: name,
          collection: collection as string,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Index Dropped",
      description: "The result of the index drop",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          indexName: {
            type: "string",
            description:
              'Name of the dropped index, or "*" if all were dropped',
          },
          collection: {
            type: "string",
            description: "The collection the index was dropped from",
          },
        },
        required: ["indexName", "collection"],
      },
    },
  },
};
