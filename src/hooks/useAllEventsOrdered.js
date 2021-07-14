import { useMemo } from 'react';
import { useSharedState } from './useSharedState';
import { parcels as sharedStateParcels, adjustments as sharedStateAdjustments, sales as sharedStateSales } from '../sharedState';
import { orderBy } from 'lodash-es';

export default function useAllEventsOrdered() {
    const [parcels, ] = useSharedState(sharedStateParcels);
    const [adjustments, ] = useSharedState(sharedStateAdjustments);
    const [sales, ] = useSharedState(sharedStateSales);
    return useMemo(() =>
        orderBy([
            ...parcels.map(p => ({ type: 'ACQUISITION', ...p })),
            ...adjustments.map(a => ({ type: 'ADJUSTMENT', ...a })),
            ...sales.map(s => ({ type: 'SALE', ...s })),
        ], [
            e => e.date,
            // Tiebreaking logic:
            // Acquisitions should be before sales, to make sure all parcels are available for sale
            // Positive Adjustments should be after buys and before sales, to allow user to maximise cost base
            // Negative Adjustments should be after sales, to maximise cost base
            // BUY -> +ADJ -> SALE -> -ADJ
            e =>
                e.type === 'ACQUISITION' ? 1 :
                (e.type === 'ADJUSTMENT' && e.netAmount > 0) ? 2 :
                e.type === 'SALE' ? 3 :
                4
        ])
    , [parcels, adjustments, sales]);
}