import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cp = searchParams.get('cp')?.trim();

  if (!cp || cp.length !== 5) {
    return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 });
  }

  // 1. Intentar con sepomex.kurenn.dev (Base oficial SEPOMEX completa sin token)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://sepomex.kurenn.dev/api/v1/zip_codes?zip_code=${cp}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.zip_codes && data.zip_codes.length > 0) {
        const first = data.zip_codes[0];
        const estado = first.d_estado || '';
        const ciudad = first.d_ciudad || first.d_mnpio || '';
        const colonias = data.zip_codes.map((z: any) => z.d_asenta).filter(Boolean);

        return NextResponse.json({
          estado,
          ciudad,
          municipio: first.d_mnpio || '',
          colonias,
          fuente: 'sepomex'
        });
      }
    }
  } catch (err) {
    console.warn('[SEPOMEX API] Error o timeout en servicio primario:', err);
  }

  // 2. Fallback secundario: Zippopotam
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const resFallback = await fetch(`https://api.zippopotam.us/mx/${cp}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resFallback.ok) {
      const data = await resFallback.json();
      if (data.places && data.places.length > 0) {
        const estado = data.places[0].state || '';
        const ciudad = data.places[0]['place name'] || '';
        const colonias = data.places.map((p: any) => p['place name']).filter(Boolean);

        return NextResponse.json({
          estado,
          ciudad,
          colonias,
          fuente: 'zippopotam'
        });
      }
    }
  } catch (errFallback) {
    console.warn('[SEPOMEX API] Error en fallback:', errFallback);
  }

  return NextResponse.json({ error: 'Código postal no encontrado' }, { status: 404 });
}
