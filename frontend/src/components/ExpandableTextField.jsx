import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Tooltip,
    useMediaQuery
} from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useTheme } from '@mui/material/styles';

export default function ExpandableTextField({
    compactRows = 2,
    expandedRows = 10,
    dialogTitle,
    dialogMaxWidth = 'md',
    expandButtonLabel = 'Expand',
    expandButtonTooltip = 'Expand editor',
    containerSx,
    disabled = false,
    multiline: _ignoredMultiline,
    rows: _ignoredRows,
    ...textFieldProps
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [dialogOpen, setDialogOpen] = useState(false);

    const resolvedDialogTitle = useMemo(() => {
        if (dialogTitle) return dialogTitle;
        if (textFieldProps.label) return String(textFieldProps.label);
        return 'Edit text';
    }, [dialogTitle, textFieldProps.label]);

    return (
        <>
            <Box sx={containerSx}>
                <TextField
                    {...textFieldProps}
                    multiline
                    rows={compactRows}
                    disabled={disabled}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <Tooltip title={expandButtonTooltip}>
                        <span>
                            <Button
                                size="small"
                                startIcon={<OpenInFullIcon fontSize="small" />}
                                onClick={() => setDialogOpen(true)}
                                disabled={disabled}
                                sx={{ minWidth: 0, textTransform: 'none' }}
                            >
                                {expandButtonLabel}
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullScreen={isMobile}
                fullWidth
                maxWidth={dialogMaxWidth}
            >
                <DialogTitle>{resolvedDialogTitle}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        {...textFieldProps}
                        fullWidth
                        multiline
                        rows={expandedRows}
                        autoFocus
                        disabled={disabled}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} variant="contained">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
