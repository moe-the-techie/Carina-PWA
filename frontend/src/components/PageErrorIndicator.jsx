import { Alert, Collapse } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export default function PageErrorIndicator({ error, onClose, sx = {} }) {
    const theme = useTheme();
    const message = typeof error === 'string' ? error : error?.message;

    if (!message) {
        return null;
    }

    return (
        <Collapse in={Boolean(message)}>
            <Alert
                severity="error"
                variant="filled"
                onClose={onClose}
                sx={{
                    mb: 3,
                    borderRadius: 2,
                    alignItems: 'center',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.28)}`,
                    '& .MuiAlert-message': {
                        width: '100%',
                    },
                    ...sx,
                }}
            >
                {message}
            </Alert>
        </Collapse>
    );
}
