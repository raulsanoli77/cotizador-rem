export interface MiembroEquipo {
  id: string;
  nombre: string;
  puesto: string;
  departamento: 'Dirección' | 'Ventas Técnicas' | 'Cotizaciones' | 'Logística y Operaciones';
  nivelJerarquico: 1 | 2 | 3; // 1: Dirección / Liderazgo, 2: Ventas & Asesoría Técnica, 3: Atención & Soporte
  foto_url?: string;
  telefono?: string;
  codigo_pais?: string;           // ej: '+52', '+1' (código internacional para WhatsApp y llamadas)
  codigoPais?: string;            // alias de compatibilidad
  email?: string;
  descripcion?: string;
  mostrarTelefono?: boolean;      // Ver texto con número de teléfono
  mostrarEmail?: boolean;         // Ver texto con correo electrónico
  mostrarBotonWhatsapp?: boolean; // Ver botón de WhatsApp
  mostrarBotonEmail?: boolean;    // Ver botón de correo electrónico
}

/**
 * Resuelve la URL de WhatsApp y el formato telefónico de un miembro del equipo,
 * detectando automáticamente si es de México (+52), EE. UU. (+1 / El Paso TX) o internacional.
 */
export function resolverWhatsAppMiembro(
  m: {
    nombre?: string;
    telefono?: string;
    codigo_pais?: string;
    codigoPais?: string;
  }
): {
  waUrl: string;
  waNumeroLimpio: string;
  telefonoVisual: string;
  codigoPaisFinal: string;
} {
  const telRaw = (m.telefono || '').trim();
  const digitsOnly = telRaw.replace(/\D/g, '');

  if (!digitsOnly) {
    return {
      waUrl: '',
      waNumeroLimpio: '',
      telefonoVisual: '',
      codigoPaisFinal: '+52',
    };
  }

  // 1. Determinar código de país explícito si existe
  let rawCode = (m.codigo_pais || m.codigoPais || '').trim();

  // Si no hay código explícito pero el teléfono inicia con '+'
  if (!rawCode && telRaw.startsWith('+')) {
    if (telRaw.startsWith('+1')) rawCode = '+1';
    else if (telRaw.startsWith('+52')) rawCode = '+52';
    else {
      const match = telRaw.match(/^\+(\d{1,4})/);
      if (match) rawCode = `+${match[1]}`;
    }
  }

  // 2. Desglose de dígitos
  let codeDigits = rawCode.replace(/\D/g, '');
  let phoneDigits = digitsOnly;

  if (!codeDigits) {
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // 1 seguido de 10 dígitos (EE. UU.)
      codeDigits = '1';
      phoneDigits = digitsOnly.slice(1);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('52')) {
      // 52 seguido de 10 dígitos (México)
      codeDigits = '52';
      phoneDigits = digitsOnly.slice(2);
    } else if (digitsOnly.length === 10 && digitsOnly.startsWith('915')) {
      // Área 915 es El Paso, Texas (EE. UU.)
      codeDigits = '1';
    } else {
      // Por defecto México (+52)
      codeDigits = '52';
    }
  } else {
    // Si se especificó el código, verificar si digitsOnly ya lo incluye repetido al frente
    if (codeDigits === '1' && digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      phoneDigits = digitsOnly.slice(1);
    } else if (codeDigits === '52' && digitsOnly.length === 12 && digitsOnly.startsWith('52')) {
      phoneDigits = digitsOnly.slice(2);
    }
  }

  const codigoPaisFinal = `+${codeDigits}`;
  const waNumeroLimpio = `${codeDigits}${phoneDigits}`;
  const nombreEnc = encodeURIComponent(m.nombre || 'Asesor');
  const waUrl = `https://wa.me/${waNumeroLimpio}?text=Hola%20${nombreEnc},%20te%20contacto%20desde%20la%20p%C3%A1gina%20de%20REM%20Industrial.`;

  // Formato visual legible (ej: "+1 (915) 726-0022" o "+1 9157260022")
  let telefonoVisual = telRaw;
  if (!telRaw.startsWith('+')) {
    telefonoVisual = `${codigoPaisFinal} ${telRaw}`;
  }

  return {
    waUrl,
    waNumeroLimpio,
    telefonoVisual,
    codigoPaisFinal,
  };
}

export interface TelefonoItem {
  id: string;
  titulo: string; // ej: 'Oficina Matriz', 'Línea 2', 'Ventas El Paso'
  numero: string;
}

export interface EmailItem {
  id: string;
  titulo: string; // ej: 'Ventas Generales', 'Cotizaciones'
  email: string;
}

