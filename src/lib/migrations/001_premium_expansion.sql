-- ============================================================================
-- Rooom OS Premium Expansion Migration
-- Version: 001
-- Description: Adds support for pricing products (packs, subscriptions,
--              gift certificates), client wallets, chat system, and widgets
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Pricing product types
CREATE TYPE pricing_product_type AS ENUM ('pack', 'subscription', 'gift_certificate');

-- Billing periods for subscriptions
CREATE TYPE billing_period AS ENUM ('once', 'monthly', 'quarterly', 'yearly');

-- Subscription/purchase status
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Wallet transaction types
CREATE TYPE wallet_transaction_type AS ENUM ('credit', 'debit', 'expire', 'refund', 'adjustment');

-- Chat conversation status
CREATE TYPE chat_status AS ENUM ('active', 'waiting_human', 'with_human', 'resolved', 'closed');

-- Chat message sender types
CREATE TYPE chat_sender_type AS ENUM ('visitor', 'ai', 'human');

-- Chat message content types
CREATE TYPE chat_content_type AS ENUM ('text', 'image', 'file', 'booking_card', 'availability_card', 'pack_card', 'system');

-- Widget types
CREATE TYPE widget_type AS ENUM ('booking', 'chat', 'packs');

-- ============================================================================
-- PRICING PRODUCTS TABLE
-- Stores packs, subscriptions, and gift certificates
-- ============================================================================

CREATE TABLE pricing_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

    -- Basic product info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type pricing_product_type NOT NULL,

    -- Pricing
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    billing_period billing_period NOT NULL DEFAULT 'once',

    -- Credits configuration
    credits_included INTEGER CHECK (credits_included IS NULL OR credits_included > 0),
    credits_type VARCHAR(50) DEFAULT 'hours', -- 'hours', 'sessions', 'dollars'

    -- Validity rules
    valid_days INTEGER CHECK (valid_days IS NULL OR valid_days > 0), -- Days until expiry after purchase
    valid_spaces UUID[], -- NULL means all spaces, array for specific spaces
    valid_time_slots JSONB, -- Restrictions like {"weekdays": true, "hours": {"start": "09:00", "end": "17:00"}}

    -- Stripe integration
    stripe_product_id VARCHAR(255),
    stripe_price_id VARCHAR(255),

    -- Display settings
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Limits
    max_purchases_per_client INTEGER, -- NULL means unlimited

    -- Legal
    terms_and_conditions TEXT,

    -- Additional data
    metadata JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT valid_credits_for_type CHECK (
        (type = 'gift_certificate' AND credits_type = 'dollars') OR
        (type != 'gift_certificate')
    )
);

-- Indexes for pricing_products
CREATE INDEX idx_pricing_products_studio_id ON pricing_products(studio_id);
CREATE INDEX idx_pricing_products_type ON pricing_products(studio_id, type);
CREATE INDEX idx_pricing_products_active ON pricing_products(studio_id, is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_products_stripe_product ON pricing_products(stripe_product_id) WHERE stripe_product_id IS NOT NULL;
CREATE INDEX idx_pricing_products_display ON pricing_products(studio_id, display_order, is_featured);

-- Trigger for updated_at
CREATE TRIGGER pricing_products_updated_at
    BEFORE UPDATE ON pricing_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLIENT WALLETS TABLE
-- Stores credit balances for clients (one per client per credit type)
-- ============================================================================

CREATE TABLE client_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Balance
    credits_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
    credits_type VARCHAR(50) NOT NULL DEFAULT 'hours', -- 'hours', 'sessions', 'dollars'

    -- Lifetime stats
    total_credits_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_credits_used DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_credits_expired DECIMAL(10, 2) NOT NULL DEFAULT 0,

    -- Unique constraint: one wallet per client per credit type
    CONSTRAINT unique_client_wallet UNIQUE (client_id, credits_type)
);

-- Indexes for client_wallets
CREATE INDEX idx_client_wallets_studio_id ON client_wallets(studio_id);
CREATE INDEX idx_client_wallets_client_id ON client_wallets(client_id);
CREATE INDEX idx_client_wallets_balance ON client_wallets(studio_id, credits_balance) WHERE credits_balance > 0;

-- Trigger for updated_at
CREATE TRIGGER client_wallets_updated_at
    BEFORE UPDATE ON client_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLIENT PURCHASES TABLE
