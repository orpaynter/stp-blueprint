CREATE TABLE chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    visitor_id TEXT,
    current_step TEXT DEFAULT 'greeting',
    conversation_data JSONB DEFAULT '{}',
    lead_data JSONB DEFAULT '{}',
    qualification_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT NOW()
);