#!/usr/bin/env node
import { locateMonorepo, parseArgs, print } from './navigation-index-lib.mjs';

const args = parseArgs(process.argv.slice(2));
const result = locateMonorepo({ start: args.start || process.cwd(), explicitRepo: args.repo });
print(result, true);
if (!result.root) process.exitCode = 1;
