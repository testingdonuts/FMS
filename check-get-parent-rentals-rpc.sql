-- Check get_parent_rentals RPC signature and existence
-- Run in Supabase SQL editor

-- 1) List all overloads of get_parent_rentals and their argument names/types
SELECT
  p.oid::regprocedure AS signature,
  p.proname,
  p.proargnames,
  oidvectortypes(p.proargtypes) AS arg_types,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_parent_rentals'
ORDER BY signature;

-- 2) Quick sanity call (replace with a real parent UUID)
-- SELECT * FROM public.get_parent_rentals('00000000-0000-0000-0000-000000000000'::uuid) LIMIT 1;
