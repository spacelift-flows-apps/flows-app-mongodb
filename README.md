# MongoDB

## Description

App for interacting with MongoDB databases. Supports document queries, write operations, aggregation pipelines, bulk inserts, streaming, collection introspection, and raw database commands.

## Configuration

The app requires MongoDB connection details:

- `connectionString` - MongoDB connection URI, e.g. `mongodb://user:pass@host:27017` or `mongodb+srv://...` (required, sensitive)
- `database` - Default database name (required)
- `tls` - Enable TLS/SSL (default: false)
- `tlsCAFile` - PEM-encoded CA certificate for verifying the server certificate (optional, sensitive)
- `connectTimeout` - Connection timeout in seconds (default: 10)
- `serverSelectionTimeout` - Server selection timeout in seconds (default: 30)

## Blocks

- `findDocuments`
  - Queries documents from a collection using a filter with support for projection, sorting, limit, and skip.

- `executeCommand`
  - Executes a write operation (insertOne, updateOne, updateMany, deleteOne, deleteMany, replaceOne) on a collection.

- `insertDocuments`
  - Inserts multiple documents into a collection using insertMany. Supports ordered/unordered mode.

- `aggregate`
  - Executes an aggregation pipeline on a collection for data transformation and analysis.

- `streamDocuments`
  - Queries documents and streams results in batches as separate events. Useful for large datasets.

- `getCollectionInfo`
  - Retrieves collection metadata, indexes, validation rules, and inferred field schema from a sample of documents.

- `runCommand`
  - Executes an arbitrary database command. Escape hatch for operations not covered by other blocks.
