import { log, setupLogLevel } from "../utilities/log.ts";
import { version as currentVersion } from "../version.ts";
import { help as displayHelp } from "./help.ts";
import { NestCLIError } from "../error.ts";
import { mainCommand } from "../commands/main.ts";
import { didYouMean } from "../utilities/cli.ts";

export async function main(
  command?: string,
  logLevel?: string,
  version?: boolean,
  help?: unknown,
) {
  if (version) {
    console.info(currentVersion);
    return;
  }

  if (help) {
    displayHelp(mainCommand, command);
    return;
  }

  setupLogLevel(logLevel);

  if (command) {
    if (command in mainCommand.subCommands) {
      await mainCommand.subCommands[command].action();
    } else {
      log.error(`Unknown command: ${command}`);
      didYouMean(Object.keys(mainCommand.subCommands), [command]);
      throw new NestCLIError("Unknown command");
    }
  } else {
    // default action
    displayHelp(mainCommand);
  }
}