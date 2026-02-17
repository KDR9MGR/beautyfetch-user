import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface DriverProtectionResult {
  success: boolean;
  message?: string;
  data?: any;
}

export const validateDriverStatus = async (
  driverId: string
): Promise<{
  isVerified: boolean;
  isActive: boolean;
  reason?: string;
  documents?: {
    licenseVerified: boolean;
    insuranceVerified: boolean;
    backgroundCheckPassed: boolean;
  };
}> => {
  try {
    const { data, error } = await supabase
      .rpc('validate_driver_status', {
        p_driver_id: driverId
      });

    if (error) {
      console.error('Driver status validation error:', error);
      return { 
        isVerified: false, 
        isActive: false, 
        reason: 'Driver validation failed' 
      };
    }

    return {
      isVerified: data.is_verified,
      isActive: data.is_active,
      reason: data.reason,
      documents: data.documents
    };
  } catch (error) {
    console.error('Driver status validation exception:', error);
    return { 
      isVerified: false, 
      isActive: false, 
      reason: 'Driver validation unavailable' 
    };
  }
};

export const enforceDriverOnlineStatus = async (
  driverId: string,
  wantToGoOnline: boolean
): Promise<{
  success: boolean;
  isOnline: boolean;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('enforce_driver_online_status', {
        p_driver_id: driverId,
        p_want_online: wantToGoOnline
      });

    if (error) {
      console.error('Driver online status enforcement error:', error);
      return { success: false, isOnline: false, reason: 'Status update failed' };
    }

    return {
      success: data.success,
      isOnline: data.is_online,
      reason: data.reason
    };
  } catch (error) {
    console.error('Driver online status enforcement exception:', error);
    return { success: false, isOnline: false, reason: 'Status update unavailable' };
  }
};

export const setOrderAcceptTimeout = async (
  deliveryId: string,
  timeoutMinutes: number = 5
): Promise<{
  success: boolean;
  expiresAt?: string;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('set_order_accept_timeout', {
        p_delivery_id: deliveryId,
        p_timeout_minutes: timeoutMinutes
      });

    if (error) {
      console.error('Order accept timeout error:', error);
      return { success: false, reason: 'Timeout setup failed' };
    }

    return {
      success: data.success,
      expiresAt: data.expires_at,
      reason: data.reason
    };
  } catch (error) {
    console.error('Order accept timeout exception:', error);
    return { success: false, reason: 'Timeout setup unavailable' };
  }
};

export const autoReassignOnRejection = async (
  deliveryId: string,
  rejectedDriverId: string,
  rejectionReason: string
): Promise<{
  success: boolean;
  newDriverId?: string;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('auto_reassign_on_rejection', {
        p_delivery_id: deliveryId,
        p_rejected_driver_id: rejectedDriverId,
        p_rejection_reason: rejectionReason
      });

    if (error) {
      console.error('Auto reassign error:', error);
      return { success: false, reason: 'Reassignment failed' };
    }

    return {
      success: data.success,
      newDriverId: data.new_driver_id,
      reason: data.reason
    };
  } catch (error) {
    console.error('Auto reassign exception:', error);
    return { success: false, reason: 'Reassignment unavailable' };
  }
};

export const preventMultipleActiveDeliveries = async (
  driverId: string
): Promise<{
  allowed: boolean;
  activeDeliveryCount?: number;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('prevent_multiple_active_deliveries', {
        p_driver_id: driverId
      });

    if (error) {
      console.error('Multiple active deliveries check error:', error);
      return { allowed: false, reason: 'Validation failed' };
    }

    return {
      allowed: data.allowed,
      activeDeliveryCount: data.active_delivery_count,
      reason: data.reason
    };
  } catch (error) {
    console.error('Multiple active deliveries check exception:', error);
    return { allowed: false, reason: 'Validation unavailable' };
  }
};

export const assignBasedOnDistanceAndAvailability = async (
  orderId: string,
  storeLocation: { lat: number; lng: number }
): Promise<{
  success: boolean;
  assignedDriverId?: string;
  estimatedTime?: number;
  distance?: number;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('assign_based_on_distance_availability', {
        p_order_id: orderId,
        p_store_lat: storeLocation.lat,
        p_store_lng: storeLocation.lng
      });

    if (error) {
      console.error('Smart assignment error:', error);
      return { success: false, reason: 'Assignment failed' };
    }

    return {
      success: data.success,
      assignedDriverId: data.assigned_driver_id,
      estimatedTime: data.estimated_time,
      distance: data.distance,
      reason: data.reason
    };
  } catch (error) {
    console.error('Smart assignment exception:', error);
    return { success: false, reason: 'Assignment unavailable' };
  }
};

export const implementProofOfDelivery = async (
  deliveryId: string,
  proofType: 'otp' | 'signature' | 'photo',
  proofData: string
): Promise<{
  success: boolean;
  verificationCode?: string;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('implement_proof_of_delivery', {
        p_delivery_id: deliveryId,
        p_proof_type: proofType,
        p_proof_data: proofData
      });

    if (error) {
      console.error('Proof of delivery error:', error);
      return { success: false, reason: 'Proof verification failed' };
    }

    return {
      success: data.success,
      verificationCode: data.verification_code,
      reason: data.reason
    };
  } catch (error) {
    console.error('Proof of delivery exception', error);
    return { success: false, reason: 'Proof verification unavailable' };
  }
};

export const handleFailedDelivery = async (
  deliveryId: string,
  failureReason: string,
  attemptedAt: string,
  customerNotes?: string
): Promise<{
  success: boolean;
  nextAction?: string;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('handle_failed_delivery', {
        p_delivery_id: deliveryId,
        p_failure_reason: failureReason,
        p_attempted_at: attemptedAt,
        p_customer_notes: customerNotes
      });

    if (error) {
      console.error('Failed delivery handling error:', error);
      return { success: false, reason: 'Failed delivery processing failed' };
    }

    return {
      success: data.success,
      nextAction: data.next_action,
      reason: data.reason
    };
  } catch (error) {
    console.error('Failed delivery handling exception', error);
    return { success: false, reason: 'Failed delivery processing unavailable' };
  }
};

export const calculateDriverEarnings = async (
  driverId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalEarnings: number;
  baseEarnings: number;
  bonusEarnings: number;
  deliveryCount: number;
  cancelledCount: number;
  completionRate: number;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_driver_earnings', {
        p_driver_id: driverId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('Driver earnings calculation error:', error);
      return {
        totalEarnings: 0,
        baseEarnings: 0,
        bonusEarnings: 0,
        deliveryCount: 0,
        cancelledCount: 0,
        completionRate: 0
      };
    }

    return {
      totalEarnings: data.total_earnings,
      baseEarnings: data.base_earnings,
      bonusEarnings: data.bonus_earnings,
      deliveryCount: data.delivery_count,
      cancelledCount: data.cancelled_count,
      completionRate: data.completion_rate
    };
  } catch (error) {
    console.error('Driver earnings calculation exception', error);
    return {
      totalEarnings: 0,
      baseEarnings: 0,
      bonusEarnings: 0,
      deliveryCount: 0,
      cancelledCount: 0,
      completionRate: 0
    };
  }
};