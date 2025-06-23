Add cron job support using OpenNext custom worker approach

This new worker keeps the standard out-of-the-box worker (`./.open-next/worker.js`) which comes with just a `fetch` Cloudflare Worker handler, and allows us to extend it with other handlers. We currently start by adding Cron support by adding the `scheduled` handler.

## Security

This introduces a new secret called `CRON_SECRET` which is used to authenticate cron requests.

This was added with `CLOUDFLARE_API_TOKEN= npx wrangler secret put CRON_SECRET`.

## How to add a new cron

1. **Create an API endpoint** that checks for the cron secret:
   ```typescript
   // pages/api/v1/cleanup.ts
   export default withPrisma(async (prisma, req, res) => {
     if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     
     // Your cron logic here
     const deleted = await prisma.post.deleteMany({ ... });
     return res.json({ success: true, deleted: deleted.count });
   });
   ```

2. **Add to CRON_ROUTES** in `worker.ts`:
   ```typescript
   const CRON_ROUTES = {
     '0 0 * * *': '/api/v1/cleanup',  // Daily at midnight
   };
   ```

3. **Add to wrangler.jsonc** triggers (if not already there):
   ```json
   "triggers": {
     "crons": ["0 0 * * *"]
   }
   ```

## Why HTTP requests to our own API?

The cron handler makes HTTP requests to our own API endpoints rather than calling
functions directly. While this adds minor overhead, it provides important benefits:

- **Observability**: All cron executions appear in logs/analytics as regular API requests
- **Consistency**: Reuses existing middleware, auth, error handling, and monitoring
- **Simplicity**: No need to duplicate logic or create separate cron-specific functions
- **Debugging**: Can manually test cron endpoints via HTTP clients
- **Retryability**: Failed tasks can be retried via queues like Qstash or CF Queus

## Why POST for cron requests?

We use POST method for all cron-triggered API calls because:

- **Mutation intent**: Cron jobs typically perform actions (send emails, clean data, generate reports) rather than just read data
- **No caching**: GET requests might be cached by Cloudflare or browsers, but we want cron jobs to run every time
- **Security convention**: Many APIs reserve GET for safe, idempotent operations and POST for actions that change state

Resolves: #9