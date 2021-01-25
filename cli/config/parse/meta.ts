import { limitFields, setupCheckType } from "../../utilities/cli.ts";
import { NestCLIError } from "../../error.ts";
import { assertHooks } from "./hooks.ts";
import { log } from "../../utilities/log.ts";
import type { Json, Meta } from "../../utilities/types.ts";

export function assertMeta(meta: Json, file: string, prefix = ""): Meta {
  if (Array.isArray(meta)) {
    log.error("Unable to parses meta object: received an array.");
    throw new NestCLIError("Config(meta): received an array");
  }

  const {
    $schema,
    name,
    fullName,
    description,
    homepage,
    license,
    unlisted,
    private: isPrivate,
    hooks,
    ...remainingFields
  } = meta;

  limitFields(file, remainingFields);

  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}$schema`, $schema, ["string"]);
  checkType(`${prefix}fullName`, fullName, ["string"]);
  checkType(`${prefix}description`, description, ["string"]);
  checkType(`${prefix}homepage`, homepage, ["string"]);
  checkType(`${prefix}license`, license, ["string"]);
  checkType(`${prefix}unlisted`, unlisted, ["boolean"]);
  checkType(`${prefix}private`, isPrivate, ["boolean"]);
  checkType(`${prefix}hooks`, hooks, ["object"]);

  if (typeof hooks === "object" && hooks !== null) {
    assertHooks(hooks, file, `${prefix}hooks.`);
  }

  if ($schema) delete meta.$schema;

  if (typeError()) throw new NestCLIError("Config(meta): Invalid type");

  return meta as unknown as Meta;
}