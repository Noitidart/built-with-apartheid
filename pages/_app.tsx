import { useAppQueryClient } from '@/hooks/useAppQueryClient';
import '@/styles/globals.css';
import { QueryClientProvider } from '@tanstack/react-query';
import classnames from 'classnames';
import type { AppProps } from 'next/app';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = useAppQueryClient(pageProps);

  return (
    <div
      className={classnames(
        geistSans.variable,
        geistMono.variable,
        'min-h-screen p-4 sm:p-8 pb-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
      )}
    >
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </div>
  );
}
