import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../contexts/ThemeContext';

export default function ThemeToggle() {
    const { mode, toggleTheme } = useThemeMode();

    return (
        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton 
                onClick={toggleTheme} 
                color="inherit"
                sx={{ 
                    width: { xs: '40px', md: '48px' },
                    height: { xs: '40px', md: '48px' }
                }}
            >
                {mode === 'dark' ? 
                    <Brightness7Icon sx={{ fontSize: { xs: '20px', md: '24px' } }} /> : 
                    <Brightness4Icon sx={{ fontSize: { xs: '20px', md: '24px' } }} />
                }
            </IconButton>
        </Tooltip>
    );
}
