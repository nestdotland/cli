import { exists as exists_, join } from "../../deps.ts";
import { PATH as DIR_PATH } from "./nest.ts";
import { Ignore } from "../../processing/ignore.ts";

export const FILE = "ignore";
export const PATH = join(DIR_PATH, FILE);

const encoder = new TextEncoder();

/** Test whether or not the ignore file exists by checking with the file system */
export function exists(): Promise<boolean> {
  return exists_(PATH);
}

/** Reads the ignore file. */
export function read(): Promise<string> {
  return Deno.readTextFile(PATH);
}

/** Reads and parses the ignore file. */
export function parse(path = PATH): Promise<string[]> {
  const ignore = new Ignore(path);

  return ignore.matchFiles();
}

/** Writes an ignore object to the ignore file. */
export async function write(
  text: string,
  path = PATH,
): Promise<void> {
  await Deno.writeFile(path, encoder.encode(text));
}
