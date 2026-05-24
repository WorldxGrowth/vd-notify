require('dotenv').config({ path: '/root/vdnotify/.env' });

module.exports = {
    port: process.env.API_PORT || 4000,
    jwtSecret: process.env.JWT_SECRET || 'vdnotify_secret_change_this',
    db: {
        host: '127.0.0.1',
        port: 5432,
        database: 'vdnotify',
        user: 'vdchain',
        password: 'Umesh@@##2002',
    },
    networkName: 'VDCHAIN_MAINNET',
    chainId: 882022,
};
