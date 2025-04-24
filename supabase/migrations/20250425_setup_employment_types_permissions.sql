-- This script sets up basic employment types with appropriate permissions
-- Execute this in your Supabase SQL editor

-- First, let's create some basic employment types
INSERT INTO employment_types (name, description, permissions)
VALUES 
  ('Admin', 'Full access to all system features', NULL),
  ('Manager', 'Can manage services, staff, and appointments', '["staff", "services", "packages", "appointments", "reports", "inventory"]'::jsonb),
  ('Receptionist', 'Can manage appointments and services', '["services", "appointments"]'::jsonb),
  ('Stylist', 'Limited access to appointments and services', '["appointments", "services"]'::jsonb)
ON CONFLICT (name) 
DO UPDATE SET 
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Note: The Admin type will have an empty permissions array due to the
-- handle_admin_permissions trigger, which ensures Admin always has full access
-- without needing to list specific permissions.

-- You can add more custom roles as needed
-- Example:
-- INSERT INTO employment_types (name, description, permissions)
-- VALUES ('Inventory Manager', 'Manages inventory only', '["inventory"]'::jsonb);