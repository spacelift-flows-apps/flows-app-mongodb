/**
 * Block Registry for MongoDB App
 *
 * This file exports all blocks as a dictionary for easy registration.
 */

import { findDocuments } from "./findDocuments";
import { updateDocuments } from "./updateDocuments";
import { deleteDocuments } from "./deleteDocuments";
import { insertDocuments } from "./insertDocuments";
import { aggregate } from "./aggregate";
import { streamDocuments } from "./streamDocuments";
import { getCollectionInfo } from "./getCollectionInfo";
import { createIndex } from "./createIndex";
import { dropIndex } from "./dropIndex";
import { runCommand } from "./runCommand";

/**
 * Dictionary of all available blocks
 */
export const blocks = {
  findDocuments,
  updateDocuments,
  deleteDocuments,
  insertDocuments,
  aggregate,
  streamDocuments,
  getCollectionInfo,
  createIndex,
  dropIndex,
  runCommand,
} as const;

// Named exports for individual blocks
export {
  findDocuments,
  updateDocuments,
  deleteDocuments,
  insertDocuments,
  aggregate,
  streamDocuments,
  getCollectionInfo,
  createIndex,
  dropIndex,
  runCommand,
};
