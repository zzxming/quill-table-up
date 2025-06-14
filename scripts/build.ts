#!/usr/bin/env node
import { buildTS } from './bundle';
import { startServer } from './server';

async function main() {
  const args = process.argv.slice(2);
  const isDev = args[0] === 'watch';
  await buildTS({ isDev });
  if (isDev) {
    startServer();
  }
}

main().catch((error) => {
  console.error('Error during build:', error);
  process.exit(1);
});
