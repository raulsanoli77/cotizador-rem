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
  }>;
  subtotal: number;
  moneda: 'USD' | 'MXN';
  config: {
    empresa: { nombre: string; rfc?: string; direccion?: string; email?: string; telefono?: string };
    logoUrl?: string;
    textLegal: string;
  };
}

export function generarFolio(): string {
  const timestamp = Date.now().toString().slice(-5);
  const year = new Date().getFullYear();
  return `REM-${year}-${timestamp}`;
}

export function formatearMoneda(valor: number, moneda: 'USD' | 'MXN'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: moneda,
  }).format(valor);
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    position: 'relative',
  },
  headerBar: {
    backgroundColor: '#0f172a',
    height: 10,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
    marginTop: 10,
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: '#2563eb',
    marginBottom: 4,
  },
  companyDetails: {
    color: '#666666',
    fontSize: 9,
  },
  quoteInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  quoteDetailText: {
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  clientSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  clientTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  clientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clientItem: {
    width: '50%',
    marginBottom: 8,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    fontSize: 9,
  },
  col1: { width: '5%' },
  col2: { width: '10%', textAlign: 'center' },
  col3: { width: '15%' },
  col4: { width: '20%' },
  col5: { width: '26%' },
  col6: { width: '12%', textAlign: 'right' },
  col7: { width: '12%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subtotalLabel: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtotalValue: {
    fontWeight: 'bold',
  },
  disclaimerSection: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
    marginBottom: 30,
  },
  disclaimerText: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
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
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <View style={styles.headerBar} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {config.logoUrl ? (
            <Image src={config.logoUrl} style={{ width: 120, marginBottom: 8 }} />
          ) : (
            <Text style={styles.companyName}>{config.empresa.nombre}</Text>
          )}
          <Text style={styles.tagline}>Integrador Técnico de Herramientas Industriales</Text>
          {config.empresa.rfc && <Text style={styles.companyDetails}>RFC: {config.empresa.rfc}</Text>}
          {config.empresa.direccion && <Text style={styles.companyDetails}>Dirección: {config.empresa.direccion}</Text>}
        </View>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
          <Text style={styles.quoteDetailText}><Text style={styles.bold}>Folio:</Text> {folio}</Text>
          <Text style={styles.quoteDetailText}><Text style={styles.bold}>Fecha:</Text> {fecha}</Text>
          <Text style={styles.quoteDetailText}><Text style={styles.bold}>Moneda:</Text> {moneda}</Text>
        </View>
      </View>

      {/* Client Section */}
      <View style={styles.clientSection}>
        <Text style={styles.clientTitle}>Datos del Cliente</Text>
        <View style={styles.clientGrid}>
          <View style={styles.clientItem}>
            <Text><Text style={styles.bold}>Nombre:</Text> {cliente.nombre_completo}</Text>
          </View>
          <View style={styles.clientItem}>
            <Text><Text style={styles.bold}>Empresa:</Text> {cliente.empresa}</Text>
          </View>
          <View style={styles.clientItem}>
            <Text><Text style={styles.bold}>Email:</Text> {cliente.email}</Text>
          </View>
          <View style={styles.clientItem}>
            <Text><Text style={styles.bold}>Teléfono:</Text> {cliente.telefono}</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>#</Text>
          <Text style={styles.col2}>Cant.</Text>
          <Text style={styles.col3}>Marca</Text>
          <Text style={styles.col4}>No. Parte</Text>
          <Text style={styles.col5}>Descripción</Text>
          <Text style={styles.col6}>P. Unit.</Text>
          <Text style={styles.col7}>Total</Text>
        </View>
        
        {partidas.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col1}>{index + 1}</Text>
            <Text style={styles.col2}>{item.cantidad}</Text>
            <Text style={styles.col3}>{item.marca}</Text>
            <Text style={styles.col4}>{item.numero_parte}</Text>
            <Text style={styles.col5}>{item.descripcion}</Text>
            <Text style={styles.col6}>{formatearMoneda(item.precio_unitario, moneda)}</Text>
            <Text style={styles.col7}>{formatearMoneda(item.total, moneda)}</Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{formatearMoneda(subtotal, moneda)}</Text>
          </View>
        </View>
      </View>

      {/* Legal Disclaimers */}
      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerText}>
          {config.textLegal}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Este documento es una cotización rápida con carácter informativo. Para una cotización formal contacte a {config.empresa.email || 'ventas@remindustrial.com'}</Text>
      </View>
    </Page>
  </Document>
);
