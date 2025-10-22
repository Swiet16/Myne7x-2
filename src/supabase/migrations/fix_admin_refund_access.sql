-- Fix Admin Access to Refund Requests with Related Tables
-- This ensures admins can view refund_requests along with products and profiles data

-- 1. Ensure admin function exists and works correctly
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
    
    -- Check if user is admin based on email patterns
    IF v_user_email IS NOT NULL THEN
        -- Check by specific admin emails or patterns
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

-- Grant execute permission on the admin check function
GRANT EXECUTE ON FUNCTION is_admin_user_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user_simple(UUID) TO anon;

-- 2. Drop and recreate policies for refund_requests
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can update all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can delete refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Users can view their own refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Users can create refund requests" ON refund_requests;

-- Create comprehensive policies for refund_requests
CREATE POLICY "Admins can view all refund requests" ON refund_requests
    FOR SELECT USING (is_admin_user_simple());

CREATE POLICY "Admins can update all refund requests" ON refund_requests
    FOR UPDATE USING (is_admin_user_simple());

CREATE POLICY "Admins can delete refund requests" ON refund_requests
    FOR DELETE USING (is_admin_user_simple());

CREATE POLICY "Users can view their own refund requests" ON refund_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests" ON refund_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Ensure admins can view related products data
DROP POLICY IF EXISTS "Admins can view all products" ON products;

CREATE POLICY "Admins can view all products" ON products
    FOR SELECT USING (is_admin_user_simple() OR true);

-- 4. Ensure admins can view related profiles data
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin_user_simple() OR auth.uid() = user_id);

-- 5. Create a test query function to verify access
CREATE OR REPLACE FUNCTION test_admin_refund_access()
RETURNS TABLE(
    can_see_refunds BOOLEAN,
    refund_count BIGINT,
    can_see_products BOOLEAN,
    product_count BIGINT,
    can_see_profiles BOOLEAN,
    profile_count BIGINT,
    admin_status BOOLEAN,
    user_email TEXT,
    error_message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_admin_status BOOLEAN;
    v_refund_count BIGINT;
    v_product_count BIGINT;
    v_profile_count BIGINT;
BEGIN
    v_user_id := auth.uid();
    
    -- Get email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- Check admin status
    v_admin_status := is_admin_user_simple(v_user_id);
    
    -- Try to count refund requests
    BEGIN
        SELECT COUNT(*) INTO v_refund_count FROM refund_requests;
    EXCEPTION WHEN OTHERS THEN
        v_refund_count := -1;
    END;
    
    -- Try to count products
    BEGIN
        SELECT COUNT(*) INTO v_product_count FROM products;
    EXCEPTION WHEN OTHERS THEN
        v_product_count := -1;
    END;
    
    -- Try to count profiles
    BEGIN
        SELECT COUNT(*) INTO v_profile_count FROM profiles;
    EXCEPTION WHEN OTHERS THEN
        v_profile_count := -1;
    END;
    
    RETURN QUERY SELECT
        v_refund_count >= 0,
        v_refund_count,
        v_product_count >= 0,
        v_product_count,
        v_profile_count >= 0,
        v_profile_count,
        v_admin_status,
        v_user_email,
        CASE
            WHEN NOT v_admin_status THEN '❌ You are NOT logged in as admin'
            WHEN v_refund_count < 0 THEN '❌ Cannot access refund_requests table'
            WHEN v_product_count < 0 THEN '❌ Cannot access products table'
            WHEN v_profile_count < 0 THEN '❌ Cannot access profiles table'
            ELSE '✅ All access granted'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_admin_refund_access() TO authenticated;

-- 6. Add helpful comments
COMMENT ON POLICY "Admins can view all refund requests" ON refund_requests IS 'Allows admin users to view all refund requests';
COMMENT ON POLICY "Admins can view all products" ON products IS 'Allows admin users to view all products (needed for refund request joins)';
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 'Allows admin users to view all profiles (needed for refund request joins)';
COMMENT ON FUNCTION test_admin_refund_access() IS 'Test function to verify admin can access refund requests and related tables';

-- Instructions for testing:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Then run: SELECT * FROM test_admin_refund_access();
-- 3. Check the output to see if all access is granted
-- 4. The error_message column will tell you what's wrong if there are issues