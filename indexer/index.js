const { JsonRpcProvider } = require('ethers');
const config = require('./config');
const db = require('./db');
const logger = require('./logger');
const { startAutoReload, getWebhooksForAddress } = require('./matcher');
const { fireWebhook } = require('./notifier');

const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const provider = new JsonRpcProvider(config.rpcUrl);

async function getIndexerState() {
    const res = await db.query("SELECT value FROM indexer_state WHERE key = 'last_indexed_block'");
    return parseInt(res.rows[0].value);
}

async function updateIndexerState(blockNumber) {
    await db.query(
        "UPDATE indexer_state SET value = $1, updated_at = NOW() WHERE key = 'last_indexed_block'",
        [blockNumber.toString()]
    );
}

function buildPayload(webhookId, network, activities) {
    return {
        webhookId: webhookId,
        id: 'whevt_' + require('crypto').randomBytes(10).toString('hex'),
        createdAt: new Date().toISOString(),
        type: 'ADDRESS_ACTIVITY',
        event: {
            network: network,
            activity: activities
        }
    };
}

function buildActivity(tx, receipt, blockNumber, category, extra = {}) {
    const blockHex = '0x' + blockNumber.toString(16);
    return {
        blockNum: blockHex,
        hash: tx.hash,
        fromAddress: tx.from?.toLowerCase() || null,
        toAddress: tx.to?.toLowerCase() || null,
        value: tx.value ? parseFloat(require('ethers').formatEther(tx.value)) : 0,
        asset: 'VDC',
        category: category,
        erc721TokenId: null,
        erc1155Metadata: null,
        typeTraceAddress: null,
        rawContract: {
            rawValue: tx.value ? '0x' + tx.value.toString(16) : '0x0',
            address: null,
            decimals: 18
        },
        log: null,
        ...extra
    };
}

async function processBlock(blockNumber) {
    try {
        const block = await provider.getBlock(blockNumber, true);
        if (!block || !block.transactions) return;

        logger.info(`Processing block ${blockNumber} — ${block.transactions.length} txs`);

        for (const tx of block.transactions) {
            const fullTx = typeof tx === 'string' ? await provider.getTransaction(tx) : tx;
            if (!fullTx) continue;

            const receipt = await provider.getTransactionReceipt(fullTx.hash);
            if (!receipt) continue;

            const fromAddr = fullTx.from?.toLowerCase();
            const toAddr = fullTx.to?.toLowerCase();

            // Address match karo
            const fromWebhooks = getWebhooksForAddress(fromAddr || '');
            const toWebhooks   = getWebhooksForAddress(toAddr || '');

            // Unique webhooks — same webhook ek hi baar fire ho
            const webhookMap = new Map();
            for (const w of [...fromWebhooks, ...toWebhooks]) {
                if (!webhookMap.has(w.webhook_uuid)) webhookMap.set(w.webhook_uuid, w);
            }

            if (webhookMap.size > 0) {
                const activity = buildActivity(fullTx, receipt, blockNumber, 'external');

                // Parallel fire — sab ek saath
                const fires = [];
                for (const webhook of webhookMap.values()) {
                    const payload = buildPayload(webhook.webhook_id, config.networkName, [activity]);
                    fires.push(fireWebhook(webhook, payload));
                }
                await Promise.allSettled(fires);
            }

            // ERC20 Transfer events
            for (const log of receipt.logs) {
                if (
                    log.topics[0] === ERC20_TRANSFER_TOPIC &&
                    log.topics.length === 3
                ) {
                    const erc20From = '0x' + log.topics[1].slice(26).toLowerCase();
                    const erc20To   = '0x' + log.topics[2].slice(26).toLowerCase();

                    const erc20FromWebhooks = getWebhooksForAddress(erc20From);
                    const erc20ToWebhooks   = getWebhooksForAddress(erc20To);

                    const erc20WebhookMap = new Map();
                    for (const w of [...erc20FromWebhooks, ...erc20ToWebhooks]) {
                        if (!erc20WebhookMap.has(w.webhook_uuid)) erc20WebhookMap.set(w.webhook_uuid, w);
                    }

                    if (erc20WebhookMap.size === 0) continue;

                    let tokenAmount = 0;
                    try {
                        tokenAmount = parseFloat(require('ethers').formatUnits(
                            BigInt(log.data === '0x' ? 0 : log.data), 18
                        ));
                    } catch(e) {}

                    const erc20Activity = {
                        blockNum: '0x' + blockNumber.toString(16),
                        hash: fullTx.hash,
                        fromAddress: erc20From,
                        toAddress: erc20To,
                        value: tokenAmount,
                        asset: 'UNKNOWN',
                        category: 'token',
                        erc721TokenId: null,
                        erc1155Metadata: null,
                        typeTraceAddress: null,
                        rawContract: {
                            rawValue: log.data,
                            address: log.address?.toLowerCase() || null,
                            decimals: 18
                        },
                        log: {
                            address: log.address?.toLowerCase(),
                            topics: log.topics,
                            data: log.data,
                            blockNumber: '0x' + blockNumber.toString(16),
                            transactionHash: fullTx.hash,
                            transactionIndex: '0x' + (receipt.index || 0).toString(16),
                            blockHash: block.hash,
                            logIndex: '0x' + (log.index || 0).toString(16),
                            removed: false
                        }
                    };

                    const erc20Fires = [];
                    for (const webhook of erc20WebhookMap.values()) {
                        const payload = buildPayload(webhook.webhook_id, config.networkName, [erc20Activity]);
                        erc20Fires.push(fireWebhook(webhook, payload));
                    }
                    await Promise.allSettled(erc20Fires);
                }
            }
        }

        await updateIndexerState(blockNumber);
    } catch (e) {
        logger.error(`processBlock ${blockNumber} error: ${e.message}`);
    }
}

async function startSync() {
    logger.info('🚀 VDNotify Indexer Starting...');
    logger.info(`RPC: ${config.rpcUrl}`);
    logger.info(`Network: ${config.networkName}`);

    // Address map load karo
    await startAutoReload();

    // Indexer state check
    const lastIndexed = await getIndexerState();
    const latestOnChain = await provider.getBlockNumber();

    if (lastIndexed === 0) {
        // Fresh start — current block se shuru karo
        await updateIndexerState(latestOnChain - 1);
        logger.info(`Fresh start — beginning from block ${latestOnChain}`);
    } else {
        logger.info(`Resuming from block ${lastIndexed + 1}`);
    }

    logger.info('✅ VDNotify Indexer Ready — Listening for blocks...');

    while (true) {
        try {
            const lastBlock = await getIndexerState();
            const latest = await provider.getBlockNumber();

            if (lastBlock < latest) {
                await processBlock(lastBlock + 1);
            } else {
                await new Promise(r => setTimeout(r, config.pollInterval));
            }
        } catch (e) {
            logger.error(`Sync loop error: ${e.message}`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

startSync();
