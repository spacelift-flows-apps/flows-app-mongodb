import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const getCollectionInfo: AppBlock = {
  name: "Get Collection Info",
  description:
    "Retrieves collection metadata, indexes, validation rules, and inferred field schema from a sample of documents",
  category: "Utility",

  inputs: {
    default: {
      config: {
        collection: {
          name: "Collection",
          description: "Name of the collection to inspect",
          type: "string",
          required: true,
        },
        sampleSize: {
          name: "Sample Size",
          description:
            "Number of documents to sample for field inference (0 to skip inference)",
          type: "number",
          required: false,
          default: 100,
        },
      },
      async onEvent(input) {
        const { collection, sampleSize } = input.event.inputConfig;
        const db = await getDb(input.app.config);
        const collName = collection as string;

        // Get collection info from listCollections (full info, not nameOnly)
        const collections = await db
          .listCollections({ name: collName }, { nameOnly: false })
          .toArray();
        if (collections.length === 0) {
          throw new Error(`Collection '${collName}' not found`);
        }
        const collInfo = collections[0];

        // Get collection stats
        const stats = await db.command({ collStats: collName });

        // Get indexes
        const indexes = await db.collection(collName).indexes();

        // Infer field schema from a sample of documents
        let inferredFields: Record<
          string,
          { types: string[]; occurrences: number }
        > = {};

        const sample = sampleSize as number;
        if (sample > 0) {
          const sampleDocs = await db
            .collection(collName)
            .find({})
            .limit(sample)
            .toArray();

          const fieldMap: Record<string, Map<string, number>> = {};
          const fieldCounts: Record<string, number> = {};

          for (const doc of sampleDocs) {
            collectFields(doc, "", fieldMap, fieldCounts);
          }

          for (const [field, typeMap] of Object.entries(fieldMap)) {
            inferredFields[field] = {
              types: Array.from(typeMap.keys()),
              occurrences: fieldCounts[field],
            };
          }
        }

        await events.emit({
          name: collInfo.name,
          type: collInfo.type,
          options: collInfo.options || {},
          documentCount: stats.count,
          storageSize: stats.storageSize,
          avgDocumentSize: stats.count > 0 ? stats.avgObjSize : 0,
          indexes: JSON.parse(JSON.stringify(indexes)),
          validationRules: collInfo.options?.validator || null,
          inferredFields,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Collection Information",
      description: "Metadata and schema information about the collection",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Collection name",
          },
          type: {
            type: "string",
            description: "Collection type (e.g. 'collection', 'view')",
          },
          options: {
            type: "object",
            description: "Collection creation options",
          },
          documentCount: {
            type: "number",
            description: "Number of documents in the collection",
          },
          storageSize: {
            type: "number",
            description: "Total storage size in bytes",
          },
          avgDocumentSize: {
            type: "number",
            description: "Average document size in bytes",
          },
          indexes: {
            type: "array",
            description: "Array of index definitions",
            items: {
              type: "object",
            },
          },
          validationRules: {
            description: "JSON Schema validation rules, if configured",
          },
          inferredFields: {
            type: "object",
            description:
              "Fields inferred from sampled documents, with observed types and occurrence count",
          },
        },
        required: [
          "name",
          "type",
          "options",
          "documentCount",
          "storageSize",
          "avgDocumentSize",
          "indexes",
          "inferredFields",
        ],
      },
    },
  },
};

/**
 * Recursively collects field paths and their types from a document.
 */
function collectFields(
  obj: any,
  prefix: string,
  fieldMap: Record<string, Map<string, number>>,
  fieldCounts: Record<string, number>,
) {
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const typeName = getTypeName(value);

    if (!fieldMap[fieldPath]) {
      fieldMap[fieldPath] = new Map();
      fieldCounts[fieldPath] = 0;
    }
    fieldMap[fieldPath].set(
      typeName,
      (fieldMap[fieldPath].get(typeName) || 0) + 1,
    );
    fieldCounts[fieldPath]++;

    // Recurse into plain objects (not arrays, dates, etc.)
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      collectFields(value, fieldPath, fieldMap, fieldCounts);
    }
  }
}

function getTypeName(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  return typeof value;
}
