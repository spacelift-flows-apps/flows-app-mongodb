import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const aggregate: AppBlock = {
  name: "Aggregate",
  description:
    "Executes an aggregation pipeline on a collection for data transformation and analysis",
  category: "Basic",

  inputs: {
    default: {
      config: {
        collection: {
          name: "Collection",
          description: "Name of the collection to aggregate",
          type: "string",
          required: true,
        },
        pipeline: {
          name: "Pipeline",
          description:
            'Array of aggregation pipeline stages (e.g. [{ $match: { status: "active" } }, { $group: { _id: "$category", total: { $sum: 1 } } }])',
          type: {
            type: "array",
            items: {
              type: "object",
            },
          },
          required: true,
        },
        options: {
          name: "Options",
          description:
            "Aggregation options (e.g. { allowDiskUse: true } for large datasets)",
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: false,
        },
      },
      async onEvent(input) {
        const { collection, pipeline, options } = input.event.inputConfig;
        const db = await getDb(input.app.config);

        const rawDocuments = await db
          .collection(collection as string)
          .aggregate(
            pipeline as Record<string, any>[],
            (options as Record<string, any>) || {},
          )
          .toArray();

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
      name: "Aggregation Result",
      description: "The result of the aggregation pipeline",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            description: "Array of result documents from the pipeline",
            items: {
              type: "object",
            },
          },
          count: {
            type: "number",
            description: "Number of documents in the result",
          },
        },
        required: ["documents", "count"],
      },
    },
  },
};