-- Tracks purchases of products (packs, subscriptions, gift certificates)
-- ============================================================================

CREATE TABLE client_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES pricing_products(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    -- Status
    status subscription_status NOT NULL DEFAULT 'active',

    -- Timestamps
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Pause functionality (for subscriptions)
    pause_started_at TIMESTAMPTZ,
    pause_ends_at TIMESTAMPTZ,

    -- Credits tracking (for packs)
    credits_remaining DECIMAL(10, 2),

    -- Stripe subscription (for recurring)
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Gift certificate specific
    gift_code VARCHAR(50),
    gift_recipient_email VARCHAR(255),
    gift_message TEXT,
    gift_redeemed_at TIMESTAMPTZ,
    gift_redeemed_by UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Additional data
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for client_purchases
CREATE INDEX idx_client_purchases_studio_id ON client_purchases(studio_id);
CREATE INDEX idx_client_purchases_client_id ON client_purchases(client_id);
CREATE INDEX idx_client_purchases_product_id ON client_purchases(product_id);
CREATE INDEX idx_client_purchases_status ON client_purchases(studio_id, status);
CREATE INDEX idx_client_purchases_active ON client_purchases(client_id, status) WHERE status = 'active';
CREATE INDEX idx_client_purchases_expires ON client_purchases(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_client_purchases_stripe_sub ON client_purchases(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX idx_client_purchases_gift_code ON client_purchases(studio_id, gift_code) WHERE gift_code IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER client_purchases_updated_at
    BEFORE UPDATE ON client_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WALLET TRANSACTIONS TABLE
-- Audit log of all wallet credit changes
-- ============================================================================

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES client_wallets(id) ON DELETE CASCADE,

    -- Related entities
    purchase_id UUID REFERENCES client_purchases(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Transaction details
    type wallet_transaction_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL, -- Positive for credit, negative for debit
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,

    -- Expiry tracking (for FIFO expiration)
    expires_at TIMESTAMPTZ,

    -- Audit
    created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,

    -- Additional data
    metadata JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT valid_balance_change CHECK (
        balance_after = balance_before + amount
    )
);

-- Indexes for wallet_transactions
CREATE INDEX idx_wallet_transactions_studio_id ON wallet_transactions(studio_id);
CREATE INDEX idx_wallet_transactions_client_id ON wallet_transactions(client_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(studio_id, type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_purchase ON wallet_transactions(purchase_id) WHERE purchase_id IS NOT NULL;
CREATE INDEX idx_wallet_transactions_booking ON wallet_transactions(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_wallet_transactions_expiring ON wallet_transactions(expires_at) WHERE expires_at IS NOT NULL AND type = 'credit';

-- ============================================================================
-- CHAT CONVERSATIONS TABLE
-- Stores chat sessions between visitors/clients and AI/humans
-- ============================================================================

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

    -- Visitor/Client identity
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Set if visitor is identified as client
    visitor_id VARCHAR(100) NOT NULL, -- Anonymous session ID
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    visitor_phone VARCHAR(50),

    -- Status
    status chat_status NOT NULL DEFAULT 'active',
    assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,

    -- Message tracking
    last_message_at TIMESTAMPTZ,
    last_message_preview VARCHAR(255),
    unread_count INTEGER NOT NULL DEFAULT 0,

    -- AI context
    ai_context JSONB NOT NULL DEFAULT '{}', -- Stores conversation context for AI

    -- Organization
    tags TEXT[] NOT NULL DEFAULT '{}',

    -- Feedback
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    rating_feedback TEXT,

    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES team_members(id) ON DELETE SET NULL,

    -- Additional data
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for chat_conversations
CREATE INDEX idx_chat_conversations_studio_id ON chat_conversations(studio_id);
CREATE INDEX idx_chat_conversations_client_id ON chat_conversations(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_chat_conversations_visitor ON chat_conversations(studio_id, visitor_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(studio_id, status);
CREATE INDEX idx_chat_conversations_assigned ON chat_conversations(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_chat_conversations_unread ON chat_conversations(studio_id, unread_count) WHERE unread_count > 0;
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(studio_id, last_message_at DESC);
CREATE INDEX idx_chat_conversations_email ON chat_conversations(studio_id, visitor_email) WHERE visitor_email IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CHAT MESSAGES TABLE
-- Individual messages within conversations
-- ============================================================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,

    -- Sender
    sender_type chat_sender_type NOT NULL,
    sender_id UUID, -- team_member_id if human, NULL if visitor/AI

    -- Content
    content_type chat_content_type NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    content_data JSONB, -- Additional structured data (e.g., booking card details)

    -- Visibility
    is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal notes between team members

    -- Read tracking
    read_at TIMESTAMPTZ,

    -- Additional data
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for chat_messages
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_type, sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX idx_chat_messages_unread ON chat_messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- WIDGET CONFIGS TABLE
-- Configuration for embeddable widgets (booking, chat, packs)
-- ============================================================================

CREATE TABLE widget_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

    -- Widget identity
    type widget_type NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Security
    allowed_domains TEXT[] NOT NULL DEFAULT '{}', -- Empty array means all domains allowed

    -- Appearance
    theme JSONB NOT NULL DEFAULT '{
        "primaryColor": "#000000",
        "backgroundColor": "#ffffff",
        "borderRadius": 8,
        "fontFamily": "Inter, system-ui, sans-serif"
    }',

    -- Position
    position JSONB NOT NULL DEFAULT '{
        "type": "floating",
        "side": "right",
        "offset": { "x": 20, "y": 20 }
    }',

    -- Behavior
    behavior JSONB NOT NULL DEFAULT '{
        "autoOpen": false,
        "showOnMobile": true,
        "greetingDelay": 3000
    }',

    -- Content customization
    content JSONB NOT NULL DEFAULT '{
        "title": "Chat with us",
        "subtitle": "We typically reply within minutes",
        "placeholder": "Type a message..."
    }',

    -- Analytics
    analytics_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Generated embed code (cached)
    embed_code TEXT,

    -- Unique constraint: one widget per type per studio
    CONSTRAINT unique_widget_per_studio UNIQUE (studio_id, type)
);

-- Indexes for widget_configs
CREATE INDEX idx_widget_configs_studio_id ON widget_configs(studio_id);
CREATE INDEX idx_widget_configs_type ON widget_configs(studio_id, type);
CREATE INDEX idx_widget_configs_active ON widget_configs(studio_id, is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER widget_configs_updated_at
    BEFORE UPDATE ON widget_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE pricing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

-- Pricing Products Policies
CREATE POLICY "pricing_products_studio_access" ON pricing_products
    FOR ALL USING (
        studio_id IN (
            SELECT studio_id FROM team_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "pricing_products_public_read" ON pricing_products
    FOR SELECT USING (is_active = true);

-- Client Wallets Policies
CREATE POLICY "client_wallets_studio_access" ON client_wallets
    FOR ALL USING (
        studio_id IN (
            SELECT studio_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Client Purchases Policies
CREATE POLICY "client_purchases_studio_access" ON client_purchases
    FOR ALL USING (
        studio_id IN (
            SELECT studio_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Wallet Transactions Policies
CREATE POLICY "wallet_transactions_studio_access" ON wallet_transactions
    FOR ALL USING (
        studio_id IN (
            SELECT studio_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Chat Conversations Policies
CREATE POLICY "chat_conversations_studio_access" ON chat_conversations
    FOR ALL USING (
        studio_id IN (
            SELECT studio_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Chat Messages Policies
CREATE POLICY "chat_messages_conversation_access" ON chat_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM chat_conversations WHERE studio_id IN (
                SELECT studio_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

-- Widget Configs Policies
CREATE POLICY "widget_configs_studio_access" ON widget_configs
    FOR ALL USING (
        studio_id IN (
            SELECT studio_id FROM team_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "widget_configs_public_read" ON widget_configs
    FOR SELECT USING (is_active = true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create client wallet
CREATE OR REPLACE FUNCTION get_or_create_client_wallet(
    p_studio_id UUID,
    p_client_id UUID,
    p_credits_type VARCHAR(50) DEFAULT 'hours'
) RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    SELECT id INTO v_wallet_id
    FROM client_wallets
    WHERE client_id = p_client_id AND credits_type = p_credits_type;

    IF v_wallet_id IS NULL THEN
        INSERT INTO client_wallets (studio_id, client_id, credits_type)
        VALUES (p_studio_id, p_client_id, p_credits_type)
        RETURNING id INTO v_wallet_id;
    END IF;

    RETURN v_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to wallet (with transaction logging)
CREATE OR REPLACE FUNCTION add_wallet_credits(
    p_studio_id UUID,
    p_client_id UUID,
    p_amount DECIMAL(10, 2),
    p_credits_type VARCHAR(50),
    p_purchase_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL(10, 2);
    v_transaction_id UUID;
BEGIN
    -- Get or create wallet
    v_wallet_id := get_or_create_client_wallet(p_studio_id, p_client_id, p_credits_type);

    -- Get current balance
    SELECT credits_balance INTO v_balance_before
    FROM client_wallets
    WHERE id = v_wallet_id
    FOR UPDATE;

    -- Update wallet
    UPDATE client_wallets
    SET
        credits_balance = credits_balance + p_amount,
        total_credits_purchased = total_credits_purchased + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Create transaction
    INSERT INTO wallet_transactions (
        studio_id, client_id, wallet_id, purchase_id,
        type, amount, balance_before, balance_after,
        description, expires_at, created_by
    ) VALUES (
        p_studio_id, p_client_id, v_wallet_id, p_purchase_id,
        'credit', p_amount, v_balance_before, v_balance_before + p_amount,
        p_description, p_expires_at, p_created_by
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to debit credits from wallet (with transaction logging)
CREATE OR REPLACE FUNCTION debit_wallet_credits(
    p_studio_id UUID,
    p_client_id UUID,
    p_amount DECIMAL(10, 2),
    p_credits_type VARCHAR(50),
    p_booking_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL(10, 2);
    v_transaction_id UUID;
BEGIN
    -- Get wallet
    SELECT id, credits_balance INTO v_wallet_id, v_balance_before
    FROM client_wallets
    WHERE client_id = p_client_id AND credits_type = p_credits_type
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for client % with credits type %', p_client_id, p_credits_type;
    END IF;

    IF v_balance_before < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_balance_before, p_amount;
    END IF;

    -- Update wallet
    UPDATE client_wallets
    SET
        credits_balance = credits_balance - p_amount,
        total_credits_used = total_credits_used + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Create transaction
    INSERT INTO wallet_transactions (
        studio_id, client_id, wallet_id, booking_id,
        type, amount, balance_before, balance_after,
        description, created_by
    ) VALUES (
        p_studio_id, p_client_id, v_wallet_id, p_booking_id,
        'debit', -p_amount, v_balance_before, v_balance_before - p_amount,
        p_description, p_created_by
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 255),
        unread_count = CASE
            WHEN NEW.sender_type = 'visitor' THEN unread_count + 1
            ELSE unread_count
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_update_conversation
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE pricing_products IS 'Stores all purchasable products: packs, subscriptions, and gift certificates';
COMMENT ON TABLE client_wallets IS 'Credit balances for clients, one wallet per client per credit type';
COMMENT ON TABLE client_purchases IS 'Purchase records linking clients to products they have bought';
COMMENT ON TABLE wallet_transactions IS 'Audit log of all credit movements in client wallets';
COMMENT ON TABLE chat_conversations IS 'Chat sessions between visitors/clients and AI/human operators';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat conversations';
COMMENT ON TABLE widget_configs IS 'Configuration for embeddable widgets on external websites';

COMMENT ON COLUMN pricing_products.credits_type IS 'Type of credits: hours, sessions, or dollars (for gift certificates)';
COMMENT ON COLUMN pricing_products.valid_spaces IS 'Array of space UUIDs this product can be used for. NULL means all spaces';
COMMENT ON COLUMN pricing_products.valid_time_slots IS 'JSON object defining time restrictions for using this product';
COMMENT ON COLUMN client_purchases.gift_code IS 'Unique redemption code for gift certificates';
COMMENT ON COLUMN chat_conversations.visitor_id IS 'Anonymous session identifier for tracking visitors across messages';
COMMENT ON COLUMN chat_conversations.ai_context IS 'JSON object storing conversation context for AI continuity';
COMMENT ON COLUMN chat_messages.content_data IS 'Structured data for rich content types like booking cards';
COMMENT ON COLUMN widget_configs.allowed_domains IS 'Domains where this widget can be embedded. Empty array allows all domains';
