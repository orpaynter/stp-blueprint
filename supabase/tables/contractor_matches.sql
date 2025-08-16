CREATE TABLE contractor_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    contractor_data JSONB NOT NULL,
    match_score INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    notified_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);