-- Create ENUM type for switch status
CREATE TYPE switch_status AS ENUM ('active', 'triggered');

-- Create switches table for EAGLE CLAW system
CREATE TABLE switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    threshold INT NOT NULL,
    encrypted_data TEXT NOT NULL,
    recipient_wallet TEXT NOT NULL,
    status switch_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for efficient cron job scanning
CREATE INDEX idx_switches_status_heartbeat ON switches (status, last_heartbeat)
WHERE status = 'active';

-- Create index for user wallet lookups
CREATE INDEX idx_switches_user_wallet ON switches (user_wallet);
