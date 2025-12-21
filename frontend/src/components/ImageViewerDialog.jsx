import React from 'react';
import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Slide
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { transitions, zIndex } from '../styles';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ImageViewerDialog({ open, imageUrl, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            TransitionComponent={Transition}
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    boxShadow: 'none'
                }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transition: transitions.fast,
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    zIndex: zIndex.tooltip
                }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {imageUrl && (
                    <Box
                        component="img"
                        src={imageUrl}
                        alt="Full size"
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            cursor: 'zoom-out'
                        }}
                        onClick={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
