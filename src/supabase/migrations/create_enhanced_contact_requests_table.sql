-- Enhanced Contact Requests Table
-- This migration creates a comprehensive contact requests system

-- Create contact_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN ('general', 'support', 'sales', 'technical', 'billing', 'feedback')),
    admin_notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_priority ON contact_requests(priority);
CREATE INDEX IF NOT EXISTS idx_contact_requests_category ON contact_requests(category);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_assigned_to ON contact_requests(assigned_to);

-- Create view for contact requests with enhanced display
CREATE OR REPLACE VIEW contact_requests_with_details AS
SELECT 
    cr.*,
    CASE 
        WHEN cr.status = 'new' THEN '🆕 New'
        WHEN cr.status = 'in_progress' THEN '⏳ In Progress'
        WHEN cr.status = 'resolved' THEN '✅ Resolved'
        WHEN cr.status = 'closed' THEN '🔒 Closed'
        ELSE cr.status
    END as status_display,
    CASE 
        WHEN cr.priority = 'low' THEN '🟢 Low'
        WHEN cr.priority = 'medium' THEN '🟡 Medium'
        WHEN cr.priority = 'high' THEN '🟠 High'
        WHEN cr.priority = 'urgent' THEN '🔴 Urgent'
        ELSE cr.priority
    END as priority_display,
    CASE 
        WHEN cr.category = 'general' THEN '💬 General'
        WHEN cr.category = 'support' THEN '🛠️ Support'
        WHEN cr.category = 'sales' THEN '💰 Sales'
        WHEN cr.category = 'technical' THEN '⚙️ Technical'
        WHEN cr.category = 'billing' THEN '💳 Billing'
        WHEN cr.category = 'feedback' THEN '📝 Feedback'
        ELSE cr.category
    END as category_display,
    COALESCE(assigned_prof.full_name, assigned_prof.email) as assigned_to_name,
    EXTRACT(EPOCH FROM (NOW() - cr.created_at))/3600 as hours_since_created,
    CASE 
        WHEN cr.created_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
        WHEN cr.created_at > NOW() - INTERVAL '24 hours' THEN EXTRACT(HOUR FROM (NOW() - cr.created_at)) || ' hours ago'
        WHEN cr.created_at > NOW() - INTERVAL '7 days' THEN EXTRACT(DAY FROM (NOW() - cr.created_at)) || ' days ago'
        ELSE TO_CHAR(cr.created_at, 'Mon DD, YYYY')
    END as time_ago
FROM contact_requests cr
LEFT JOIN profiles assigned_prof ON cr.assigned_to = assigned_prof.user_id
ORDER BY 
    CASE cr.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    cr.created_at DESC;

-- Create function to update contact request status
CREATE OR REPLACE FUNCTION update_contact_status(
    request_id UUID,
    new_status VARCHAR(20),
    admin_notes_text TEXT DEFAULT NULL,
    admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the request details
    SELECT * INTO request_record
    FROM contact_requests
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact request not found';
    END IF;
    
    -- Update the request
    UPDATE contact_requests 
    SET 
        status = new_status,
        admin_notes = COALESCE(admin_notes_text, admin_notes),
        assigned_to = COALESCE(admin_user_id, assigned_to),
        resolved_at = CASE WHEN new_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
    WHERE id = request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign contact request to admin
CREATE OR REPLACE FUNCTION assign_contact_request(
    request_id UUID,
    admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE contact_requests 
    SET 
        assigned_to = admin_user_id,
        status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END,
        updated_at = NOW()
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact request not found';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get contact request statistics
CREATE OR REPLACE FUNCTION get_contact_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'new_requests', COUNT(*) FILTER (WHERE status = 'new'),
        'in_progress_requests', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'resolved_requests', COUNT(*) FILTER (WHERE status = 'resolved'),
        'closed_requests', COUNT(*) FILTER (WHERE status = 'closed'),
        'urgent_requests', COUNT(*) FILTER (WHERE priority = 'urgent'),
        'high_priority_requests', COUNT(*) FILTER (WHERE priority = 'high'),
        'avg_response_time_hours', 
            COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) 
            FILTER (WHERE resolved_at IS NOT NULL), 0),
        'requests_today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'requests_this_week', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'requests_this_month', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')
    ) INTO stats
    FROM contact_requests;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on contact_requests table
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact requests
-- Allow anyone to insert contact requests (for public contact form)
CREATE POLICY "Anyone can create contact requests" ON contact_requests
    FOR INSERT WITH CHECK (true);

