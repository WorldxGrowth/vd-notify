const config = {
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
    APP_NAME: 'VDNotify',
    APP_TAGLINE: 'Real-time Webhook Notifications for VDChain',
    CHAIN_NAME: 'VDChain',
    CHAIN_ID: 882022,
    CURRENCY: 'VDC',
    TOKEN_KEY: 'vdnotify_token',
    USER_KEY: 'vdnotify_user',
    TOKEN_EXPIRY_DAYS: 7,
};

export default config;
