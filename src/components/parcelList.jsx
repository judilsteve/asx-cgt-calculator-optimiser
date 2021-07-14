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
    FormControlLabel,
    Switch,
    Typography
} from '@material-ui/core';
import {
    Delete,
    Add,
    Done,
    Clear,
    Edit,
    ExpandLess,
    ExpandMore
} from '@material-ui/icons';
import { KeyboardDatePicker } from "@material-ui/pickers";
import dayjs from 'dayjs';
import { useSharedState } from '../hooks/useSharedState';
import { parcels as sharedStateParcels } from '../sharedState';
import { maxBy, orderBy } from 'lodash-es';
import  { getParcelLog } from '../hooks/useAvailableParcels';
import useAllEventsOrdered from '../hooks/useAllEventsOrdered';

export default function ParcelList() {
    const [parcels, setParcels] = useSharedState(sharedStateParcels);
    const orderedParcels = useMemo(() => orderBy(parcels, p => p.date), [parcels]);

    const nextId = useMemo(() => {
        const maxId = maxBy(parcels, p => p.id)?.id;
        if(maxId === undefined) return 'A';

        const charCodeBeforeCapitalA = 'A'.charCodeAt(0) - 1;
        let numericMaxId = 0;
        let pow = 0;
        for(let i = maxId.length - 1; i >= 0; i--) {
            numericMaxId += (maxId.charCodeAt(i) - charCodeBeforeCapitalA) * Math.pow(26, pow++);
        }

        let numericNextId = numericMaxId + 1;
        let nextId = '';
        while (numericNextId)
        {
            const modulo = (numericNextId - 1) % 26;
            nextId = String.fromCharCode(65 + modulo) + nextId;
            numericNextId = Math.floor((numericNextId - modulo) / 26);
        }

        return nextId;
    }, [parcels]);

    const [newParcelActive, setNewParcelActive] = useState(false);
    const saveNewParcel = p => {
        setParcels([...parcels, p]);
        setNewParcelActive(false);
    }
    const lastRow = newParcelActive ?
        <EditParcelRow id={nextId} cancel={() => setNewParcelActive(false)} save={saveNewParcel}/> : 
        <TableRow>
            <TableCell align="right" colSpan={9}><IconButton onClick={() => setNewParcelActive(true)}><Add/></IconButton></TableCell>
        </TableRow>

    const [parcelIdsBeingEdited, setParcelIdsBeingEdited] = useState([]);
    const editParcel = id => setParcelIdsBeingEdited([...parcelIdsBeingEdited, id]);
    const stopEditingParcel = id => setParcelIdsBeingEdited(parcelIdsBeingEdited.filter(id2 => id2 !== id));
    const saveParcel = p => {
        setParcels([...parcels.filter(p2 => p2.id !== p.id), p]);
        stopEditingParcel(p.id);
    };

    const [detailParcelIds, setDetailParcelIds] = useState([]);
    const toggleDetails = parcelId => detailParcelIds.includes(parcelId) ?
        setDetailParcelIds(detailParcelIds.filter(id => id !== parcelId)) :
        setDetailParcelIds([...detailParcelIds, parcelId]);

    return <TableContainer component={Paper}>
        <Table style={{ minWidth: 650 }} size="small">
            <TableHead>
                <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell align="right">Date Acquired</TableCell>
                    <TableCell align="right">ASX Code</TableCell>
                    <TableCell align="right">Parcel Type</TableCell>
                    <TableCell align="right">Memo</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">Unit Price ($/u)</TableCell>
                    <TableCell align="right">Brokerage ($)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {orderedParcels.map(p => parcelIdsBeingEdited.includes(p.id) ?
                    <EditParcelRow key={p.id} id={p.id} parcel={p} cancel={() => stopEditingParcel(p.id)} save={saveParcel}/> :
                    <Fragment key={p.id}>
                        <TableRow key={p.id}>
                            <TableCell component="th" scope="row">{p.id}</TableCell>
                            <TableCell align="right">{dayjs(p.date).format('YYYY-MM-DD')}</TableCell>
                            <TableCell align="right">{p.asxCode}</TableCell>
                            <TableCell align="right">{p.isDrp ? 'Dividend Reinvestment' : 'Purchase'}</TableCell>
                            <TableCell align="right">{p.memo}</TableCell>
                            <TableCell align="right">{p.units}</TableCell>
                            <TableCell align="right">{p.unitPrice}</TableCell>
                            <TableCell align="right">{p.brokerage}</TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => toggleDetails(p.id)}>{detailParcelIds.includes(p.id) ? <ExpandLess/> : <ExpandMore/>}</IconButton>
                                <IconButton size="small" onClick={() => editParcel(p.id)}><Edit/></IconButton>
                                <IconButton size="small" onClick={() => setParcels(parcels.filter(p2 => p2.id !== p.id))}><Delete/></IconButton>
                            </TableCell>
                        </TableRow>
                        {detailParcelIds.includes(p.id) && <ParcelDetailRow parcelId={p.id}/>}
                    </Fragment>
                )}
                {lastRow}
            </TableBody>
        </Table>
    </TableContainer>
}

