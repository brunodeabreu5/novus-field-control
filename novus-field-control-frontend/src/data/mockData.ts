import type { Tenant, Project, Invoice } from '@/types';

export const mockTenants: Tenant[] = [
  {
    id: '1', nombre: 'Comercial Guaraní S.A.', email: 'contacto@guarani.com.py',
    telefono: '+595 21 555-1234', rucCi: '80012345-6', direccion: 'Av. Mariscal López 1200',
    ciudad: 'Asunción', departamento: 'Asunción', plan: 'empresarial',
    valorMensual: 5500000, moneda: 'PYG', status: 'activo',
    fechaInicio: '2024-01-15', fechaVencimiento: '2025-01-15', createdAt: '2024-01-15',
  },
  {
    id: '2', nombre: 'TechPy Solutions', email: 'info@techpy.com',
    telefono: '+595 21 555-5678', rucCi: '80098765-1', direccion: 'Calle Palma 456',
    ciudad: 'Asunción', departamento: 'Asunción', plan: 'profesional',
    valorMensual: 350, moneda: 'USD', status: 'activo',
    fechaInicio: '2024-03-01', fechaVencimiento: '2025-03-01', createdAt: '2024-03-01',
  },
  {
    id: '3', nombre: 'Agro del Este', email: 'ventas@agroeste.com.py',
    telefono: '+595 61 555-9012', rucCi: '80054321-3', direccion: 'Ruta 7 Km 220',
    ciudad: 'Ciudad del Este', departamento: 'Alto Paraná', plan: 'basico',
    valorMensual: 1500, moneda: 'BRL', status: 'activo',
    fechaInicio: '2024-06-10', fechaVencimiento: '2025-06-10', createdAt: '2024-06-10',
  },
  {
    id: '4', nombre: 'Distribuidora Chaco', email: 'admin@dischaco.py',
    telefono: '+595 21 555-3456', rucCi: '80067890-8', direccion: 'Av. Eusebio Ayala 3300',
    ciudad: 'Asunción', departamento: 'Central', plan: 'profesional',
    valorMensual: 3200000, moneda: 'PYG', status: 'suspendido',
    fechaInicio: '2023-09-01', fechaVencimiento: '2024-09-01', createdAt: '2023-09-01',
  },
  {
    id: '5', nombre: 'Encarnación Digital', email: 'hola@encardigital.com',
    telefono: '+595 71 555-7890', rucCi: '80011223-5', direccion: 'Calle Tomás R. Pereira 890',
    ciudad: 'Encarnación', departamento: 'Itapúa', plan: 'basico',
    valorMensual: 150, moneda: 'USD', status: 'cancelado',
    fechaInicio: '2024-02-20', fechaVencimiento: '2024-08-20', createdAt: '2024-02-20',
  },
  {
    id: '6', nombre: 'Cooperativa San Pedro', email: 'coop@sanpedro.org.py',
    telefono: '+595 42 555-1122', rucCi: '80033445-2', direccion: 'Av. San Blas 500',
    ciudad: 'San Pedro', departamento: 'San Pedro', plan: 'empresarial',
    valorMensual: 7000000, moneda: 'PYG', status: 'activo',
    fechaInicio: '2023-11-01', fechaVencimiento: '2025-11-01', createdAt: '2023-11-01',
  },
];

