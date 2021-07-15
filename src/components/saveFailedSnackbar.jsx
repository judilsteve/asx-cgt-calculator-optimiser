import React, { useEffect, useRef, useState } from 'react';
import { Snackbar } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { useSharedState } from '../hooks/useSharedState';
import { saveFailedState } from '../hooks/useSharedState';

export default function SimpleSnackbar() {
    const [saveFailed, ] = useSharedState(saveFailedState);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const initialPaintRef = useRef(true);

    useEffect(() => {
        if(!initialPaintRef.current) setSnackbarOpen(true);
        initialPaintRef.current = false;
    }, [saveFailed, initialPaintRef]);

    const failMsg = 'Changes could not be saved to your browser\'s local storage. ' +
        'Storage may be full or disabled by private browsing modes. ' +
        'You MUST manually export your holdings using the buttons at the top of the page or you WILL lose your work.';

    const successMsg = 'Changes saved to local storage successfully.';

    const close = () => setSnackbarOpen(false);

    return <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        open={snackbarOpen}
        onClose={close}
        autoHideDuration={saveFailed ? null : 6000}
        color={saveFailed ? 'error' : 'primary'}
    >
        <MuiAlert severity={saveFailed ? 'warning': 'success'} onClose={close} variant="filled">
            {saveFailed ? failMsg : successMsg}
        </MuiAlert >
    </Snackbar>;
}
