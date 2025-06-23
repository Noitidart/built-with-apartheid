This is a [Next.js](https://nextjs.org/) project bootstrapped with [`c3`](https://developers.cloudflare.com/pages/get-started/c3) and deployed to [Cloudflare Pages](https://pages.cloudflare.com/).

## Local Development

1. First install [nvm](https://github.com/nvm-sh/nvm).
2. Run `nvm use` this will guide you through installing the correct Node version via nvm.
3. Run `npm run dev` to run the local development server.
4. Open the URL you see in terminal, it should be [http://localhost:3000](http://localhost:3000).

### Database Schema Changes

1. Run `npx prisma migrate dev --name YOUR_MIGRATION_NAME` to create and apply the migration.
   - If you need to modify the migration script before applying it (e.g. because columns with data are being dropped and you want to migrate that data), run `npx prisma migrate dev --name YOUR_MIGRATION_NAME --create-only` to create the migration script without applying it. Then modify the SQL file that gets created, then apply it with `npx prisma migrate dev`.
2. When ready to apply these changes to production, first update `.env` with the production `DATABASE_URL`, then run `npx prisma migrate deploy`. Be sure to revert `DATABASE_URL` in `.env` after the migration is applied.
