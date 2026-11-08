import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Scale, FileCheck, AlertTriangle, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones Comerciales | REM Industrial',
  description:
    'Términos y Condiciones Generales de Uso, Cotización y Venta Mercantil B2B de REM Industrial para la industria metalmecánica y maquiladora.',
};

export default function TerminosYCondicionesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Encabezado */}
          <div className="bg-brand-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl mb-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/30">
                <Scale className="w-4 h-4" />
                Marco Mercantil B2B · Código de Comercio de México
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Términos y Condiciones Comerciales
              </h1>
              <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Reglamento contractual de uso del portal web, emisión de cotizaciones formales y compraventa mercantil de herramientas de corte, medición y suministros industriales.
              </p>
              <p className="text-xs text-slate-400 mt-4">
                <strong>Vigencia:</strong> A partir de Noviembre de 2026 | Chihuahua, Chihuahua, México.
              </p>
            </div>
          </div>

          {/* Cuerpo Contractual */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            {/* Introducción */}
            <section className="border-b border-slate-100 pb-8">
              <p>
                El presente documento establece los <strong>Términos y Condiciones Generales de Uso, Cotización y Venta Mercantil</strong> (en adelante, los <em>&quot;Términos&quot;</em>) que rigen la relación comercial entre <strong>REM Industrial</strong> (en lo sucesivo, <em>&quot;EL PROVEEDOR&quot;</em>) y las personas físicas con actividad empresarial o personas morales que accedan, se registren, coticen o adquieran mercancías a través del portal{' '}
                <a href="https://www.remindustrial.mx" className="text-brand-600 font-bold hover:underline">
                  https://www.remindustrial.mx
                </a>{' '}
                o mediante atención ejecutiva de sus asesores comerciales (en adelante, <em>&quot;EL CLIENTE&quot;</em>).
              </p>
              <div className="mt-4 p-4 bg-slate-50 border-l-4 border-brand-600 rounded-r-lg text-xs sm:text-sm text-slate-800 font-medium">
                Al navegar en la plataforma, solicitar una cotización formal o emitir una Orden de Compra, <em>EL CLIENTE</em> declara bajo protesta de decir verdad que cuenta con la capacidad legal y facultades de representación suficientes para obligarse conforme al Código de Comercio de los Estados Unidos Mexicanos.
              </div>
            </section>

            {/* Cláusula 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  1
                </span>
                Naturaleza Informativa del Catálogo Digital y Pre-Cotizaciones
              </h2>
              <p>
                La información, imágenes, especificaciones técnicas y precios desplegados en el portal web tienen carácter <strong>estrictamente orientativo e informativo</strong>. No constituyen una oferta de venta vinculante ni irrevocable de forma unilateral.
              </p>
              <p>
                Las solicitudes generadas a través del cotizador en línea se consideran una <em>solicitud formal de cotización preliminar</em>. Toda cotización queda sujeta a la revisión y validación definitiva por parte del equipo comercial de <em>EL PROVEEDOR</em> respecto a existencias reales de almacén, tiempos de importación, costos de flete y confirmación de vigencia de precios con las plantas fabricantes.
              </p>
            </section>

            {/* Cláusula 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  2
                </span>
                Moneda, Precios y Tipo de Cambio (USD / MXN)
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>
                  <strong>Moneda de Cotización:</strong> Salvo indicación expresa en contrario, los precios de herramientas importadas suelen cotizarse en Dólares de los Estados Unidos de América (USD) o en Moneda Nacional (MXN).
                </li>
                <li>
                  <strong>Impuesto al Valor Agregado (IVA):</strong> Todos los precios mostrados en el catálogo o desglosados en pre-cotizaciones se entienden <strong>más el 16% de IVA</strong> (o tasa fronteriza aplicable según la legislación fiscal vigente), el cual se detallará en la cotización formal y en la factura correspondiente.
                </li>
                <li>
                  <strong>Tipo de Cambio Oficial:</strong> Las operaciones cotizadas en USD que sean liquidadas en Moneda Nacional (MXN) se solventarán al <strong>Tipo de Cambio para solventar obligaciones denominadas en moneda extranjera</strong> publicado por el <strong>Banco de México (Banxico)</strong> en el Diario Oficial de la Federación (DOF) correspondiente al día hábil de pago efectivo.
                </li>
                <li>
                  <strong>Vigencia de Precios:</strong> Debido a la volatilidad en el costo internacional de materias primas (carburo de tungsteno, aceros rápidos, recubrimientos PVD/CVD) y logística portuaria, las cotizaciones formales emitidas tienen una vigencia estándar de <strong>15 (quince) días naturales</strong> contados a partir de su emisión, salvo estipulación en contrario indicada en el folio de cotización.
                </li>
              </ul>
            </section>

            {/* Cláusula 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  3
                </span>
                Perfeccionamiento del Contrato de Compraventa Mercantil
              </h2>
              <p>
                De conformidad con los Artículos 78, 80 y 89 del Código de Comercio, el contrato de compraventa mercantil entre <em>EL CLIENTE</em> y <em>EL PROVEEDOR</em> se considerará perfeccionado y vinculante en el momento en que ocurra cualquiera de los siguientes supuestos:
              </p>
              <ol className="list-decimal pl-6 space-y-1 text-slate-600">
                <li><em>EL CLIENTE</em> emita y remita una <strong>Orden de Compra formal (PO)</strong> debidamente autorizada por su departamento de adquisiciones con referencia al folio de cotización de REM Industrial.</li>
                <li><em>EL CLIENTE</em> acepte expresamente por medios electrónicos (portal web, correo electrónico o WhatsApp institucional) la cotización formal y los tiempos de entrega (ETA) asignados.</li>
                <li>Tratándose de operaciones de contado, cuando se reciba el pago total del importe o el anticipo pactado.</li>
              </ol>
            </section>

            {/* Cláusula 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  4
                </span>
                Condiciones de Pago y Cláusula de Reserva de Dominio
              </h2>
              <p>
                <strong>Términos de Pago:</strong> Las operaciones son de riguroso <strong>Contado</strong> mediante transferencia electrónica bancaria vía SPEI, salvo que <em>EL CLIENTE</em> cuente con una línea de crédito comercial previamente autorizada por escrito por el departamento de Crédito y Cobranza de <em>EL PROVEEDOR</em> (ej. 15, 30 o 45 días).
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Cláusula Expresa de Reserva de Dominio (Art. 2312 del Código Civil Federal):
                </p>
                <p>
                  <em>EL PROVEEDOR</em> se reserva el dominio y propiedad legal de todas las herramientas, instrumentos y equipos suministrados hasta la liquidación total e incondicional del importe consignado en la factura correspondiente. Mientras el precio no sea pagado en su totalidad, <em>EL CLIENTE</em> mantendrá la posesión de las mercancías en calidad exclusiva de <strong>depositario</strong>, quedando estrictamente obligado a conservarlas en buen estado y respondiendo de cualquier pérdida o menoscabo.
                </p>
              </div>
            </section>

            {/* Cláusula 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  5
                </span>
                Tiempos de Entrega (ETA), Logística y Traspaso de Riesgos
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>
                  <strong>Tiempos Estimados de Entrega (ETA):</strong> Los plazos comunicados son estimados con base en la información proporcionada por las plantas productoras, despachos aduanales e inventarios disponibles. <em>EL PROVEEDOR</em> no asume responsabilidad civil, penal ni contractual por retrasos originados por causas de fuerza mayor o caso fortuito (contingencias aduanales en puentes fronterizos, huelgas de paqueterías, fenómenos meteorológicos o demoras imputables directamente a la planta matriz del fabricante extranjero).
                </li>
                <li>
                  <strong>Entregas Locales:</strong> En la ciudad de Chihuahua y zona industrial conurbada, las entregas se coordinarán conforme a las rutas de reparto programadas o mediante recolección en mostrador de almacén.
                </li>
                <li>
                  <strong>Envíos Foráneos (Traspaso de Riesgo):</strong> Salvo acuerdo específico de flete pagado por <em>EL PROVEEDOR</em>, los envíos foráneos se consideran bajo la modalidad <strong>FOB Almacén Chihuahua (Libre a Bordo)</strong>. La mercancía viaja por cuenta, cargo y riesgo de <em>EL CLIENTE</em> a partir del momento en que es entregada a la empresa transportista o fletera seleccionada (Tresguerras, Castores, FedEx, etc.). Se recomienda a <em>EL CLIENTE</em> solicitar flete asegurado al momento de su cotización.
                </li>
              </ul>
            </section>

            {/* Cláusula 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  6
                </span>
                Política de Cancelaciones, Devoluciones y Herramental Especial
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs sm:text-sm">
                <div>
                  <h3 className="font-bold text-red-700 uppercase">
                    A. Herramental Especial, Medición y Pedidos de Importación Directa:
                  </h3>
                  <p className="text-slate-700 mt-1">
                    Tratándose de herramientas fabricadas bajo plano o diseño especial, instrumentos de metrología con calibración de fábrica, o partidas solicitadas sobre pedido exclusivo de importación con fabricantes extranjeros, <strong>NO SE ACEPTARÁN CANCELACIONES, DEVOLUCIONES NI REEMBOLSOS</strong> una vez que la orden haya sido transmitida a la planta matriz del fabricante.
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <h3 className="font-bold text-slate-800 uppercase">
                    B. Productos de Stock de Almacén:
                  </h3>
                  <p className="text-slate-700 mt-1">
                    Cualquier solicitud de devolución de mercancía estándar de stock regular deberá notificarse por escrito dentro de los primeros <strong>5 (cinco) días hábiles</strong> posteriores a la recepción física. Para que sea procedente, el producto deberá encontrarse en su empaque original sellado, sin signos de uso, montaje o manipulación. Toda devolución autorizada causará un cargo administrativo por reabastecimiento e inspección del <strong>15% al 20%</strong> sobre el valor neto de la partida.
                  </p>
                </div>
              </div>
            </section>

            {/* Cláusula 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  7
                </span>
                Garantías y Limitación Exclusiva de Responsabilidad Técnica
              </h2>
              <p>
                <strong>Garantía de Calidad:</strong> Todas las herramientas, insertos, cortadores e instrumentos de medición comercializados por <em>EL PROVEEDOR</em> son 100% originales y cuentan exclusivamente con la garantía otorgada por sus respectivas marcas fabricantes contra defectos probados de material o vicios ocultos de manufactura.
              </p>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg text-xs sm:text-sm text-red-950 space-y-2">
                <p className="font-bold">
                  Exclusión Expresa de Responsabilidad por Parámetros de Maquinado y Operación:
                </p>
                <p>
                  En ningún caso <em>EL PROVEEDOR</em>, sus directivos, ingenieros o asesores comerciales serán legalmente responsables ante <em>EL CLIENTE</em> por:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Daños indirectos, incidentales, especiales, punitivos o consecuenciales.</li>
                  <li>Lucro cesante, pérdidas de producción, paros de línea fabril o tiempos muertos de centros de maquinado (CNC, tornos, fresadoras).</li>
                  <li>Piezas de producción desechadas o retrabajos.</li>
                  <li>Ruptura, astillamiento o desgaste prematuro de herramientas derivado de parámetros inadecuados de corte (RPM, avances, profundidad, refrigeración deficiente), falta de rigidez en la máquina, herramientas mal sujetadas o pericia deficiente del operador.</li>
                </ul>
                <p className="text-xs italic pt-1">
                  La asesoría técnica brindada por nuestro personal representa una recomendación técnica orientativa de buena fe; es responsabilidad indelegable del departamento de ingeniería o taller de <em>EL CLIENTE</em> validar los parámetros idóneos en sus procesos y máquinas.
                </p>
              </div>
            </section>

            {/* Cláusula 8 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  8
                </span>
                Facturación Fiscal Digital (CFDI 4.0)
              </h2>
              <p>
                Las facturas fiscales electrónicas se emitirán conforme a los datos tributarios capturados por <em>EL CLIENTE</em> en el portal (RFC, Régimen Fiscal, Domicilio Fiscal y Uso de CFDI), debiendo coincidir estrictamente con su Constancia de Situación Fiscal ante el SAT. Toda factura se emitirá dentro del mes calendario en que se procese el pedido o cobro, conforme a las disposiciones del Código Fiscal de la Federación.
              </p>
            </section>

            {/* Cláusula 9 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  9
                </span>
                Propiedad Intelectual y Marcas Registradas
              </h2>
              <p>
                Todas las marcas, logotipos, nombres comerciales, códigos de producto e imágenes de fabricantes (tales como Kennametal, Kyocera, Mitutoyo, WIDIA, YG-1, entre otras) expuestas en la plataforma son propiedad exclusiva de sus respectivos titulares. Su inclusión en el catálogo digital se realiza con fines informativos y de comercialización legítima autorizada en los términos de la Ley Federal de Protección a la Propiedad Industrial.
              </p>
            </section>

            {/* Cláusula 10 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  10
                </span>
                Legislación Aplicable, Jurisdicción y Competencia
              </h2>
              <p>
                Para la interpretación, ejecución y cumplimiento de las operaciones mercantiles reguladas bajo estos Términos, las partes se someten de manera expresa e irrestricta a las leyes mercantiles y civiles aplicables de los <strong>Estados Unidos Mexicanos</strong> y a la jurisdicción exclusiva de los <strong>Tribunales Competentes con sede en la ciudad de Chihuahua, Chihuahua</strong>, renunciando a cualquier otro fuero o tribunal que por razón de sus domicilios presentes, futuros o por la ubicación de sus plantas pudiera corresponderles.
              </p>
            </section>

            {/* Declaración final */}
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-5 text-xs sm:text-sm text-slate-800">
              <p className="font-bold mb-1">Acuerdo Total y Vinculación Legal:</p>
              <p>
                La aceptación electrónica de estos Términos mediante casillas de verificación en formularios de registro, cotización o pago surte los mismos efectos jurídicos que una firma autógrafa conforme al Artículo 89 del Código de Comercio de México.
              </p>
            </div>

          </div>

          {/* Navegación al pie */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <Link
              href="/aviso-de-privacidad"
              className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Consultar Aviso de Privacidad Integral
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/catalogo"
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              Ir al Catálogo de Productos
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
