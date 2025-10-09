import { Globe, MapPin } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { useNavigate, useLocation } from 'react-router-dom';

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
};

interface CountrySelectorDropdownProps {
  className?: string;
}

export const CountrySelectorDropdown = ({ className = "" }: CountrySelectorDropdownProps) => {
  const {
    selectedCountry,
    allCountries,
    loading,
    selectCountry,
  } = useCountryDetection();
  
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const handleCountryChange = (countryCode: string) => {
    const country = allCountries.find(c => c.code === countryCode);
    if (country) {
      selectCountry(country);
      
      // Navigate to country-specific route
      const newCountryCode = country.code.toLowerCase();
      
      // Update URL with new country code
      if (location.pathname.includes('/products/')) {
        const slug = location.pathname.split('/products/')[1];
        navigate(`/${newCountryCode}/products/${slug}`);
      } else {
        navigate(`/${newCountryCode}`);
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedCountry?.code || ''}
        onValueChange={handleCountryChange}
      >
        <SelectTrigger className="w-auto min-w-[140px] h-9 bg-background">
          <SelectValue>
            {selectedCountry && (
              <div className="flex items-center gap-2">
                <span>{countryFlags[selectedCountry.code] || '🌍'}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background">
          {allCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span>{countryFlags[country.code] || '🌍'}</span>
                <span>{country.name}</span>
                <span className="text-xs text-muted-foreground">({country.currency})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
