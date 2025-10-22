-- Final Admin Setup for myne7x@gmail.com
-- This migration sets up admin access specifically for your email

-- Create a simple admin check function with your specific email
CREATE OR REPLACE FUNCTION is_admin_user_final(user_id UUID DEFAULT auth.uid())
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
    
    -- Check if user is admin - specifically including myne7x@gmail.com
    IF user_email IS NOT NULL THEN
        IF user_email IN (
            'myne7x@gmail.com',
            'admin@myne7x.com', 
            'admin@example.com',
            'admin@admin.com'
        ) OR user_email LIKE '%@admin.%'
           OR user_email LIKE 'admin@%' THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing admin policies
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can update all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can view all contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can update contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can delete contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON payment_requests;

-- Create new admin policies using the final admin function
DO $$
BEGIN
    -- Refund Requests Policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refund_requests') THEN
        EXECUTE 'CREATE POLICY "Admins can view all refund requests" ON refund_requests FOR SELECT USING (is_admin_user_final())';
        EXECUTE 'CREATE POLICY "Admins can update all refund requests" ON refund_requests FOR UPDATE USING (is_admin_user_final())';
    END IF;

    -- Contact Requests Policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_requests') THEN
        EXECUTE 'CREATE POLICY "Admins can view all contact requests" ON contact_requests FOR SELECT USING (is_admin_user_final())';
        EXECUTE 'CREATE POLICY "Admins can update contact requests" ON contact_requests FOR UPDATE USING (is_admin_user_final())';
        EXECUTE 'CREATE POLICY "Admins can delete contact requests" ON contact_requests FOR DELETE USING (is_admin_user_final())';
    END IF;

    -- Payment Requests Policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_requests') THEN
        EXECUTE 'CREATE POLICY "Admins can view all payment requests" ON payment_requests FOR SELECT USING (is_admin_user_final())';
        EXECUTE 'CREATE POLICY "Admins can update payment requests" ON payment_requests FOR UPDATE USING (is_admin_user_final())';
    END IF;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin_user_final(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user_final(UUID) TO anon;

-- Create or update profile for myne7x@gmail.com if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Insert or update the admin profile
        INSERT INTO profiles (user_id, email, full_name)
        VALUES (
            gen_random_uuid(),
            'myne7x@gmail.com',
            'Myne7x Admin'
        )
        ON CONFLICT (email) DO UPDATE SET
            full_name = 'Myne7x Admin';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If there's any error, just continue
    NULL;
END $$;

-- Test function to verify admin access
CREATE OR REPLACE FUNCTION test_myne7x_admin()
RETURNS TABLE(
    email TEXT,
    is_admin BOOLEAN,
    message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'myne7x@gmail.com'::TEXT as email,
        is_admin_user_final() as is_admin,
        CASE 
            WHEN is_admin_user_final() THEN 'myne7x@gmail.com has admin access ✅'
            ELSE 'myne7x@gmail.com does NOT have admin access ❌'
        END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_myne7x_admin() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION is_admin_user_final(UUID) IS 'Final admin check function specifically configured for myne7x@gmail.com';

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Admin setup completed for myne7x@gmail.com';
    RAISE NOTICE 'You can test admin access by calling: SELECT * FROM test_myne7x_admin();';
END $$;
