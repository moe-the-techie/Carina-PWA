import React from 'react';
import {
    Dialog,
    DialogContent,
    IconButton,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function ImageViewerDialog({ open, imageUrl, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
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
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    zIndex: 1
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
