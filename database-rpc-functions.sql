-- RPC functions for getting counts - run this in your Supabase SQL Editor

-- Function to get total services count
CREATE OR REPLACE FUNCTION get_services_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM services);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active services count
CREATE OR REPLACE FUNCTION get_active_services_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM services WHERE is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get services count by organization
CREATE OR REPLACE FUNCTION get_organization_services_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM services WHERE organization_id = org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get services count with filters
CREATE OR REPLACE FUNCTION get_services_count_filtered(
  active_only BOOLEAN DEFAULT NULL,
  org_id UUID DEFAULT NULL,
  service_type_filter TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM services
  WHERE 
    (active_only IS NULL OR is_active = active_only)
    AND (org_id IS NULL OR organization_id = org_id)
    AND (service_type_filter IS NULL OR service_type = service_type_filter);
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_services_count() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_active_services_count() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_organization_services_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_services_count_filtered(BOOLEAN, UUID, TEXT) TO authenticated, anon;

-- Test the functions
SELECT 'RPC functions created successfully!' as message;
SELECT get_services_count() as total_services;
SELECT get_active_services_count() as active_services;