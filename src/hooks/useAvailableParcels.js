import { useMemo } from 'react';

export function processEvent(event, currentHoldings, errorOnMissingParcel, logs) {
    switch(event.type) {
        case 'ACQUISITION':
            const perUnitCostBase = (event.units * event.unitPrice + event.brokerage) / event.units;
            currentHoldings[event.id] = {
                id: event.id,
                date: event.date,
                memo: event.memo,
                asxCode: event.asxCode,
                remainingUnits: event.units,
                perUnitCostBase
            };
            logs?.push({
                parcelId: event.id,
                eventId: event.id,
                date: event.date,
                log: `Acquired Parcel ${event.id} with initial cost base of $${perUnitCostBase.toFixed(4)}/u.`
            });
            break;
        case 'ADJUSTMENT':
            let totalApplicableUnits = 0;
            for(const applicableParcelId of event.applicableParcelIds) {
                const parcel = currentHoldings[applicableParcelId];
                if(!parcel || parcel.asxCode !== event.asxCode || parcel.remainingUnits <= 0) {
                    if(errorOnMissingParcel)
                        throw new Error(`Adjustment ${event.id} was applicable to invalid parcel ${applicableParcelId.toFixed(4)}`);
                    else continue;
                }
                totalApplicableUnits += parcel.remainingUnits;
            }
            for(const applicableParcelId of event.applicableParcelIds) {
                const parcel = currentHoldings[applicableParcelId];
                if(!parcel) continue;
                const percentage = parcel.remainingUnits / totalApplicableUnits * 100;
                parcel.perUnitCostBase += event.netAmount / totalApplicableUnits;
                logs?.push({
                    parcelId: applicableParcelId,
                    eventId: event.id,
                    date: event.date,
                    log: `Applied ${percentage.toFixed(2)}% of a $${event.netAmount} adjustment. New cost base: $${parcel.perUnitCostBase.toFixed(4)}/u.`
                });
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
                logs?.push({
                    parcelId: parcel.id,
                    eventId: event.id,
                    date: event.date,
                    log: `Sold ${applicableParcel.unitsSold} units. Remaining units: ${parcel.remainingUnits}`
                });
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

export function getParcelLog(allEventsOrdered) {
    const available = {};
    const logs = [];

    for(const event of allEventsOrdered) {
        processEvent(event, available, /*errorOnMissingParcel:*/false, logs);
    }
    return logs;
}

export default function useAvailableParcels(allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude) {
    return useMemo(() => {
        const available = getAvailableParcelsLookup(allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude);
        return Object.values(available);
    }, [allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude]);
}