import { Globe, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCountryDetection } from '@/hooks/useCountryDetection';

interface CountrySelectorProps {
  showDetectedInfo?: boolean;
  className?: string;
}

export const CountrySelector = ({ 
  showDetectedInfo = true, 
  className = "" 
}: CountrySelectorProps) => {
  const {
    detectedCountry,
    selectedCountry,
    effectiveCountry,
    allCountries,
    loading,
    selectCountry,
    resetToDetected,
    isCountrySelected
  } = useCountryDetection();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Detecting location...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <Select
          value={effectiveCountry?.code || ''}
          onValueChange={(value) => {
            const country = allCountries.find(c => c.code === value);
            selectCountry(country || null);
          }}
        >
          <SelectTrigger className="w-48">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Select country" />
              {effectiveCountry && (
                <Badge variant="secondary" className="ml-auto">
                  {effectiveCountry.currency}
                </Badge>
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {allCountries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center justify-between w-full">
                  <span>{country.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {country.currency}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showDetectedInfo && (
        <div className="text-sm space-y-1">
          {detectedCountry && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>
                Detected: {detectedCountry.name}
                {isCountrySelected && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={resetToDetected}
                    className="h-auto p-0 ml-2 text-xs"
                  >
                    Reset
                  </Button>
                )}
              </span>
            </div>
          )}
          
          {isCountrySelected && (
            <div className="flex items-center gap-2 text-blue-600">
              <ChevronDown className="h-3 w-3" />
              <span className="text-xs">Manually selected: {selectedCountry?.name}</span>
            </div>
          )}

          {!detectedCountry && (
            <div className="text-xs text-muted-foreground">
              Location detection failed. Please select your country manually.
            </div>
          )}
        </div>
      )}
    </div>
  );
};