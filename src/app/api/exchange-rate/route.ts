import { NextResponse } from 'next/server';
import { obtenerTipoCambio } from '@/lib/pricing/exchange-rate';

export async function GET() {
  try {
    const tipoCambio = await obtenerTipoCambio();
    return NextResponse.json(tipoCambio);
  } catch (error) {
    console.error('[API/exchange-rate] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipo de cambio' },
      { status: 500 }
    );
  }
}
