import { parse } from "../deps.ts";
import type { Args } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import { limitOptions, setupCheckType } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";
import { mainCommand } from "../commands/main.ts";

import { help } from "../functions/help.ts";

export const helpCommand: Command = {
  name: "help",
  description: "Show this help or the help of a sub-command",
  arguments: [{
    name: "[command]",
    description: "A command",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export function action() {
  const flags = assertFlags(parse(Deno.args));

  help(mainCommand, flags.command);
}

interface Flags {
  command?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, command], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[command]", command, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { command } as Flags;
}