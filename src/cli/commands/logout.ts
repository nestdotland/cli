import { parse } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utils/cli.ts";
import { NestCLIError } from "../utils/error.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { logout } from "./functions/logout.ts";

import type { Args, Command } from "../utils/types.ts";

export const logoutCommand: Command = {
  name: "logout",
  description: "Remove an existing user account",
  arguments: [{
    name: "[username]",
    description: "",
  }],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(logoutCommand.name, logoutCommand);

export async function action(args = Deno.args) {
  const { user } = assertFlags(parse(args));

  await logout(user);
}

interface Flags {
  user?: string;
}

function assertFlags(args: Args): Flags {
  const { _: [_, user, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[username]", user, ["string"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { user } as Flags;
}