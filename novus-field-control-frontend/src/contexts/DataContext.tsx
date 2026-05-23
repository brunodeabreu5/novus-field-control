import React, { createContext, useContext, useState } from 'react';
import type { Tenant, Project, Invoice } from '@/types';
import { mockTenants, mockProjects, mockInvoices } from '@/data/mockData';

interface DataContextType {
  tenants: Tenant[];
  projects: Project[];
  invoices: Invoice[];
  addTenant: (t: Omit<Tenant, 'id' | 'createdAt'>) => void;
  updateTenant: (t: Tenant) => void;
  deleteTenant: (id: string) => void;
  addProject: (p: Omit<Project, 'id'>) => void;
  addInvoice: (i: Omit<Invoice, 'id'>) => void;
  getTenantById: (id: string) => Tenant | undefined;
  getProjectsByTenant: (tenantId: string) => Project[];
  getInvoicesByTenant: (tenantId: string) => Invoice[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const addTenant = (t: Omit<Tenant, 'id' | 'createdAt'>) => {
    const newTenant: Tenant = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString().split('T')[0] };
    setTenants(prev => [...prev, newTenant]);
  };

  const updateTenant = (t: Tenant) => {
    setTenants(prev => prev.map(x => x.id === t.id ? t : x));
  };

  const deleteTenant = (id: string) => {
    setTenants(prev => prev.filter(x => x.id !== id));
  };

  const addProject = (p: Omit<Project, 'id'>) => {
    setProjects(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  };

  const addInvoice = (i: Omit<Invoice, 'id'>) => {
    setInvoices(prev => [...prev, { ...i, id: crypto.randomUUID() }]);
  };

  const getTenantById = (id: string) => tenants.find(t => t.id === id);
  const getProjectsByTenant = (tenantId: string) => projects.filter(p => p.tenantId === tenantId);
  const getInvoicesByTenant = (tenantId: string) => invoices.filter(i => i.tenantId === tenantId);

  return (
    <DataContext.Provider value={{
      tenants, projects, invoices,
      addTenant, updateTenant, deleteTenant,
      addProject, addInvoice,
      getTenantById, getProjectsByTenant, getInvoicesByTenant,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