export interface DireccionItem {
  id: string;
  titulo: string; // ej: 'Matriz Ciudad Juárez', 'Oficina El Paso TX', 'Próxima Sede Chihuahua'
  direccion: string;
  detalles?: string; // ej: 'Almacén y mostrador'
}

export interface PilarValorItem {
  id: string;
  titulo: string;
  descripcion: string;
  icono: 'shield' | 'zap' | 'wrench' | 'truck';
}

export interface RecuadroHeroItem {
  id: string;
  destacado: string; // ej: 'Distribución', 'Binacional', 'Envíos', 'Técnico'
  subtitulo: string; // ej: 'Marcas Globales de Prestigio', 'Cd. Juárez, El Paso TX & Chihuahua Capital', 'Toda la República Mexicana', 'Soporte Especializado'
}

export const RECUADROS_HERO_DEFAULT: RecuadroHeroItem[] = [
  {
    id: 'recuadro-1',
    destacado: 'Distribución',
    subtitulo: 'Marcas Globales de Prestigio',
  },
  {
    id: 'recuadro-2',
    destacado: 'Binacional',
    subtitulo: 'Cd. Juárez, El Paso TX & Chihuahua Capital',
  },
  {
    id: 'recuadro-3',
    destacado: 'Envíos',
    subtitulo: 'Toda la República Mexicana',
  },
  {
    id: 'recuadro-4',
    destacado: 'Técnico',
    subtitulo: 'Soporte Especializado',
  },
];

export interface NosotrosConfig {
  badge: string;
  titulo_hero: string;
  subtitulo_hero: string;
  foto_principal_url: string;
  telefonos: TelefonoItem[];
  emails: EmailItem[];
  direcciones: DireccionItem[];
  pilares: PilarValorItem[];
  recuadros_hero?: RecuadroHeroItem[];
  texto_nosotros: string;
  vision: string;
  mision: string;
  presencia_ciudades: string;
  horario: string;
  // Campos antiguos para retrocompatibilidad
  telefono1?: string;
  telefono2?: string;
  email?: string;
  direccion?: string;
}

export const PILARES_DEFAULT: PilarValorItem[] = [
  {
    id: 'pilar-1',
    titulo: 'Calidad Certificada',
    descripcion: 'Marcas originales de prestigio mundial con especificaciones técnicas rigurosas para la industria maquiladora.',
    icono: 'shield',
  },
  {
    id: 'pilar-2',
    titulo: 'Respuesta Inmediata',
    descripcion: 'Cotizaciones formales y seguimiento ágil en WhatsApp y correo para que tus líneas de producción nunca se detengan.',
    icono: 'zap',
  },
  {
    id: 'pilar-3',
    titulo: 'Asesoría de Campo',
    descripcion: 'Ingenieros de aplicaciones que acuden a tu planta a optimizar parámetros de maquinado y selección de herramental.',
    icono: 'wrench',
  },
  {
    id: 'pilar-4',
    titulo: 'Logística y Envíos',
    descripcion: 'Stock estratégico en Ciudad Juárez, El Paso TX y Chihuahua Capital, con envíos seguros y rápidos a cualquier parque industrial de México.',
    icono: 'truck',
  },
];

export const NOSOTROS_CONFIG_DEFAULT: NosotrosConfig = {
  badge: 'Tú Socio Industrial',
  titulo_hero: 'Pasión por la Precisión y el Servicio Industrial',
  subtitulo_hero: 'En REM Industrial proveemos soluciones técnicas de alto rendimiento en herramientas de corte, metrología, abrasivos y suministros MRO para la industria metalmecánica y maquiladora.',
  foto_principal_url: '/images/equipo-rem.jpg',
  telefonos: [
    { id: 'tel-1', titulo: 'Oficina Matriz (Línea 1)', numero: '(656) 634 1516' },
    { id: 'tel-2', titulo: 'Atención a Clientes (Línea 2)', numero: '(656) 634 1571' },
  ],
  emails: [
    { id: 'email-1', titulo: 'Ventas Oficiales & Cotizaciones', email: 'ventasrem@remindustrial.mx' },
  ],
  direcciones: [
    { 
      id: 'dir-1', 
      titulo: 'Matriz & Centro de Distribución (Cd. Juárez)', 
      direccion: 'Av. Manuel Gómez Morín 1249, Colonia Las Palmas, Local 5, C.P. 32668 Ciudad Juárez, Chihuahua, México',
      detalles: 'Oficinas corporativas, almacén y mostrador de entregas'
    },
    {
      id: 'dir-2',
      titulo: 'Presencia Binacional (El Paso, TX)',
      direccion: 'El Paso, Texas, EE. UU. (Atención y Logística Transfronteriza)',
      detalles: 'Importación directa y suministros para la franja fronteriza'
    },
    {
      id: 'dir-3',
      titulo: 'Próxima Sede (Chihuahua Capital)',
      direccion: 'Chihuahua, Chih., México (Próxima apertura)',
      detalles: 'Atención técnica y distribución para la zona centro del estado'
    }
  ],
  pilares: PILARES_DEFAULT,
  recuadros_hero: RECUADROS_HERO_DEFAULT,
  texto_nosotros: 'En REM Industrial, nos comprometemos a ser el socio preferido y más confiable para la provisión de productos y servicios diseñados para optimizar la productividad y calidad de nuestros clientes, todo ello al costo más competitivo. Nuestra visión es ser reconocidos como la opción predilecta por nuestra capacidad de aportar soluciones efectivas y accesibles.',
  vision: 'Ser el recurso preferido y el más confiable para los productos y servicios que mejoren y faciliten la productividad y calidad de nuestros clientes al menor costo posible.',
  mision: 'Ser la empresa líder en la distribución de productos de calidad y servicios de gran valor, cuando y donde los necesite el cliente, creando relaciones positivas y duraderas con nuestros clientes.',
  presencia_ciudades: 'Ciudad Juárez • El Paso TX • Próxima apertura Chihuahua Capital • Cobertura en línea en toda la República Mexicana',
  horario: 'Lunes a Viernes: 08:00 AM - 05:00 PM',
};

