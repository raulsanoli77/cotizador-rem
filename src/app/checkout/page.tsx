'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useCartStore } from '@/stores/cart-store';
import { formatearPrecio } from '@/lib/pricing/engine';
import { Loader2, ShieldCheck, MapPin, Building, Upload, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
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

  const [guardarDireccion, setGuardarDireccion] = useState(true);
  const [usarDireccionGuardada, setUsarDireccionGuardada] = useState(false);
  
  const [esPoVerbal, setEsPoVerbal] = useState(false);
  const [numeroPo, setNumeroPo] = useState('');
  const [archivoPo, setArchivoPo] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      // Precargar datos si existen
      if (perfilData.calle && perfilData.num_exterior && perfilData.ciudad && perfilData.estado && perfilData.codigo_postal) {
        setCalle(perfilData.calle);
        setNumExterior(perfilData.num_exterior);
        setNumInterior(perfilData.num_interior || '');
        setColonia(perfilData.colonia || '');
        setCiudad(perfilData.ciudad);
        setEstado(perfilData.estado);
        setCodigoPostal(perfilData.codigo_postal);
        setUsarDireccionGuardada(true);
        setGuardarDireccion(false);
      }

      setLoading(false);
    }

    initCheckout();
  }, [items.length, router]);

  const handleCPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setCodigoPostal(val);
    if (val.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/mx/${val}`);
        if (res.ok) {
          const data = await res.json();
          if (data.places && data.places.length > 0) {
            setEstado(data.places[0].state);
            
            // Extraer todos los lugares (colonias) sugeridos
            const lugares = data.places.map((p: any) => p['place name']);
            setSugerenciasLugares(lugares);
            
            // Si solo hay una opción, la ponemos directo en colonia
            if (lugares.length === 1) {
              setColonia(lugares[0]);
            } else {
              setColonia(''); // Para que desplieguen y elijan
            }
            // Zippopotam a veces mezcla ciudad con colonia, lo dejamos en blanco si son varias opciones
            // para que el usuario escriba su ciudad correcta.
          }
        }
      } catch (err) {
        // Ignoramos silenciosamente si la API falla
      }
    } else {
      setSugerenciasLugares([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoPo(e.target.files[0]);
    }
  };

  const procesarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esPoVerbal && !numeroPo) {
      setErrorStr('Debes proporcionar un Número de PO o seleccionar Orden Verbal.');
      return;
    }
    if (!calle || !numExterior || !colonia || !ciudad || !estado || !codigoPostal) {
      setErrorStr('Los campos obligatorios de la dirección de envío deben estar completos.');
      return;
    }

    setProcesando(true);
    setErrorStr(null);

    try {
      let poUrl = '';

      if (archivoPo) {
        const fileExt = archivoPo.name.split('.').pop();
        const fileName = `${cliente.id}/${Date.now()}-PO.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('ordenes_compra')
          .upload(fileName, archivoPo);
        
        if (uploadError) throw new Error('Error al subir el archivo PO: ' + uploadError.message);
        poUrl = uploadData.path;
      }

      const subtotal = obtenerSubtotal();
      const iva = subtotal * 0.16;
      const total = subtotal + iva;
      const moneda = items[0]?.producto.moneda_venta || 'USD';

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
        numero_po: esPoVerbal ? 'VERBAL' : numeroPo,
        es_po_verbal: esPoVerbal,
        po_url: poUrl,
        calle,
        num_exterior: numExterior,
        num_interior: numInterior,
        colonia,
        ciudad,
        estado,
        codigo_postal: codigoPostal,
        flete_urgente: fleteUrgente,
        notas_cliente: notas,
        subtotal,
        iva,
        total,
        moneda,
        partidas,
        guardar_direccion: guardarDireccion,
      });

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
            <h1 className="text-3xl font-bold text-slate-900 mb-4">¡Pedido Recibido!</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Tu Orden de Compra ha sido procesada con éxito y enviada a nuestro equipo para su surtido. Recibirás confirmaciones sobre el envío a tu correo.
            </p>
            <Link 
              href="/catalogo"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-brand-600/20"
            >
              Volver al Catálogo
            </Link>
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
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
            <p className="text-slate-500 mb-8">Tu carrito está vacío.</p>
            <Link href="/catalogo" className="text-brand-600 font-bold hover:underline">Ir al catálogo</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-32 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/catalogo" className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-brand-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout B2B</h1>
              <p className="text-slate-500">Completa tu orden de compra formal</p>
            </div>
          </div>

          <form onSubmit={procesarPedido} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Formulario (Left Column) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Sección: Orden de Compra */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-brand-50 p-2.5 rounded-lg text-brand-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Orden de Compra (PO)</h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <input 
                      type="checkbox" 
                      id="poVerbal"
                      checked={esPoVerbal}
                      onChange={(e) => setEsPoVerbal(e.target.checked)}
                      className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                    />
                    <label htmlFor="poVerbal" className="font-medium text-slate-700 cursor-pointer">
                      Es una Orden Verbal (Sin documento formal)
                    </label>
                  </div>

                  {!esPoVerbal && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Número de PO *</label>
                        <input 
                          type="text" 
                          required={!esPoVerbal}
                          value={numeroPo}
                          onChange={(e) => setNumeroPo(e.target.value)}
                          placeholder="Ej. PO-2023-001"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Adjuntar PDF (Opcional)</label>
                        <div 
                          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 font-medium">
                            {archivoPo ? archivoPo.name : 'Haz clic para seleccionar o arrastra tu archivo PDF'}
                          </p>
                          <input 
                            type="file" 
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sección: Dirección de Envío */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-brand-50 p-2.5 rounded-lg text-brand-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Dirección de Envío</h2>
                </div>

                {usarDireccionGuardada ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Dirección Predeterminada</p>
                    <p className="font-medium text-slate-900 mb-1">{calle} {numExterior} {numInterior ? `Int. ${numInterior}` : ''}</p>
                    <p className="text-slate-600 mb-4">{colonia ? `${colonia}, ` : ''}{ciudad}, {estado}. CP {codigoPostal}</p>
                    <button 
                      type="button" 
                      onClick={() => {
                        setUsarDireccionGuardada(false);
                        setCalle('');
                        setNumExterior('');
                        setNumInterior('');
                        setColonia('');
                        setCiudad('');
                        setEstado('');
                        setCodigoPostal('');
                        setGuardarDireccion(true);
                      }}
                      className="text-sm text-brand-600 hover:text-brand-700 font-bold hover:underline"
                    >
                      Ingresar una dirección diferente
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Código Postal *</label>
                      <input 
                        type="text" 
                        required
                        value={codigoPostal}
                        onChange={handleCPChange}
                        placeholder="Ej. 31100"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Al teclear los 5 dígitos buscaremos tu Estado y Ciudad.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Estado *</label>
                      <input 
                        type="text" 
                        required
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Ciudad / Municipio *</label>
                      <input 
                        type="text" 
                        required
                        value={ciudad}
                        list="sugerencias-ciudad"
                        onChange={(e) => setCiudad(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                      <datalist id="sugerencias-ciudad">
                        {sugerenciasLugares.map((lugar, i) => (
                          <option key={`muni-${i}`} value={lugar} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Colonia / Localidad *</label>
                      <input 
                        type="text" 
                        required
                        value={colonia}
                        list="sugerencias-colonia"
                        onChange={(e) => setColonia(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                      <datalist id="sugerencias-colonia">
                        {sugerenciasLugares.map((lugar, i) => (
                          <option key={`col-${i}`} value={lugar} />
                        ))}
                      </datalist>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Calle *</label>
                      <input 
                        type="text" 
                        required
                        value={calle}
                        onChange={(e) => setCalle(e.target.value)}
                        placeholder="Av. Principal, Blvd..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">No. Exterior *</label>
                      <input 
                        type="text" 
                        required
                        value={numExterior}
                        onChange={(e) => setNumExterior(e.target.value)}
                        placeholder="Ej. 123, S/N"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">No. Interior (Opcional)</label>
                      <input 
                        type="text" 
                        value={numInterior}
                        onChange={(e) => setNumInterior(e.target.value)}
                        placeholder="Nave 3, Local B..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Notas de Entrega (Opcional)</label>
                      <textarea 
                        rows={2}
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Horarios, referencias o instrucciones especiales..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                      />
                    </div>
                    
                    {/* Checkbox Urgente */}
                    <div className="sm:col-span-2 pt-4 border-t border-slate-100 mt-2">
                      <div className="flex items-start gap-3 bg-brand-50 p-4 rounded-xl border border-brand-100">
                        <input 
                          type="checkbox" 
                          id="fleteUrg"
                          checked={fleteUrgente}
                          onChange={(e) => setFleteUrgente(e.target.checked)}
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 mt-0.5"
                        />
                        <label htmlFor="fleteUrg" className="font-medium text-slate-800 cursor-pointer">
                          ⚡ Necesito flete URGENTE (Cotizar envío prioritario)
                          <p className="text-xs text-slate-500 font-normal mt-1">
                            Calcularemos la tarifa del envío más rápido disponible para tus productos.
                          </p>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2 pt-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="guardarDir"
                          checked={guardarDireccion}
                          onChange={(e) => setGuardarDireccion(e.target.checked)}
                          className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                        />
                        <label htmlFor="guardarDir" className="font-medium text-slate-700 cursor-pointer">
                          Guardar esta dirección en mi perfil para futuras compras
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen (Right Column) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 text-white sticky top-28">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-brand-400" /> Resumen del Pedido
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
                    <span>Total a Pagar</span>
                    <span className="text-brand-400">{formatearPrecio(obtenerSubtotal() * 1.16, items[0]?.producto.moneda_venta || 'USD')}</span>
                  </div>
                </div>

                {perfil?.terminos_pago && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-medium mb-1">Condiciones Comerciales Aplicadas:</p>
                    <p className="text-sm font-bold text-brand-300">{perfil.terminos_pago}</p>
                  </div>
                )}

                {errorStr && (
                  <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center font-medium">
                    {errorStr}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full mt-8 bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  {procesando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar y Procesar Pedido'}
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-4">
                  Al confirmar, generaremos la orden oficial en el sistema. Los tiempos de entrega serán confirmados vía correo.
                </p>
              </div>
            </div>

          </form>
        </div>
      </main>
    </>
  );
}
