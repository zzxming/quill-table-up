#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(__dirname, '..');
export const distBundle = resolve(projectRoot, './dist');
export const demoBundle = resolve(projectRoot, './docs');
