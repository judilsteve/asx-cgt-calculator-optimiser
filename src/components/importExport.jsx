import { Button, Typography } from '@material-ui/core';
import React, { useRef, useState } from 'react';
import { clearUnloadWarning, useSharedState } from '../hooks/useSharedState';
import { parcels as parcelsSharedState, adjustments as adjustmentsSharedState, sales as salesSharedState } from '../sharedState';
import dayjs from 'dayjs';

export default function ImportExport() {
    const [parcels, setParcels] = useSharedState(parcelsSharedState);
    const [adjustments, setAdjustments] = useSharedState(adjustmentsSharedState);
    const [sales, setSales] = useSharedState(salesSharedState);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const importData = async files => {
        if(!window.confirm(`WARNING: Importing this file will completely and irreversibly replace any data currently entered. Continue?`)) return;

        setError(null);
        setMessage(null);

        let data;
        try {
            data = JSON.parse(await files[0].text());
        } catch(e) {
            setError('File was not valid JSON. Ensure that you have selected the correct file and try again.');
            throw e;
        }
        if(!data.parcels || !data.adjustments || !data.sales) {
            setError('File appears malformed. Ensure that you have selected the correct file and try again.');
            return;
        }
        // TODO_JU? Further schema validation

        setParcels(data.parcels);
        setAdjustments(data.adjustments);
        setSales(data.sales);

        setMessage('Import successful');
        setTimeout(() => setMessage(null), 1000 * 30);
    };

    const exportData = () => {
        const jsonBlob = new Blob([JSON.stringify({
            parcels,
            adjustments,
            sales
        })]);
        const blobUrl = URL.createObjectURL(jsonBlob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const now = dayjs();
        link.download = `Holdings_${now.format(`YYYY-MM-DD_THH-mm-ss`)}.json`;
        document.body.appendChild(link);
        link.dispatchEvent( new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
        document.body.removeChild(link);
        clearUnloadWarning();
    };

    const uploadRef = useRef(null);

    return <>
        <input
            ref={uploadRef}
            onChange={e => importData(e.target.files)}
            accept="application/json"
            style={{ display: 'none' }}
            id="import-file-input"
            type="file"/>
        <label htmlFor="import-file-input">
            <Button onClick={() => uploadRef.current?.click()} variant="contained" color="primary">Import Holdings</Button>
        </label>
        <Button onClick={exportData} style={{margin: 10}} variant="contained" color="primary">Export Holdings</Button>
        { !error && !message && <><br/><Typography color="textSecondary" variant="body2">NOTE: Importing holdings will completely and irreversibly replace any data currently entered</Typography></> }
        { error && <><br/><Typography color="error" variant="body2">{error}</Typography></> }
        { message && <><br/><Typography color="textSecondary" variant="body2">{message}</Typography></> }
    </>;
}