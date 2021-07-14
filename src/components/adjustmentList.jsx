import React, { useEffect, useMemo, useState } from 'react';
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
    Tooltip
} from '@material-ui/core';
import {
    Delete,
    Add,
    Done,
    Clear,
    Edit,
    Warning
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
            <TableCell align="right" colSpan={6}><IconButton onClick={() => setNewAdjustmentActive(true)}><Add/></IconButton></TableCell>
        </TableRow>

    const [adjustmentIdsBeingEdited, setAdjustmentIdsBeingEdited] = useState([]);
    const editAdjustment = id => setAdjustmentIdsBeingEdited([...adjustmentIdsBeingEdited, id]);
    const stopEditingAdjustment = id => setAdjustmentIdsBeingEdited(adjustmentIdsBeingEdited.filter(id2 => id2 !== id));
    const saveAdjustment = a => {
        setAdjustments([...adjustments.filter(a2 => a2.id !== a.id), a]);
        stopEditingAdjustment(a.id);
    };

    const allEventsOrdered = useAllEventsOrdered();

    const errorRowIds = useMemo(() => {
        const rowIds = new Set();
        for(const adjustment of adjustments) {
            const availableParcels = getAvailableParcelsLookup(allEventsOrdered, adjustment.date, /*errorOnMissingParcel:*/false);
            for(const parcelId of adjustment.applicableParcelIds) {
                const parcel = availableParcels[parcelId];
                if(parcel === undefined || parcel.remainingUnits <= 0) {
                    rowIds.add(adjustment.id);
                    break;
                }
            }
        }
        return rowIds;
    }, [allEventsOrdered, adjustments]);

    return <TableContainer component={Paper}>
        <Table style={{ minWidth: 650 }} size="small">
            <TableHead>
                <TableRow>
                    <TableCell/>
                    <TableCell align="right">Date</TableCell>
                    <TableCell align="right">Applicable Parcels</TableCell>
                    <TableCell align="right">Memo</TableCell>
                    <TableCell align="right">Net Amount ($)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {/* TODO_JU Expandable detail log that lists the effects of an adjustment */}
                {orderedAdjustments.map(a => adjustmentIdsBeingEdited.includes(a.id) ?
                    <EditAdjustmentRow key={a.id} id={a.id} adjustment={a} cancel={() => stopEditingAdjustment(a.id)} save={saveAdjustment}/> :
                    <TableRow key={a.id}>
                        <TableCell>{ errorRowIds.has(a.id) ? 
                            <Tooltip title="One or more applicable parcels do not exist or have been entirely sold before the adjustment date.">
                                <Warning color="error"/>
                            </Tooltip> :
                            <></> }
                        </TableCell>
                        <TableCell align="right">{dayjs(a.date).format('YYYY-MM-DD')}</TableCell>
                        <TableCell align="right">{a.applicableParcelIds.join(', ')}</TableCell>
                        <TableCell align="right">{a.memo}</TableCell>
                        <TableCell align="right">{a.netAmount}</TableCell>
                        <TableCell align="right">
                            <IconButton size="small" onClick={() => editAdjustment(a.id)}><Edit/></IconButton>
                            <IconButton size="small" onClick={() => setAdjustments(adjustments.filter(a2 => a2.id !== a.id))}><Delete/></IconButton>
                        </TableCell>
                    </TableRow>
                )}
                {lastRow}
            </TableBody>
        </Table>
    </TableContainer>
}

function EditAdjustmentRow(props) {
    const {
        id,
        save,
        cancel,
        adjustment
    } = props;

    const [date, setDate] = useState(null);
    const [applicableParcelIds, setApplicableParcelIds] = useState([]);
    const [memo, setMemo] = useState('');
    const [netAmount, setNetAmount] = useState('');

    useEffect(() => {
        setDate(adjustment?.date ?? null);
        setApplicableParcelIds(adjustment?.applicableParcelIds ?? []);
        setMemo(adjustment?.memo ?? '');
        setNetAmount(adjustment?.netAmount.toString() ?? '');
    }, [adjustment]);

    const boundSave = () => save({
        id: id ?? uuidv4(),
        date,
        applicableParcelIds,
        memo,
        netAmount: parseFloat(netAmount)
    });

    const netAmountValid = netAmount && !isNaN(parseFloat(netAmount));
    const valid = date && applicableParcelIds.length && netAmountValid;

    const availableParcels = useAvailableParcels(useAllEventsOrdered(), date, /*errorOnMissingParcel:*/false);

    useEffect(() => {
        setApplicableParcelIds(applicableParcelIds =>
            applicableParcelIds.filter(id => availableParcels.find(p => p.id === id)));
    }, [availableParcels]);

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
                        <Checkbox checked={applicableParcelIds.includes(p.id)} />
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