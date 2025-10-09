import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Video, MessageCircle, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ContactsListProps {
  onCall: (contactId: string, callType: 'audio' | 'video') => void;
  onChat: (contactId: string, contactName: string) => void;
  onClose: () => void;
}

export const ContactsList = ({ onCall, onChat, onClose }: ContactsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_contacts')
      .select(`
        contact_id,
        profiles!user_contacts_contact_id_fkey (
          id,
          phone,
          first_name,
          last_name,
          email
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading contacts:', error);
      return;
    }

    const contactsList = data
      .filter(item => item.profiles)
      .map(item => item.profiles) as unknown as Contact[];
    
    setContacts(contactsList);
  };

  const searchUser = async () => {
    if (!searchPhone.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, phone, first_name, last_name, email')
      .eq('phone', searchPhone.trim())
      .neq('id', user?.id);

    setLoading(false);

    if (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to search user',
        variant: 'destructive'
      });
      return;
    }

    setSearchResults(data || []);

    if (!data || data.length === 0) {
      toast({
        title: 'Not Found',
        description: 'No user found with this phone number'
      });
    }
  };

  const addContact = async (contactId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_contacts')
      .insert({
        user_id: user.id,
        contact_id: contactId
      });

    if (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Contact added successfully'
    });

    setSearchPhone('');
    setSearchResults([]);
    loadContacts();
  };

  const getContactName = (contact: Contact) => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    }
    return contact.phone || contact.email || 'Unknown';
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 md:w-96 h-[600px] bg-card border rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Contacts</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b space-y-2">
        <div className="flex gap-2">
          <Input
            type="tel"
            placeholder="Search by phone number"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUser()}
          />
          <Button onClick={searchUser} disabled={loading}>
            Search
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 p-2 border rounded-lg">
            {searchResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-2">
                <div className="text-sm">
                  <div className="font-medium">{getContactName(result)}</div>
                  <div className="text-muted-foreground">{result.phone}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addContact(result.id)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {contacts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No contacts yet. Search and add contacts to get started!
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
              >
                <div className="flex-1">
                  <div className="font-medium">{getContactName(contact)}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCall(contact.id, 'audio')}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCall(contact.id, 'video')}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onChat(contact.id, getContactName(contact))}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
