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
 * Create a payment invoice for purchasing form credits
 * Returns checkout URL for redirection to Fawaterk
 */
export async function createPaymentInvoice() {
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
 * Redirect to Fawaterk checkout page
 * @param {string} checkoutUrl - The Fawaterk checkout URL
 */
export function redirectToCheckout(checkoutUrl) {
    if (checkoutUrl) {
        window.location.href = checkoutUrl;
    } else {
        throw new Error('No checkout URL provided');
    }
}