export function normalizarNosotrosConfig(raw?: any): NosotrosConfig {
  if (!raw) return NOSOTROS_CONFIG_DEFAULT;

  const config: NosotrosConfig = {
    ...NOSOTROS_CONFIG_DEFAULT,
    ...raw,
  };

  // Normalizar teléfonos
  if (!Array.isArray(config.telefonos) || config.telefonos.length === 0) {
    const tels: TelefonoItem[] = [];
    if (raw.telefono1) tels.push({ id: 'tel-1', titulo: 'Teléfono Principal', numero: raw.telefono1 });
    if (raw.telefono2) tels.push({ id: 'tel-2', titulo: 'Teléfono Secundario', numero: raw.telefono2 });
    config.telefonos = tels.length > 0 ? tels : NOSOTROS_CONFIG_DEFAULT.telefonos;
  }

  // Normalizar emails
  if (!Array.isArray(config.emails) || config.emails.length === 0) {
    const ems: EmailItem[] = [];
    if (raw.email) ems.push({ id: 'email-1', titulo: 'Email Oficial', email: raw.email });
    config.emails = ems.length > 0 ? ems : NOSOTROS_CONFIG_DEFAULT.emails;
  }

  // Normalizar direcciones
  if (!Array.isArray(config.direcciones) || config.direcciones.length === 0) {
    const dirs: DireccionItem[] = [];
    if (raw.direccion) {
      dirs.push({ 
        id: 'dir-1', 
        titulo: 'Matriz Principal', 
        direccion: raw.direccion,
        detalles: 'Oficinas corporativas y distribución' 
      });
    }
    config.direcciones = dirs.length > 0 ? dirs : NOSOTROS_CONFIG_DEFAULT.direcciones;
  }

  // Normalizar pilares de valor
  if (!Array.isArray(config.pilares) || config.pilares.length === 0) {
    config.pilares = PILARES_DEFAULT;
  }

  // Normalizar recuadros hero
  if (!Array.isArray(config.recuadros_hero) || config.recuadros_hero.length === 0) {
    config.recuadros_hero = RECUADROS_HERO_DEFAULT;
  } else {
    // Si la configuración guardada previa tiene "+15" o abreviatura "Rep.", reformularlos automáticamente
    config.recuadros_hero = config.recuadros_hero.map((r) => {
      let d = r.destacado || '';
      let s = r.subtitulo || '';
      if (d === '+15' || d.includes('15')) {
        d = 'Distribución';
        if (!s || s === 'Marcas Líderes Globales') {
          s = 'Marcas Globales de Prestigio';
        }
      }
      if (s && s.includes('Rep. Mexicana')) {
        s = s.replace('Rep. Mexicana', 'República Mexicana');
      }
      return { ...r, destacado: d, subtitulo: s };
    });
  }

  return config;
}

export const EQUIPO_INICIAL: MiembroEquipo[] = [
  {
    id: '1',
    nombre: 'Roberto Ávila Silva',
    puesto: 'Director General & Operaciones',
    departamento: 'Dirección',
    nivelJerarquico: 1,
    foto_url: '',
    telefono: '9157260022',
    codigo_pais: '+1',
    email: 'Roberto@remindustrial.mx',
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
