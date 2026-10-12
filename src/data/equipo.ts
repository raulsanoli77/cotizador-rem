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

export interface NosotrosConfig {
  badge: string;
  titulo_hero: string;
  subtitulo_hero: string;
  foto_principal_url: string;
  telefono1: string;
  telefono2: string;
  texto_nosotros: string;
  vision: string;
  mision: string;
  presencia_ciudades: string;
  direccion: string;
  horario: string;
  email: string;
}

export const NOSOTROS_CONFIG_DEFAULT: NosotrosConfig = {
  badge: 'Tú Socio Industrial',
  titulo_hero: 'Pasión por la Precisión y el Servicio Industrial',
  subtitulo_hero: 'En REM Industrial proveemos soluciones técnicas de alto rendimiento en herramientas de corte, metrología, abrasivos y suministros MRO para la industria metalmecánica y maquiladora.',
  foto_principal_url: '/images/equipo-rem.jpg',
  telefono1: '(656) 634 1516',
  telefono2: '(656) 634 1571',
  texto_nosotros: 'En REM Industrial, nos comprometemos a ser el socio preferido y más confiable para la provisión de productos y servicios diseñados para optimizar la productividad y calidad de nuestros clientes, todo ello al costo más competitivo. Nuestra visión es ser reconocidos como la opción predilecta por nuestra capacidad de aportar soluciones efectivas y accesibles.',
  vision: 'Ser el recurso preferido y el más confiable para los productos y servicios que mejoren y faciliten la productividad y calidad de nuestros clientes al menor costo posible.',
  mision: 'Ser la empresa líder en la distribución de productos de calidad y servicios de gran valor, cuando y donde los necesite el cliente, creando relaciones positivas y duraderas con nuestros clientes.',
  presencia_ciudades: 'Ciudad Juárez • El Paso TX • Próxima apertura Chihuahua Capital • Cobertura en línea en toda la República Mexicana',
  direccion: 'Av. Manuel Gómez Morín 1249, Colonia Las Palmas, Local 5, C.P. 32668 Ciudad Juárez, Chihuahua, México',
  horario: 'Lunes a Viernes: 08:00 AM - 05:00 PM',
  email: 'ventasrem@remindustrial.mx',
};

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
    descripcion: 'Atención a cuentas clave de maquiladora y metalmecánica en Ciudad Juárez, El Paso y norte del país.',
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
    descripcion: 'Gestión de inventarios críticos, entregas en planta local y envíos nacionales rápidos.',
  },
];
