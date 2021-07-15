import React, { useEffect, useMemo, useState, Fragment } from 'react';
import {
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    TextField,
    MenuItem,
    Checkbox,
    ListItemText,
    Tooltip,
    Typography
} from '@material-ui/core';
import {
    Delete,
    Add,
    Done,
    Clear,
    Edit,
    Warning,
    ExpandLess,
    ExpandMore
} from '@material-ui/icons';
import { KeyboardDatePicker } from "@material-ui/pickers";
import dayjs from 'dayjs';
import Select from './select';
import useAvailableParcels, { getAvailableParcelsLookup } from '../hooks/useAvailableParcels';
import { useSharedState } from '../hooks/useSharedState';
import { adjustments as sharedStateAdjustments } from '../sharedState';
import { orderBy } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import useAllEventsOrdered from '../hooks/useAllEventsOrdered';

export default function AdjustmentList() {
    const [adjustments, setAdjustments] = useSharedState(sharedStateAdjustments);
    const orderedAdjustments = useMemo(() => orderBy(adjustments, a => a.date), [adjustments]);

    const [newAdjustmentActive, setNewAdjustmentActive] = useState(false);
    const saveNewAdjustment = a => {
        setAdjustments([...adjustments, a]);
        setNewAdjustmentActive(false);
    }
    const lastRow = newAdjustmentActive ?
        <EditAdjustmentRow cancel={() => setNewAdjustmentActive(false)} save={saveNewAdjustment}/> : 
        <TableRow>
            <TableCell align="right" colSpan={7}><IconButton onClick={() => setNewAdjustmentActive(true)}><Add/></IconButton></TableCell>
        </TableRow>

    const [adjustmentIdsBeingEdited, setAdjustmentIdsBeingEdited] = useState([]);
    const editAdjustment = id => setAdjustmentIdsBeingEdited([...adjustmentIdsBeingEdited, id]);
    const stopEditingAdjustment = id => setAdjustmentIdsBeingEdited(adjustmentIdsBeingEdited.filter(id2 => id2 !== id));
    const saveAdjustment = a => {
        setAdjustments([...adjustments.filter(a2 => a2.id !== a.id), a]);
        stopEditingAdjustment(a.id);
    };

    const allEventsOrdered = useAllEventsOrdered();

    const errorLookup = useMemo(() => {
        const lookup = {};
        for(const adjustment of adjustments) {
            const errors = [];
            const availableParcels = getAvailableParcelsLookup(allEventsOrdered, adjustment.date, /*errorOnMissingParcel:*/false);
            for(const parcelId of adjustment.applicableParcelIds) {
                const parcel = availableParcels[parcelId];
                if(parcel === undefined) {
                    errors.push(`Parcel ${parcelId} did not exist at the adjustment date.`);
                    continue;
                } else if(parcel.asxCode !== adjustment.asxCode) {
                    errors.push(`Parcel ${parcelId} has the wrong ASX Code.`);
                } else if(parcel.remainingUnits <= 0) {
                    errors.push(`Parcel ${parcelId} was entirely sold before the adjustment date.`);
                }
            }
            lookup[adjustment.id] = errors;
        }
        return lookup;
    }, [allEventsOrdered, adjustments]);

    const [detailAdjustmentIds, setDetailAdjustmentIds] = useState([]);
    const toggleDetails = adjustmentId => detailAdjustmentIds.includes(adjustmentId) ?
        setDetailAdjustmentIds(detailAdjustmentIds.filter(id => id !== adjustmentId)) :
        setDetailAdjustmentIds([...detailAdjustmentIds, adjustmentId]);

    return <TableContainer component={Paper}>
        <Table style={{ minWidth: 650 }} size="small">
            <TableHead>
                <TableRow>
                    <TableCell/>
                    <TableCell align="right">Date</TableCell>
                    <TableCell align="right">ASX Code</TableCell>
                    <TableCell align="right">Applicable Parcels</TableCell>
                    <TableCell align="right">Memo</TableCell>
                    <TableCell align="right">Net Amount ($)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {orderedAdjustments.map(a => adjustmentIdsBeingEdited.includes(a.id) ?
                    <EditAdjustmentRow key={a.id} id={a.id} adjustment={a} cancel={() => stopEditingAdjustment(a.id)} save={saveAdjustment}/> :
                    <Fragment key={a.id}>
                        <TableRow>
                            <TableCell>{ errorLookup[a.id].length ?
                                errorLookup[a.id].map(e => <Tooltip key={e} title={e}>
                                    <Warning color="error"/>
                                </Tooltip>) :
                                <></> }
                            </TableCell>
                            <TableCell align="right">{dayjs(a.date).format('YYYY-MM-DD')}</TableCell>
                            <TableCell align="right">{a.asxCode}</TableCell>
                            <TableCell align="right">{a.applicableParcelIds.join(', ')}</TableCell>
                            <TableCell align="right">{a.memo}</TableCell>
                            <TableCell align="right">{a.netAmount}</TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => toggleDetails(a.id)}>{detailAdjustmentIds.includes(a.id) ? <ExpandLess/> : <ExpandMore/>}</IconButton>
                                <IconButton size="small" onClick={() => editAdjustment(a.id)}><Edit/></IconButton>
                                <IconButton size="small" onClick={() => setAdjustments(adjustments.filter(a2 => a2.id !== a.id))}><Delete/></IconButton>
                            </TableCell>
                        </TableRow>
                        {detailAdjustmentIds.includes(a.id) && <AdjustmentDetailRow adjustment={a}/>}
                    </Fragment>
                )}
                {lastRow}
            </TableBody>
        </Table>
    </TableContainer>
}

