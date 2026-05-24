-- ============================================================
-- VDNotify — Complete Future-Proof Database Schema
-- Run: psql -U postgres -d vdnotify -f schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. PLANS — Subscription tiers
-- ============================================================
CREATE TABLE plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,  -- 'free', 'basic', 'pro', 'payg'
    display_name    VARCHAR(100) NOT NULL,
    max_webhooks    INTEGER NOT NULL DEFAULT 3,
    max_addresses   INTEGER NOT NULL DEFAULT 100, -- per webhook
    monthly_credits INTEGER NOT NULL DEFAULT 500, -- free credits/month
    price_monthly   NUMERIC(10,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (name, display_name, max_webhooks, max_addresses, monthly_credits, price_monthly) VALUES
('free',  'Free',    3,   100,    500,   0),
('basic', 'Basic',   10,  1000,   2000,  99),
('pro',   'Pro',     50,  10000,  10000, 299),
('payg',  'Pay As You Go', 100, 50000, 0, 0);

-- ============================================================
-- 2. USERS — Auth + Account
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    plan_id         INTEGER REFERENCES plans(id) DEFAULT 1,
    api_key         VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    credit_balance  BIGINT NOT NULL DEFAULT 500,       -- current credits
    credits_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    is_active       BOOLEAN DEFAULT true,
    is_verified     BOOLEAN DEFAULT false,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);

