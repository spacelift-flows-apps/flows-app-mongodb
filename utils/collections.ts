import memoizee from "memoizee";
import { MongoClient } from "mongodb";
import { createClientOptions } from "./client.ts";

interface CollectionEntry {
  name: string;
  type: string;
}

async function fetchCollections(
  connectionString: string,
  database: string,
  optionsJson: string,
): Promise<CollectionEntry[]> {
  const options = JSON.parse(optionsJson);
  options.maxPoolSize = 1;

  const client = new MongoClient(connectionString, options);
  try {
    await client.connect();
    const db = client.db(database);
    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();
    return collections.map((c) => ({
      name: c.name,
      type: c.type || "collection",
    }));
  } finally {
    await client.close().catch(() => {});
  }
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

  const options = createClientOptions(input.app.config);
  const collections = await getCollections(
    connectionString as string,
    database as string,
    JSON.stringify(options),
  );

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
