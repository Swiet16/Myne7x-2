-- Fix All Triggers and Conflicts
-- This migration ensures all triggers are properly created without conflicts

-- Drop all existing triggers that might conflict
DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON refund_requests;
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
DROP TRIGGER IF EXISTS auto_categorize_contact_request ON contact_requests;

-- Drop and recreate functions to ensure they're up to date
DROP FUNCTION IF EXISTS update_refund_requests_updated_at();
DROP FUNCTION IF EXISTS update_contact_requests_updated_at();
DROP FUNCTION IF EXISTS auto_categorize_contact_request();

-- Recreate the updated_at trigger function for refund_requests
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the updated_at trigger function for contact_requests
CREATE OR REPLACE FUNCTION update_contact_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the auto-categorize function for contact_requests
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

-- Create triggers only if the tables exist
DO $$
BEGIN
    -- Create refund_requests updated_at trigger if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refund_requests') THEN
        CREATE TRIGGER update_refund_requests_updated_at
            BEFORE UPDATE ON refund_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_refund_requests_updated_at();
    END IF;
    
    -- Create contact_requests updated_at trigger if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_requests') THEN
        CREATE TRIGGER update_contact_requests_updated_at
            BEFORE UPDATE ON contact_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_contact_requests_updated_at();
            
        -- Create auto-categorize trigger for contact_requests
        CREATE TRIGGER auto_categorize_contact_request
            BEFORE INSERT ON contact_requests
            FOR EACH ROW
            EXECUTE FUNCTION auto_categorize_contact_request();
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_refund_requests_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION update_contact_requests_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_categorize_contact_request() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION update_refund_requests_updated_at() IS 'Updates the updated_at timestamp for refund_requests table';
COMMENT ON FUNCTION update_contact_requests_updated_at() IS 'Updates the updated_at timestamp for contact_requests table';
COMMENT ON FUNCTION auto_categorize_contact_request() IS 'Automatically categorizes and prioritizes contact requests based on content';

-- Verify triggers were created successfully
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    -- Check refund_requests triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'refund_requests' 
    AND trigger_name = 'update_refund_requests_updated_at';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'Refund requests updated_at trigger created successfully';
    END IF;
    
    -- Check contact_requests triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'contact_requests' 
    AND trigger_name = 'update_contact_requests_updated_at';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'Contact requests updated_at trigger created successfully';
    END IF;
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'contact_requests' 
    AND trigger_name = 'auto_categorize_contact_request';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE 'Contact requests auto-categorize trigger created successfully';
    END IF;
END $$;
