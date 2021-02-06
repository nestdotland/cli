import { parse } from "../deps.ts";
import { NestCLIError } from "../utils/error.ts";
import { limitOptions, setupCheckType } from "../utils/cli.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { help } from "./functions/help.ts";

import type { Args, Command } from "../utils/types.ts";

export const helpCommand: Command = {
  name: "help",
  description: "Show this help or the help of a sub-command",
  arguments: [{
    name: "[...command]",
    description: "A command or a sub-command",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(helpCommand.name, helpCommand);

export function action() {
  const { commands } = assertFlags(parse(Deno.args));

  help(mainCommand, commands);
}

interface Flags {
  commands?: string[];
}

function assertFlags(args: Args): Flags {
  const { _: [_, ...commands], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);

  const { checkType, typeError } = setupCheckType("flags");

  for (let i = 0; i < commands.length; i++) {
    checkType("[command]", commands[i], ["string"]);
  }

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { commands } as Flags;
}