import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant } from '@/lib/api/types';

interface TenantState {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  setCurrentTenant: (tenant: Tenant) => void;
  setTenants: (tenants: Tenant[]) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      tenants: [],

      setCurrentTenant: (tenant: Tenant) => {
        set({ currentTenant: tenant });
      },

      setTenants: (tenants: Tenant[]) => {
        set({ tenants });
      },

      clearTenant: () => {
        set({ currentTenant: null, tenants: [] });
      },
    }),
    {
      name: 'tenant-storage',
    }
  )
);
