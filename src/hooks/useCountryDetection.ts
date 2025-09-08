import { useState, useEffect } from 'react';
import { CountryService, Country } from '@/services/countryService';

export const useCountryDetection = () => {
  const [detectedCountry, setDetectedCountry] = useState<Country | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the effective country (selected or detected)
  const effectiveCountry = selectedCountry || detectedCountry;

  useEffect(() => {
    const initializeCountryDetection = async () => {
      try {
        setLoading(true);
        
        // Fetch all available countries
        const countries = await CountryService.getAllCountries();
        setAllCountries(countries);

        // Try to detect visitor's country by IP
        const detected = await CountryService.detectCountryByIP();
        
        if (detected) {
          setDetectedCountry(detected);
        } else {
          // Fallback to default country (Bangladesh)
          const defaultCountry = await CountryService.getDefaultCountry();
          setDetectedCountry(defaultCountry);
        }

        // Check if there's a saved country preference in localStorage
        const savedCountryCode = localStorage.getItem('selectedCountry');
        if (savedCountryCode) {
          const savedCountry = countries.find(c => c.code === savedCountryCode);
          if (savedCountry) {
            setSelectedCountry(savedCountry);
          }
        }

      } catch (err) {
        console.error('Country detection failed:', err);
        setError('Failed to detect country');
        
        // Fallback to default
        const defaultCountry = await CountryService.getDefaultCountry();
        setDetectedCountry(defaultCountry);
      } finally {
        setLoading(false);
      }
    };

    initializeCountryDetection();
  }, []);

  // Manually select a country
  const selectCountry = (country: Country | null) => {
    setSelectedCountry(country);
    
    // Save preference to localStorage
    if (country) {
      localStorage.setItem('selectedCountry', country.code);
    } else {
      localStorage.removeItem('selectedCountry');
    }
  };

  // Reset to detected country
  const resetToDetected = () => {
    setSelectedCountry(null);
    localStorage.removeItem('selectedCountry');
  };

  // Get visitor's IP for debugging
  const getVisitorIP = async () => {
    try {
      return await CountryService.getVisitorIP();
    } catch (err) {
      console.error('Failed to get IP:', err);
      return null;
    }
  };

  return {
    detectedCountry,
    selectedCountry,
    effectiveCountry,
    allCountries,
    loading,
    error,
    selectCountry,
    resetToDetected,
    getVisitorIP,
    // Utility functions
    isCountryDetected: !!detectedCountry,
    isCountrySelected: !!selectedCountry,
    countryName: effectiveCountry?.name || 'Unknown',
    countryCode: effectiveCountry?.code || '',
    currency: effectiveCountry?.currency || 'USD'
  };
};