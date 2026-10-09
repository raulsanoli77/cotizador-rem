'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Save, CheckCircle, Package, Calendar, Search, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import { actualizarPedido } from '@/app/admin/pedidos/[id]/actions';

export default function PedidoDetailAdmin({ pedido, partidas, productosOriginales }: { pedido: any, partidas: any[], productosOriginales: any[] }) {
  const router = useRouter();
  const [estatus, setEstatus] = useState(pedido.estatus);
  const [loading, setLoading] = useState(false);
  const [partidasState, setPartidasState] = useState(partidas);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [successStr, setSuccessStr] = useState<string | null>(null);

  // Estado para el buscador de alternativas por partida
  const [searchStates, setSearchStates] = useState<Record<string, { loading: boolean, error: string | null, query: string, show: boolean, tempProducto?: any }>>({});

  const handlePropChange = (id: string, prop: string, value: any) => {
    setPartidasState(prev => prev.map(p => p.id === id ? { ...p, [prop]: value } : p));
  };

  const toggleSugerirAlternativa = (id: string, show: boolean) => {
    setSearchStates(prev => ({
      ...prev,
      [id]: { ...prev[id], show, query: prev[id]?.query || '', error: null, loading: false }
    }));
    // Si la oculta, limpiamos los datos de la alternativa
    if (!show) {
      setPartidasState(prev => prev.map(p => p.id === id ? { 
        ...p, 
        alternativa_producto_id: null, 
        alternativa_numero_parte: null, 
        alternativa_marca: null, 
        alternativa_descripcion: null,
        alternativa_precio: null
      } : p));
    }
  };

  const buscarAlternativa = async (partidaId: string) => {
    const query = searchStates[partidaId]?.query?.trim();
    if (!query) return;

    setSearchStates(prev => ({ ...prev, [partidaId]: { ...prev[partidaId], loading: true, error: null } }));

    try {
      const { data: producto, error } = await supabase
        .from('productos')
        .select('*')
        .ilike('numero_parte', query)
        .eq('activo', true)
        .single();

      if (error || !producto) {
        throw new Error('Producto no encontrado en el catálogo');
      }

      // Fetch configs and exchange rate
      const [resMargenes, resCruces, resTC] = await Promise.all([
        supabase.from('configuracion').select('valor').eq('clave', 'marcas_margenes').maybeSingle(),
        supabase.from('configuracion').select('valor').eq('clave', 'marcas_cruce_volumen').maybeSingle(),
        fetch('/api/exchange-rate').then(res => res.json()).catch(() => ({ valor: 20.0 }))
      ]);

      const marcaKey = producto.marca ? producto.marca.toUpperCase() : '';
      const margenPersonalizado = marcaKey && resMargenes.data?.valor ? resMargenes.data.valor[marcaKey] : undefined;
      const aplicaCruce = marcaKey && resCruces.data?.valor ? resCruces.data.valor[marcaKey] : false;
      const tipoCambio = resTC.valor || 20.0;

      const { calcularPrecioVenta } = await import('@/lib/pricing/engine');
      
      const resultado = calcularPrecioVenta(
        producto.costo_base,
        producto.moneda_costo,
        pedido.moneda || 'MXN',
        tipoCambio,
        margenPersonalizado,
        aplicaCruce
      );

      let precioFinal = resultado.precioVenta;
      const descuentoCliente = pedido.perfil?.descuento_porcentaje || 0;
      if (descuentoCliente > 0) {
         precioFinal = precioFinal * (1 - (descuentoCliente / 100));
      }

      // Guardamos la alternativa PERO no la asignamos como "confirmada" todavía
      // Guardaremos temporalmente el producto buscado en el estado visual
      setSearchStates(prev => ({ 
        ...prev, 
        [partidaId]: { 
          ...prev[partidaId], 
          loading: false, 
          error: null,
          tempProducto: {
            id: producto.id,
            numero_parte: producto.numero_parte,
            marca: producto.marca,
            descripcion: formatearDescripcionProducto(producto),
            precio: precioFinal
          }
        } 
      }));

    } catch (e: any) {
      setSearchStates(prev => ({ ...prev, [partidaId]: { ...prev[partidaId], loading: false, error: e.message, tempProducto: null } }));
    }
  };

  const confirmarAlternativa = (partidaId: string, productoTemp: any) => {
    setPartidasState(prev => prev.map(p => p.id === partidaId ? { 
      ...p, 
      alternativa_producto_id: productoTemp.id,
      alternativa_numero_parte: productoTemp.numero_parte,
      alternativa_marca: productoTemp.marca,
      alternativa_descripcion: productoTemp.descripcion,
      alternativa_precio: productoTemp.precio
    } : p));
  };

  const quitarAlternativa = (partidaId: string) => {
    setPartidasState(prev => prev.map(p => p.id === partidaId ? { 
      ...p, 
      alternativa_producto_id: null,
      alternativa_numero_parte: null,
      alternativa_marca: null,
      alternativa_descripcion: null,
      alternativa_precio: null,
      alternativa_motivo: null
    } : p));
    setSearchStates(prev => ({
      ...prev,
      [partidaId]: { ...prev[partidaId], tempProducto: null }
    }));
  };

  const guardarCambios = async () => {
    setLoading(true);
    setErrorStr(null);
    setSuccessStr(null);
    
    try {
      const result = await actualizarPedido(pedido.id, estatus, pedido.estatus, partidasState);
      
      if (!result.success) throw new Error(result.error);

      setSuccessStr('Cambios guardados correctamente. Si marcaste "En Revisión", se envió un correo al cliente.');
      router.refresh();
    } catch (e: any) {
      setErrorStr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage.from('ordenes_compra').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4">
        <Link href="/admin/pedidos" className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-brand-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pedido: {pedido.id.split('-')[0]}
          </h1>
          <p className="text-slate-500">
            {new Date(pedido.fecha_creacion).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Detalles */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Información del Cliente</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Cliente</p>
                <p className="font-semibold">{pedido.perfil?.empresa || 'Desconocido'}</p>
                <p className="text-slate-600">{pedido.perfil?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Orden de Compra (PO)</p>
                <p className="font-bold">{pedido.es_po_verbal ? 'ORDEN VERBAL' : pedido.numero_po}</p>
                {pedido.po_url && (
                  <a 
                    href={getPdfUrl(pedido.po_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline text-xs font-semibold"
                  >
                    Ver PDF Adjunto
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Envío y Logística</h2>
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Calle:</span> {pedido.calle} {pedido.num_exterior} {pedido.num_interior}</p>
              <p><span className="text-slate-500">Colonia:</span> {pedido.colonia}</p>
              <p><span className="text-slate-500">Destino:</span> {pedido.ciudad}, {pedido.estado}. CP {pedido.codigo_postal}</p>
              
              {pedido.flete_urgente && (
                <div className="bg-orange-100 text-orange-800 p-3 rounded-lg font-bold border border-orange-200 flex items-center gap-2">
                  ⚡ FLETE URGENTE SOLICITADO
                </div>
              )}
              {pedido.notas_cliente && (
                <div>
                  <p className="text-slate-500 mt-2">Notas del Cliente:</p>
                  <p className="bg-slate-50 p-2 rounded border border-slate-100 italic">{pedido.notas_cliente}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Administración</h2>
            
            <label className="block text-sm font-semibold text-slate-700 mb-2">Estatus del Pedido</label>
            <select 
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="nuevo">Nuevo</option>
              <option value="en_revision">En Revisión (Regresarlo al cliente)</option>
              <option value="aprobado_por_cliente">Aprobado (Cliente)</option>
              <option value="procesando">Procesando</option>
              <option value="enviado">Enviado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Si marcas "En Revisión", el cliente deberá aprobar los Tiempos de Entrega y alternativas.
            </p>

            <button
              onClick={guardarCambios}
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            {errorStr && <p className="text-red-500 text-sm mt-3">{errorStr}</p>}
            {successStr && <p className="text-green-600 text-sm mt-3">{successStr}</p>}
          </div>
        </div>

        {/* Columna Derecha: Partidas */}
        <div className="lg:col-span-2 space-y-4">
          {partidasState.map((partida, idx) => {
            const isAltChecked = searchStates[partida.id]?.show || !!partida.alternativa_producto_id;
            const searchState = searchStates[partida.id] || { query: '', loading: false, error: null };

            return (
              <div key={partida.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl">
                      <Package className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{partida.numero_parte}</h3>
                      <p className="text-sm text-slate-500">{partida.marca}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{partida.descripcion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-brand-600">
                      {formatearPrecio(partida.importe, pedido.moneda)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {partida.cantidad} pzs x {formatearPrecio(partida.precio_unitario, pedido.moneda)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  {/* ETA */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-brand-500" /> Tiempo de Entrega (ETA)
                    </label>
                    <input 
                      type="text"
                      value={partida.tiempo_entrega || ''}
                      onChange={(e) => handlePropChange(partida.id, 'tiempo_entrega', e.target.value)}
                      placeholder="Ej. 3 a 5 días hábiles"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                    />
                  </div>

                  {/* Alternativa Toggle */}
                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-5">
                      <input 
                        type="checkbox"
                        checked={isAltChecked}
                        onChange={(e) => toggleSugerirAlternativa(partida.id, e.target.checked)}
                        className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Sugerir Alternativa de Catálogo</span>
                    </label>
                  </div>
                </div>

                {/* Panel de Alternativa */}
                {isAltChecked && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text"
                        placeholder="Buscar Número de Parte..."
                        value={searchState.query}
                        onChange={(e) => setSearchStates(prev => ({ ...prev, [partida.id]: { ...prev[partida.id], query: e.target.value } }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-orange-500 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && buscarAlternativa(partida.id)}
                      />
                      <button 
                        onClick={() => buscarAlternativa(partida.id)}
                        disabled={searchState.loading || !searchState.query}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                      >
                        {searchState.loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                        Buscar
                      </button>
                    </div>

                    {searchState.error && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mb-2">
                        <AlertCircle className="w-3 h-3"/> {searchState.error}
                      </p>
                    )}

                    {searchState.tempProducto && !partida.alternativa_producto_id && (
                      <div className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{searchState.tempProducto.numero_parte} <span className="text-xs text-slate-500 font-normal ml-1">({searchState.tempProducto.marca})</span></p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{searchState.tempProducto.descripcion}</p>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            <p className="text-xs text-slate-400">Precio Unitario (Cliente)</p>
                            <p className="font-bold text-orange-600 text-sm">{formatearPrecio(searchState.tempProducto.precio, pedido.moneda)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => confirmarAlternativa(partida.id, searchState.tempProducto)}
                          className="w-full px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4"/> Confirmar esta alternativa
                        </button>
                      </div>
                    )}

                    {partida.alternativa_producto_id && (
                      <div className="bg-white p-3 rounded-lg border border-orange-400 shadow-sm relative">
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3"/> Seleccionada
                        </div>
                        <div className="flex justify-between items-start mb-3 mt-1">
                          <div className="pr-16">
                            <p className="font-bold text-slate-800 text-sm">{partida.alternativa_numero_parte} <span className="text-xs text-slate-500 font-normal ml-1">({partida.alternativa_marca})</span></p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{partida.alternativa_descripcion}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-slate-400">Precio (C/U)</p>
                            <p className="font-bold text-orange-600 text-sm">{formatearPrecio(partida.alternativa_precio || 0, pedido.moneda)}</p>
                          </div>
                        </div>

                        <div className="border-t border-orange-100 pt-3">
                          <label className="block text-xs font-semibold text-orange-900 mb-1">Motivo / Mensaje para el cliente:</label>
                          <input 
                            type="text"
                            value={partida.alternativa_motivo || 'No hay stock del original. Te sugerimos esta alternativa:'}
                            onChange={(e) => setPartidasState(prev => prev.map(p => p.id === partida.id ? { ...p, alternativa_motivo: e.target.value } : p))}
                            className="w-full text-sm bg-orange-50/50 border border-orange-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                          />
                        </div>

                        <button 
                          onClick={() => quitarAlternativa(partida.id)}
                          className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium underline"
                        >
                          Remover alternativa
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Comentarios del Administrador */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Comentarios para el cliente (Opcional)
                  </label>
                  <textarea 
                    rows={2}
                    value={partida.comentario_admin || ''}
                    onChange={(e) => handlePropChange(partida.id, 'comentario_admin', e.target.value)}
                    placeholder="Escribe alguna nota, razón de la alternativa o detalle extra sobre este producto..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm resize-none"
                  />
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
