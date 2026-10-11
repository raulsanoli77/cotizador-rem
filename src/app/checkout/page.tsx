'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/stores/cart-store';
import { formatearPrecio } from '@/lib/pricing/engine';
import { Loader2, ShieldCheck, MapPin, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { crearPedidoB2B } from './actions';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';

export default function CheckoutB2BPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const obtenerSubtotal = useCartStore((s) => s.obtenerSubtotal);
  const limpiarCarrito = useCartStore((s) => s.limpiarCarrito);
  
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [folioGenerado, setFolioGenerado] = useState('');
  const [errorStr, setErrorStr] = useState<string | null>(null);
  
  const [cliente, setCliente] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);

  // Form State
  const [calle, setCalle] = useState('');
  const [numExterior, setNumExterior] = useState('');
  const [numInterior, setNumInterior] = useState('');
  const [colonia, setColonia] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [fleteUrgente, setFleteUrgente] = useState(false);
  const [notas, setNotas] = useState('');
  
  const [sugerenciasLugares, setSugerenciasLugares] = useState<string[]>([]);
  const [esColoniaManual, setEsColoniaManual] = useState(false);
  const [loadingCP, setLoadingCP] = useState(false);

  const [guardarDireccion, setGuardarDireccion] = useState(false);
  const [usarDireccionGuardada, setUsarDireccionGuardada] = useState(false);
  const [tieneUbicacionGuardada, setTieneUbicacionGuardada] = useState(false);

  useEffect(() => {
    async function initCheckout() {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const { data: perfilData } = await supabase
        .from('perfiles_clientes')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!perfilData || perfilData.estatus !== 'aprobado') {
        router.push('/cotizacion');
        return;
      }

      setCliente(session.user);
      setPerfil(perfilData);
      
      // Si tiene al menos código postal guardado en su perfil
      if (perfilData.codigo_postal) {
        setCalle(perfilData.calle || '');
        setNumExterior(perfilData.num_exterior || '');
        setNumInterior(perfilData.num_interior || '');
        setColonia(perfilData.colonia || '');
        setCiudad(perfilData.ciudad || '');
        setEstado(perfilData.estado || '');
        setCodigoPostal(perfilData.codigo_postal);
        setUsarDireccionGuardada(true);
        setTieneUbicacionGuardada(true);
      }

      setLoading(false);
    }

    initCheckout();
  }, [items.length, router]);

  const handleCPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setCodigoPostal(val);
    if (val.length === 5) {
      setLoadingCP(true);
      try {
        const res = await fetch(`/api/sepomex?cp=${val}`);
        if (res.ok) {
          const data = await res.json();
          if (data.estado) {
            setEstado(data.estado);
            setCiudad(data.ciudad || data.municipio || '');
            if (data.colonias && data.colonias.length > 0) {
              setSugerenciasLugares(data.colonias);
              setEsColoniaManual(false);
              setColonia(data.colonias.length === 1 ? data.colonias[0] : (data.colonias.includes(colonia) ? colonia : data.colonias[0]));
            }
          }
        }
      } catch (err) {
        // En caso de falla, el usuario puede teclear manualmente
      } finally {
        setLoadingCP(false);
      }
    } else {
      setSugerenciasLugares([]);
    }
  };

  const seleccionarDireccionGuardada = () => {
    setUsarDireccionGuardada(true);
    setErrorStr(null);
    if (perfil) {
      setCalle(perfil.calle || '');
      setNumExterior(perfil.num_exterior || '');
      setNumInterior(perfil.num_interior || '');
      setColonia(perfil.colonia || '');
      setCiudad(perfil.ciudad || '');
      setEstado(perfil.estado || '');
      setCodigoPostal(perfil.codigo_postal || '');
    }
  };

  const seleccionarNuevaDireccion = () => {
    setUsarDireccionGuardada(false);
    setErrorStr(null);
    setCalle('');
    setNumExterior('');
    setNumInterior('');
    setColonia('');
    setCiudad('');
    setEstado('');
    setCodigoPostal('');
    setSugerenciasLugares([]);
  };

  const procesarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();

    let cpFinal = codigoPostal;
    let ciudadFinal = ciudad;
    let estadoFinal = estado;
    let calleFinal = calle;
    let numExtFinal = numExterior;
    let numIntFinal = numInterior;
    let colFinal = colonia;

    // Si el usuario eligió usar su ubicación guardada, respaldar con los datos del perfil
    if (usarDireccionGuardada && perfil) {
      cpFinal = perfil.codigo_postal || cpFinal;
      ciudadFinal = perfil.ciudad || ciudadFinal;
      estadoFinal = perfil.estado || estadoFinal;
      calleFinal = perfil.calle || calleFinal;
      numExtFinal = perfil.num_exterior || numExtFinal;
      numIntFinal = perfil.num_interior || numIntFinal;
      colFinal = perfil.colonia || colFinal;
    }

    if (!cpFinal || !ciudadFinal || !estadoFinal) {
      setErrorStr('El Código Postal, Ciudad y Estado son obligatorios para calcular el flete.');
      return;
    }

    setProcesando(true);
    setErrorStr(null);

    try {
      const subtotal = obtenerSubtotal();
      const iva = subtotal * 0.16;
      const total = subtotal + iva;
      const moneda = items[0]?.producto.moneda_venta || 'USD';
      const folio = `${Date.now().toString().slice(-6)}`;

      const partidas = items.map(item => ({
        producto_id: item.producto.id,
        numero_parte: item.producto.numero_parte,
        marca: item.producto.marca,
        descripcion: formatearDescripcionProducto(item.producto),
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_venta,
        importe: item.producto.precio_venta * item.cantidad,
      }));

      await crearPedidoB2B({
        cliente_id: cliente.id,
        numero_po: folio,
        es_po_verbal: false,
        calle: calleFinal,
        num_exterior: numExtFinal,
        num_interior: numIntFinal,
        colonia: colFinal,
        ciudad: ciudadFinal,
        estado: estadoFinal,
        codigo_postal: cpFinal,
        flete_urgente: fleteUrgente,
        notas_cliente: notas,
        subtotal,
        iva,
        total,
        moneda,
        partidas,
        guardar_direccion: guardarDireccion,
      });

      setFolioGenerado(folio);
      setCompletado(true);
      limpiarCarrito();
    } catch (err: any) {
      setErrorStr(err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (completado) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 pt-32 pb-12 flex items-center justify-center">
          <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-100">
            <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">¡Cotización Registrada!</h1>
            <p className="text-sm font-semibold text-brand-600 mb-4 tracking-wider uppercase">Folio: {folioGenerado}</p>
            <p className="text-slate-600 mb-8 leading-relaxed text-sm">
              Tu solicitud de cotización formal ha sido enviada con éxito. Nuestro equipo de ventas revisará tiempos de entrega y el mejor costo de flete según tu código postal para ponerse en contacto contigo a la brevedad.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/cuenta/pedidos"
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-brand-600/20 text-sm"
              >
                Ver Mis Cotizaciones
              </Link>
              <Link 
                href="/catalogo"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Volver al Catálogo
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 pt-32 pb-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Cotizador</h1>
            <p className="text-slate-500 mb-8">Tu carrito de cotización está vacío.</p>
            <Link href="/catalogo" className="text-brand-600 font-bold hover:underline">Ir al catálogo</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-100 pt-32 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/catalogo" className="p-2 bg-white rounded-lg shadow-sm border-2 border-slate-300 text-slate-600 hover:text-brand-600 hover:border-slate-400 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Solicitud de Cotización Formal</h1>
              <p className="text-slate-600 text-sm">Confirma los datos de entrega para calcular costos y tiempos de flete.</p>
            </div>
          </div>

          <form onSubmit={procesarCotizacion} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Formulario (Left Column) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Sección: Ubicación de Envío / Destino del Flete */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-brand-50 p-2.5 rounded-lg text-brand-600 border border-brand-200">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Destino de Entrega (Para Flete)</h2>
                    <p className="text-xs text-slate-600">El Código Postal es indispensable para calcular el costo de paquetería.</p>
                  </div>
                </div>

                {tieneUbicacionGuardada && (
                  <div className="space-y-3 mb-6">
                    <label 
                      onClick={seleccionarDireccionGuardada}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        usarDireccionGuardada ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="opcionUbicacion" 
                        checked={usarDireccionGuardada} 
                        onChange={seleccionarDireccionGuardada} 
                        className="mt-1 text-brand-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">Usar mi ubicación registrada</span>
                        <span className="text-xs text-slate-600 block mt-0.5 font-medium">
                          {perfil?.calle ? `${perfil.calle} ${perfil.num_exterior || ''}, ` : ''}{perfil?.colonia ? `Col. ${perfil.colonia}, ` : ''}{perfil?.ciudad || ''}, {perfil?.estado || ''}. CP {perfil?.codigo_postal || ''}
                        </span>
                      </div>
                    </label>

                    <label 
                      onClick={seleccionarNuevaDireccion}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        !usarDireccionGuardada ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20' : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="opcionUbicacion" 
                        checked={!usarDireccionGuardada} 
                        onChange={seleccionarNuevaDireccion} 
                        className="mt-1 text-brand-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">Cotizar para otra ubicación / obra</span>
                        <span className="text-xs text-slate-600 block mt-0.5 font-medium">
                          Ingresa un Código Postal diferente para esta cotización específica.
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                {(!tieneUbicacionGuardada || !usarDireccionGuardada) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-800 mb-1">Código Postal (5 dígitos) *</label>
                      <input 
                        type="text" 
                        required
                        maxLength={5}
                        value={codigoPostal}
                        onChange={handleCPChange}
                        placeholder="Ej. 31124"
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-bold tracking-wide text-sm transition-all focus:outline-none"
                      />
                      {loadingCP && <span className="text-[11px] text-brand-600 font-medium mt-1 block">Detectando ubicación...</span>}
                      <p className="text-[11px] text-slate-500 mt-1">Al ingresar tu C.P. detectaremos tu Estado y Ciudad automáticamente.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">Estado *</label>
                      <input 
                        type="text" 
                        required
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                        placeholder="Ej. Chihuahua"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">Ciudad o Municipio *</label>
                      <input 
                        type="text" 
                        required
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                        placeholder="Ej. Chihuahua"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      {sugerenciasLugares.length > 0 && !esColoniaManual ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-800">
                              Colonia / Fraccionamiento <span className="text-slate-500 font-normal">({sugerenciasLugares.length} opciones detectadas)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setEsColoniaManual(true)}
                              className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold hover:underline"
                            >
                              ✏️ Escribir otra manualmente
                            </button>
                          </div>
                          <select
                            value={colonia}
                            onChange={(e) => {
                              if (e.target.value === '__OTRA__') {
                                setEsColoniaManual(true);
                                setColonia('');
                              } else {
                                setColonia(e.target.value);
                              }
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 text-sm font-medium cursor-pointer shadow-sm transition-all focus:outline-none"
                          >
                            <option value="">-- Selecciona tu colonia ({sugerenciasLugares.length} disponibles) --</option>
                            {sugerenciasLugares.map((lugar, i) => (
                              <option key={`col-${i}`} value={lugar}>{lugar}</option>
                            ))}
                            <option value="__OTRA__">✏️ Otra colonia (no está en la lista)...</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-800">
                              Colonia <span className="text-slate-500 font-normal">(Opcional)</span>
                            </label>
                            {sugerenciasLugares.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEsColoniaManual(false);
                                  if (!colonia && sugerenciasLugares.length > 0) {
                                    setColonia(sugerenciasLugares[0]);
                                  }
                                }}
                                className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold hover:underline"
                              >
                                📋 Ver lista desplegable ({sugerenciasLugares.length})
                              </button>
                            )}
                          </div>
                          <input 
                            type="text" 
                            value={colonia}
                            onChange={(e) => setColonia(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                            placeholder="Ej. Lomas del Santuario, Misión Universidad..."
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">Calle <span className="text-slate-500 font-normal">(Opcional)</span></label>
                      <input 
                        type="text" 
                        value={calle}
                        onChange={(e) => setCalle(e.target.value)}
                        placeholder="Av. Industrial..."
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">No. Exterior <span className="text-slate-500 font-normal">(Opcional)</span></label>
                      <input 
                        type="text" 
                        value={numExterior}
                        onChange={(e) => setNumExterior(e.target.value)}
                        placeholder="Ej. 1234"
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="guardarDir"
                          checked={guardarDireccion}
                          onChange={(e) => setGuardarDireccion(e.target.checked)}
                          className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                        />
                        <label htmlFor="guardarDir" className="text-xs text-slate-800 font-medium cursor-pointer">
                          Guardar esta dirección en mi cuenta para futuras cotizaciones
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkbox Urgente */}
                <div className="pt-4 border-t-2 border-slate-200 mt-6">
                  <div className="flex items-start gap-3 bg-brand-50/70 p-4 rounded-xl border-2 border-brand-200">
                    <input 
                      type="checkbox" 
                      id="fleteUrg"
                      checked={fleteUrgente}
                      onChange={(e) => setFleteUrgente(e.target.checked)}
                      className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 mt-0.5"
                    />
                    <label htmlFor="fleteUrg" className="font-semibold text-slate-900 cursor-pointer text-sm">
                      ⚡ Requiere flete URGENTE / Prioritario
                      <p className="text-xs text-slate-600 font-normal mt-0.5">
                        Tu asesor buscará la opción de paquetería express más rápida disponible.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Comentarios del cliente */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Notas adicionales o requerimientos de entrega <span className="text-slate-500 font-normal">(Opcional)</span>
                  </label>
                  <textarea 
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej. Entregar en horario de 8 a 15 hrs, maniobra en rampa, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm resize-none focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Resumen (Right Column) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 text-white sticky top-28">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-brand-400" /> Resumen de Cotización
                </h2>
                
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {items.map(item => (
                    <div key={item.producto.id} className="flex justify-between items-start gap-4 text-sm border-b border-slate-800 pb-4">
                      <div>
                        <p className="font-bold text-slate-100">{item.producto.numero_parte}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{formatearDescripcionProducto(item.producto)}</p>
                        <p className="text-xs text-brand-400 mt-1">Cant: {item.cantidad}</p>
                      </div>
                      <p className="font-semibold shrink-0">
                        {formatearPrecio(item.producto.precio_venta * item.cantidad, item.producto.moneda_venta)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>{formatearPrecio(obtenerSubtotal(), items[0]?.producto.moneda_venta || 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>IVA (16%)</span>
                    <span>{formatearPrecio(obtenerSubtotal() * 0.16, items[0]?.producto.moneda_venta || 'USD')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-slate-800">
                    <span>Total Estimado</span>
                    <span className="text-brand-400">{formatearPrecio(obtenerSubtotal() * 1.16, items[0]?.producto.moneda_venta || 'USD')}</span>
                  </div>
                </div>

                {perfil?.descuento_porcentaje ? (
                  <div className="mt-6 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
                    <span className="font-bold block text-sm text-brand-200">Descuento Preferencial: {perfil.descuento_porcentaje}%</span>
                    Tus precios en catálogo ya incluyen este beneficio comercial.
                  </div>
                ) : null}

                {errorStr && (
                  <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center font-medium">
                    {errorStr}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full mt-6 bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none text-base"
                >
                  {procesando ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Registrando solicitud...</>
                  ) : (
                    <><Send className="h-5 w-5" /> Solicitar Cotización Formal</>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-4 leading-normal">
                  Tu asesor comercial validará existencias, tiempos de entrega y flete según tu Código Postal para contactarte por WhatsApp o correo.
                </p>
              </div>
            </div>

          </form>
        </div>
      </main>
    </>
  );
}
