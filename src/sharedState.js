import { SharedPersistedState } from './hooks/useSharedState';

export const parcels = new SharedPersistedState('parcels', []);
export const adjustments = new SharedPersistedState('adjustments', []);
export const sales = new SharedPersistedState('sales', []);
