const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get user's form credits balance
 */
export async function getFormCredits() {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${apiBaseUrl}/api/payments/credits`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch credits');
    }

    return response.json();
}

/**
 * Create a payment intention for purchasing form credits
 */
export async function createPaymentIntention() {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${apiBaseUrl}/api/payments/create-intention`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
    }

    return response.json();
}

/**
 * Get payment status by ID
 */
export async function getPaymentStatus(paymentId) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${apiBaseUrl}/api/payments/${paymentId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch payment status');
    }

    return response.json();
}

/**
 * Get payment history
 */
export async function getPaymentHistory(page = 1, limit = 10) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${apiBaseUrl}/api/payments/history?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch payment history');
    }

    return response.json();
}

/**
 * Load Paymob Pixel SDK scripts
 */
export function loadPaymobPixelSDK() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector('script[src*="paymob-pixel"]')) {
            resolve();
            return;
        }

        // Load CSS
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'https://cdn.jsdelivr.net/npm/paymob-pixel@latest/styles.css';
        document.head.appendChild(styleLink);

        const mainCss = document.createElement('link');
        mainCss.rel = 'stylesheet';
        mainCss.href = 'https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.css';
        document.head.appendChild(mainCss);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.js';
        script.type = 'module';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}
