require('dotenv').config({ path: '/root/vdnotify/.env' });

module.exports = {
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    chainId: parseInt(process.env.CHAIN_ID) || 882022,
    networkName: process.env.NETWORK_NAME || 'VDCHAIN_MAINNET',
    db: {
        host: '127.0.0.1',
        port: 5432,
        database: 'vdnotify',
        user: 'vdchain',
        password: 'Umesh@@##2002',
    },
    pollInterval: 3000,
};
