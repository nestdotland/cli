import { limitFields } from "../../utils/cli.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { NestCLIError } from "../../utils/error.ts";
import { assertMeta } from "./meta.ts";
import { assertApi } from "./api.ts";
import { log } from "../../utils/log.ts";
import type { Json, Project } from "../../utils/types.ts";

export function assertProject(
  module: Json,
  file: string,
  prefix = "",
): Project {
  if (Array.isArray(module)) {
    log.error("Unable to parses project object: received an array.");
    throw new NestCLIError("Config(project): received an array");
  }

  const {
    $comment,
    meta,
    ignore,
    api,
    name,
    author,
    version,
    lastSync,
    nextAutoSync,
    ...remainingFields
  } = module;

  limitFields(file, remainingFields, [
    "$comment",
    "meta",
    "ignore",
    "api",
    "name",
    "author",
    "version",
    "lastSync",
    "nextAutoSync",
  ]);

  const { checkType, typeError } = setupCheckType(file);

  checkType(`${prefix}$comment`, $comment, ["string"]);
  if (checkType(`${prefix}meta`, meta, ["object"], true)) {
    assertMeta(meta, file, `${prefix}meta.`);
  }
  checkType(`${prefix}ignore`, ignore, ["string"], true);
  if (checkType(`${prefix}api`, api, ["object"], true)) {
    assertApi(api, file, `${prefix}api.`);
  }
  checkType(`${prefix}name`, name, ["string"], true);
  checkType(`${prefix}author`, author, ["string"], true);
  checkType(`${prefix}version`, version, ["string"], true);
  checkType(`${prefix}lastSync`, lastSync, ["number"], true);
  checkType(`${prefix}nextAutoSync`, nextAutoSync, ["number"], true);

  if ($comment) delete module.$comment;

  if (typeError()) throw new NestCLIError("Config(project): Invalid type");

  return module as Project;
}
