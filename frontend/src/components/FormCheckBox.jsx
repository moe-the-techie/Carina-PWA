import React from 'react';
import { FormControlLabel, Checkbox, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function FormCheckBox({ label, name, checked, onChange }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                backgroundColor: checked
                ? theme.palette.primary.main
                : theme.palette.background.darker,
                borderRadius: 20,
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
                        color: theme.palette.grey[400],
                        '&.Mui-checked': {
                        color: theme.palette.grey[200],
                        },
                        transform: 'scale(1.2)',
                    }}
                    />
                }
                label={
                    <Typography sx={{ fontStyle: 'italic', fontSize: '1.2rem' }}>
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