-- Admin policies will be created in fix_admin_policies_no_role.sql migration
-- This ensures no role column dependencies

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_requests_updated_at();

-- Create trigger to automatically categorize requests based on subject/message
CREATE OR REPLACE FUNCTION auto_categorize_contact_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-categorize based on keywords in subject or message
    IF NEW.category = 'general' THEN
        IF LOWER(NEW.subject || ' ' || NEW.message) ~ 'payment|billing|invoice|refund|charge' THEN
            NEW.category := 'billing';
        ELSIF LOWER(NEW.subject || ' ' || NEW.message) ~ 'bug|error|not working|broken|technical|issue' THEN
            NEW.category := 'technical';
        ELSIF LOWER(NEW.subject || ' ' || NEW.message) ~ 'help|support|how to|question' THEN
            NEW.category := 'support';
        ELSIF LOWER(NEW.subject || ' ' || NEW.message) ~ 'buy|purchase|price|cost|sale' THEN
            NEW.category := 'sales';
        ELSIF LOWER(NEW.subject || ' ' || NEW.message) ~ 'feedback|suggestion|improve|feature' THEN
            NEW.category := 'feedback';
        END IF;
    END IF;
    
    -- Auto-set priority based on keywords
    IF NEW.priority = 'medium' THEN
        IF LOWER(NEW.subject || ' ' || NEW.message) ~ 'urgent|asap|immediately|emergency|critical' THEN
            NEW.priority := 'urgent';
        ELSIF LOWER(NEW.subject || ' ' || NEW.message) ~ 'important|high|priority|soon' THEN
            NEW.priority := 'high';
        ELSIF LOWER(NEW.subject || ' ' || NEW.message) ~ 'low|minor|whenever|no rush' THEN
            NEW.priority := 'low';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS auto_categorize_contact_request ON contact_requests;
CREATE TRIGGER auto_categorize_contact_request
    BEFORE INSERT ON contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_categorize_contact_request();

-- Insert sample data for testing (optional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM contact_requests LIMIT 1) THEN
        INSERT INTO contact_requests (name, email, subject, message, category, priority)
        VALUES 
            ('John Doe', 'john@example.com', 'Question about your products', 'I would like to know more about your digital products and pricing.', 'sales', 'medium'),
            ('Jane Smith', 'jane@example.com', 'Technical issue with download', 'I am having trouble downloading my purchased product. Please help.', 'technical', 'high'),
            ('Bob Wilson', 'bob@example.com', 'Great service!', 'Just wanted to say thank you for the excellent customer service.', 'feedback', 'low');
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_requests TO authenticated;
GRANT SELECT ON contact_requests_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION update_contact_status(UUID, VARCHAR, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_contact_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contact_stats() TO authenticated;

-- Allow anonymous users to insert contact requests (for public contact form)
GRANT INSERT ON contact_requests TO anon;

COMMENT ON TABLE contact_requests IS 'Stores customer contact requests and inquiries';
COMMENT ON VIEW contact_requests_with_details IS 'Enhanced view of contact requests with formatted display fields';
COMMENT ON FUNCTION update_contact_status(UUID, VARCHAR, TEXT, UUID) IS 'Updates contact request status and admin notes';
COMMENT ON FUNCTION assign_contact_request(UUID, UUID) IS 'Assigns contact request to an admin user';
COMMENT ON FUNCTION get_contact_stats() IS 'Returns comprehensive statistics about contact requests';
