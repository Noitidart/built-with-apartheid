import Button, { type TButtonProps } from '@/components/Button';
import { useMe } from '@/hooks/useMeQuery';
import type { TLoginRequestBody } from '@/pages/api/v1/login';
import type { TMe } from '@/types/user';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'motion/react';
import Link from 'next/link';

type TLoginProtectedLayoutProps = {
  title: string;
  subtitle?: string;
  subtitleHref?: string;
  ContentComponent: React.ComponentType<{ me: TMe }>;
  requireMod?: boolean;
};

function LoginProtectedLayout({
  title,
  subtitle,
  subtitleHref,
  ContentComponent,
  requireMod = true
}: TLoginProtectedLayoutProps) {
  const me = useMe();

  return (
    <>
      <motion.h1
        className="text-4xl sm:text-6xl font-bold text-center mb-3 sm:mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h1>

      {subtitle && (
        <motion.h2
          className="mb-10 text-lg sm:text-2xl text-center text-gray-600 dark:text-gray-400 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {subtitleHref ? (
            <Link href={subtitleHref}>{subtitle}</Link>
          ) : (
            subtitle
          )}
        </motion.h2>
      )}

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {!me || !me.isAuthenticated ? (
          <LoginForm />
        ) : requireMod && !me.isMod ? (
          <AccessDenied />
        ) : (
          <ContentComponent me={me} />
        )}
      </motion.main>
    </>
  );
}

function AccessDenied() {
  const logoutMutation = useLogoutMutation();

  return (
    <>
      <div className="w-full max-w-xl mx-auto px-4 sm:p-6 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 text-center ">
        <h3 className="text-3xl sm:text-4xl font-bold mb-6 ">Access Denied</h3>

        <p className="text-lg sm:text-xl font-medium mb-2">
          You do not have moderator privileges.
        </p>
      </div>

      <Button
        label={
          logoutMutation.isPending || logoutMutation.isSuccess
            ? 'Logging out...'
            : 'Logout'
        }
        size="md"
        className="mt-10 mx-auto"
        onClick={() => logoutMutation.mutate()}
        loading={logoutMutation.isPending || logoutMutation.isSuccess}
        outlined
      />
    </>
  );
}

function LoginForm() {
  const loginMutation = useLoginMutation();

  function submitLogin(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    loginMutation.mutate({ email, password });
  }

  const isLoggingIn = loginMutation.isPending || loginMutation.isSuccess;

  return (
    <>
      <form
        className="space-y-6 max-w-md mx-auto"
        onSubmit={submitLogin}
        noValidate
      >
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          <div>
            <input
              type="password"
              required
              name="password"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        {loginMutation.error && (
          <div className="text-red-600 dark:text-red-400 text-sm text-center">
            {loginMutation.error.message}
          </div>
        )}

        <Button
          type="submit"
          size="md"
          disabled={isLoggingIn}
          loading={isLoggingIn}
          className="w-full"
          label={isLoggingIn ? 'Signing in...' : 'Sign in'}
        />
      </form>
    </>
  );
}

function useLoginMutation() {
  return useMutation({
    mutationKey: ['login'],
    mutationFn: async function fetchLogin(body: TLoginRequestBody) {
      const response = await axios.post('/api/v1/login', body, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.data.success) {
        throw new Error('Login failed');
      }

      return response.data;
    },
    onError: function showLoginFailedOnLoginError(error) {
      console.error('Login error:', error);
      alert('Login failed, please check your credentials and try again.');
    }
  });
}

function useLogoutMutation() {
  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async function fetchLogout() {
      const response = await axios.post('/api/v1/logout');
      return response.data;
    },
    onError: function showLogoutFailedOnLogoutError(error) {
      console.error('Failed to logout', { error });
      alert('Failed to logout');
    }
  });
}

export type TLogoutButtonProps = Pick<
  TButtonProps,
  'size' | 'className' | 'outlined'
>;

export function LogoutButton(props: TLogoutButtonProps) {
  const logoutMutation = useLogoutMutation();

  return (
    <Button
      label={
        logoutMutation.isPending || logoutMutation.isSuccess
          ? 'Logging out...'
          : 'Logout'
      }
      onClick={() => logoutMutation.mutate()}
      loading={logoutMutation.isPending || logoutMutation.isSuccess}
      {...props}
    />
  );
}

export default LoginProtectedLayout;
