import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  id: string;
  store_name: string;
  store_tagline: string;
  store_description: string;
  store_logo?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  site_title: string;
  currency: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  inventory_alerts: boolean;
  maintenance_mode: boolean;
}

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updatedFields: Partial<StoreSettings>) => {
    if (!settings) return false;

    try {
      const { error } = await supabase
        .from('store_settings')
        .update(updatedFields)
        .eq('id', settings.id);

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      } else {
        setSettings({ ...settings, ...updatedFields });
        return true;
      }
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings
  };
};