function AdjustmentDetailRow(props) {
    const { adjustment } = props;

    const allEventsOrdered = useAllEventsOrdered();
    const log = useMemo(() => {
        const available = getAvailableParcelsLookup(allEventsOrdered, adjustment.date, /*errorOnMisingParcel:*/false, adjustment.id );
        const log = [];
        const invalidLog = ['Adjustment is invalid. Fix issues to see further information.'];

        let totalApplicableUnits = 0;
        for(const applicableParcelId of adjustment.applicableParcelIds) {
            const parcel = available[applicableParcelId];
            if(!parcel || parcel.asxCode !== adjustment.asxCode || parcel.remainingUnits < 0) return invalidLog;
            totalApplicableUnits += parcel.remainingUnits;
        }
        if(totalApplicableUnits <= 0) return invalidLog;
        log.push(`Adjustment applies to a total of ${totalApplicableUnits} units.`);
        for(const applicableParcelId of adjustment.applicableParcelIds) {
            const parcel = available[applicableParcelId];
            if(!parcel || parcel.asxCode !== adjustment.asxCode || parcel.remainingUnits < 0) return invalidLog;
            const percentage = parcel.remainingUnits / totalApplicableUnits * 100;
            let message = `${percentage.toFixed(2)}% of adjustment applied to parcel ${parcel.id} (${parcel.remainingUnits} remaining units). `;
            const newCostBase = parcel.perUnitCostBase + adjustment.netAmount / totalApplicableUnits;
            message += `Cost base of parcel was ${adjustment.netAmount > 0 ? 'raised' : 'lowered'} from $${parcel.perUnitCostBase.toFixed(4)}/u to $${newCostBase.toFixed(4)}/u.`;
            log.push(message);
        }
        return log;
    }, [allEventsOrdered, adjustment]);

    return <>
        {log.map(e => <TableRow key={e}>
            <TableCell/>
            <TableCell colSpan={5} align="right"><Typography variant="body2" color="primary">
                {e}
            </Typography></TableCell>
            <TableCell/>
        </TableRow>)}
    </>
}

function EditAdjustmentRow(props) {
    const {
        id,
        save,
        cancel,
        adjustment
    } = props;

    const [date, setDate] = useState(null);
    const [asxCode, setAsxCode] = useState(null);
    const [applicableParcelIds, setApplicableParcelIds] = useState([]);
    const [memo, setMemo] = useState('');
    const [netAmount, setNetAmount] = useState('');

    useEffect(() => {
        setDate(adjustment?.date ?? null);
        setAsxCode(adjustment?.asxCode ?? null);
        setApplicableParcelIds(adjustment?.applicableParcelIds ?? []);
        setMemo(adjustment?.memo ?? '');
        setNetAmount(adjustment?.netAmount.toString() ?? '');
    }, [adjustment]);

    const boundSave = () => save({
        id: id ?? uuidv4(),
        date,
        asxCode,
        applicableParcelIds,
        memo,
        netAmount: parseFloat(netAmount)
    });

    const netAmountValid = netAmount && !isNaN(parseFloat(netAmount));
    const valid = date && applicableParcelIds.length && netAmountValid;

    const allAvailableParcels = useAvailableParcels(useAllEventsOrdered(), date, /*errorOnMissingParcel:*/false)
    const availableParcels = useMemo(() => allAvailableParcels
        .filter(p => !asxCode || p.asxCode === asxCode)
    , [allAvailableParcels, asxCode]);

    useEffect(() => {
        setApplicableParcelIds(applicableParcelIds => applicableParcelIds
            .filter(id => availableParcels.find(p =>
                p.id === id && (!asxCode || p.asxCode === asxCode))));
    }, [availableParcels, asxCode]);

    return <TableRow>
        <TableCell/>
        <TableCell align="right">
            <KeyboardDatePicker
                disableToolbar
                variant="inline"
                format="YYYY-MM-DD"
                label="Date"
                value={date}
                error={!date}
                onChange={e => setDate(e.toJSON())}
            />
        </TableCell>
        <TableCell align="right">
            <TextField value={asxCode} onChange={e => setAsxCode(e.target.value)} label="ASX Code"/>
        </TableCell>
        <TableCell align="right">
            <Select
                disabled={!date || !availableParcels.length}
                id="applicable-parcel-select"
                label="Applicable Parcels"
                error={!applicableParcelIds.length}
                multiple
                value={applicableParcelIds}
                onChange={e => setApplicableParcelIds(e.target.value)}
                renderValue={selected => selected.join(', ')}>
                {availableParcels.map(p =>
                    <MenuItem key={p.id} value={p.id}>
                        <Checkbox color="primary" checked={applicableParcelIds.includes(p.id)} />
                        <ListItemText primary={`${p.id}${p.memo ? ': ' + p.memo : ''}`} secondary={`${p.remainingUnits}x ${p.asxCode}, acquired ${dayjs(p.date).format('YYYY-MM-DD')}`}/>
                    </MenuItem>)}
            </Select>
        </TableCell>
        <TableCell align="right">
            <TextField value={memo} onChange={e => setMemo(e.target.value)} label="Memo"/>
        </TableCell>
        <TableCell align="right">
            <TextField type="number" value={netAmount} onChange={e => setNetAmount(e.target.value)} error={!netAmountValid} label="Net Amount ($)"/>
        </TableCell>
        <TableCell align="right">
            <IconButton onClick={boundSave} disabled={!valid}><Done/></IconButton>
            <IconButton onClick={cancel}><Clear/></IconButton>
        </TableCell>
    </TableRow>
}