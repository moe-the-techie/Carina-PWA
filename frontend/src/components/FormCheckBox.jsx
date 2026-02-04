import React from 'react';
import { FormControlLabel, Checkbox, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { spacing, borderRadius, transitions } from '../styles';

export default function FormCheckBox({ label, name, checked, onChange }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                backgroundColor: checked
                ? theme.palette.primary.main
                : theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.9)',
                borderRadius: borderRadius.xl,
                py: spacing.sm,
                px: spacing.md,
                mb: spacing.md,
                width: '100%',
                transition: transitions.default,
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
