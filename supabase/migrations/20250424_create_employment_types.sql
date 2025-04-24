-- Create the employment_types table to store role configurations
CREATE TABLE IF NOT EXISTS public.employment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_configurable BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a unique constraint on the name to prevent duplicates
ALTER TABLE public.employment_types ADD CONSTRAINT unique_employment_type_name UNIQUE (name);

-- Add permissions check trigger to ensure Admin type always has full permissions
CREATE OR REPLACE FUNCTION public.handle_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the Admin role or not configurable, clear the permissions array
  -- Admin roles implicitly have all permissions
  IF NEW.name = 'Admin' OR NEW.is_configurable = false THEN
    NEW.permissions = '[]'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_admin_permissions
BEFORE INSERT OR UPDATE ON public.employment_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_permissions();

-- Enable RLS
ALTER TABLE public.employment_types ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin users can access employment types"
  ON public.employment_types
  USING (auth.jwt() ->> 'role' = 'admin');

-- Update employees table to reference employment_types instead of using a string
-- First, add a temporary column to avoid constraint issues during migration
ALTER TABLE public.employees ADD COLUMN employment_type_id UUID;

-- Add foreign key constraint 
ALTER TABLE public.employees 
  ADD CONSTRAINT fk_employees_employment_type 
  FOREIGN KEY (employment_type_id) 
  REFERENCES public.employment_types(id);

-- Create update_employee_timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_employment_types_updated_at ON public.employment_types;
CREATE TRIGGER update_employment_types_updated_at
BEFORE UPDATE ON public.employment_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add a constraint to ensure either employment_type or employment_type_id is set
ALTER TABLE public.employees
  ADD CONSTRAINT employees_employment_type_check
  CHECK (
    (employment_type IS NOT NULL) OR 
    (employment_type_id IS NOT NULL)
  );