import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface ServiceabilityResult {
  isServiceable: boolean;
  reason?: string;
  storeId?: string;
  deliveryFee?: number;
  estimatedTime?: number;
}

export const validateServiceability = async (
  address: {
    address_line_1: string;
    city: string;
    state: string;
    postal_code: string;
  },
  storeId?: string
): Promise<ServiceabilityResult> => {
  try {
    // Call Supabase edge function for serviceability check
    const { data, error } = await supabase.functions.invoke('check-serviceability', {
      body: {
        address,
        storeId
      }
    });

    if (error) {
      console.error('Serviceability check error:', error);
      return { 
        isServiceable: false, 
        reason: 'Unable to check serviceability' 
      };
    }

    return {
      isServiceable: data.isServiceable,
      reason: data.reason,
      storeId: data.storeId,
      deliveryFee: data.deliveryFee,
      estimatedTime: data.estimatedTime
    };
  } catch (error) {
    console.error('Serviceability check exception:', error);
    return { 
      isServiceable: false, 
      reason: 'Serviceability check unavailable' 
    };
  }
};

export const getServiceableStores = async (
  userLocation: { lat: number; lng: number }
): Promise<Array<{
  id: string;
  name: string;
  distance: number;
  deliveryFee: number;
  estimatedTime: number;
}>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_serviceable_stores', {
        p_user_lat: userLocation.lat,
        p_user_lng: userLocation.lng
      });

    if (error) {
      console.error('Serviceable stores error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Serviceable stores exception:', error);
    return [];
  }
};

export const validateDeliveryRadius = async (
  storeId: string,
  userAddress: {
    lat: number;
    lng: number;
    postal_code: string;
  }
): Promise<{
  isValid: boolean;
  distance?: number;
  maxRadius?: number;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('validate_delivery_radius', {
        p_store_id: storeId,
        p_user_lat: userAddress.lat,
        p_user_lng: userAddress.lng,
        p_postal_code: userAddress.postal_code
      });

    if (error) {
      console.error('Delivery radius validation error:', error);
      return { 
        isValid: false, 
        reason: 'Unable to validate delivery radius' 
      };
    }

    return {
      isValid: data.is_valid,
      distance: data.distance,
      maxRadius: data.max_radius,
      reason: data.reason
    };
  } catch (error) {
    console.error('Delivery radius validation exception:', error);
    return { 
      isValid: false, 
      reason: 'Delivery radius validation unavailable' 
    };
  }
};