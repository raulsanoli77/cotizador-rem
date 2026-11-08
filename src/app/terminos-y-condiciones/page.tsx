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
                El presente documento establece los <strong>Términos y Condiciones Generales de Uso, Cotización y Venta Mercantil</strong> (en adelante, los <em>&quot;Términos&quot;</em>) que rigen la relación comercial entre <strong>REM Industrial</strong>, representada y operada comercialmente por la persona física con actividad empresarial <strong>ROBERTO AVILA SILVA</strong> (con Registro Federal de Contribuyentes <strong>AISR761004B77</strong>), con domicilio fiscal registrado en Av. Manuel Gómez Morín No. 1249, Int. 1 (Plaza Comercial Impulso, Local 5), Colonia Las Palmas, C.P. 32668, Ciudad Juárez, Chihuahua, y oficinas comerciales en Chihuahua, Chihuahua (en lo sucesivo, <em>&quot;EL PROVEEDOR&quot;</em>), y las personas físicas con actividad empresarial o personas morales que accedan, se registren, coticen o adquieran mercancías a través del portal{' '}
                <a href="https://www.remindustrial.mx" className="text-brand-600 font-bold hover:underline">
                  https://www.remindustrial.mx
                </a>{' '}
                o mediante atención ejecutiva de sus asesores comerciales (en adelante, <em>&quot;EL CLIENTE&quot;</em>).
              </p>
              <div className="mt-4 p-4 bg-slate-50 border-l-4 border-brand-600 rounded-r-lg text-xs sm:text-sm text-slate-800 space-y-2">
                <p className="font-bold text-slate-900">
                  Declaración de Operación B2B y Uso Exclusivamente Industrial / Productivo (Plantas, Talleres y Distribuidores):
                </p>
                <p>
                  Al navegar en la plataforma, registrarse, solicitar una cotización formal o emitir una Orden de Compra, <em>EL CLIENTE</em> (ya sea <strong>usuario final industrial</strong> —como plantas maquiladoras, talleres de maquinado y centros de manufactura— o <strong>distribuidor mercantil</strong>) declara expresamente y bajo protesta de decir verdad que: <strong>(i)</strong> actúa como persona moral o persona física con actividad empresarial debidamente inscrita ante el RFC; <strong>(ii)</strong> adquiere las herramientas, instrumentos y suministros con el propósito exclusivo de utilizarlos o integrarlos directamente en sus procesos industriales, de maquinado, corte, manufactura, transformación técnica o comercialización mercantil; y <strong>(iii)</strong> por tratarse de adquisiciones destinadas a actividades productivas y mercantiles (y no a consumo personal ni doméstico), la relación entre las partes se rige de manera exclusiva por el <strong>Código de Comercio</strong> de los Estados Unidos Mexicanos y supletoriamente por el Código Civil Federal, conforme a lo dispuesto en el Artículo 2, fracción I de la Ley Federal de Protección al Consumidor.
                </p>
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
                  <strong>Vigencia de Precios:</strong> Debido a la volatilidad en el costo internacional de materias primas (carburo de tungsteno, aceros rápidos, recubrimientos PVD/CVD) y logística portuaria, las cotizaciones formales emitidas tendrán una <strong>vigencia máxima de 7 (siete) días naturales</strong> contados a partir de su emisión cuando no se especifique un plazo distinto en el documento, o bien, la vigencia que expresamente se indique en el folio de la cotización formal respectiva. Transcurrido dicho plazo sin confirmación formal u orden de compra, los precios, condiciones y tiempos de entrega quedan sujetos a revalidación obligatoria.
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
                <strong>Términos de Pago:</strong> Toda operación comercial es de riguroso <strong>Contado</strong> mediante transferencia electrónica bancaria vía SPEI. <em>EL PROVEEDOR</em> no otorga crédito comercial de manera abierta ni automática; cualquier condición de pago diferido es de carácter estrictamente excepcional, discrecional y requiere autorización previa y por escrito de la administración de <em>EL PROVEEDOR</em>.
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
                  <strong>Tiempos Estimados de Entrega (ETA):</strong> Los plazos comunicados son estimados con base en la información proporcionada por las plantas productoras, despachos aduanales e inventarios disponibles. <em>EL PROVEEDOR</em> no asume responsabilidad civil, mercantil ni contractual por retrasos originados por causas de fuerza mayor o caso fortuito (contingencias aduanales en puentes fronterizos, huelgas de paqueterías, fenómenos meteorológicos o demoras imputables directamente a la planta matriz del fabricante extranjero).
                </li>
                <li>
                  <strong>Entregas Locales:</strong> En las ciudades de <strong>Ciudad Juárez</strong> y <strong>Chihuahua Capital</strong> (y sus respectivas zonas industriales conurbadas), las entregas se coordinarán conforme a las rutas de reparto programadas o mediante recolección directa en mostrador de almacén.
                </li>
                <li>
                  <strong>Envíos Foráneos (Traspaso de Riesgo):</strong> Salvo acuerdo específico de flete pagado por <em>EL PROVEEDOR</em>, los envíos foráneos a otros municipios o entidades federativas se consideran bajo la modalidad <strong>FOB Almacén (Libre a Bordo Ciudad Juárez / Chihuahua)</strong>. La mercancía viaja por cuenta, cargo y riesgo de <em>EL CLIENTE</em> a partir del momento en que es entregada a la empresa transportista o fletera seleccionada (Tresguerras, Castores, FedEx, etc.). Se recomienda a <em>EL CLIENTE</em> solicitar flete asegurado al momento de su cotización.
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
                    B. Productos de Stock de Almacén y Evaluación de Procedencia:
                  </h3>
                  <p className="text-slate-700 mt-1">
                    Toda solicitud de devolución voluntaria de mercancía estándar de stock regular (por error de selección del comprador, cambio de proyecto o preferencia comercial) está sujeta a previa evaluación técnica y comercial. <em>EL PROVEEDOR</em> se reserva en todo momento el derecho exclusivo de analizar caso por caso para determinar si la devolución es aceptada o rechazada.
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-600 text-xs sm:text-sm">
                    <li>
                      <strong>Plazo de Notificación:</strong> Cualquier solicitud de devolución comercial de mercancía de stock o reporte por discrepancias visibles de cantidad/empaque deberá formularse por escrito dentro de los primeros <strong>5 (cinco) días hábiles</strong> posteriores a la recepción física del producto. (Las reclamaciones técnicas por defectos de fabricación o vicios ocultos se tramitarán conforme a la Cláusula 7 y los plazos del Código de Comercio).
                    </li>
                    <li>
                      <strong>Estado del Producto:</strong> Para ser considerada, la mercancía deberá encontrarse en su empaque original sellado de fábrica, sin etiquetas ajenas, códigos de barra alterados, ni signos de montaje, prueba o manipulación en husillo o torreta.
                    </li>
                    <li>
                      <strong>Cargo Mínimo de Reabastecimiento (Restocking Fee):</strong> Toda devolución autorizada causará un cargo administrativo <strong>mínimo del 20% (veinte por ciento)</strong> sobre el valor neto facturado de la partida. En caso de que el fabricante o planta matriz en el extranjero cobre un porcentaje o penalización superior por concepto de retorno o reingreso, dicho porcentaje mayor será trasladado íntegramente a <em>EL CLIENTE</em>.
                    </li>
                    <li>
                      <strong>Gastos Logísticos y Arancelarios:</strong> Todos los costos de fletes de recolección y reenvío, maniobras de almacén, seguros de traslado, gastos aduanales, aranceles de reimportación/retorno o cualquier otro costo logístico generado por la devolución serán absorbidos al 100% por cuenta y cargo exclusivo de <em>EL CLIENTE</em>.
                    </li>
                    <li>
                      <strong>No Devolución de Dinero (Saldo a Favor Exclusivo):</strong> Las devoluciones aceptadas <strong>EN NINGÚN CASO IMPLICARÁN EL REEMBOLSO O DEVOLUCIÓN DE DINERO EN EFECTIVO NI POR TRANSFERENCIA BANCARIA</strong>. El importe neto procedente (una vez deducido el cargo mínimo del 20% o el cargo superior del fabricante, así como los gastos de flete y aduana) se acreditará exclusivamente como una <strong>Nota de Crédito o Saldo a Favor</strong> para ser redimido en futuras compras de herramientas o suministros con <em>EL PROVEEDOR</em>.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cláusula 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  7
                </span>
                Garantías, Tope de Responsabilidad y Exclusiones Técnicas
              </h2>
              <p>
                <strong>Garantía contra Defectos de Fabricación:</strong> Todas las herramientas, insertos, cortadores e instrumentos de medición comercializados por <em>EL PROVEEDOR</em> son 100% originales. En caso de presentarse algún defecto probado de material o vicio oculto de manufactura reclamado dentro de los plazos previstos por el Artículo 383 del Código de Comercio, <em>EL PROVEEDOR</em> canalizará y gestionará el dictamen técnico ante el fabricante correspondiente; de resultar procedente la garantía, la obligación se cumplirá mediante la reposición física de la pieza defectuosa o la emisión de una Nota de Crédito a favor de <em>EL CLIENTE</em> por el valor de la partida afectada.
              </p>
              <p>
                <strong>Tope Máximo de Responsabilidad Contractual:</strong> Salvo en casos de dolo directamente imputable conforme al Artículo 2106 del Código Civil Federal, la responsabilidad total y acumulada de <em>EL PROVEEDOR</em> derivada de cualquier orden de compra, partida suministrada o servicio conexo estará estrictamente limitada, como tope máximo, al <strong>valor neto facturado y efectivamente pagado por la partida específica</strong> que haya dado origen a la reclamación.
              </p>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg text-xs sm:text-sm text-red-950 space-y-2">
                <p className="font-bold">
                  Exclusión Expresa de Responsabilidad por Parámetros de Maquinado y Daños Consecuenciales:
                </p>
                <p>
                  Salvo dolo comprobado, en ningún caso <em>EL PROVEEDOR</em>, sus directivos, ingenieros o asesores comerciales serán legalmente responsables ante <em>EL CLIENTE</em> por:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Daños indirectos, incidentales, especiales, punitivos o consecuenciales.</li>
                  <li>Lucro cesante, pérdidas de producción, penalizaciones contractuales ante terceros, paros de línea fabril o tiempos muertos de centros de maquinado (CNC, tornos, fresadoras).</li>
                  <li>Piezas de trabajo o materia prima del cliente dañadas, desechadas (scrap) o retrabajos.</li>
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
                Todas las marcas, logotipos, nombres comerciales, códigos de producto e imágenes de fabricantes (tales como Kennametal, Kyocera, Mitutoyo, WIDIA, YG-1, Insize, entre otras) expuestas en la plataforma son propiedad exclusiva de sus respectivos titulares. Su exhibición y referencia en el catálogo digital se realiza con fines estrictamente identificativos, informativos y de comercialización legítima de productos originales en los términos de la Ley Federal de Protección a la Propiedad Industrial.
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
                Para la interpretación, ejecución y cumplimiento de las operaciones mercantiles reguladas bajo estos Términos, las partes se someten de manera expresa e irrestricta a las leyes mercantiles y civiles aplicables de los <strong>Estados Unidos Mexicanos</strong> y a la jurisdicción de los <strong>Tribunales Competentes del Estado de Chihuahua</strong> (con sede en la ciudad de Chihuahua o Ciudad Juárez, a elección de la parte promovente), renunciando a cualquier otro fuero o tribunal que por razón de sus domicilios presentes, futuros o por la ubicación de sus plantas pudiera corresponderles.
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