function ParcelDetailRow(props) {
    const { parcelId } = props;

    const allEventsOrdered = useAllEventsOrdered();
    const log = useMemo(() =>
        getParcelLog(allEventsOrdered).filter(l => l.parcelId === parcelId)
    , [allEventsOrdered, parcelId]);

    return <>
        {log.map(e => <TableRow key={e.eventId}>
            <TableCell/>
            <TableCell align="right"><Typography variant="body2" color="primary">
                {dayjs(e.date).format('YYYY-MM-DD')}
            </Typography></TableCell>
            <TableCell colSpan={6} align="right"><Typography variant="body2" color="primary">
                {e.log}
            </Typography></TableCell>
            <TableCell/>
        </TableRow>)}
    </>
}

function EditParcelRow(props) {
    const {
        id,
        save,
        cancel,
        parcel
    } = props;

    const [date, setDate] = useState(null);
    const [asxCode, setAsxCode] = useState('');
    const [isDrp, setIsDrp] = useState(false);
    const [memo, setMemo] = useState('');
    const [units, setUnits] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [brokerage, setBrokerage] = useState('');

    useEffect(() => {
        setDate(parcel?.date ?? null);
        setAsxCode(parcel?.asxCode ?? '');
        setIsDrp(parcel?.isDrp ?? false);
        setMemo(parcel?.memo ?? '');
        setUnits(parcel?.units.toString() ?? '');
        setUnitPrice(parcel?.unitPrice.toString() ?? '');
        setBrokerage(parcel?.brokerage.toString() ?? '');
    }, [parcel]);

    const boundSave = () => save({
        id,
        date,
        asxCode,
        isDrp,
        memo,
        units: parseInt(units),
        unitPrice: parseFloat(unitPrice),
        brokerage: isDrp ? 0 : parseFloat(brokerage)
    });

    const unitsValid = units && !isNaN(parseFloat(units)) && parseInt(units) === parseFloat(units);
    const unitPriceValid = unitPrice && !isNaN(parseFloat(unitPrice));
    const brokerageValid = isDrp || (brokerage && !isNaN(parseFloat(brokerage)));

    const valid = date && asxCode && unitsValid && unitPriceValid && brokerageValid;

    return <TableRow>
        <TableCell component="th" scope="row">{id}</TableCell>
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
            <TextField value={asxCode} onChange={e => setAsxCode(e.target.value)} error={!asxCode} label="ASX Code"/>
        </TableCell>
        <TableCell align="right">
            <FormControlLabel control={<Switch color="primary" checked={isDrp} onChange={() => setIsDrp(!isDrp)}/>} label="Dividend Reinvestment" />
        </TableCell>
        <TableCell align="right">
            <TextField value={memo} onChange={e => setMemo(e.target.value)} label="Memo"/>
        </TableCell>
        <TableCell align="right">
            <TextField type="number" value={units} onChange={e => setUnits(e.target.value)} error={!unitsValid} label="Units"/>
        </TableCell>
        <TableCell align="right">
            <TextField type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} error={!unitPriceValid} label="Unit Price ($/u)"/>
        </TableCell>
        <TableCell align="right">
            <TextField type="number" disabled={isDrp} value={isDrp ? '0.00' : brokerage} onChange={e => setBrokerage(e.target.value)} error={!isDrp && !brokerageValid} label="Brokerage ($)"/>
        </TableCell>
        <TableCell align="right">
            <IconButton onClick={boundSave} disabled={!valid}><Done/></IconButton>
            <IconButton onClick={cancel}><Clear/></IconButton>
        </TableCell>
    </TableRow>
}