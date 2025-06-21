/**
 * This extends the OpenNext-generated worker to add cron support.
 * See: https://opennext.js.org/cloudflare/howtos/custom-worker
 */

// @ts-expect-error - Will be resolved after OpenNext build
import { default as openNextWorker } from './.open-next/worker.js';

type TCronExpression = string;
type TCronRoute = `/api/${string}`;
const CRON_ROUTES: Record<TCronExpression, TCronRoute | TCronRoute[]> = {
  // Example: This will hit `/api/v1/watchers/email` every 5 minutes.
  // '*/5 * * * *': '/api/v1/watchers/email',
  //
  // Example: This will hit `/api/v1/stats/generate` and `/api/v1/cleanup` every
  // 6 hours. The endpoints are hit in parallel.
  // '0 */6 * * *': ['/api/v1/stats/generate', '/api/v1/cleanup'],
};

export default {
  // Use the OpenNext fetch handler as-is
  fetch: openNextWorker.fetch,

  // Extension for Cron support.
  async scheduled(event, env, ctx) {
    const expression = event.cron;
    const routes = castArray(CRON_ROUTES[expression] || []);

    if (routes.length === 0) {
      console.error({
        message: 'No cron routes found for expression',
        expression,
        CRON_ROUTES
      });

      throw new Error(`NO_ROUTES_FOR_EXPRESSION: ${event.cron}`);
    }

    // `waitUntil` keeps the worker alive until all promises resolve. Without it,
    // the worker would shut down immediately and our API calls would be killed!
    ctx.waitUntil(
      Promise.allSettled(
        routes.map(function callCronRoute(route) {
          // Make a real HTTP request for better observability in logs
          // The worker URL can be provided via environment variable or constructed
          const workerUrl = 'https://builtwithapartheid.com';
          return fetch(workerUrl + route, {
              method: 'POST',
              headers: {
                // All Cron routes should check for this secret or throw 401,
                // this ensures no other actors can trigger cron routes.
                'x-cron-secret': env.CRON_SECRET
              }
          });
        })
      )
    );
  }
} satisfies ExportedHandler<CloudflareEnv>;

// Uncomment this if we ever need to use DO Queue and DO Tag Cache.
// See https://opennext.js.org/cloudflare/howtos/custom-worker which links to
// https://opennext.js.org/cloudflare/caching for details.
// export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';

function castArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
