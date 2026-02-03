// Fawaterk Configuration
// Get your credentials from: https://app.fawaterk.com/

const fawaterkConfig = {
    // API Key (for authentication)
    apiKey: process.env.FAWATERK_API_KEY,
    
    // API Endpoints
    baseUrl: process.env.FAWATERK_BASE_URL || 'https://app.fawaterk.com/api/v2',
    
    // Endpoints
    invoiceEndpoint: '/invoiceInitPay',
    paymentStatusEndpoint: '/getInvoiceData/',
    
    // Default currency
    currency: 'EGP',
    
    // Price per package (e.g., 200 = 200 EGP) - configurable via env
    formPackagePrice: parseFloat(process.env.FAWATERK_FORM_PACKAGE_PRICE) || 200,
    
    // Number of forms per package - configurable via env
    formsPerPackage: parseInt(process.env.FAWATERK_FORMS_PER_PACKAGE) || 4,
    
    // Webhook secret for verifying callbacks (optional)
    webhookSecret: process.env.FAWATERK_WEBHOOK_SECRET,
};

export default fawaterkConfig;
