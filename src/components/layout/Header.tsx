'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, Search, Loader2, Package, Plus, Check, ArrowRight, FolderOpen } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { supabase } from '@/lib/supabase/client';
import { buscarVistaPreviaRapida } from '@/app/catalogo/actions';
import { formatearPrecio } from '@/lib/pricing/engine';
import { obtenerMultiploVenta } from '@/lib/pricing/formatters';
import type { ProductoConPrecio } from '@/types';
import CartDrawer from './CartDrawer';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

type ProductoPreview = ProductoConPrecio & { descripcion_formateada: string };

export default function Header() {
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cartAbierto, setCartAbierto] = useState(false);
  const items = useCartStore((s) => s.items);
  const agregarItem = useCartStore((s) => s.agregarItem);
  const cantidadItems = items.reduce((acc, item) => acc + item.cantidad, 0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('REM Industrial');
  const [headerBusqueda, setHeaderBusqueda] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vendedorAsignado, setVendedorAsignado] = useState<{ nombre: string; telefono: string; email: string; foto_url?: string | null } | null>(null);

  // Estado para Vista Previa Instantánea del Buscador
  const [buscandoPreview, setBuscandoPreview] = useState(false);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [productosPreview, setProductosPreview] = useState<ProductoPreview[]>([]);
  const [categoriasPreview, setCategoriasPreview] = useState<{ nombre: string; cantidad: number; imagen_url: string | null }[]>([]);
  const [totalPreview, setTotalPreview] = useState(0);
  const [agregadosRecientes, setAgregadosRecientes] = useState<Record<string, boolean>>({});
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'apariencia').single();
      if (data?.valor) {
        if (data.valor.logo_url) setLogoUrl(data.valor.logo_url);
        if (data.valor.titulo) setTitulo(data.valor.titulo);
      }
    }
    
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        const { data: perfil } = await supabase
          .from('perfiles_clientes')
          .select('estatus, rol, vendedor:vendedores(nombre, telefono, email, foto_url, activo)')
          .eq('id', session.user.id)
          .single();
          
        if (perfil) {
          if (perfil.rol !== 'admin' && perfil.vendedor && (perfil.vendedor as any).activo !== false) {
            setVendedorAsignado(perfil.vendedor as any);
          } else {
            setVendedorAsignado(null);
          }
          if (perfil.rol === 'admin') {
            setIsAdmin(true);
            setIsPending(false); // Los admins nunca están "en revisión"
          } else {
            setIsAdmin(false);
            if (perfil.estatus === 'pendiente') {
              setIsPending(true);
            }
          }
        } else {
          setVendedorAsignado(null);
        }
      } else {
        setIsAdmin(false);
        setIsPending(false);
        setVendedorAsignado(null);
      }
    }

    fetchBranding();
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) checkAuth(); // re-check on change
      else {
        setIsPending(false);
        setVendedorAsignado(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cerrar vista previa al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktop = searchContainerRef.current?.contains(target);
      const inMobile = mobileSearchContainerRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setMostrarPreview(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMostrarPreview(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debounce de búsqueda instantánea
  useEffect(() => {
    const q = headerBusqueda.trim();
    if (q.length < 2) {
      setProductosPreview([]);
      setCategoriasPreview([]);
      setTotalPreview(0);
      setBuscandoPreview(false);
      return;
    }

    let cancelado = false;
    setBuscandoPreview(true);

    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await buscarVistaPreviaRapida(q, session?.access_token || null, 6);
        if (!cancelado) {
          setProductosPreview(res.productos);
          setCategoriasPreview(res.categorias);
          setTotalPreview(res.totalCoincidencias);
          setBuscandoPreview(false);
        }
      } catch (err) {
        console.error('Error en vista previa de búsqueda:', err);
        if (!cancelado) setBuscandoPreview(false);
      }
    }, 220);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [headerBusqueda]);

  const handleAgregarRapido = (e: React.MouseEvent, prod: ProductoPreview) => {
    e.preventDefault();
    e.stopPropagation();
    const multiplo = obtenerMultiploVenta(prod);
    agregarItem(prod, multiplo);
    setAgregadosRecientes((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAgregadosRecientes((prev) => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarPreview(false);
    setMenuAbierto(false);
    if (headerBusqueda.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(headerBusqueda.trim())}`);
    } else {
      router.push('/catalogo');
    }
  };

  const enlaces = [
    { href: '/', label: 'Inicio' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/nosotros', label: 'Sobre Nosotros' },
    { href: '/nosotros#organigrama', label: 'Contacto' },
  ];

  const renderDropdownPreview = () => {
    const q = headerBusqueda.trim();
    if (!mostrarPreview || q.length < 2) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[80vh] flex flex-col">
        {buscandoPreview && productosPreview.length === 0 ? (
          <div className="p-6 flex items-center justify-center gap-2.5 text-slate-300 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            <span>Buscando &quot;{q}&quot; en el catálogo...</span>
          </div>
        ) : productosPreview.length === 0 ? (
          <div className="p-6 text-center">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No encontramos coincidencias para &quot;{q}&quot;</p>
            <p className="text-xs text-slate-400 mt-1">Prueba buscando por código de parte, medida (ej. 1/2), marca o recubrimiento.</p>
          </div>
        ) : (
          <>
            {/* Barra rápida de Categorías coincidentes */}
            {categoriasPreview.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5 text-brand-400" />
                  Categorías:
                </span>
                {categoriasPreview.map((cat) => (
                  <Link
                    key={cat.nombre}
                    href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}&q=${encodeURIComponent(q)}`}
                    onClick={() => {
                      setMostrarPreview(false);
                      setMenuAbierto(false);
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-brand-600 text-xs font-bold text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>{cat.nombre}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 text-brand-300">
                      {cat.cantidad}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Lista de Productos Coincidentes */}
            <div className="divide-y divide-slate-800 overflow-y-auto max-h-[55vh]">
              {productosPreview.map((prod) => {
                const recienAgregado = Boolean(agregadosRecientes[prod.id]);
                const multiplo = obtenerMultiploVenta(prod);

                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 p-3.5 hover:bg-slate-800/80 transition-colors group"
                  >
                    <Link
                      href={`/catalogo/${prod.id}`}
                      onClick={() => {
                        setMostrarPreview(false);
                        setMenuAbierto(false);
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      {/* Miniatura */}
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1">
                        {prod.imagen_url ? (
                          <img
                            src={prod.imagen_url}
                            alt={prod.numero_parte}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Datos del Producto */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-sm text-white group-hover:text-brand-400 transition-colors">
                            {prod.numero_parte}
                          </span>
                          {prod.marca && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                              {prod.marca}
                            </span>
                          )}
                          {prod.categoria && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              • {prod.categoria}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 truncate mt-0.5 font-medium">
                          {prod.descripcion_formateada}
                        </p>
                      </div>
                    </Link>

                    {/* Precio y Botón Rápido de Cotizar */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-white">
                          {formatearPrecio(prod.precio_venta, prod.moneda_venta)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {prod.moneda_venta} + IVA {multiplo > 1 ? `(Paq. ${multiplo})` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAgregarRapido(e, prod)}
                        title={multiplo > 1 ? `Agregar paquete de ${multiplo} pzas a la cotización` : 'Agregar a la cotización'}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          recienAgregado
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
                        }`}
                      >
                        {recienAgregado ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Listo</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cotizar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pie para ver todos los resultados */}
            <Link
              href={`/buscar?q=${encodeURIComponent(q)}`}
              onClick={() => {
                setMostrarPreview(false);
                setMenuAbierto(false);
              }}
              className="px-4 py-3 bg-slate-950 hover:bg-slate-800 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
            >
              <span>
                Ver todos los resultados para &quot;{q}&quot; ({totalPreview} {totalPreview === 1 ? 'producto' : 'productos'})
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-brand-700 text-white flex items-center justify-center text-xs sm:text-sm font-medium px-4 truncate">
        {vendedorAsignado ? (
          <>
            {vendedorAsignado.foto_url && (
              <img 
                src={vendedorAsignado.foto_url} 
                alt={vendedorAsignado.nombre} 
                className="w-5 h-5 rounded-full object-cover inline-block mr-1.5 border border-white/50 shadow-xs" 
              />
            )}
            <span>Tu asesor asignado: <strong className="font-bold">{vendedorAsignado.nombre}</strong></span>
            <span className="mx-2">|</span>
            <a href={`mailto:${vendedorAsignado.email}`} className="hover:underline font-bold">{vendedorAsignado.email}</a>
            <span className="mx-2">|</span>
            <a 
              href={`https://wa.me/52${vendedorAsignado.telefono.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline font-bold"
              title="Abrir WhatsApp con tu asesor"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-300 fill-current" />
              <span>{vendedorAsignado.telefono}</span>
            </a>
          </>
        ) : (
          <>
            <span>¿Prefieres atención personalizada? Contáctanos:</span> 
            <a href="mailto:ventas3@remindustrial.mx" className="ml-1 hover:underline font-bold">ventas3@remindustrial.mx</a> 
            <span className="mx-2">|</span> 
            <a 
              href="https://wa.me/526141815170" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline font-bold"
              title="Abrir WhatsApp de Ventas"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-300 fill-current" />
              <span>614 181 5170</span>
            </a>
          </>
        )}
      </div>
      <header className="fixed top-8 left-0 right-0 z-40 h-16 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0 bg-white rounded-md px-2 py-1 shadow-sm hover:shadow-md transition-shadow">
            <img 
              src={logoUrl || '/logo-rem.png'} 
              alt={titulo} 
              className="h-10 object-contain" 
            />
          </Link>

          {/* Buscador Global con Vista Previa Instantánea (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl relative">
            <form 
              className="relative w-full"
              onSubmit={handleSearchSubmit}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={headerBusqueda}
                onFocus={() => setMostrarPreview(true)}
                onChange={(e) => {
                  setHeaderBusqueda(e.target.value);
                  setMostrarPreview(true);
                }}
                placeholder="Buscar por código de parte, medida (ej. 1/2), marca, recubrimiento..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-16 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {buscandoPreview && (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                )}
                {headerBusqueda && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderBusqueda('');
                      setProductosPreview([]);
                      setCategoriasPreview([]);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button type="submit" className="hidden">Buscar</button>
            </form>

            {renderDropdownPreview()}
          </div>

          {/* Carrito + Menu Móvil */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <nav className="hidden md:flex items-center gap-6 mr-2">
              {enlaces.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {e.label}
                </Link>
              ))}
              
              <div className="h-6 w-px bg-slate-700 mx-1"></div>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {isPending && (
                    <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-md">
                      Cuenta en Revisión
                    </span>
                  )}
                  {isAdmin ? (
                    <Link href="/admin/productos" className="text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Panel Admin
                    </Link>
                  ) : (
                    <Link href="/cuenta/pedidos" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                      Mi Cuenta
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                    title="Cerrar Sesión"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/admin/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link href="/registro" className="text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Crear Cuenta
                  </Link>
                </>
              )}
            </nav>

            <button
              onClick={() => setCartAbierto(true)}
              className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5 text-slate-300 group-hover:text-white" />
              <span className="hidden md:inline text-sm font-semibold text-slate-300">Cotización</span>
              {cantidadItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-slate-900">
                  {cantidadItems}
                </span>
              )}
            </button>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Móvil con Buscador Instantáneo */}
        {menuAbierto && (
          <nav className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3">
            <div ref={mobileSearchContainerRef} className="relative pb-2">
              <form className="relative w-full" onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={headerBusqueda}
                  onFocus={() => setMostrarPreview(true)}
                  onChange={(e) => {
                    setHeaderBusqueda(e.target.value);
                    setMostrarPreview(true);
                  }}
                  placeholder="Buscar código, medida, marca..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-14 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                {headerBusqueda && (
                  <button
                    type="button"
                    onClick={() => setHeaderBusqueda('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
              {renderDropdownPreview()}
            </div>

            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="block text-sm font-medium text-slate-300 hover:text-white py-2"
                onClick={() => setMenuAbierto(false)}
              >
                {e.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Drawer del Carrito */}
      <CartDrawer isOpen={cartAbierto} onClose={() => setCartAbierto(false)} />
    </>
  );
}
