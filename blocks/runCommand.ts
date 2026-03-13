import { AppBlock, events } from "@slflows/sdk/v1";
import { getDb } from "../utils/client.ts";

export const runCommand: AppBlock = {
  name: "Run Command",
  description:
    "Executes an arbitrary database command. Escape hatch for operations not covered by other blocks.",
  category: "Utility",

  inputs: {
    default: {
      config: {
        command: {
          name: "Command",
          description:
            'MongoDB database command object (e.g. { createUser: "app", pwd: "...", roles: ["readWrite"] })',
          type: {
            type: "object",
            additionalProperties: true,
          },
          required: true,
        },
      },
      async onEvent(input) {
        const { command } = input.event.inputConfig;
        const db = await getDb(input.app.config);

        const rawResult = await db.command(command as Record<string, any>);

        // Serialize BSON types to plain JSON
        const result = JSON.parse(JSON.stringify(rawResult));

        await events.emit({
          result,
        });
      },
    },
  },

  outputs: {
    default: {
      name: "Command Result",
      description: "The raw result from the database command",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          result: {
            type: "object",
            description: "The command result object",
          },
        },
        required: ["result"],
      },
    },
  },
};
