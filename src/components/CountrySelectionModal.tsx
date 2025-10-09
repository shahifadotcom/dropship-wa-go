import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Check } from 'lucide-react';
import { Country } from '@/services/countryService';
import { useNavigate, useLocation } from 'react-router-dom';

interface CountrySelectionModalProps {
  countries: Country[];
  onSelect: (country: Country) => void;
  open: boolean;
}

// Country flag emoji mapping
const countryFlags: { [key: string]: string } = {
  BD: '🇧🇩',
  US: '🇺🇸',
  GB: '🇬🇧',
  IN: '🇮🇳',
  PK: '🇵🇰',
  AU: '🇦🇺',
  CA: '🇨🇦',
  AE: '🇦🇪',
  SA: '🇸🇦',
  MY: '🇲🇾',
  SG: '🇸🇬',
  // Add more as needed
};

export const CountrySelectionModal = ({ countries, onSelect, open }: CountrySelectionModalProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleConfirm = () => {
    if (selectedCountry) {
      onSelect(selectedCountry);
      
      // Redirect to country-specific home page
      const countryCode = selectedCountry.code.toLowerCase();
      navigate(`/${countryCode}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Your Country
          </DialogTitle>
          <DialogDescription>
            Choose your country to see products and prices in your local currency
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:border-primary ${
                  selectedCountry?.id === country.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{countryFlags[country.code] || '🌍'}</span>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{country.name}</p>
                    <p className="text-sm text-muted-foreground">Currency: {country.currency}</p>
                  </div>
                </div>
                {selectedCountry?.id === country.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        <Button 
          onClick={handleConfirm} 
          disabled={!selectedCountry}
          className="w-full"
          size="lg"
        >
          Continue to Shop
        </Button>
      </DialogContent>
    </Dialog>
  );
};
