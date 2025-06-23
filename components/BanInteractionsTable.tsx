import type { TBanInteraction } from '@/types/ban-interaction';

type BanInteractionsTableProps = {
  interactions: TBanInteraction[];
  compact?: boolean;
};

function BanInteractionsTable({
  interactions,
  compact = false
}: BanInteractionsTableProps) {
  if (!interactions.length) {
    return (
      <p className={`text-gray-500 ${compact ? 'text-sm' : ''}`}>
        No ban history
      </p>
    );
  }

  const containerClass = compact
    ? 'space-y-2 max-h-48 overflow-y-auto border rounded p-2'
    : 'space-y-4';

  const itemClass = compact
    ? 'text-sm border-b pb-2 last:border-b-0'
    : 'border-b pb-4 last:border-b-0';

  return (
    <div className={containerClass}>
      {interactions.map((interaction) => (
        <div key={interaction.id} className={itemClass}>
          <div
            className={`flex ${
              compact
                ? 'flex-col'
                : 'flex-col sm:flex-row sm:items-center sm:justify-between'
            }`}
          >
            <div>
              <p className={`font-medium ${compact ? 'text-sm' : ''}`}>
                {interaction.type.replace(/_/g, ' ')}
              </p>
              <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                by {interaction.user?.email || interaction.user?.id || 'System'}{' '}
                • {new Date(interaction.createdAt).toLocaleString()}
              </p>
              {interaction.data && typeof interaction.data === 'object' && (
                <>
                  {'reason' in interaction.data && interaction.data.reason && (
                    <p
                      className={`text-gray-700 ${
                        compact ? 'text-xs mt-1' : 'text-sm mt-1'
                      }`}
                    >
                      Reason: {interaction.data.reason as string}
                    </p>
                  )}
                </>
              )}
            </div>

            {!compact &&
              (interaction.targetUsers.length > 0 ||
                interaction.targetIps.length > 0) && (
                <div className="mt-2 sm:mt-0 text-sm">
                  {interaction.targetUsers.length > 0 && (
                    <p>
                      Users:{' '}
                      {interaction.targetUsers
                        .map((u) => u.email || u.id)
                        .join(', ')}
                    </p>
                  )}
                  {interaction.targetIps.length > 0 && (
                    <p>
                      IPs:{' '}
                      {interaction.targetIps
                        .map(
                          (ip) => `${ip.value}${ip.isBanned ? ' (Banned)' : ''}`
                        )
                        .join(', ')}
                    </p>
                  )}
                </div>
              )}
          </div>

          {compact &&
            (interaction.targetUsers.length > 0 ||
              interaction.targetIps.length > 0) && (
              <div className="mt-1 text-xs text-gray-600">
                {interaction.targetUsers.length > 0 && (
                  <span>
                    {interaction.targetUsers.length} user
                    {interaction.targetUsers.length !== 1 ? 's' : ''}
                  </span>
                )}
                {interaction.targetUsers.length > 0 &&
                  interaction.targetIps.length > 0 && <span> • </span>}
                {interaction.targetIps.length > 0 && (
                  <span>
                    {interaction.targetIps.length} IP
                    {interaction.targetIps.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

export default BanInteractionsTable;
