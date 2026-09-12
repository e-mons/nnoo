import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Business {
  id: string;
  name: string;
  legal_name?: string | null;
  industry: string;
  country_code: string;
  currency_code: string;
  timezone: string;
  state?: string | null;
  local_government_area?: string | null;
  city?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  phone?: string | null;
  email?: string | null;
  registration_number?: string | null;
  tax_identifier?: string | null;
  logo_path?: string | null;
  status: 'active' | 'suspended' | string;
  created_at: string;
  updated_at: string;
}

export interface BusinessMembership {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  membership_status: string;
  business: Business;
}

interface BusinessContextType {
  activeBusiness: Business | null;
  activeMembership: BusinessMembership | null;
  memberships: BusinessMembership[];
  isLoading: boolean;
  hasSuspendedBusiness: boolean;
  setActiveBusinessId: (id: string) => void;
  refreshMemberships: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  activeBusiness: null,
  activeMembership: null,
  memberships: [],
  isLoading: true,
  hasSuspendedBusiness: false,
  setActiveBusinessId: () => {},
  refreshMemberships: async () => {},
});

export const useBusiness = () => useContext(BusinessContext);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<BusinessMembership[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSuspendedBusiness, setHasSuspendedBusiness] = useState(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchMemberships = async (retryCount = 0): Promise<void> => {
    if (!user) {
      setMemberships([]);
      setActiveBusinessIdState(null);
      setHasSuspendedBusiness(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('business_memberships')
        .select('*, business:businesses(*)')
        .eq('user_id', user.id)
        .eq('membership_status', 'active');

      if (error) {
        if ((error.code === 'PGRST303' || error.message?.includes('JWT issued at future')) && retryCount < 2) {
          await sleep(1500);
          return fetchMemberships(retryCount + 1);
        }
        throw error;
      }

      const allMemberships = (data || []) as BusinessMembership[];
      const activeMemberships = allMemberships.filter((m) => m.business?.status === 'active');
      const suspendedBusinessExists = allMemberships.some((m) => m.business?.status === 'suspended');

      setMemberships(activeMemberships);
      setHasSuspendedBusiness(suspendedBusinessExists);

      // Auto-select first if none is selected or selected is invalid
      if (activeMemberships.length > 0) {
        if (!activeBusinessId || !activeMemberships.find((m) => m.business_id === activeBusinessId)) {
          setActiveBusinessIdState(activeMemberships[0].business_id);
        }
      } else {
        setActiveBusinessIdState(null);
      }
    } catch (err) {
      console.error('Error fetching memberships:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [user]);

  const setActiveBusinessId = (id: string) => {
    if (memberships.some((m) => m.business_id === id)) {
      setActiveBusinessIdState(id);
    }
  };

  const activeMembership = memberships.find((m) => m.business_id === activeBusinessId) || null;
  const activeBusiness = activeMembership?.business || null;

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        activeMembership,
        memberships,
        isLoading,
        hasSuspendedBusiness,
        setActiveBusinessId,
        refreshMemberships: () => fetchMemberships(0),
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}
