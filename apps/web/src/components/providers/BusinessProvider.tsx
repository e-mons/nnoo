'use client';

import React, { createContext, useContext, useState } from 'react';

export type Business = {
  id: string;
  name: string;
  industry: string;
  logo_path?: string | null;
  status: string;
  email?: string | null;
  phone?: string | null;
};

export type BusinessMembership = {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  membership_status: string;
  business: Business;
};

type BusinessContextType = {
  memberships: BusinessMembership[];
  activeBusiness: Business | null;
  activeMembership: BusinessMembership | null;
  setActiveBusinessId: (id: string) => void;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({
  children,
  initialMemberships,
}: {
  children: React.ReactNode;
  initialMemberships: BusinessMembership[];
}) {
  // Try to restore last active from localStorage or fallback to the first membership
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nnoo_active_business_id');
      if (stored && initialMemberships.some(m => m.business_id === stored)) {
        return stored;
      }
    }
    return initialMemberships.length > 0 ? initialMemberships[0].business_id : null;
  });

  const setActiveBusinessId = (id: string) => {
    if (initialMemberships.some(m => m.business_id === id)) {
      setActiveBusinessIdState(id);
      localStorage.setItem('nnoo_active_business_id', id);
    }
  };

  const activeMembership = initialMemberships.find(m => m.business_id === activeBusinessId) || null;
  const activeBusiness = activeMembership?.business || null;

  return (
    <BusinessContext.Provider
      value={{
        memberships: initialMemberships,
        activeBusiness,
        activeMembership,
        setActiveBusinessId,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
