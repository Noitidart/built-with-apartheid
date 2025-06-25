import Button from '@/components/Button';
import { getWatchedSitesQuerySignature } from '@/components/WatchedSitesSidebar';
import type { TScanResponseData } from '@/pages/api/v1/scan';
import type { TMe } from '@/types/user';
import type { Website } from '@prisma/client';
import {
  useMutation,
  useQueryClient,
  type QueryClient
} from '@tanstack/react-query';
import {
  BellIcon,
  BellOffIcon,
  MailIcon,
  SettingsIcon,
  ShieldCheckIcon,
  XIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';
import isEmail from 'sane-email-validation';

type WatchButtonProps = {
  me: Pick<TMe, 'id' | 'email' | 'watchedWebsites'>;
  website: Pick<Website, 'id' | 'hostname'> & {
    _count: { watchers: number };
  };
};

function WatchButton({ me, website }: WatchButtonProps) {
  const queryClient = useQueryClient();
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageAction, setManageAction] = useState<
    'update-email' | 'stop-watching' | null
  >(null);
  const [emailError, setEmailError] = useState('');
  const [watcherState, watcherActions] = useWatcherState(
    me.watchedWebsites.some(function isThisWebsite(w) {
      return w.id === website.id;
    }),
    website._count.watchers
  );
  const [statusMessage, setStatusMessage] = useState('');

  useSetupReactModalAccessibility();

  const watchMutation = useMutation({
    mutationFn: (data: { email?: string }) => watchWebsite(website.id, data),
    onSuccess: function delegateToWatchSuccessHandler(data) {
      return handleWatchMutationSuccess({
        data,
        setIsWatchModalOpen,
        setIsManageModalOpen,
        setStatusMessage,
        watcherActions,
        queryClient,
        websiteId: website.id,
        websiteHostname: website.hostname
      });
    }
  });

  const unwatchMutation = useMutation({
    mutationFn: function callUnwatchWebsite() {
      return unwatchWebsite(website.id);
    },
    onSuccess: function delegateToUnwatchSuccessHandler(data) {
      return handleUnwatchMutationSuccess({
        data,
        setIsManageModalOpen,
        setStatusMessage,
        watcherActions,
        queryClient,
        websiteId: website.id
      });
    }
  });

  function handleStartWatchingClick() {
    setEmailError('');
    setIsWatchModalOpen(true);
  }

  function handleManageWatchClick() {
    setEmailError('');
    setManageAction(null);
    setIsManageModalOpen(true);
  }

  function handleWatchSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    // Get the form element
    const form =
      e?.currentTarget ||
      (document.querySelector('form[data-watch-form]') as HTMLFormElement);
    if (!form) return;

    const formData = new FormData(form);
    const email = formData.get('email') as string;

    // When managing (already watching), validate email only if trying to update
    if (watcherState.isWatched && manageAction === 'update-email') {
      if (!email) {
        setEmailError('Email is required');
        return;
      }

      if (!isEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      if (email === me.email) {
        setEmailError('This is already your notification email');
        return;
      }
    } else if (!watcherState.isWatched) {
      // When starting to watch
      if (!email && !me.email) {
        setEmailError('Email is required to watch this website');
        return;
      }

      if (email && !isEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
    }

    setEmailError('');

    // Only send email if it's different from current user email
    const dataToSend = email !== me.email ? { email } : {};
    watchMutation.mutate(dataToSend);
  }

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        {statusMessage && (
          <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
            {statusMessage}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">
          {watcherState.isWatched
            ? 'You are monitoring this site'
            : 'Interested in monitoring this site?'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {getWatchStatusMessage(
            watcherState.isWatched,
            watcherState.watcherCount,
            website.hostname
          )}
        </p>
        <Button
          onClick={
            watcherState.isWatched
              ? handleManageWatchClick
              : handleStartWatchingClick
          }
          size="md"
          color={watcherState.isWatched ? 'black' : 'blue'}
          label={
            watcherState.isWatched ? (
              <>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Manage Watch
              </>
            ) : (
              <>
                <BellIcon className="w-4 h-4 mr-2" />
                Start Watching
              </>
            )
          }
        />
      </div>

      {/* Start Watching Modal */}
      <WatchModal<StartWatchingModalContentProps>
        isOpen={isWatchModalOpen}
        onClose={function handleStartWatchModalClose() {
          closeWatchModal(setIsWatchModalOpen);
        }}
        title="Watch Site"
        TitleIconComponent={BellIcon}
        ContentComponent={StartWatchingModalContent}
        // content props
        websiteHostname={website.hostname}
        userEmail={me.email}
        emailError={emailError}
        setEmailError={setEmailError}
        handleWatchSubmit={handleWatchSubmit}
        watchMutationIsPending={watchMutation.isPending}
        setIsWatchModalOpen={setIsWatchModalOpen}
      />

      <WatchModal<ManageWatchModalContentProps>
        isOpen={isManageModalOpen}
        onClose={function handleManageModalClose() {
          closeManageModal(setIsManageModalOpen);
        }}
        title="Manage Watch"
        TitleIconComponent={SettingsIcon}
        ContentComponent={ManageWatchModalContent}
        // content props
        websiteHostname={website.hostname}
        userEmail={me.email}
        emailError={emailError}
        setEmailError={setEmailError}
        manageAction={manageAction}
        setManageAction={setManageAction}
        handleWatchSubmit={handleWatchSubmit}
        watchMutationIsPending={watchMutation.isPending}
        unwatchMutationIsPending={unwatchMutation.isPending}
        unwatchMutate={unwatchMutation.mutate}
        setIsManageModalOpen={setIsManageModalOpen}
      />
    </>
  );
}

// Types
type TWatchResponse = {
  action:
    | 'watch'
    | 'watch-and-change-email'
    | 'change-email'
    | 'noop-already-watching';
  me?: TMe;
};

type TUnwatchResponse = {
  success: boolean;
  wasWatching: boolean;
};

// Modal component types
type TWatchModalOwnProps<TContentProps> = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  TitleIconComponent: React.ComponentType<{ className?: string }>;
  ContentComponent: React.ComponentType<TContentProps>;
};

type TWatchModalProps<TContentProps> = TWatchModalOwnProps<TContentProps> &
  TContentProps;

// Helper functions
function getWatchStatusMessage(
  isWatched: boolean,
  watcherCount: number,
  hostname: string
): string {
  if (isWatched) {
    if (watcherCount === 1) {
      return `We'll keep you updated about ${hostname}`;
    }
    return `You're one of ${watcherCount} people monitoring ${hostname}`;
  }

  if (watcherCount > 0) {
    const othersText = watcherCount === 1 ? 'other' : 'others';
    return `Join ${watcherCount} ${othersText} monitoring this site. Receive email notifications about security changes and Israeli tech detection.`;
  }

  return 'Receive email notifications about security changes and Israeli tech detection.';
}

function clearEmailError(setEmailError: (value: string) => void): void {
  setEmailError('');
}

function closeWatchModal(setIsWatchModalOpen: (value: boolean) => void): void {
  setIsWatchModalOpen(false);
}

function closeManageModal(
  setIsManageModalOpen: (value: boolean) => void
): void {
  setIsManageModalOpen(false);
}

function selectUpdateEmailAction(
  setManageAction: (value: 'update-email' | 'stop-watching' | null) => void
): void {
  setManageAction('update-email');
}

function selectStopWatchingAction(
  setManageAction: (value: 'update-email' | 'stop-watching' | null) => void
): void {
  setManageAction('stop-watching');
}

async function watchWebsite(
  websiteId: number,
  data: { email?: string }
): Promise<TWatchResponse> {
  const response = await fetch(`/api/v1/websites/${websiteId}/watch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = (await response.json()) as {
      _errors?: { formErrors?: string[] };
    };
    throw new Error(
      errorData._errors?.formErrors?.[0] || 'Failed to watch website'
    );
  }

  return response.json() as Promise<TWatchResponse>;
}

async function unwatchWebsite(websiteId: number): Promise<TUnwatchResponse> {
  const response = await fetch(`/api/v1/websites/${websiteId}/unwatch`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = (await response.json()) as {
      _errors?: { formErrors?: string[] };
    };
    throw new Error(
      errorData._errors?.formErrors?.[0] || 'Failed to unwatch website'
    );
  }

  return response.json() as Promise<TUnwatchResponse>;
}

function updateScanQueryForWatch(
  oldData: TScanResponseData | undefined,
  websiteId: number,
  hostname: string,
  newEmail?: string
): TScanResponseData | undefined {
  if (!oldData || !('me' in oldData)) return oldData;
  return {
    ...oldData,
    me: {
      ...oldData.me,
      ...(newEmail && { email: newEmail }),
      watchedWebsites: [
        ...oldData.me.watchedWebsites,
        { id: websiteId, hostname }
      ]
    }
  };
}

function updateScanQueryForUnwatch(
  oldData: TScanResponseData | undefined,
  websiteId: number
): TScanResponseData | undefined {
  if (!oldData || !('me' in oldData)) return oldData;
  return {
    ...oldData,
    me: {
      ...oldData.me,
      watchedWebsites: oldData.me.watchedWebsites.filter(
        function isNotThisWebsite(w) {
          return w.id !== websiteId;
        }
      )
    }
  };
}

function updateScanQueryForEmailChange(
  oldData: TScanResponseData | undefined,
  newEmail: string
): TScanResponseData | undefined {
  if (!oldData || !('me' in oldData)) return oldData;
  return {
    ...oldData,
    me: {
      ...oldData.me,
      email: newEmail
    }
  };
}

function clearStatusMessageAfterDelay(
  setStatusMessage: (value: string) => void
): void {
  setTimeout(function clearStatusMessage() {
    setStatusMessage('');
  }, 4000);
}

function clearStatusMessageAfterShortDelay(
  setStatusMessage: (value: string) => void
): void {
  setTimeout(function clearStatusMessage() {
    setStatusMessage('');
  }, 3000);
}

type WatchSuccessHandlerParams = {
  data: TWatchResponse;
  setIsWatchModalOpen: (value: boolean) => void;
  setIsManageModalOpen: (value: boolean) => void;
  setStatusMessage: (value: string) => void;
  watcherActions: {
    setIsWatched: (value: boolean) => void;
    incrementWatcherCount: () => void;
  };
  queryClient: QueryClient;
  websiteId: number;
  websiteHostname: string;
};

function handleWatchMutationSuccess(params: WatchSuccessHandlerParams): void {
  const {
    data,
    setIsWatchModalOpen,
    setIsManageModalOpen,
    setStatusMessage,
    watcherActions,
    queryClient,
    websiteId,
    websiteHostname
  } = params;

  setIsWatchModalOpen(false);
  setIsManageModalOpen(false);

  const url = window.location.pathname.slice(1).toLowerCase();

  switch (data.action) {
    case 'watch':
      setStatusMessage('You are now watching this site');
      watcherActions.setIsWatched(true);
      watcherActions.incrementWatcherCount();
      queryClient.setQueryData<TScanResponseData>(
        ['scan', url],
        function updateWatchStateInQuery(oldData) {
          return updateScanQueryForWatch(oldData, websiteId, websiteHostname);
        }
      );
      // Reset watched sites query to refresh the sidebar
      queryClient.resetQueries({
        queryKey: getWatchedSitesQuerySignature().queryKey
      });
      break;
    case 'watch-and-change-email':
      setStatusMessage(
        'You are now watching this site and your email has been updated'
      );
      watcherActions.setIsWatched(true);
      watcherActions.incrementWatcherCount();
      queryClient.setQueryData<TScanResponseData>(
        ['scan', url],
        function updateWatchStateAndEmailInQuery(oldData) {
          return updateScanQueryForWatch(
            oldData,
            websiteId,
            websiteHostname,
            data.me?.email || undefined
          );
        }
      );
      // Reset watched sites query to refresh the sidebar
      queryClient.resetQueries({
        queryKey: getWatchedSitesQuerySignature().queryKey
      });
      break;
    case 'noop-already-watching':
      setStatusMessage('You are already watching this site');
      break;
    case 'change-email':
      setStatusMessage('Your notification email has been updated');
      queryClient.setQueryData<TScanResponseData>(
        ['scan', url],
        function updateEmailInQuery(oldData) {
          const email =
            data.me?.email ||
            (oldData && 'me' in oldData && oldData.me.email
              ? oldData.me.email
              : '');
          return updateScanQueryForEmailChange(oldData, email);
        }
      );
      break;
  }

  clearStatusMessageAfterDelay(setStatusMessage);
}

type UnwatchSuccessHandlerParams = {
  data: TUnwatchResponse;
  setIsManageModalOpen: (value: boolean) => void;
  setStatusMessage: (value: string) => void;
  watcherActions: {
    setIsWatched: (value: boolean) => void;
    decrementWatcherCount: () => void;
  };
  queryClient: QueryClient;
  websiteId: number;
};

function handleUnwatchMutationSuccess(
  params: UnwatchSuccessHandlerParams
): void {
  const {
    data,
    setIsManageModalOpen,
    setStatusMessage,
    watcherActions,
    queryClient,
    websiteId
  } = params;

  setIsManageModalOpen(false);

  if (!data.wasWatching) {
    setStatusMessage('You were not watching this website');
    clearStatusMessageAfterShortDelay(setStatusMessage);
  } else {
    // Update local state
    watcherActions.setIsWatched(false);
    watcherActions.decrementWatcherCount();

    // Set success message
    setStatusMessage('You have stopped watching this site');
    clearStatusMessageAfterDelay(setStatusMessage);

    // Update scan query data to remove the website from watchedWebsites
    const url = window.location.pathname.slice(1).toLowerCase();
    queryClient.setQueryData<TScanResponseData>(
      ['scan', url],
      function removeWatchFromQuery(oldData) {
        return updateScanQueryForUnwatch(oldData, websiteId);
      }
    );

    // Reset watched sites query to refresh the sidebar
    queryClient.resetQueries({
      queryKey: getWatchedSitesQuerySignature().queryKey
    });
  }
}

// Custom hooks
function useSetupReactModalAccessibility() {
  useEffect(function setupReactModalAccessibility() {
    // Set the app element for react-modal accessibility
    if (typeof document !== 'undefined') {
      Modal.setAppElement('#__next');
    }
  }, []);
}

type WatcherState = {
  isWatched: boolean;
  watcherCount: number;
};

function useWatcherState(
  initialIsWatched: boolean,
  initialWatcherCount: number
): [
  WatcherState,
  {
    setIsWatched: (value: boolean) => void;
    incrementWatcherCount: () => void;
    decrementWatcherCount: () => void;
  }
] {
  const [state, setState] = useState<WatcherState>({
    isWatched: initialIsWatched,
    watcherCount: initialWatcherCount
  });

  const actions = {
    setIsWatched: function updateIsWatched(value: boolean) {
      setState(function mergeIsWatched(prev) {
        return { ...prev, isWatched: value };
      });
    },
    incrementWatcherCount: function addOneWatcher() {
      setState(function incrementCount(prev) {
        return { ...prev, watcherCount: prev.watcherCount + 1 };
      });
    },
    decrementWatcherCount: function removeOneWatcher() {
      setState(function decrementCount(prev) {
        return {
          ...prev,
          watcherCount: Math.max(0, prev.watcherCount - 1)
        };
      });
    }
  };

  return [state, actions];
}

// Modal content components
type StartWatchingModalContentProps = {
  websiteHostname: string;
  userEmail: string | null;
  emailError: string;
  setEmailError: (value: string) => void;
  handleWatchSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  watchMutationIsPending: boolean;
  setIsWatchModalOpen: (value: boolean) => void;
};

function StartWatchingModalContent({
  websiteHostname,
  userEmail,
  emailError,
  setEmailError,
  handleWatchSubmit,
  watchMutationIsPending,
  setIsWatchModalOpen
}: StartWatchingModalContentProps) {
  return (
    <form onSubmit={handleWatchSubmit} data-watch-form>
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          Monitoring
        </p>

        <p className="font-medium text-gray-900 dark:text-white">
          {websiteHostname}
        </p>
      </div>

      <div className="mb-6">
        <label className="block mb-2">
          <span className="flex items-center gap-2 text-sm font-medium mb-1">
            <MailIcon className="w-4 h-4" />
            Email Notifications
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            Email address for notifications
          </span>
        </label>

        <input
          type="email"
          name="email"
          defaultValue={userEmail || ''}
          onChange={function clearErrorOnEmailChange() {
            clearEmailError(setEmailError);
          }}
          placeholder="your@email.com"
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
        />

        {emailError && (
          <p className="text-red-400 text-sm mt-1">{emailError}</p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          We&apos;ll send security alerts and updates to this email address.
        </p>
      </div>

      <div className="mb-6 text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p className="flex items-start gap-1">
          <ShieldCheckIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Your email will only be used for security notifications about this
            site, including monthly recaps, calls to action, and important
            status changes.
          </span>
        </p>

        <p>You can unsubscribe at any time from any notification email.</p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          onClick={function closeStartWatchingModal() {
            closeWatchModal(setIsWatchModalOpen);
          }}
          label="Cancel"
          size="md"
          outlined
        />

        <Button
          type="submit"
          disabled={watchMutationIsPending}
          loading={watchMutationIsPending}
          label={watchMutationIsPending ? 'Watching...' : 'Start Watching'}
          size="md"
        />
      </div>
    </form>
  );
}

type ManageWatchModalContentProps = {
  websiteHostname: string;
  userEmail: string | null;
  emailError: string;
  setEmailError: (value: string) => void;
  manageAction: 'update-email' | 'stop-watching' | null;
  setManageAction: (value: 'update-email' | 'stop-watching' | null) => void;
  handleWatchSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  watchMutationIsPending: boolean;
  unwatchMutationIsPending: boolean;
  unwatchMutate: () => void;
  setIsManageModalOpen: (value: boolean) => void;
};

function ManageWatchModalContent({
  websiteHostname,
  userEmail,
  emailError,
  setEmailError,
  manageAction,
  setManageAction,
  handleWatchSubmit,
  watchMutationIsPending,
  unwatchMutationIsPending,
  unwatchMutate,
  setIsManageModalOpen
}: ManageWatchModalContentProps) {
  return (
    <form onSubmit={handleWatchSubmit} data-watch-form>
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          Monitoring
        </p>

        <p className="font-medium text-gray-900 dark:text-white">
          {websiteHostname}
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          What would you like to do?
        </p>

        <div className="space-y-3">
          <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="manage-action"
              value="update-email"
              checked={manageAction === 'update-email'}
              onChange={function selectEmailUpdateOption() {
                selectUpdateEmailAction(setManageAction);
              }}
              className="mr-3 mt-1"
            />

            <div className="flex items-start gap-2">
              <MailIcon className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400" />

              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Change email address
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Current: {userEmail || 'No email set'}
                </div>
              </div>
            </div>
          </label>

          <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="radio"
              name="manage-action"
              value="stop-watching"
              checked={manageAction === 'stop-watching'}
              onChange={function selectStopWatchingOption() {
                selectStopWatchingAction(setManageAction);
              }}
              className="mr-3 mt-1"
            />

            <div className="flex items-start gap-2">
              <BellOffIcon className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400" />

              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Stop watching
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  No longer receive emails for this site
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {manageAction === 'update-email' && (
        <div className="mb-6">
          <label className="block mb-2">
            <span className="flex items-center gap-2 text-sm font-medium mb-1">
              <MailIcon className="w-4 h-4" />
              New Email Address
            </span>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              Current: {userEmail || 'No email set'}
            </span>
          </label>

          <input
            type="email"
            name="email"
            defaultValue={userEmail || ''}
            onChange={function clearErrorOnEmailChange() {
              clearEmailError(setEmailError);
            }}
            placeholder="your@email.com"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
          />
          {emailError && (
            <p className="text-red-400 text-sm mt-1">{emailError}</p>
          )}
        </div>
      )}

      {manageAction === 'stop-watching' && (
        <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You will stop receiving all email notifications for this site.
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          onClick={function closeManageWatchModal() {
            closeManageModal(setIsManageModalOpen);
          }}
          label="Cancel"
          size="md"
          outlined
        />

        {manageAction && (
          <Button
            type={manageAction === 'update-email' ? 'submit' : 'button'}
            onClick={
              manageAction === 'stop-watching'
                ? function stopWatchingThisSite() {
                    unwatchMutate();
                  }
                : undefined
            }
            disabled={watchMutationIsPending || unwatchMutationIsPending}
            loading={watchMutationIsPending || unwatchMutationIsPending}
            label={
              manageAction === 'update-email'
                ? watchMutationIsPending
                  ? 'Updating...'
                  : 'Update Email'
                : unwatchMutationIsPending
                  ? 'Stopping...'
                  : 'Stop Watching'
            }
            size="md"
            className={
              manageAction === 'stop-watching'
                ? '!bg-red-600 hover:!bg-red-700'
                : ''
            }
          />
        )}
      </div>
    </form>
  );
}

function WatchModal<TContentProps extends object>(
  props: TWatchModalProps<TContentProps>
) {
  const {
    isOpen,
    onClose,
    title,
    TitleIconComponent,
    ContentComponent,
    ...contentProps
  } = props;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="w-full max-w-md mx-auto mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl outline-none"
      overlayClassName="fixed inset-0 bg-black/25 dark:bg-black/50 flex items-start justify-center p-4 overflow-y-auto z-[100]"
      contentLabel={title}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <TitleIconComponent className="w-6 h-6" />
            {title}
          </h2>

          <Button
            onClick={onClose}
            label={<XIcon className="w-5 h-5" />}
            size="sm"
            className="!p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 !bg-transparent hover:!bg-transparent"
          />
        </div>

        <ContentComponent {...(contentProps as TContentProps)} />
      </div>
    </Modal>
  );
}

export default WatchButton;
