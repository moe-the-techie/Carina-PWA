// Paymob Configuration
// Get your credentials from: https://accept.paymob.com/portal2/en/settings

const paymobConfig = {
    // API Key (for legacy authentication)
    apiKey: process.env.PAYMOB_API_KEY,
    
    // Secret Key (for Intention API - Token authentication)
    secretKey: process.env.PAYMOB_SECRET_KEY,
    
    // Public Key (for frontend Pixel SDK)
    publicKey: process.env.PAYMOB_PUBLIC_KEY,
    
    // Integration ID (for card payments)
    integrationId: process.env.PAYMOB_INTEGRATION_ID,
    
    // HMAC Secret (for verifying callbacks)
    hmacSecret: process.env.PAYMOB_HMAC_SECRET,
    
    // API Endpoints
    baseUrl: 'https://accept.paymob.com',
    intentionEndpoint: '/v1/intention/',
    
    // Checkout URL (for redirecting users)
    checkoutUrl: 'https://accept.paymob.com/unifiedcheckout/',
    
    // Default currency
    currency: 'EGP',
    
    // Price per package in cents (e.g., 20000 = 200 EGP) - configurable via env
    formPackagePrice: parseInt(process.env.PAYMOB_FORM_PACKAGE_PRICE) || 20000,
    
    // Number of forms per package - configurable via env
    formsPerPackage: parseInt(process.env.PAYMOB_FORMS_PER_PACKAGE) || 4,
};

export default paymobConfig;
