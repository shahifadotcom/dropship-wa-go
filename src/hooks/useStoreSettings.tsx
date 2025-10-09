import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  id: string;
  store_name: string;
  store_tagline: string;
  store_description: string;
  store_logo?: string;
  favicon_url?: string;
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
      // Use public view for anon access (non-sensitive data)
      const { data, error } = await supabase
        .from('store_settings_public')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
        setSettings({
          id: 'default',
          store_name: '',
          store_tagline: '',
          store_description: '',
          site_title: 'Online Store',
          currency: 'BDT',
          contact_email: '',
          contact_phone: '',
          contact_address: '',
          email_notifications: false,
          whatsapp_notifications: false,
          inventory_alerts: false,
          maintenance_mode: false,
        });
      } else if (!data) {
        // No settings found, use safe defaults
        setSettings({
          id: 'default',
          store_name: '',
          store_tagline: '',
          store_description: '',
          site_title: 'Online Store',
          currency: 'BDT',
          contact_email: '',
          contact_phone: '',
          contact_address: '',
          email_notifications: false,
          whatsapp_notifications: false,
          inventory_alerts: false,
          maintenance_mode: false,
        });
      } else {
        setSettings({
          id: data.id || 'default',
          store_name: data.store_name || '',
          store_tagline: data.store_tagline || '',
          store_description: data.store_description || '',
          store_logo: data.store_logo,
          favicon_url: data.favicon_url,
          site_title: 'Online Store',
          currency: data.currency || 'BDT',
          contact_email: '',
          contact_phone: '',
          contact_address: '',
          email_notifications: false,
          whatsapp_notifications: false,
          inventory_alerts: false,
          maintenance_mode: false,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      // Set default values on error
      setSettings({
        id: 'default',
        store_name: '',
        store_tagline: '',
        store_description: '',
        site_title: 'Online Store',
        currency: 'BDT',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        email_notifications: false,
        whatsapp_notifications: false,
        inventory_alerts: false,
        maintenance_mode: false
      });
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