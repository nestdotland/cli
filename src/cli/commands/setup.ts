import { parse } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utils/cli.ts";
import { NestCLIError } from "../utils/error.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { setup } from "./functions/setup.ts";

import type { Args, Command } from "../utils/types.ts";

export const setupCommand: Command = {
  name: "setup",
  description: "Link current directory to an existing module",
  arguments: [{
    name: "[author]",
    description: "A module author",
  }, {
    name: "[module]",
    description: "A module name",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(setupCommand.name, setupCommand);

export async function action(args = Deno.args) {
  const { author, name } = assertFlags(parse(args));

  await setup(author, name);
}

interface Flags {
  author?: string;
  name?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, author, name, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[author]", author, ["string"]);
  checkType("[module]", name, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { author, name } as Flags;
}