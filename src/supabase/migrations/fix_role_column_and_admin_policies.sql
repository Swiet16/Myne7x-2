-- Fix Role Column and Admin Policies
-- This migration adds the missing role column and fixes admin access policies

-- First, check if the role column exists, if not, add it
DO $$
BEGIN
    -- Check if role column exists in profiles table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        -- Add role column to profiles table
        ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        
        -- Add check constraint for role values
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin', 'moderator'));
        
        -- Create index on role column for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
        
        -- Update existing profiles to have proper roles
        -- Set admin role for specific email patterns (customize as needed)
        UPDATE profiles SET role = 'admin' 
        WHERE email LIKE '%@admin.%' 
           OR email LIKE '%admin%' 
           OR email IN ('admin@example.com', 'admin@myne7x.com');
    END IF;
END $$;

-- Create a more flexible admin check function that doesn't rely on role column
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Get user email from auth.users or profiles
    SELECT COALESCE(
        (SELECT email FROM auth.users WHERE id = user_id),
        (SELECT email FROM profiles WHERE user_id = user_id)
    ) INTO user_email;
    
    -- Check if user is admin based on multiple criteria
    IF user_email IS NOT NULL THEN
        -- Check by email pattern
        IF user_email LIKE '%@admin.%' 
           OR user_email LIKE '%admin%@%'
           OR user_email IN ('admin@example.com', 'admin@myne7x.com') THEN
            is_admin := TRUE;
        END IF;
        
        -- Check by role column if it exists
        IF NOT is_admin THEN
            BEGIN
                SELECT (role = 'admin') INTO is_admin
                FROM profiles 
                WHERE profiles.user_id = user_id;
            EXCEPTION WHEN OTHERS THEN
                -- If role column doesn't exist or other error, continue with email-based check
                NULL;
            END;
        END IF;
    END IF;
    
    RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies that reference the role column
DROP POLICY IF EXISTS "Admins can view all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can update all refund requests" ON refund_requests;
DROP POLICY IF EXISTS "Admins can view all contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can update contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins can delete contact requests" ON contact_requests;

-- Recreate policies using the new admin check function
CREATE POLICY "Admins can view all refund requests" ON refund_requests
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update all refund requests" ON refund_requests
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can view all contact requests" ON contact_requests
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update contact requests" ON contact_requests
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete contact requests" ON contact_requests
    FOR DELETE USING (is_admin_user());

-- Update existing admin policies for other tables to use the new function
-- Payment requests
DROP POLICY IF EXISTS "Admins can view all payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON payment_requests;

CREATE POLICY "Admins can view all payment requests" ON payment_requests
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update payment requests" ON payment_requests
    FOR UPDATE USING (is_admin_user());

-- Products table
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update products" ON products
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (is_admin_user());

-- Website images table
DROP POLICY IF EXISTS "Admins can manage website images" ON website_images;
DROP POLICY IF EXISTS "Admins can insert website images" ON website_images;
DROP POLICY IF EXISTS "Admins can update website images" ON website_images;
DROP POLICY IF EXISTS "Admins can delete website images" ON website_images;

CREATE POLICY "Admins can insert website images" ON website_images
    FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update website images" ON website_images
    FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete website images" ON website_images
    FOR DELETE USING (is_admin_user());

-- Contact details table
DROP POLICY IF EXISTS "Admins can manage contact details" ON contact_details;
DROP POLICY IF EXISTS "Admins can update contact details" ON contact_details;

CREATE POLICY "Admins can update contact details" ON contact_details
    FOR UPDATE USING (is_admin_user());

-- Create a function to promote a user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the user's role in profiles table
    UPDATE profiles 
    SET role = 'admin' 
    WHERE email = target_email;
    
    -- Return true if a row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the admin check function
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin(TEXT) TO authenticated;

-- Create a view to check admin status for current user
CREATE OR REPLACE VIEW current_user_admin_status AS
SELECT 
    auth.uid() as user_id,
    is_admin_user() as is_admin,
    COALESCE(
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM profiles WHERE user_id = auth.uid())
    ) as email;

GRANT SELECT ON current_user_admin_status TO authenticated;

-- Insert some sample admin users if they don't exist
DO $$
BEGIN
    -- Insert admin profile if it doesn't exist
    INSERT INTO profiles (user_id, email, full_name, role)
    SELECT 
        gen_random_uuid(),
        'admin@myne7x.com',
        'System Administrator',
        'admin'
    WHERE NOT EXISTS (
        SELECT 1 FROM profiles WHERE email = 'admin@myne7x.com'
    );
    
    -- You can add more admin users here as needed
    -- INSERT INTO profiles (user_id, email, full_name, role) VALUES (...);
    
EXCEPTION WHEN OTHERS THEN
    -- If there's an error (like user_id constraint), just continue
    NULL;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION is_admin_user(UUID) IS 'Checks if a user has admin privileges based on email patterns and role column';
COMMENT ON FUNCTION promote_to_admin(TEXT) IS 'Promotes a user to admin role by email address';
COMMENT ON VIEW current_user_admin_status IS 'Shows admin status for the current authenticated user';

-- Create a trigger to automatically set admin role for specific email patterns
CREATE OR REPLACE FUNCTION auto_set_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign admin role based on email patterns
    IF NEW.email LIKE '%@admin.%' 
       OR NEW.email LIKE '%admin%@%'
       OR NEW.email IN ('admin@example.com', 'admin@myne7x.com') THEN
        NEW.role := 'admin';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profile insertions
DROP TRIGGER IF EXISTS auto_set_admin_role_trigger ON profiles;
CREATE TRIGGER auto_set_admin_role_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_admin_role();

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS auto_set_admin_role_update_trigger ON profiles;
CREATE TRIGGER auto_set_admin_role_update_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION auto_set_admin_role();
