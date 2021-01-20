import { Meta } from "../../lib/utilities/types.ts";

/** Command option */
export interface Option {
  flag: string;
  argument?: string;
  description: string;
}

/** Command argument */
export interface Argument {
  name: string;
  description: string;
}

export interface Command {
  name: string;
  description: string;
  arguments: Argument[];
  options: Option[];
  subCommands: Record<string, Command>;
  action: (args?: string[]) => Promise<void> | void;
}

// export type RawObject = Record<string, unknown>;

export interface Hooks {
  presync?: string;
  postsync?: string;
  prepack?: string;
  postpack?: string;
  prepublish?: string;
  postpublish?: string;
  preaudit?: string;
  postaudit?: string;
}

export interface MetaData extends Meta {
  hooks?: Hooks;
}

export interface Api {
  versions: string[];
  latestVersion: string;
  lastPublished: number;
}

export interface Project {
  meta: Meta;

  api: Api;

  version: string;
  lastSync: number;
  nextAutoSync: number;
}

export type { JSONArray, JSONObject, JSONValue, Json } from "./json.ts"