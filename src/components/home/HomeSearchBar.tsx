import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { geocodeAddress } from '@/lib/hybridLocationService';
import { toast } from '@/components/ui/sonner';

export function HomeSearchBar() {
  const navigate = useNavigate();
  const { userLocation, setUserLocation } = useLocation();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const placeholder = useMemo(() => {
    if (userLocation?.address) return userLocation.address;
    return 'Enter delivery address';
  }, [userLocation?.address]);

  useEffect(() => {
    if (userLocation?.address) {
      setValue(userLocation.address);
    }
  }, [userLocation?.address]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error('Please enter your address or pincode');
      return;
    }
    setSubmitting(true);
    try {
      const coords = await geocodeAddress(trimmed);
      setUserLocation({ ...coords, address: trimmed });
      navigate('/home');
    } catch (e) {
      toast.error('Unable to find that address. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder={placeholder}
            className="h-10 rounded-xl bg-white pl-9 pr-3 text-sm shadow-none"
          />
        </div>
        <Button
          type="button"
          className="h-10 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white hover:bg-red-600"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Searching…' : 'Search'}
        </Button>
      </div>
    </div>
  );
}
