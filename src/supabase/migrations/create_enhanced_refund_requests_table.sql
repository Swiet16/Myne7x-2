-- Enhanced Refund Requests Table
-- This migration creates a comprehensive refund requests system with purchase status tracking

-- Create refund_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    additional_info TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_product_id ON refund_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

-- Create function to check if user has purchased the product
CREATE OR REPLACE FUNCTION check_user_purchase_status(user_uuid UUID, product_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    has_access BOOLEAN := FALSE;
    payment_approved BOOLEAN := FALSE;
    purchase_date TIMESTAMP WITH TIME ZONE;
    purchase_method VARCHAR(50) := 'unknown';
BEGIN
    -- Check if user has direct access to the product
    SELECT EXISTS(
        SELECT 1 FROM user_product_access 
        WHERE user_id = user_uuid AND product_id = product_uuid
    ) INTO has_access;
    
    -- Check if user has approved payment request for this product
    SELECT EXISTS(
        SELECT 1 FROM payment_requests 
        WHERE user_id = user_uuid 
        AND product_id = product_uuid 
        AND status = 'approved'
    ), 
    MIN(created_at),
    COALESCE(MIN(payment_method), 'unknown')
    FROM payment_requests 
    WHERE user_id = user_uuid 
    AND product_id = product_uuid 
    AND status = 'approved'
    INTO payment_approved, purchase_date, purchase_method;
    
    -- If no payment found, check access table for date
    IF purchase_date IS NULL AND has_access THEN
        SELECT MIN(created_at) INTO purchase_date
        FROM user_product_access 
        WHERE user_id = user_uuid AND product_id = product_uuid;
        purchase_method := 'direct_access';
    END IF;
    
    RETURN jsonb_build_object(
        'has_purchased', (has_access OR payment_approved),
        'has_access', has_access,
        'payment_approved', payment_approved,
        'purchase_date', purchase_date,
        'purchase_method', purchase_method
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for refund requests with purchase status
CREATE OR REPLACE VIEW refund_requests_with_status AS
SELECT 
    rr.*,
    p.title as product_title,
    p.price as product_price,
    p.price_pkr as product_price_pkr,
    prof.full_name as user_name,
    prof.email as user_email,
    check_user_purchase_status(rr.user_id, rr.product_id) as purchase_status,
    CASE 
        WHEN rr.status = 'pending' THEN '⏳ Pending Review'
        WHEN rr.status = 'approved' THEN '✅ Approved'
        WHEN rr.status = 'rejected' THEN '❌ Rejected'
        ELSE rr.status
    END as status_display
FROM refund_requests rr
LEFT JOIN products p ON rr.product_id = p.id
LEFT JOIN profiles prof ON rr.user_id = prof.user_id
ORDER BY rr.created_at DESC;

-- Create function to update refund request status
CREATE OR REPLACE FUNCTION update_refund_status(
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
    FROM refund_requests_with_status
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Refund request not found';
    END IF;
    
    -- Update the request
    UPDATE refund_requests 
    SET 
        status = new_status,
        admin_notes = COALESCE(admin_notes_text, admin_notes),
        processed_by = admin_user_id,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Create notification for the user
    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
    VALUES (
        request_record.user_id,
        CASE 
            WHEN new_status = 'approved' THEN 'Refund Request Approved ✅'
            WHEN new_status = 'rejected' THEN 'Refund Request Rejected ❌'
            ELSE 'Refund Request Updated'
        END,
        CASE 
            WHEN new_status = 'approved' THEN 
                format('Your refund request for "%s" (Product ID: %s) has been approved. We will process your refund shortly.', 
                       request_record.product_title, request_record.product_id)
            WHEN new_status = 'rejected' THEN 
                format('Your refund request for "%s" has been rejected. %s', 
                       request_record.product_title, 
                       COALESCE('Reason: ' || admin_notes_text, 'Please contact support for more information.'))
            ELSE 
                format('Your refund request for "%s" has been updated to %s.', 
                       request_record.product_title, new_status)
        END,
        'refund_update',
        FALSE,
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on refund_requests table
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own refund requests" ON refund_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refund requests" ON refund_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending refund requests" ON refund_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admin policies will be created in fix_admin_policies_no_role.sql migration
-- This ensures no role column dependencies

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_requests_updated_at();

-- Insert sample data for testing (optional)
-- This will only run if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM refund_requests LIMIT 1) THEN
        -- Note: Replace with actual user and product IDs from your system
        INSERT INTO refund_requests (user_id, product_id, reason, contact_email, status)
        SELECT 
            u.id,
            p.id,
            'Sample refund request for testing purposes',
            'user@example.com',
            'pending'
        FROM auth.users u
        CROSS JOIN products p
        WHERE u.email = 'admin@example.com' -- Replace with actual admin email
        AND p.is_active = true
        LIMIT 1;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON refund_requests TO authenticated;
GRANT SELECT ON refund_requests_with_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_purchase_status(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_refund_status(UUID, VARCHAR, TEXT, UUID) TO authenticated;

COMMENT ON TABLE refund_requests IS 'Stores customer refund requests with purchase status tracking';
COMMENT ON FUNCTION check_user_purchase_status(UUID, UUID) IS 'Checks if a user has purchased a specific product';
COMMENT ON VIEW refund_requests_with_status IS 'Enhanced view of refund requests with purchase status and user details';
COMMENT ON FUNCTION update_refund_status(UUID, VARCHAR, TEXT, UUID) IS 'Updates refund request status and sends notifications';
