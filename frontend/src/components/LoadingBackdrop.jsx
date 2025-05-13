import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
}));

export default function LoadingBackdrop({ open }) {
    return (
        <StyledBackdrop open={open}>
            <CircularProgress color="inherit" />
        </StyledBackdrop>
    )
}
