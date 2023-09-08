import upath from 'upath';
import type { Mocked, MockedFunction } from 'vitest';
import type { RenovateConfig } from '../lib/config/types';
import * as _logger from '../lib/logger';
import { Platform, platform as _platform } from '../lib/modules/platform';
import { scm as _scm } from '../lib/modules/platform/scm';
import * as _env from '../lib/util/exec/env';
import * as _fs from '../lib/util/fs';
import * as _hostRules from '../lib/util/host-rules';
import { regEx } from '../lib/util/regex';

/**
 * Simple wrapper for getting mocked version of a module
 * @param module module which is mocked by `vi.mock`
 */
export function mocked<T extends object>(module: T): Mocked<T> {
  return module as Mocked<T>;
}

/**
 * Simple wrapper for getting mocked version of a function
 * @param func function which is mocked by `vi.mock`
 */
export function mockedFunction<T extends (...args: any[]) => any>(
  func: T
): MockedFunction<T> {
  return func as MockedFunction<T>;
}

/**
 * Simply wrapper to create partial mocks.
 * @param obj Object to cast to final type
 */
export function partial<T>(): T;
export function partial<T>(obj: Partial<T>): T;
export function partial<T>(obj: Partial<T>[]): T[];
export function partial(obj: unknown = {}): unknown {
  return obj;
}

export const fs = vi.mocked(_fs);

// TODO: fix types, jest / typescript is using wrong overload (#22198)
export const platform = vi.mocked(partial<Required<Platform>>(_platform));
export const scm = vi.mocked(_scm);
export const env = vi.mocked(_env);
export const hostRules = vi.mocked(_hostRules);
export const logger = vi.mocked(_logger, true);

export type { RenovateConfig };

function getCallerFileName(): string | null {
  let result: string | null = null;

  const prepareStackTrace = Error.prepareStackTrace;
  const stackTraceLimit = Error.stackTraceLimit;

  Error.prepareStackTrace = (_err, stack) => stack;
  Error.stackTraceLimit = 5; // max calls inside this file + 1

  try {
    const err = new Error();

    const stack = err.stack as unknown as NodeJS.CallSite[];

    let currentFile: string | null = null;
    for (const frame of stack) {
      const fileName = frame.getFileName() ?? null;
      if (!currentFile) {
        currentFile = fileName;
      } else if (currentFile !== fileName) {
        result = fileName;
        break;
      }
    }
  } catch (e) {
    // no-op
  }

  Error.prepareStackTrace = prepareStackTrace;
  Error.stackTraceLimit = stackTraceLimit;

  return result;
}

export function getFixturePath(fixtureFile: string, fixtureRoot = '.'): string {
  const callerDir = upath.dirname(getCallerFileName()!);
  return upath.join(callerDir, fixtureRoot, '__fixtures__', fixtureFile);
}

export function regexMatches(target: string, patterns: string[]): boolean {
  return patterns.some((patt: string) => {
    const re = regEx(patt);
    return re.test(target);
  });
}
