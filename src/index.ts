#!/usr/bin/env node

import { Refactor } from "./refactor.js";
export { args } from "./args.js";

const ref = new Refactor();
await ref.refactor();
