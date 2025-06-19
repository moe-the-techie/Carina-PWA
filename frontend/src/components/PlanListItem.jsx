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
            <Typography variant="h6" className="text-blue-600 font-semibold">
                Form by: {form.user.name}
            </Typography>
            <Typography variant="body2" className="text-gray-700">
                Date: {form.createdAt}
            </Typography>
        </Box>
    );
}