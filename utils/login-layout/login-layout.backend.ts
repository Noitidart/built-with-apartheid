import { getMeFromRefreshedToken } from '@/lib/auth.backend';
import { withPrismaSSR } from '@/lib/prisma';
import type { GetServerSideProps } from 'next';

/**
 * Common getServerSideProps for pages that need authentication.
 * Fetches the current user and passes it as props.
 */
export const getLoginLayoutServerSideProps = withPrismaSSR(
  async function getServerSideProps(prisma, context) {
    const me = await getMeFromRefreshedToken({
      prisma,
      request: context.req,
      response: context.res
    });

    return {
      props: {
        me
      }
    };
  }
) satisfies GetServerSideProps;
