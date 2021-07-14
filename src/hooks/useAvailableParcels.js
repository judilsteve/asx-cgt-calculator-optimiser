import { useMemo } from 'react';

export function processEvent(event, currentHoldings, errorOnMissingParcel) {
    switch(event.type) {
        case 'ACQUISITION':
            currentHoldings[event.id] = {
                id: event.id,
                date: event.date,
                memo: event.memo,
                asxCode: event.asxCode,
                remainingUnits: event.units,
                perUnitCostBase: (event.units * event.unitPrice + event.brokerage) / event.units
            };
            break;
        case 'ADJUSTMENT':
            let totalApplicableUnits = 0;
            for(const applicableParcelId of event.applicableParcelIds) {
                const parcel = currentHoldings[applicableParcelId];
                if(!parcel || parcel.asxCode !== event.asxCode || parcel.remainingUnits <= 0) {
                    if(errorOnMissingParcel)
                        throw new Error(`Adjustment ${event.id} was applicable to invalid parcel ${applicableParcelId}`);
                    else continue;
                }
                totalApplicableUnits += parcel.remainingUnits;
            }
            for(const applicableParcelId of event.applicableParcelIds) {
                const parcel = currentHoldings[applicableParcelId];
                if(!parcel) continue;
                parcel.perUnitCostBase += event.netAmount / totalApplicableUnits;
            }
            break;
        case 'SALE':
            for(const applicableParcel of event.applicableParcels) {
                const parcel = currentHoldings[applicableParcel.id];
                if(!parcel) {
                    if(errorOnMissingParcel)
                        throw new Error(`Sale ${event.id} was applicable to non-existent parcel ${applicableParcel.id}`);
                    else continue;
                }
                parcel.remainingUnits -= applicableParcel.unitsSold;
            }
            break;
        default:
            throw new Error(`Unrecognised event type ${event.type}`);
    }
}

// TODO_JU? Some sort of lazy memoised repository for this, to improve performance
export function getAvailableParcelsLookup(allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude) {
    const available = {};

    for(const event of allEventsOrdered) {
        if(event.id === eventIdToExclude) continue;
        if(date !== null && event.date > date) break;
        processEvent(event, available, errorOnMissingParcel);
    }
    return available;
}

export default function useAvailableParcels(allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude) {
    return useMemo(() => {
        const available = getAvailableParcelsLookup(allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude);
        return Object.values(available);
    }, [allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude]);
}