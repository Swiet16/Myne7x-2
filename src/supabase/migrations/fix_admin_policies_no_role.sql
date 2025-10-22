-- Fix Admin Policies Without Role Column
-- This migration creates admin policies that work purely based on email patterns
-- No role column is required or referenced

-- Create a simple admin check function based only on email patterns
CREATE OR REPLACE FUNCTION is_admin_user_simple(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get user email from auth.users first, then profiles as fallback
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    -- If not found in auth.users, try profiles table
    IF user_email IS NULL THEN
        SELECT email INTO user_email FROM profiles WHERE user_id = user_id;
    END IF;
    
    -- Check if user is admin based on email patterns only
    IF user_email IS NOT NULL THEN
        -- Check by specific admin emails or patterns
        IF user_email IN ('admin@myne7x.com', 'admin@example.com', 'admin@admin.com')
           OR user_email LIKE '%@admin.%'
           OR user_email LIKE 'admin@%'
           OR user_email LIKE '%admin%@%' THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing admin policies that might reference role column
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can update all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can view all contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can update contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can delete contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can manage website images" ON website_images;
DROP POLICY IF EXISTS "Admins can insert website images" ON website_images;
DROP POLICY IF EXISTS "Admins can update website images" ON website_images;
DROP POLICY IF EXISTS "Admins can delete website images" ON website_images;
DROP POLICY IF EXISTS "Admins can manage contact details" ON contact_details;
DROP POLICY IF EXISTS "Admins can update contact details" ON contact_details;

-- Create new admin policies using the simple email-based function

-- Refund Requests Policies
CREATE POLICY "Admins can view all refund requests" ON refund_requests
    FOR SELECT USING (is_admin_user_simple());

CREATE POLICY "Admins can update all refund requests" ON refund_requests
    FOR UPDATE USING (is_admin_user_simple());

-- Contact Requests Policies
CREATE POLICY "Admins can view all contact requests" ON contact_requests
    FOR SELECT USING (is_admin_user_simple());

CREATE POLICY "Admins can update contact requests" ON contact_requests
    FOR UPDATE USING (is_admin_user_simple());

CREATE POLICY "Admins can delete contact requests" ON contact_requests
    FOR DELETE USING (is_admin_user_simple());

-- Payment Requests Policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_requests') THEN
        EXECUTE 'CREATE POLICY "Admins can view all payment requests" ON payment_requests FOR SELECT USING (is_admin_user_simple())';
        EXECUTE 'CREATE POLICY "Admins can update payment requests" ON payment_requests FOR UPDATE USING (is_admin_user_simple())';
    END IF;
END $$;

-- Products Policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        EXECUTE 'CREATE POLICY "Admins can insert products" ON products FOR INSERT WITH CHECK (is_admin_user_simple())';
        EXECUTE 'CREATE POLICY "Admins can update products" ON products FOR UPDATE USING (is_admin_user_simple())';
        EXECUTE 'CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (is_admin_user_simple())';
    END IF;
END $$;

-- Website Images Policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_images') THEN
        EXECUTE 'CREATE POLICY "Admins can insert website images" ON website_images FOR INSERT WITH CHECK (is_admin_user_simple())';
        EXECUTE 'CREATE POLICY "Admins can update website images" ON website_images FOR UPDATE USING (is_admin_user_simple())';
        EXECUTE 'CREATE POLICY "Admins can delete website images" ON website_images FOR DELETE USING (is_admin_user_simple())';
    END IF;
END $$;

-- Contact Details Policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_details') THEN
        EXECUTE 'CREATE POLICY "Admins can update contact details" ON contact_details FOR UPDATE USING (is_admin_user_simple())';
    END IF;
END $$;

-- Grant execute permission on the admin check function
GRANT EXECUTE ON FUNCTION is_admin_user_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user_simple(UUID) TO anon;

-- Create a view to check admin status for current user (without role column)
CREATE OR REPLACE VIEW current_user_admin_status_simple AS
SELECT 
    auth.uid() as user_id,
    is_admin_user_simple() as is_admin,
    COALESCE(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM profiles WHERE user_id = auth.uid())
    ) as email;

GRANT SELECT ON current_user_admin_status_simple TO authenticated;

-- Create a function to test admin access (useful for debugging)
CREATE OR REPLACE FUNCTION test_admin_access()
RETURNS TABLE(
    current_user_id UUID,
    current_email TEXT,
    is_admin BOOLEAN,
    message TEXT
) AS $$
DECLARE
    user_id UUID;
    user_email TEXT;
    admin_status BOOLEAN;
BEGIN
    user_id := auth.uid();
    
    -- Get email from auth.users first
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    -- If not found, try profiles
    IF user_email IS NULL THEN
        SELECT email INTO user_email FROM profiles WHERE profiles.user_id = user_id;
    END IF;
    
    admin_status := is_admin_user_simple(user_id);
    
    RETURN QUERY SELECT 
        user_id,
        user_email,
        admin_status,
        CASE 
            WHEN admin_status THEN 'User has admin access'
            ELSE 'User does not have admin access'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_admin_access() TO authenticated;

-- Add some helpful comments
COMMENT ON FUNCTION is_admin_user_simple(UUID) IS 'Simple admin check based only on email patterns, no role column required';
COMMENT ON VIEW current_user_admin_status_simple IS 'Shows admin status for current user without requiring role column';
COMMENT ON FUNCTION test_admin_access() IS 'Test function to debug admin access for current user';

-- Insert a test admin user in profiles if it doesn't exist (optional)
DO $$
BEGIN
    -- Only insert if profiles table exists and doesn't have this admin
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@myne7x.com') THEN
            INSERT INTO profiles (user_id, email, full_name)
            VALUES (
                gen_random_uuid(),
                'admin@myne7x.com',
                'System Administrator'
            );
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If there's any error (like constraints), just continue
    NULL;
END $$;

-- Final verification: List all admin emails that would have access
CREATE OR REPLACE FUNCTION list_admin_emails()
RETURNS TABLE(email TEXT, source TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(au.email, p.email) as email,
        CASE 
            WHEN au.email IS NOT NULL THEN 'auth.users'
            ELSE 'profiles'
        END as source
    FROM auth.users au
    FULL OUTER JOIN profiles p ON au.id = p.user_id
    WHERE COALESCE(au.email, p.email) IS NOT NULL
    AND (
        COALESCE(au.email, p.email) IN ('admin@myne7x.com', 'admin@example.com', 'admin@admin.com')
        OR COALESCE(au.email, p.email) LIKE '%@admin.%'
        OR COALESCE(au.email, p.email) LIKE 'admin@%'
        OR COALESCE(au.email, p.email) LIKE '%admin%@%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION list_admin_emails() TO authenticated;
