import React from 'react';
import { FormControlLabel, Checkbox, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function FormCheckBox({ label, name, checked, onChange }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                backgroundColor: checked
                ? theme.palette.secondary.main
                : theme.palette.background.darker,
                borderRadius: 3,
                py: 1,
                px: 2,
                mb: 2,
                width: '100%',
            }}
        >

            <FormControlLabel
                control={
                    <Checkbox
                    checked={checked}
                    onChange={onChange}
                    name={name}
                    disableRipple
                    sx={{
                        color: theme.palette.grey[500],
                        '&.Mui-checked': {
                        color: theme.palette.grey[700],
                        },
                    }}
                    />
                }
                label={
                    <Typography sx={{ fontStyle: 'italic' }}>
                    {label}
                    </Typography>
                }
                sx={{
                    alignItems: 'center',
                    m: 0,
                    color: theme.palette.primary.contrastText,
                }}
            />

        </Box>
    );
}
