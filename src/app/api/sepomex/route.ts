import { NextResponse } from 'next/server';

// Caché en memoria para evitar llamadas redundantes y responder instantáneamente
const cpCache = new Map<string, {
  estado: string;
  ciudad: string;
  municipio: string;
  colonias: string[];
  fuente: string;
}>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cp = searchParams.get('cp')?.trim();

  if (!cp || cp.length !== 5 || !/^\d{5}$/.test(cp)) {
    return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 });
  }

  // Si ya lo tenemos en caché, devolver inmediatamente
  if (cpCache.has(cp)) {
    return NextResponse.json(cpCache.get(cp));
  }

  // 1. Intentar con sepomex.kurenn.dev (Base oficial SEPOMEX completa del Servicio Postal Mexicano)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
        // La ciudad oficial o en su defecto el municipio (nunca la colonia)
        const ciudad = first.d_ciudad || first.d_mnpio || '';
        const municipio = first.d_mnpio || '';
        
        // Obtener todas las colonias sin duplicados
        const coloniasSet = new Set<string>();
        data.zip_codes.forEach((z: any) => {
          if (z.d_asenta) coloniasSet.add(z.d_asenta.trim());
        });
        const colonias = Array.from(coloniasSet);

        const result = {
          estado,
          ciudad,
          municipio,
          colonias,
          fuente: 'sepomex'
        };

        cpCache.set(cp, result);
        return NextResponse.json(result);
      }
    }
  } catch (err) {
    console.warn('[SEPOMEX API] Error o timeout en servicio primario SEPOMEX:', err);
  }

  // 2. Fallback secundario: Zippopotam
  // NOTA: Zippopotam en México devuelve colonias en "place name", no la ciudad.
  // Por lo tanto, extraemos el estado y las colonias, pero dejamos ciudad vacía
  // para que el usuario pueda escribir su ciudad real y no se confunda con la colonia.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const resFallback = await fetch(`https://api.zippopotam.us/mx/${cp}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resFallback.ok) {
      const data = await resFallback.json();
      if (data.places && data.places.length > 0) {
        const estado = data.places[0].state || '';
        const coloniasSet = new Set<string>();
        data.places.forEach((p: any) => {
          if (p['place name']) coloniasSet.add(p['place name'].trim());
        });
        const colonias = Array.from(coloniasSet);

        const result = {
          estado,
          ciudad: '', // Dejar en blanco para que el usuario escriba su ciudad y no la colonia
          municipio: '',
          colonias,
          fuente: 'zippopotam'
        };

        cpCache.set(cp, result);
        return NextResponse.json(result);
      }
    }
  } catch (errFallback) {
    console.warn('[SEPOMEX API] Error en fallback:', errFallback);
  }

  return NextResponse.json({ error: 'Código postal no encontrado' }, { status: 404 });
}
