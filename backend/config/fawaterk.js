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

    // Optional: separate packages for first-time vs follow-up purchases
    // If not provided, they fall back to the original package values.
    firstTimePackagePrice: parseFloat(process.env.FAWATERK_FIRST_TIME_PACKAGE_PRICE) || (parseFloat(process.env.FAWATERK_FORM_PACKAGE_PRICE) || 200),
    firstTimeFormsPerPackage: parseInt(process.env.FAWATERK_FIRST_TIME_FORMS_PER_PACKAGE) || (parseInt(process.env.FAWATERK_FORMS_PER_PACKAGE) || 4),
    followUpPackagePrice: parseFloat(process.env.FAWATERK_FOLLOW_UP_PACKAGE_PRICE) || (parseFloat(process.env.FAWATERK_FORM_PACKAGE_PRICE) || 200),
    followUpFormsPerPackage: parseInt(process.env.FAWATERK_FOLLOW_UP_FORMS_PER_PACKAGE) || (parseInt(process.env.FAWATERK_FORMS_PER_PACKAGE) || 4),
    
    // Webhook secret for verifying callbacks (optional)
    webhookSecret: process.env.FAWATERK_WEBHOOK_SECRET,
};

export default fawaterkConfig;
