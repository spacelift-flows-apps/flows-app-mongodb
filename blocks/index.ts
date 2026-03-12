/**
 * Block Registry for MongoDB App
 *
 * This file exports all blocks as a dictionary for easy registration.
 */

import { findDocuments } from "./findDocuments";
import { executeCommand } from "./executeCommand";
import { insertDocuments } from "./insertDocuments";
import { aggregate } from "./aggregate";
import { streamDocuments } from "./streamDocuments";
import { getCollectionInfo } from "./getCollectionInfo";
import { runCommand } from "./runCommand";

/**
 * Dictionary of all available blocks
 */
export const blocks = {
  findDocuments,
  executeCommand,
  insertDocuments,
  aggregate,
  streamDocuments,
  getCollectionInfo,
  runCommand,
} as const;

// Named exports for individual blocks
export {
  findDocuments,
  executeCommand,
  insertDocuments,
  aggregate,
  streamDocuments,
  getCollectionInfo,
  runCommand,
};
