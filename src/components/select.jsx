import React from 'react';
import { FormControl, InputLabel, Select as MatSelect } from '@material-ui/core';

export default function Select(props) {
    const {
        disabled,
        error,
        value,
        onChange,
        children,
        renderValue,
        multiple,
        id,
        label
    } = props;

    // Renders popover *below* the dropdown instead of on top of it
    const selectProps = {
        anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left'
        },
        transformOrigin: {
            vertical: 'top',
            horizontal: 'left'
        },
        getContentAnchorEl: null
    };

    return <FormControl fullWidth>
        <InputLabel id={id}>{label}</InputLabel>
        <MatSelect
            MenuProps={selectProps}
            disabled={disabled}
            labelId={id}
            error={error}
            multiple={multiple}
            fullWidth
            value={value}
            onChange={onChange}
            renderValue={renderValue}>
            {children}
        </MatSelect>
    </FormControl>;
}