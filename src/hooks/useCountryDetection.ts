import { useState, useEffect } from 'react';
import { CountryService, Country } from '@/services/countryService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const useCountryDetection = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSelection, setNeedsSelection] = useState(false);
  const { countryCode } = useParams<{ countryCode: string }>();
  const location = useLocation();

  useEffect(() => {
    const initializeCountry = async () => {
      try {
        setLoading(true);
        
        // Fetch all available countries
        const countries = await CountryService.getAllCountries();
        setAllCountries(countries);

        let countryToSet: Country | null = null;

        // Priority 1: Country from URL
        if (countryCode) {
          countryToSet = countries.find(c => c.code.toLowerCase() === countryCode.toLowerCase()) || null;
        }

        // Priority 2: Saved country preference
        if (!countryToSet) {
          const savedCountryCode = localStorage.getItem('selectedCountry');
          if (savedCountryCode) {
            countryToSet = countries.find(c => c.code === savedCountryCode) || null;
          }
        }

        if (countryToSet) {
          setSelectedCountry(countryToSet);
          setNeedsSelection(false);
        } else {
          // No country selected - show selection modal
          setNeedsSelection(true);
        }

      } catch (err) {
        console.error('Country initialization failed:', err);
        setError('Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    initializeCountry();
  }, [countryCode]);

  // Manually select a country
  const selectCountry = (country: Country | null) => {
    setSelectedCountry(country);
    setNeedsSelection(false);
    
    // Save preference to localStorage
    if (country) {
      localStorage.setItem('selectedCountry', country.code);
    } else {
      localStorage.removeItem('selectedCountry');
    }
  };

  return {
    selectedCountry,
    allCountries,
    loading,
    error,
    needsSelection,
    selectCountry,
    // Utility functions
    countryName: selectedCountry?.name || 'Unknown',
    countryCode: selectedCountry?.code || '',
    countryId: selectedCountry?.id || '',
    currency: selectedCountry?.currency || 'USD'
  };
};