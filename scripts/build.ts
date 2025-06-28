#!/usr/bin/env node
import { WebSocketServer } from 'ws';
import { buildStyle, buildTS } from './bundle';
import { startServer } from './server';

async function main() {
  const args = process.argv.slice(2);
  const isDev = args[0] === 'watch';
  let wss: WebSocketServer | undefined;
  if (isDev) {
    wss = new WebSocketServer({ port: 8080 });
    startServer();
  }
  await Promise.all([
    buildStyle({ isDev }),
    buildTS({
      isDev,
      onSuccess() {
        console.log(`[${new Date().toLocaleString()}] Build completed successfully!`);
        if (wss && wss.clients) {
          for (const client of wss.clients) {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: 'reload' }));
            }
          }
        }
      },
    }),
  ]);
}

main().catch((error) => {
  console.error('Error during build:', error);
  process.exit(1);
});
