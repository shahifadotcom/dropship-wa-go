import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'moderator' | 'user';

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_roles', { _user_id: user.id });

        if (error) {
          console.error('Error fetching user roles via RPC:', error);
          setRoles([]);
        } else {
          setRoles(data?.map((item: { role: AppRole }) => item.role) || []);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator');

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator
  };
}