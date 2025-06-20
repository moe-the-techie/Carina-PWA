import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function PlanListItem ({ form, onClick }) {
    const theme = useTheme();

    return (
        <Box
            onClick={onClick}
            sx={{ backgroundColor: theme.palette.background.container, p: 2, m: 1, borderRadius: 4, width: '100%'}}
        >
            {form.reviewed ? <Typography sx={{ color: theme.palette.contrastText.primary, fontWeight: 'bold' }}>Plan</Typography> :
            <Typography variant="h6" sx={{ color: theme.palette.contrastText.primary, fontWeight: 'bold' }}>
                Form by: {form.user.name}
            </Typography>}
            <Typography variant="body2" sx={{ color: theme.palette.contrastText.secondary }}>
                Date: {new Date(form.createdAt).toLocaleString()}
            </Typography>
        </Box>
    );
}