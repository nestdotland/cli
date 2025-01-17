import { bold, gray, green, red, yellow } from "../deps.ts";
import { lineBreak, log } from "../utils/log.ts";
import { DiffType, equal, longestCommonSubsequence } from "./diff.ts";
import type { DiffResult } from "./diff.ts";
import type { Json, JSONArray, JSONValue } from "../utils/types.ts";

export type JSONDiff =
  | DiffResult<JSONValue>
  | JSONDiff[]
  | Map<string, JSONDiff>;

/** Compares two objects and returns a diff */
export function compare(actual: Json, base: Json): JSONDiff {
  return compare_(actual, base);
}

/** Apply a diff to an object */
export function apply(diff: JSONDiff, target: Json): [Json, boolean] {
  let conflict = false;
  function applyDiff(
    diff: JSONDiff,
    target: JSONValue,
  ): JSONValue | undefined {
    if (Array.isArray(diff)) {
      if (Array.isArray(target)) {
        let j = 0;
        const res: JSONArray = [];
        for (let i = 0; i < diff.length; i++, j++) {
          const current = diff[i];
          if (Array.isArray(current) || (current instanceof Map)) {
            res.push(applyDiff(current, target[j]) as JSONValue);
          } else {
            if (current.type === DiffType.common && target[j]) {
              res.push(target[j]);
            } else if (current.type === DiffType.updated) {
              if (target[j]) res.push(target[j]);
              // in case of conflict
              if (
                !equal(current.oldValue, target[j]) &&
                !equal(current.value, target[j])
              ) {
                res.push(current.value);
                conflict = true;
              }
            } else if (current.type === DiffType.added) {
              res.push(current.value);
              j--;
            } else if (current.type === DiffType.removed) j--;
          }
        }
        for (; j < target.length; j++) {
          res.push(target[j]);
        }
        return res;
      }
      return target;
    } else if (diff instanceof Map) {
      if (
        typeof target === "object" && target !== null && !Array.isArray(target)
      ) {
        for (const [key, value] of diff) {
          const result = applyDiff(value, target[key]);
          if (result !== undefined) target[key] = result;
          else delete target[key];
        }
      }
      return target;
    }
    if (diff.type === DiffType.common) return target;
    if (diff.type === DiffType.added) {
      return diff.value;
    }
    if (diff.type === DiffType.updated) {
      conflict = true;
      return diff.value;
    }
    if (diff.type === DiffType.removed) return undefined;
  }
  return [applyDiff(diff, target) as Json, conflict];
}

/** Checks if diff contains added, removed, or updated fields */
export function isModified(diff: JSONDiff): boolean {
  if (Array.isArray(diff)) {
    for (let i = 0; i < diff.length; i++) {
      if (isModified(diff[i])) return true;
    }
    return false;
  } else if (diff instanceof Map) {
    for (const [_, value] of diff) {
      if (isModified(value)) return true;
    }
    return false;
  }
  return diff.type !== DiffType.common;
}

function compare_(actual?: JSONValue, base?: JSONValue): JSONDiff {
  if (actual === undefined) {
    return {
      type: DiffType.removed,
      value: base as JSONValue,
    };
  }
  if (base === undefined) {
    return {
      type: DiffType.added,
      value: actual,
    };
  }
  if (Array.isArray(actual)) {
    if (!Array.isArray(base)) {
      return {
        type: DiffType.updated,
        value: actual,
        oldValue: base,
      };
    }
    const diff: JSONDiff[] = [];
    const LCS = longestCommonSubsequence(actual, base);
    let actualIndex = 0;
    let baseIndex = 0;
    for (let i = 0; i <= LCS.length; i++) {
      while (!equal(LCS[i], base[baseIndex]) && baseIndex < base.length) {
        if (
          !equal(LCS[i], actual[actualIndex]) && actualIndex < actual.length
        ) {
          diff.push(compare_(actual[actualIndex], base[baseIndex]));
          actualIndex++;
        } else {
          diff.push({
            type: DiffType.removed,
            value: base[baseIndex],
          });
        }
        baseIndex++;
      }
      while (
        !equal(LCS[i], actual[actualIndex]) && actualIndex < actual.length
      ) {
        diff.push({
          type: DiffType.added,
          value: actual[actualIndex],
        });
        actualIndex++;
      }
      if (LCS[i] !== undefined) {
        diff.push({
          type: DiffType.common,
          value: LCS[i],
        });
      }
      baseIndex++;
      actualIndex++;
    }
    return diff;
  } else if (typeof actual === "object" && actual !== null) {
    if (typeof base !== "object" || base === null || Array.isArray(base)) {
      return {
        type: DiffType.updated,
        value: actual,
        oldValue: base,
      };
    }
    const diff: Map<string, JSONDiff> = new Map();
    for (const key in base) {
      const actualValue = actual[key];
      const baseValue = base[key];
      diff.set(key, compare_(actualValue, baseValue));
    }
    for (const key in actual) {
      if (diff.get(key) !== undefined) continue;
      const actualValue = actual[key];
      diff.set(key, compare_(actualValue, undefined));
    }
    return diff;
  }
  return actual === base
    ? {
      type: DiffType.common,
      value: actual,
    }
    : {
      type: DiffType.updated,
      value: actual,
      oldValue: base,
    };
}

export function print(title: string, diff: JSONDiff) {
  log.plain(
    `\n   ${bold(gray(`[${title}]`))} ${bold(red("Deleted"))} / ${
      bold(green("Added"))
    }\n`,
  );

  print_(diff, "");

  lineBreak();
}

function print_(diff: JSONDiff, indent: string, key?: string) {
  const newIndent = indent + "  ";
  if (diff instanceof Map) {
    log.plain(`${indent}   ${key ? `${key}: ` : ""}{`);
    for (const [key, value] of diff) {
      print_(value, newIndent, key);
    }
    log.plain(`${indent}   },`);
  } else if (Array.isArray(diff)) {
    log.plain(`${indent}   ${key ? `${key}: ` : ""}[`);
    for (let i = 0; i < diff.length; i++) {
      print_(diff[i], newIndent);
    }
    log.plain(`${indent}   ],`);
  } else {
    if (diff.type === DiffType.updated) {
      printLine({ type: DiffType.removed, value: diff.oldValue }, indent, key);
      printLine({ type: DiffType.added, value: diff.value }, indent, key);
    } else {
      printLine(diff, indent, key);
    }
  }
}

function printLine(diff: DiffResult<JSONValue>, indent: string, key?: string) {
  const value = `${indent}${key ? `${key}: ` : ""}${
    Deno.inspect(diff.value, { depth: Infinity, compact: false }).replaceAll(
      "\n",
      `\n${indent}`,
    )
  },`;
  let line: string;
  switch (diff.type) {
    case DiffType.added:
      line = bold(green(` + ${value.replaceAll("\n", "\n + ")}`));
      break;
    case DiffType.removed:
      line = bold(red(` - ${value.replaceAll("\n", "\n - ")}`));
      break;
    default:
      line = `   ${value.replaceAll("\n", "\n   ")}`;
      break;
  }
  log.plain(line);
}