export const mockProjects: Project[] = [
  { id: 'p1', tenantId: '1', nombre: 'ERP Comercial', descripcion: 'Sistema de gestión empresarial', status: 'activo', fechaCreacion: '2024-02-01' },
  { id: 'p2', tenantId: '1', nombre: 'Portal Web', descripcion: 'Sitio web corporativo', status: 'finalizado', fechaCreacion: '2024-01-20' },
  { id: 'p3', tenantId: '2', nombre: 'App Mobile', descripcion: 'Aplicación móvil de ventas', status: 'activo', fechaCreacion: '2024-04-15' },
  { id: 'p4', tenantId: '3', nombre: 'Sistema de Stock', descripcion: 'Control de inventario agrícola', status: 'activo', fechaCreacion: '2024-07-01' },
  { id: 'p5', tenantId: '4', nombre: 'Dashboard Ventas', descripcion: 'Panel de control de ventas', status: 'pausado', fechaCreacion: '2023-10-15' },
  { id: 'p6', tenantId: '6', nombre: 'Portal Socios', descripcion: 'Portal web para socios de la cooperativa', status: 'activo', fechaCreacion: '2024-01-10' },
  { id: 'p7', tenantId: '2', nombre: 'API Gateway', descripcion: 'Gateway de APIs internas', status: 'activo', fechaCreacion: '2024-05-20' },
];

export const mockInvoices: Invoice[] = [
  { id: 'i1', tenantId: '1', numero: 'FAC-001-2024', valor: 5500000, moneda: 'PYG', fechaEmision: '2024-12-01', fechaVencimiento: '2024-12-15', status: 'pagado', descripcion: 'Mensualidad Diciembre 2024' },
  { id: 'i2', tenantId: '1', numero: 'FAC-002-2025', valor: 5500000, moneda: 'PYG', fechaEmision: '2025-01-01', fechaVencimiento: '2025-01-15', status: 'pagado', descripcion: 'Mensualidad Enero 2025' },
  { id: 'i3', tenantId: '1', numero: 'FAC-003-2025', valor: 5500000, moneda: 'PYG', fechaEmision: '2025-02-01', fechaVencimiento: '2025-02-15', status: 'pendiente', descripcion: 'Mensualidad Febrero 2025' },
  { id: 'i4', tenantId: '2', numero: 'FAC-010-2025', valor: 350, moneda: 'USD', fechaEmision: '2025-01-01', fechaVencimiento: '2025-01-15', status: 'pagado', descripcion: 'Mensualidad Enero 2025' },
  { id: 'i5', tenantId: '2', numero: 'FAC-011-2025', valor: 350, moneda: 'USD', fechaEmision: '2025-02-01', fechaVencimiento: '2025-02-15', status: 'atrasado', descripcion: 'Mensualidad Febrero 2025' },
  { id: 'i6', tenantId: '3', numero: 'FAC-020-2025', valor: 1500, moneda: 'BRL', fechaEmision: '2025-01-10', fechaVencimiento: '2025-01-25', status: 'pagado', descripcion: 'Mensualidad Enero 2025' },
  { id: 'i7', tenantId: '4', numero: 'FAC-030-2024', valor: 3200000, moneda: 'PYG', fechaEmision: '2024-08-01', fechaVencimiento: '2024-08-15', status: 'atrasado', descripcion: 'Mensualidad Agosto 2024' },
  { id: 'i8', tenantId: '6', numero: 'FAC-040-2025', valor: 7000000, moneda: 'PYG', fechaEmision: '2025-01-01', fechaVencimiento: '2025-01-15', status: 'pagado', descripcion: 'Mensualidad Enero 2025' },
  { id: 'i9', tenantId: '6', numero: 'FAC-041-2025', valor: 7000000, moneda: 'PYG', fechaEmision: '2025-02-01', fechaVencimiento: '2025-02-15', status: 'pendiente', descripcion: 'Mensualidad Febrero 2025' },
];

export const revenueData = [
  { month: 'Sep', PYG: 8700000, USD: 500, BRL: 1500 },
  { month: 'Oct', PYG: 12200000, USD: 500, BRL: 1500 },
  { month: 'Nov', PYG: 12200000, USD: 350, BRL: 1500 },
  { month: 'Dec', PYG: 17700000, USD: 700, BRL: 3000 },
  { month: 'Ene', PYG: 17700000, USD: 700, BRL: 1500 },
  { month: 'Feb', PYG: 12500000, USD: 350, BRL: 1500 },
];
