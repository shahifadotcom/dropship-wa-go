-- Assign admin role to admin@shahifa.com
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
    au.id,
    'admin'::app_role,
    au.id
FROM auth.users au
WHERE au.email = 'admin@shahifa.com'
ON CONFLICT (user_id, role) DO NOTHING;