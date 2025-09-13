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
      // Use anon access for public store settings
      const { data, error } = await supabase
        .from('store_settings')
        .select('id, store_name, store_tagline, store_description, store_logo, site_title, currency')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
        // Set default values if fetch fails
        setSettings({
          id: 'default',
          store_name: 'DropshipPro',
          store_tagline: 'Your One-Stop Shop',
          store_description: 'Quality products at affordable prices',
          site_title: 'DropshipPro - Online Store',
          currency: 'BDT',
          contact_email: '',
          contact_phone: '',
          contact_address: '',
          email_notifications: false,
          whatsapp_notifications: false,
          inventory_alerts: false,
          maintenance_mode: false
        });
      } else {
        setSettings({
          ...data,
          id: data.id || 'default',
          contact_email: '',
          contact_phone: '',
          contact_address: '',
          email_notifications: false,
          whatsapp_notifications: false,
          inventory_alerts: false,
          maintenance_mode: false
        });
      }
    } catch (error) {
      console.error('Error:', error);
      // Set default values on error
      setSettings({
        id: 'default',
        store_name: 'DropshipPro',
        store_tagline: 'Your One-Stop Shop',
        store_description: 'Quality products at affordable prices',
        site_title: 'DropshipPro - Online Store',
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