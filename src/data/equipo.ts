export interface MiembroEquipo {
  id: string;
  nombre: string;
  puesto: string;
  departamento: 'Dirección' | 'Ventas Técnicas' | 'Cotizaciones' | 'Logística y Operaciones';
  nivelJerarquico: 1 | 2 | 3; // 1: Dirección / Liderazgo, 2: Ventas & Asesoría Técnica, 3: Atención & Soporte
  foto_url?: string;
  telefono?: string;
  email?: string;
  descripcion?: string;
}

export const EQUIPO_INICIAL: MiembroEquipo[] = [
  {
    id: '1',
    nombre: 'Dirección General',
    puesto: 'Director General & Operaciones',
    departamento: 'Dirección',
    nivelJerarquico: 1,
    foto_url: '',
    telefono: '6566341516',
    email: 'ventasrem@remindustrial.mx',
    descripcion: 'Liderazgo estratégico y desarrollo de alianzas con fabricantes internacionales de herramental.',
  },
  {
    id: '2',
    nombre: 'Gerencia Comercial',
    puesto: 'Gerente de Ventas Industriales',
    departamento: 'Ventas Técnicas',
    nivelJerarquico: 2,
    foto_url: '',
    telefono: '6566341516',
    email: 'ventasrem@remindustrial.mx',
    descripcion: 'Atención a cuentas clave de maquiladora y metalmecánica en Ciudad Juárez y norte del país.',
  },
  {
    id: '3',
    nombre: 'Ingeniería de Aplicaciones',
    puesto: 'Especialista en Herramientas de Corte',
    departamento: 'Ventas Técnicas',
    nivelJerarquico: 2,
    foto_url: '',
    telefono: '6566341571',
    email: 'ventasrem@remindustrial.mx',
    descripcion: 'Optimización de procesos de maquinado CNC, fresado, torneado e insertos de carburo.',
  },
  {
    id: '4',
    nombre: 'Atención a Clientes & Cotizaciones',
    puesto: 'Coordinadora de Cotizaciones y Cuentas',
    departamento: 'Cotizaciones',
    nivelJerarquico: 3,
    foto_url: '',
    telefono: '6566341571',
    email: 'ventasrem@remindustrial.mx',
    descripcion: 'Generación rápida de cotizaciones formales, seguimiento de órdenes de compra y facturación.',
  },
  {
    id: '5',
    nombre: 'Especialista en Metrología',
    puesto: 'Asesor Técnico en Equipo de Medición',
    departamento: 'Ventas Técnicas',
    nivelJerarquico: 2,
    foto_url: '',
    telefono: '6566341516',
    email: 'ventasrem@remindustrial.mx',
    descripcion: 'Soluciones en control de calidad dimensional, rugosímetros, CMM y calibradores de precisión.',
  },
  {
    id: '6',
    nombre: 'Logística y Almacén',
    puesto: 'Supervisor de Logística y Envíos',
    departamento: 'Logística y Operaciones',
    nivelJerarquico: 3,
    foto_url: '',
    telefono: '6566341571',
    email: 'ventasrem@remindustrial.mx',
    descripcion: 'Gestión de inventarios críticos, entregas en planta local y envíos nacionales seguros.',
  },
];
