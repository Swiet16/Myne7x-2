-- Ensure Admin Policies for Refund Requests
-- Run this migration to make sure admin users can see all refund requests

-- Drop existing admin policies for refund_requests FIRST (before dropping the function)
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can update all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can delete refund requests" ON refund_requests;

-- NOW drop existing functions (to allow parameter renaming)
DROP FUNCTION IF EXISTS is_admin_user_simple(UUID);
DROP FUNCTION IF EXISTS check_my_admin_status();

-- First, ensure the admin check function exists (FIXED: renamed parameter to avoid ambiguity)
CREATE OR REPLACE FUNCTION is_admin_user_simple(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- Get user email from auth.users first, then profiles as fallback
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    
    -- If not found in auth.users, try profiles table
    IF v_user_email IS NULL THEN
        SELECT p.email INTO v_user_email FROM profiles p WHERE p.user_id = p_user_id;
    END IF;
    
    -- Check if user is admin based on email patterns only
    IF v_user_email IS NOT NULL THEN
        -- Check by specific admin emails or patterns (NOW INCLUDES myne7@gmail.com)
        IF v_user_email IN ('admin@myne7x.com', 'myne7x@gmail.com', 'myne7@gmail.com', 'admin@example.com', 'admin@admin.com')
           OR v_user_email LIKE '%@admin.%'
           OR v_user_email LIKE 'admin@%'
           OR v_user_email LIKE '%admin%@%'
           OR v_user_email LIKE 'myne7x%'
           OR v_user_email LIKE 'myne7@%' THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policies for refund_requests
CREATE POLICY "Admins can view all refund requests" ON refund_requests
    FOR SELECT USING (is_admin_user_simple());

CREATE POLICY "Admins can update all refund requests" ON refund_requests
    FOR UPDATE USING (is_admin_user_simple());

CREATE POLICY "Admins can delete refund requests" ON refund_requests
    FOR DELETE USING (is_admin_user_simple());

-- Grant execute permission on the admin check function
GRANT EXECUTE ON FUNCTION is_admin_user_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user_simple(UUID) TO anon;

-- Create a helper function to test if current user is admin (FIXED: variable naming conflict)
CREATE OR REPLACE FUNCTION check_my_admin_status()
RETURNS TABLE(
    my_user_id UUID,
    my_email TEXT,
    is_admin BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_admin_status BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    -- Get email from auth.users first
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- If not found, try profiles (now using explicit variable names to avoid ambiguity)
    IF v_user_email IS NULL THEN
        SELECT p.email INTO v_user_email FROM profiles p WHERE p.user_id = v_user_id;
    END IF;
    
    v_admin_status := is_admin_user_simple(v_user_id);
    
    RETURN QUERY SELECT 
        v_user_id,
        v_user_email,
        v_admin_status,
        CASE 
            WHEN v_admin_status THEN '✅ You have ADMIN access'
            ELSE '❌ You do NOT have admin access. Please login with an admin email.'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_my_admin_status() TO authenticated;

-- Verify refund requests can be queried
COMMENT ON POLICY "Admins can view all refund requests" ON refund_requests IS 'Allows admin users (based on email patterns) to view all refund requests';
COMMENT ON POLICY "Admins can update all refund requests" ON refund_requests IS 'Allows admin users to update any refund request status';
COMMENT ON FUNCTION is_admin_user_simple(UUID) IS 'Checks if user is admin based on email patterns: admin@myne7x.com, myne7x@gmail.com, myne7@gmail.com, admin@*, *admin*@*, etc.';
COMMENT ON FUNCTION check_my_admin_status() IS 'Test function to check if current logged-in user has admin access';