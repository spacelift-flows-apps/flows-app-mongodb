import memoizee from "memoizee";
import { getDb } from "./client.ts";

interface CollectionEntry {
  name: string;
  type: string;
}

async function fetchCollections(appConfig: any): Promise<CollectionEntry[]> {
  const db = await getDb(appConfig);
  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();
  return collections.map((c) => ({
    name: c.name,
    type: c.type || "collection",
  }));
}

const getCollections = memoizee(fetchCollections, {
  maxAge: 60000,
  promise: true,
});

async function suggestCollections(input: any) {
  const { connectionString, database } = input.app.config;

  if (!connectionString || !database) {
    return {
      suggestedValues: [],
      message:
        "Configure connection string and database to receive suggestions.",
    };
  }

  const collections = await getCollections(input.app.config);

  let values = collections.map((c) => ({
    label: c.type === "view" ? `${c.name} (view)` : c.name,
    value: c.name,
  }));

  if (input.searchPhrase) {
    const searchLower = input.searchPhrase.toLowerCase();
    values = values.filter((v) => v.label.toLowerCase().includes(searchLower));
  }

  return { suggestedValues: values.slice(0, 50) };
}

export const collectionConfig = {
  name: "Collection",
  description: "Name of the collection",
  type: "string" as const,
  required: true as const,
  suggestValues: suggestCollections,
};
