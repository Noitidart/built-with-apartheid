import Button from '@/components/Button';
import LoginProtectedLayout from '@/components/LoginProtectedLayout';
import Spinner from '@/components/Spinner';
import { getLoginLayoutServerSideProps } from '@/lib/login-layout.backend';
import type { TGetModsResponseData } from '@/pages/api/v1/mods/team';
import type { TAddModResponseData } from '@/pages/api/v1/mods/team/add';
import type { TRemoveModResponseData } from '@/pages/api/v1/mods/team/remove';
import type { TMe } from '@/types/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

export const getServerSideProps = getLoginLayoutServerSideProps;

type TModsTeamPageProps = Awaited<
  ReturnType<typeof getServerSideProps>
>['props'];

function ModsTeamPage(_props: TModsTeamPageProps) {
  return (
    <LoginProtectedLayout
      title="Manage Team"
      subtitle="Moderator Dashboard"
      subtitleHref="/mods"
      ContentComponent={TeamManagement}
    />
  );
}

type TTeamManagementProps = {
  me: TMe;
};

function TeamManagement(_props: TTeamManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const modsQuery = useModsQuery();
  const addModMutation = useAddModMutation({
    onAddSuccess: function hideAddFormOnAddSuccess() {
      setShowAddForm(false);
    }
  });
  const removeModMutation = useRemoveModMutation();

  if (modsQuery.isLoading || modsQuery.isPending) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (modsQuery.error) {
    return (
      <div className="text-center p-8 text-red-600 dark:text-red-400">
        Failed to load moderators. Please refresh the page.
      </div>
    );
  }

  const mods = modsQuery.data.mods;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Team Members</h2>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              label={showAddForm ? 'Cancel' : 'Add Moderator'}
              outlined={showAddForm}
            />
          </div>
        </div>

        {showAddForm && (
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <AddModeratorForm
              onSubmit={function addMod(data) {
                addModMutation.mutate(data);
              }}
              isLoading={addModMutation.isPending}
            />
          </div>
        )}

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {mods.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No moderators found. You should add yourself!
            </div>
          ) : (
            mods.map((mod) => (
              <div
                key={mod.id}
                className="p-6 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{mod.email}</p>
                </div>

                <Button
                  onClick={function confirmModRemoval() {
                    if (
                      confirm(
                        `Are you sure you want to remove ${mod.email} as a moderator?`
                      )
                    ) {
                      removeModMutation.mutate(mod.id);
                    }
                  }}
                  size="sm"
                  label="Remove"
                  outlined
                  loading={removeModMutation.isPending}
                  disabled={removeModMutation.isPending}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> Any moderator can add or remove other
          moderators. Be careful who you grant access to.
        </p>
      </div>
    </div>
  );
}

type TAddModeratorFormProps = {
  onSubmit: (data: { email: string }) => void;
  isLoading: boolean;
};

function AddModeratorForm({ onSubmit, isLoading }: TAddModeratorFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email) {
      alert('Please enter an email address');
      return;
    }

    onSubmit({ email });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email Address
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="moderator@example.com"
          disabled={isLoading}
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> On first login, whatever password the user
          types will become their password.
        </p>
      </div>

      <Button
        type="submit"
        size="md"
        label={isLoading ? 'Adding...' : 'Add Moderator'}
        loading={isLoading}
        disabled={isLoading}
      />
    </form>
  );
}
function getModsQuerySignature() {
  return {
    queryKey: ['mods', 'team'],
    queryFn: async function fetchMods() {
      const response = await axios.get<TGetModsResponseData>(
        '/api/v1/mods/team'
      );

      if ('_errors' in response.data) {
        console.error('Failed to load moderators:', response.data._errors);
        throw new Error('Failed to load moderators');
      }

      return response.data;
    }
  };
}

function useModsQuery() {
  return useQuery(getModsQuerySignature());
}

function useAddModMutation(inputs: { onAddSuccess: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function addMod(data: {
      email: string;
    }) {
      const response = await axios.post<TAddModResponseData>(
        '/api/v1/mods/team/add',
        data
      );
      return response.data;
    },
    onSuccess: function refetchModsOnAddSuccess() {
      queryClient.resetQueries({ queryKey: getModsQuerySignature().queryKey });
      inputs.onAddSuccess();
    },
    onError: function showErrorOnAddError(error: unknown) {
      console.error('Failed to add moderator:', error);
      alert('Failed to add moderator. Please try again.');
    }
  });
}

function useRemoveModMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async function removeMod(userId: string) {
      const response = await axios.post<TRemoveModResponseData>(
        `/api/v1/mods/team/remove`,
        { userId }
      );
      return response.data;
    },
    onSuccess: function refetchModsOnRemoveSuccess() {
      queryClient.resetQueries({ queryKey: getModsQuerySignature().queryKey });
    },
    onError: function showErrorOnRemoveError(error: unknown) {
      console.error('Failed to remove moderator:', error);
      alert('Failed to remove moderator. Please try again.');
    }
  });
}

export default ModsTeamPage;
