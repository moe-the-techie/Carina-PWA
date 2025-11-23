import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    Stack,
    Chip
} from '@mui/material';
import {
    NotificationsActive,
    NotificationsOff,
    Campaign,
    TestTube
} from '@mui/icons-material';
import { 
    canShowNotifications, 
    requestAnnouncementNotificationPermission,
    showSmartAnnouncementNotification 
} from '../utils/announcementNotificationUtils';

export default function NotificationTestComponent() {
    const [notificationStatus, setNotificationStatus] = useState(() => canShowNotifications());
    const [testResult, setTestResult] = useState('');

    const handleRequestPermission = async () => {
        const granted = await requestAnnouncementNotificationPermission();
        setNotificationStatus(canShowNotifications());
        setTestResult(granted ? 'Permission granted!' : 'Permission denied or failed');
    };

    const handleTestNotification = async () => {
        const testAnnouncement = {
            _id: 'test-' + Date.now(),
            title: 'Test Announcement',
            message: 'This is a test announcement to verify that push notifications are working correctly in your PWA.',
            priority: 'normal',
            createdAt: new Date()
        };

        try {
            const success = await showSmartAnnouncementNotification(testAnnouncement);
            setTestResult(success ? 'Test notification sent!' : 'Failed to send notification');
        } catch (error) {
            setTestResult('Error: ' + error.message);
        }
    };

    const handleTestUrgentNotification = async () => {
        const testAnnouncement = {
            _id: 'test-urgent-' + Date.now(),
            title: 'URGENT: Test Alert',
            message: 'This is an urgent test announcement that requires user interaction. It should stay visible until dismissed.',
            priority: 'urgent',
            createdAt: new Date()
        };

        try {
            const success = await showSmartAnnouncementNotification(testAnnouncement);
            setTestResult(success ? 'Urgent test notification sent!' : 'Failed to send urgent notification');
        } catch (error) {
            setTestResult('Error: ' + error.message);
        }
    };

    const getStatusColor = () => {
        if (!notificationStatus.supported) return 'error';
        if (!notificationStatus.enabled) return 'warning';
        return 'success';
    };

    const getStatusText = () => {
        if (!notificationStatus.supported) return 'Not Supported';
        if (!notificationStatus.enabled) {
            switch (notificationStatus.reason) {
                case 'permission_denied':
                    return 'Permission Denied';
                case 'permission_not_requested':
                    return 'Permission Not Requested';
                default:
                    return 'Disabled';
            }
        }
        return 'Enabled';
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    <Campaign sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Push Notification Test
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Notification Status:
                    </Typography>
                    <Chip
                        icon={notificationStatus.enabled ? <NotificationsActive /> : <NotificationsOff />}
                        label={getStatusText()}
                        color={getStatusColor()}
                        variant="outlined"
                    />
                </Box>

                {testResult && (
                    <Alert 
                        severity={testResult.includes('Error') ? 'error' : 'success'} 
                        sx={{ mb: 2 }}
                    >
                        {testResult}
                    </Alert>
                )}

                <Stack direction="row" spacing={2} flexWrap="wrap">
                    {!notificationStatus.enabled && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleRequestPermission}
                            startIcon={<NotificationsActive />}
                        >
                            Request Permission
                        </Button>
                    )}
                    
                    {notificationStatus.enabled && (
                        <>
                            <Button
                                variant="outlined"
                                onClick={handleTestNotification}
                                startIcon={<TestTube />}
                            >
                                Test Normal Notification
                            </Button>
                            <Button
                                variant="outlined"
                                color="warning"
                                onClick={handleTestUrgentNotification}
                                startIcon={<TestTube />}
                            >
                                Test Urgent Notification
                            </Button>
                        </>
                    )}
                </Stack>

                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    Use these buttons to test the push notification system. Make sure to allow notifications when prompted.
                </Typography>
            </CardContent>
        </Card>
    );
}