import { useMemo } from 'react';

function makeAvailableParcel(parcel) {
    return {
        id: parcel.id,
        date: parcel.date,
        memo: parcel.memo,
        asxCode: parcel.asxCode,
        remainingUnits: parcel.units,
        perUnitCostBase: (parcel.units * parcel.unitPrice + parcel.brokerage) / parcel.units
    };
}

export function processEvent(event, currentHoldings, errorOnMissingParcel, logs) {
    switch(event.type) {
        case 'ACQUISITION':
            const newParcel = makeAvailableParcel(event);
            currentHoldings[event.id] = newParcel;
            logs?.push({
                parcelId: event.id,
                eventId: event.id,
                date: event.date,
                log: `Acquired Parcel ${event.id} with initial cost base of $${newParcel.perUnitCostBase.toFixed(4)}/u.`
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
            if(totalApplicableUnits <= 0) break; // Processing this event would result in division by zero
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
        if(!date) return allEventsOrdered
            .filter(e => e.type === 'ACQUISITION')
            .map(p => makeAvailableParcel(p));
        const available = getAvailableParcelsLookup(allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude);
        return Object.values(available).filter(p => p.remainingUnits > 0);
    }, [allEventsOrdered, date, errorOnMissingParcel, eventIdToExclude]);
}