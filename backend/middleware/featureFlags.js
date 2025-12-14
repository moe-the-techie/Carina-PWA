export const checkFeatureEnabled = (featureName) => {
    return (req, res, next) => {
        // Default to true if not explicitly set to 'false'
        const isEnabled = process.env[featureName] !== 'false';
        if (!isEnabled) {
            return res.status(403).json({ message: 'This feature is currently disabled.' });
        }
        next();
    };
};
