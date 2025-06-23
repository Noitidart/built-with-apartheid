import type { TGetBanDashboardResponseData } from '@/pages/api/v1/mods/bans';
import axios from 'axios';

export function getBanDashboardQuerySignature() {
  return {
    queryKey: ['mods', 'bans', 'dashboard'],
    queryFn: async function fetchBanDashboard() {
      const response = await axios.get<TGetBanDashboardResponseData>(
        '/api/v1/mods/bans'
      );
      return response.data;
    }
  };
}