-- ============================================================
-- 3. NETWORKS — Multi-chain ready
-- ============================================================
CREATE TABLE networks (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,  -- 'VDCHAIN_MAINNET'
    display_name VARCHAR(100) NOT NULL,
    chain_id     INTEGER NOT NULL UNIQUE,
    rpc_url      VARCHAR(255),
    currency     VARCHAR(20) DEFAULT 'VDC',
    is_active    BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO networks (name, display_name, chain_id, rpc_url, currency) VALUES
('VDCHAIN_MAINNET', 'VDChain Mainnet', 882022, 'http://127.0.0.1:8545', 'VDC'),
('VDCHAIN_TESTNET', 'VDChain Testnet', 882023, 'http://127.0.0.1:8546', 'VDC');

-- ============================================================
-- 4. WEBHOOKS — Core table
-- ============================================================
CREATE TYPE webhook_type AS ENUM (
    'ADDRESS_ACTIVITY',   -- address send/receive
    'CONTRACT_ACTIVITY',  -- contract pe koi bhi tx
    'TOKEN_ACTIVITY'      -- specific token transfers
);

CREATE TYPE webhook_status AS ENUM ('active', 'inactive', 'disabled');

CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    network_id      INTEGER NOT NULL REFERENCES networks(id) DEFAULT 1,
    webhook_id      VARCHAR(20) NOT NULL UNIQUE,  -- wh_xxxxxxxxxxxxxxxx
    name            VARCHAR(255) NOT NULL DEFAULT 'My Webhook',
    type            webhook_type NOT NULL DEFAULT 'ADDRESS_ACTIVITY',
    url             VARCHAR(500) NOT NULL,
    signing_key     VARCHAR(100) NOT NULL DEFAULT 'whsec_' || encode(gen_random_bytes(24), 'hex'),
    status          webhook_status DEFAULT 'active',
    -- Stats (denormalized for speed)
    total_fired     BIGINT DEFAULT 0,
    total_success   BIGINT DEFAULT 0,
    total_failed    BIGINT DEFAULT 0,
    last_fired_at   TIMESTAMPTZ,
    -- Config
    retry_count     INTEGER DEFAULT 5,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id   ON webhooks(user_id);
CREATE INDEX idx_webhooks_status    ON webhooks(status);
CREATE INDEX idx_webhooks_network   ON webhooks(network_id);

-- ============================================================
-- 5. WEBHOOK ADDRESSES — Registered addresses
-- ============================================================
CREATE TABLE webhook_addresses (
    id          BIGSERIAL PRIMARY KEY,
    webhook_id  UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    address     VARCHAR(42) NOT NULL,
    label       VARCHAR(100),          -- optional user-given name
    is_active   BOOLEAN DEFAULT true,
    added_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Most important index — indexer har block pe yahi lookup karega
CREATE UNIQUE INDEX idx_webhook_addr_unique ON webhook_addresses(webhook_id, LOWER(address));
CREATE INDEX idx_webhook_addr_address ON webhook_addresses(LOWER(address));
CREATE INDEX idx_webhook_addr_active  ON webhook_addresses(is_active) WHERE is_active = true;

-- ============================================================
-- 6. NOTIFICATION LOG — Fired webhooks record
-- ============================================================
CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed', 'retrying');

CREATE TABLE notification_log (
    id              BIGSERIAL PRIMARY KEY,
    webhook_id      UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_id        VARCHAR(30) NOT NULL UNIQUE,  -- whevt_xxxxxxxxxxxxxxxx
    tx_hash         VARCHAR(66),
    block_number    BIGINT,
    event_type      webhook_type,
    payload         JSONB NOT NULL,               -- exact payload jo bheja
    status          delivery_status DEFAULT 'pending',
    http_status     INTEGER,                       -- 200, 404, 500 etc
    response_body   TEXT,                          -- server ka response
    attempt_count   INTEGER DEFAULT 0,
    next_retry_at   TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_webhook_id  ON notification_log(webhook_id);
CREATE INDEX idx_notif_status      ON notification_log(status);
CREATE INDEX idx_notif_created     ON notification_log(created_at DESC);
CREATE INDEX idx_notif_tx_hash     ON notification_log(tx_hash);

-- Auto delete after 30 days (lightweight rakhne ke liye)
-- Cron se chalana: DELETE FROM notification_log WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================================
-- 7. CREDIT TRANSACTIONS — Ledger
-- ============================================================
CREATE TYPE credit_txn_type AS ENUM (
    'free_grant',       -- signup free credits
    'monthly_reset',    -- monthly free reset
    'purchase',         -- paid purchase
    'usage_deduct',     -- notification fired
    'refund'            -- failed delivery refund
);

CREATE TABLE credit_transactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        credit_txn_type NOT NULL,
    amount      BIGINT NOT NULL,          -- positive=add, negative=deduct
    balance     BIGINT NOT NULL,          -- balance after this txn
    description TEXT,
    webhook_id  UUID REFERENCES webhooks(id) ON DELETE SET NULL,
    ref_id      VARCHAR(100),             -- payment gateway ref
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_user_id  ON credit_transactions(user_id);
CREATE INDEX idx_credit_created  ON credit_transactions(created_at DESC);

-- ============================================================
-- 8. WEBHOOK STATS — Daily aggregates (dashboard graphs)
-- ============================================================
CREATE TABLE webhook_daily_stats (
    id              BIGSERIAL PRIMARY KEY,
    webhook_id      UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    total_fired     INTEGER DEFAULT 0,
    success_200     INTEGER DEFAULT 0,
    error_4xx       INTEGER DEFAULT 0,
    error_5xx       INTEGER DEFAULT 0,
    error_timeout   INTEGER DEFAULT 0,
    credits_used    INTEGER DEFAULT 0,
    UNIQUE(webhook_id, date)
);

CREATE INDEX idx_daily_stats_webhook ON webhook_daily_stats(webhook_id, date DESC);

-- ============================================================
-- 9. USER STATS — Account level daily (overview dashboard)
-- ============================================================
CREATE TABLE user_daily_stats (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    total_fired     INTEGER DEFAULT 0,
    total_success   INTEGER DEFAULT 0,
    total_failed    INTEGER DEFAULT 0,
    credits_used    INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- ============================================================
-- 10. INDEXER STATE — VDNotify indexer ka state
-- ============================================================
CREATE TABLE indexer_state (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO indexer_state (key, value) VALUES
('last_indexed_block', '0'),
('indexer_status', 'stopped'),
('last_error', '');

-- ============================================================
-- HELPER FUNCTION — webhook_id generator (wh_ prefix)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_webhook_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'wh_' || encode(gen_random_bytes(10), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_event_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'whevt_' || encode(gen_random_bytes(10), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Auto webhook_id on insert
CREATE OR REPLACE FUNCTION set_webhook_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.webhook_id IS NULL OR NEW.webhook_id = '' THEN
        NEW.webhook_id := generate_webhook_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_webhook_id
BEFORE INSERT ON webhooks
FOR EACH ROW EXECUTE FUNCTION set_webhook_id();