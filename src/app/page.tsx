import Link from 'next/link';
import { Search, FileText, Headphones } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#0f172a] to-blue-900 text-white py-24 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Herramientas Industriales de Alto Rendimiento
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-blue-100">
              Catálogo en línea con cotización instantánea para talleres de maquinado y maquiladoras
            </p>
            <Link 
              href="/catalogo" 
              className="inline-block bg-[#2563eb] hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Ver Catálogo
            </Link>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-6">
                  <Search className="h-8 w-8 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Catálogo Técnico</h3>
                <p className="text-slate-600">
                  Busca por especificaciones técnicas: diámetro, recubrimiento, número de flautas y más.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-6">
                  <FileText className="h-8 w-8 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Cotización Instantánea</h3>
                <p className="text-slate-600">
                  Genera tu cotización en PDF al instante con precios actualizados.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-6">
                  <Headphones className="h-8 w-8 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Atención Personalizada</h3>
                <p className="text-slate-600">
                  Solicita una cotización formal con tiempos de entrega y disponibilidad.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
