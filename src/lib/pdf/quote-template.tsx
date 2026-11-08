import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

export interface QuotePDFProps {
  folio: string;
  fecha: string;
  cliente: {
    nombre_completo: string;
    empresa: string;
    email: string;
    telefono: string;
  };
  partidas: Array<{
    cantidad: number;
    marca: string;
    numero_parte: string;
    descripcion: string;
    precio_unitario: number;
    total: number;
    requiere_confirmacion?: boolean;
  }>;
  subtotal: number;
  moneda: 'USD' | 'MXN';
  config: {
    empresa: { nombre: string; rfc?: string; direccion?: string; email?: string; telefono?: string; pagina_web?: string };
    logoUrl?: string;
    textLegal?: string;
    sitioWeb?: string;
  };
  vendedor?: {
    nombre: string;
    email: string;
    telefono: string;
  } | null;
}

export function generarFolio(): string {
  const timestamp = Date.now().toString().slice(-6);
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const rand =
    chars.charAt(Math.floor(Math.random() * chars.length)) +
    chars.charAt(Math.floor(Math.random() * chars.length));
  const year = new Date().getFullYear();
  return `REM-${year}-${timestamp}${rand}`;
}

export function formatearMoneda(valor: number, moneda: 'USD' | 'MXN'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moneda,
  }).format(valor);
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 34,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#334155',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#0f172a',
  },
  topCyanBar: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#0284c7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 14,
  },
  companyCol: {
    width: '56%',
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 8,
    color: '#0284c7',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyMeta: {
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.3,
  },
  quoteMetaCol: {
    width: '42%',
    alignItems: 'flex-end',
  },
  badgePill: {
    backgroundColor: '#0f172a',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 4,
    marginBottom: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748b',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  vigenciaValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#b45309',
  },

  /* Dos tarjetas superiores: Cliente y Asesor */
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  clientCard: {
    width: '56%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    padding: 8,
  },
  advisorCard: {
    width: '42%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 5,
    padding: 8,
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#0f172a',
    borderBottomWidth: 0.8,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  advisorCardTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#166534',
    borderBottomWidth: 0.8,
    borderBottomColor: '#86efac',
    paddingBottom: 3,
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 7.8,
    color: '#64748b',
    width: 62,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 7.8,
    color: '#1e293b',
    flex: 1,
  },

  /* Tabla de partidas */
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    alignItems: 'center',
  },
  tableHeaderCol: {
    color: '#ffffff',
    fontSize: 7.8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.8,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { width: '4%', fontSize: 7.5, color: '#64748b' },
  col2: { width: '8%', textAlign: 'center', fontSize: 7.8, fontWeight: 'bold', color: '#0f172a' },
  col3: { width: '13%', fontSize: 7.8, fontWeight: 'bold', color: '#0284c7' },
  col4: { width: '18%', fontSize: 7.8, fontWeight: 'bold', color: '#0f172a' },
  col5: { width: '33%', fontSize: 7.5, color: '#334155', paddingRight: 4 },
  col6: { width: '12%', textAlign: 'right', fontSize: 7.8, color: '#334155' },
  col7: { width: '12%', textAlign: 'right', fontSize: 7.8, fontWeight: 'bold', color: '#0f172a' },

  /* Totales */
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  totalsBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  taxNote: {
    fontSize: 7.2,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 2,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 3,
  },

  /* Cláusulas legales de protección (Cortas y claras) */
  disclaimerBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  disclaimerTitle: {
    fontSize: 7.8,
    fontWeight: 'bold',
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  disclaimerBullet: {
    fontSize: 7.2,
    color: '#78350f',
    marginBottom: 2.5,
    lineHeight: 1.28,
  },
  disclaimerBold: {
    fontWeight: 'bold',
    color: '#92400e',
  },

  /* Banner CTA (Para solicitar cotización formal) */
  ctaBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaLeft: {
    width: '68%',
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 7.8,
    fontWeight: 'bold',
  },
  ctaSubtitle: {
    color: '#94a3b8',
    fontSize: 7,
    marginTop: 1.5,
  },
  ctaRight: {
    width: '30%',
    alignItems: 'flex-end',
  },
  ctaButtonText: {
    color: '#38bdf8',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  ctaPhoneText: {
    color: '#4ade80',
    fontSize: 7.2,
    fontWeight: 'bold',
    marginTop: 1,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 34,
    right: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.8,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 6.8,
    color: '#94a3b8',
  },
});

export const QuotePDFDocument: React.FC<QuotePDFProps> = ({
  folio,
  fecha,
  cliente,
  partidas,
  subtotal,
  moneda,
  config,
  vendedor,
}) => {
  // Asesor por defecto si no viene especificado
  const asesorFinal = {
    nombre: vendedor?.nombre || 'Raúl Sánchez',
    email: vendedor?.email || 'ventas3@remindustrial.mx',
    telefono: vendedor?.telefono || '614 181 5170',
  };

  const sitioWebFinal =
    config.sitioWeb ||
    config.empresa.pagina_web ||
    'www.remindustrial.mx';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.topAccentBar} />
        <View style={styles.topCyanBar} />

        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.companyCol}>
            {config.logoUrl ? (
              <Image src={config.logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{config.empresa.nombre || 'REM Industrial'}</Text>
            )}
            <Text style={styles.tagline}>
              Herramientas de Corte · Metrología · MRO Industrial
            </Text>
            <Text style={styles.companyMeta}>
              REM Industrial Supplies · Matriz Cd. Juárez & Chihuahua, Chih.
            </Text>
            <Text style={styles.companyMeta}>
              Web: {sitioWebFinal} · Atención: {asesorFinal.email}
            </Text>
          </View>

          <View style={styles.quoteMetaCol}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>COTIZACIÓN INFORMATIVA</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Folio:</Text>
              <Text style={styles.metaValue}>{folio}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha:</Text>
              <Text style={styles.metaValue}>{fecha}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Moneda:</Text>
              <Text style={styles.metaValue}>{moneda}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Vigencia:</Text>
              <Text style={styles.vigenciaValue}>Al día de consulta (Sujeta a cambios)</Text>
            </View>
          </View>
        </View>

        {/* Dos tarjetas: Datos del Solicitante y Asesor Comercial */}
        <View style={styles.cardsContainer}>
          {/* Tarjeta Solicitante */}
          <View style={styles.clientCard}>
            <Text style={styles.cardTitle}>Datos del Solicitante</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Empresa:</Text>
              <Text style={styles.cardValue}>{cliente.empresa || 'Cliente General'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Contacto:</Text>
              <Text style={styles.cardValue}>{cliente.nombre_completo || 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Email:</Text>
              <Text style={styles.cardValue}>{cliente.email || 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Teléfono:</Text>
              <Text style={styles.cardValue}>{cliente.telefono || 'Sin teléfono'}</Text>
            </View>
          </View>

          {/* Tarjeta Asesor Asignado */}
          <View style={styles.advisorCard}>
            <Text style={styles.advisorCardTitle}>Asesor Comercial Asignado</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Asesor:</Text>
              <Text style={styles.cardValue}>{asesorFinal.nombre}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Correo:</Text>
              <Text style={styles.cardValue}>{asesorFinal.email}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Tel / WA:</Text>
              <Text style={styles.cardValue}>{asesorFinal.telefono}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Atención:</Text>
              <Text style={{ ...styles.cardValue, color: '#166534', fontWeight: 'bold' }}>
                Formalización y tiempos de entrega
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla de Partidas */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col1 }}>#</Text>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col2 }}>Cant.</Text>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col3 }}>Marca</Text>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col4 }}>No. Parte</Text>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col5 }}>Descripción</Text>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col6 }}>P. Unit.</Text>
            <Text style={{ ...styles.tableHeaderCol, ...styles.col7 }}>Total</Text>
          </View>

          {partidas.map((item, index) => {
            const isAlt = index % 2 === 1;
            return (
              <View key={index} style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>{item.cantidad}</Text>
                <Text style={styles.col3}>{item.marca}</Text>
                <Text style={styles.col4}>{item.numero_parte}</Text>
                <Text style={styles.col5}>
                  {item.descripcion}
                  {item.requiere_confirmacion && (
                    <Text style={{ color: '#b45309', fontWeight: 'bold' }}>
                      {' '}[Precio sujeto a confirmación]
                    </Text>
                  )}
                </Text>
                <Text style={styles.col6}>{formatearMoneda(item.precio_unitario, moneda)}</Text>
                <Text style={styles.col7}>{formatearMoneda(item.total, moneda)}</Text>
              </View>
            );
          })}
        </View>

        {/* Sección de Totales */}
        <View style={styles.totalsSection} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal ({moneda}):</Text>
              <Text style={styles.totalValue}>{formatearMoneda(subtotal, moneda)}</Text>
            </View>
            <Text style={styles.taxNote}>
              * Precios antes de I.V.A. (16% o tasa fronteriza 8% sujeta a cumplimiento fiscal). El costo de flete se especifica en la cotización formal.
            </Text>
          </View>
        </View>

        {/* Cláusulas de Protección (Cortas y Contundentes) */}
        <View style={styles.disclaimerBox} wrap={false}>
          <Text style={styles.disclaimerTitle}>
            Condiciones de esta Cotización Informativa:
          </Text>
          <Text style={styles.disclaimerBullet}>
            • <Text style={styles.disclaimerBold}>Sin vigencia de precio:</Text> Precios informativos al momento de su consulta, válidos únicamente al día de emisión y sujetos a cambio sin previo aviso hasta emitirse una cotización formal.
          </Text>
          <Text style={styles.disclaimerBullet}>
            • <Text style={styles.disclaimerBold}>Disponibilidad y Stock:</Text> No garantiza existencias, apartado de mercancía ni tiempos de entrega (ETA). La disponibilidad definitiva se confirma en la cotización formal.
          </Text>
          <Text style={styles.disclaimerBullet}>
            • <Text style={styles.disclaimerBold}>Precios:</Text> Precios y especificaciones sujetos a validación. REM Industrial se reserva el derecho de corregir cualquier error involuntario de captura, sistema o catálogo previo a la confirmación del pedido.
          </Text>
          <Text style={styles.disclaimerBullet}>
            • <Text style={styles.disclaimerBold}>Flete e Impuestos:</Text> Precios antes de I.V.A. No incluye gastos de envío ni seguro de traslado; el costo de flete se especifica en la cotización formal.
          </Text>
        </View>

        {/* Banner CTA para Solicitar Cotización Formal y Registro */}
        <View style={styles.ctaBanner} wrap={false}>
          <View style={styles.ctaLeft}>
            <Text style={styles.ctaTitle}>
              ¿Deseas asegurar precio, tiempos de entrega o tramitar tu orden?
            </Text>
            <Text style={styles.ctaSubtitle}>
              Solicita tu Cotización Formal con tu asesor asignado o regístrate en nuestro portal para precios preferenciales y crédito comercial.
            </Text>
          </View>
          <View style={styles.ctaRight}>
            <Text style={styles.ctaButtonText}>{asesorFinal.email}</Text>
            <Text style={styles.ctaPhoneText}>WhatsApp: {asesorFinal.telefono}</Text>
          </View>
        </View>

        {/* Pie de Página */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            REM Industrial Supplies · Especialistas en herramientas de corte, metrología y MRO para la industria metalmecánica y maquiladora.
          </Text>
          <Text style={styles.footerText}>
            Documento preliminar sin validez fiscal
          </Text>
        </View>
      </Page>
    </Document>
  );
};
