import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Mail, Phone, MapPin, FileText, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Aviso de Privacidad Integral | REM Industrial',
  description:
    'Aviso de Privacidad Integral de REM Industrial en estricto cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
};

export default function AvisoDePrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Encabezado Principal */}
          <div className="bg-brand-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl mb-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
                Cumplimiento Legal LFPDPPP / INAI
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Aviso de Privacidad Integral
              </h1>
              <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                En <strong>REM Industrial</strong> la confidencialidad, integridad y seguridad de los datos personales y comerciales de nuestros clientes, prospectos y socios de negocio es una prioridad fundamental.
              </p>
              <p className="text-xs text-slate-400 mt-4">
                <strong>Última actualización:</strong> Noviembre de 2026 | Chihuahua, Chihuahua, México.
              </p>
            </div>
          </div>

          {/* Tarjeta de Contenido */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            {/* Introducción */}
            <section className="border-b border-slate-100 pb-8">
              <p>
                El presente <strong>Aviso de Privacidad Integral</strong> se emite en estricto apego y cumplimiento a las disposiciones establecidas en la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>, su Reglamento, y los Lineamientos del Aviso de Privacidad emitidos por el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (<strong>INAI</strong>).
              </p>
            </section>

            {/* 1. Responsable */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  1
                </span>
                Identidad y Domicilio del Responsable del Tratamiento
              </h2>
              <p>
                <strong>REM Industrial</strong> (en lo sucesivo denominado <em>&quot;EL RESPONSABLE&quot;</em>), con domicilio comercial y de operaciones ubicado en la ciudad de <strong>Chihuahua, Chihuahua, México</strong>, y portal oficial de internet{' '}
                <a href="https://www.remindustrial.mx" className="text-brand-600 font-bold hover:underline">
                  https://www.remindustrial.mx
                </a>
                , hace de su conocimiento que es el responsable legítimo del uso, almacenamiento, tratamiento y protección de sus datos personales.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 mt-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                  <span><strong>Contacto Privacidad:</strong> ventas3@remindustrial.mx</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                  <span><strong>Teléfono:</strong> +52 (614) 181 5170</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Chihuahua, Chih., México</span>
                </div>
              </div>
            </section>

            {/* 2. Datos Personales Recabados */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  2
                </span>
                Datos Personales que se Recaban
              </h2>
              <p>
                Para llevar a cabo las finalidades comerciales B2B descritas en el presente aviso, recabamos las siguientes categorías de datos personales y comerciales:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
                <li><strong>Datos de Identificación y Contacto:</strong> Nombre completo del titular o contacto comercial, cargo o puesto desempeñado en la empresa, número de teléfono fijo, número de teléfono móvil o WhatsApp, y correo electrónico corporativo o personal.</li>
                <li><strong>Datos Fiscales y de Facturación (CFDI 4.0):</strong> Denominación o Razón Social de la empresa compradora, Registro Federal de Contribuyentes (RFC), Régimen Fiscal, domicilio fiscal completo (calle, número exterior/interior, colonia, código postal, municipio/alcaldía, estado), y Uso de CFDI.</li>
                <li><strong>Datos de Entrega y Logística:</strong> Domicilio de entrega física de mercancías, almacén, planta o taller de recepción, horarios de recibo y especificaciones de maniobra o descarga.</li>
                <li><strong>Datos de Navegación Digital:</strong> Dirección IP, tipo de navegador, registros de sesión, historial de partidas cotizadas y preferencias de catálogo dentro de la plataforma.</li>
              </ul>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs text-amber-900 mt-2">
                <strong>Declaración de Datos Sensibles:</strong> <em>EL RESPONSABLE</em> manifiesta expresamente que <strong>NO</strong> solicita ni recaba en ningún momento datos personales sensibles (tales como origen étnico, estado de salud presente o futuro, información genética, creencias religiosas, filosóficas o morales, afiliación sindical, opiniones políticas o preferencia sexual).
              </div>
            </section>

            {/* 3. Finalidades */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  3
                </span>
                Finalidades del Tratamiento de los Datos
              </h2>
              <p>
                Los datos personales recabados serán utilizados para las siguientes finalidades:
              </p>
              
              <h3 className="font-bold text-slate-800 text-sm mt-3">A. Finalidades Primarias (necesarias para la relación jurídica comercial):</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 text-sm">
                <li>Crear y gestionar su cuenta empresarial de usuario en el portal cotizador de REM Industrial.</li>
                <li>Generar, procesar, calcular y validar cotizaciones formales de herramientas de corte, medición, herramental y suministros industriales.</li>
                <li>Asignar a un Asesor Comercial o Ingeniero Técnico especializado para brindarle atención personalizada y seguimiento a sus requerimientos.</li>
                <li>Emitir Órdenes de Pedido, verificar existencias de almacén, coordinar importaciones y validar tiempos estimados de entrega (ETA).</li>
                <li>Gestionar la logística de despacho y entrega física de mercancías a través de transporte propio o empresas fleteras/paqueterías certificadas.</li>
                <li>Emitir los Comprobantes Fiscales Digitales por Internet (CFDI) ante el Servicio de Administración Tributaria (SAT).</li>
                <li>Evaluar solicitudes de crédito comercial y gestionar cobranza en caso de términos pactados a crédito.</li>
                <li>Tramitar garantías de fábrica, solicitudes de soporte técnico y seguimiento postventa.</li>
              </ul>

              <h3 className="font-bold text-slate-800 text-sm mt-4">B. Finalidades Secundarias (no indispensables para el servicio principal):</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 text-sm">
                <li>Envío de boletines técnicos, catálogos digitales de marcas aliadas y listas de promociones especiales.</li>
                <li>Encuestas voluntarias de satisfacción y evaluación de calidad de servicio.</li>
              </ul>
              <p className="text-xs text-slate-500 italic mt-2">
                Si usted no desea que sus datos personales sean tratados para las finalidades secundarias, podrá manifestar su negativa en cualquier momento enviando un correo a <strong>ventas3@remindustrial.mx</strong> sin que ello afecte la prestación de los servicios comerciales primarios.
              </p>
            </section>

            {/* 4. Transferencia de Datos */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  4
                </span>
                Transferencia de Datos Personales
              </h2>
              <p>
                <em>EL RESPONSABLE</em> se compromete a no vender, alquilar, transferir ni divulgar sus datos personales a terceros no autorizados para fines ajenos a los contratados. Sus datos únicamente podrán ser transferidos, sin requerir consentimiento adicional de conformidad con el Artículo 37 de la LFPDPPP, en los siguientes supuestos:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 text-sm">
                <li><strong>Empresas Fleteras y de Mensajería:</strong> Únicamente los datos indispensables de entrega (Nombre, Dirección de Entrega, Teléfono de Contacto) para la oportuna transportación y entrega física de las herramientas o mercancías.</li>
                <li><strong>Fabricantes y Proveedores Oficiales:</strong> En supuestos exclusivos donde se requiera soporte técnico especializado directo de planta o trámite formal de garantía ante la marca fabricante.</li>
                <li><strong>Autoridades Gubernamentales y Fiscales:</strong> En cumplimiento estricto a requerimientos legales fundados y motivados por el SAT u autoridades competentes.</li>
              </ul>
            </section>

            {/* 5. Derechos ARCO */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  5
                </span>
                Medios para Ejercer los Derechos ARCO y Revocación del Consentimiento
              </h2>
              <p>
                Usted o su representante legal debidamente acreditado tienen el derecho inalienable de ejercer en todo momento sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO)</strong>, así como de revocar el consentimiento otorgado para el tratamiento de sus datos.
              </p>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-sm space-y-2">
                <p className="font-bold text-slate-900">Procedimiento para el ejercicio de Derechos ARCO:</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-700 text-xs sm:text-sm">
                  <li>Enviar una solicitud formal por escrito al correo electrónico oficial: <strong>ventas3@remindustrial.mx</strong> indicando en el asunto: <em>&quot;Ejercicio de Derechos ARCO - [Nombre o Empresa]&quot;</em>.</li>
                  <li>La solicitud deberá contener: nombre completo del titular, copia simple de documento oficial que acredite su identidad (INE o Pasaporte) o poder notarial en caso de personas morales, correo electrónico para recibir notificaciones, y descripción clara y precisa de los datos sobre los que desea ejercer el derecho (Acceso, Rectificación, Cancelación u Oposición).</li>
                  <li><strong>Plazos de Respuesta:</strong> Conforme al Artículo 32 de la LFPDPPP, daremos respuesta a su solicitud en un plazo máximo de <strong>20 (veinte) días hábiles</strong> contados desde la recepción de la misma, notificándole la determinación adoptada vía correo electrónico.</li>
                </ol>
              </div>
            </section>

            {/* 6. Medidas de Seguridad */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  6
                </span>
                Medidas de Seguridad de la Información
              </h2>
              <p>
                <em>EL RESPONSABLE</em> implementa medidas de seguridad técnicas, físicas y administrativas robustas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado. Esto incluye cifrado SSL de 256 bits en todo el tráfico web, almacenamiento en bases de datos con políticas de seguridad a nivel de fila (RLS), control estricto de roles administrativos y llaves de acceso seguras.
              </p>
            </section>

            {/* 7. Cookies */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  7
                </span>
                Uso de Cookies y Tecnologías Similares
              </h2>
              <p>
                Nuestra plataforma digital utiliza cookies esenciales con el fin de reconocer a los usuarios autenticados, mantener activas las cotizaciones en curso y brindar una navegación fluida. Dichas cookies no contienen información confidencial ni se comparten con redes publicitarias invasivas. Usted puede deshabilitar el uso de cookies directamente en las opciones de configuración de su navegador de internet, aunque esto podría limitar el funcionamiento del cotizador.
              </p>
            </section>

            {/* 8. Cambios al Aviso */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-sm">
                  8
                </span>
                Modificaciones al Aviso de Privacidad
              </h2>
              <p>
                El presente Aviso de Privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de requerimientos legales o de nuestras propias políticas comerciales. Cualquier modificación será publicada oportunamente y de manera permanente en este mismo apartado web:{' '}
                <a href="https://www.remindustrial.mx/aviso-de-privacidad" className="text-brand-600 font-semibold hover:underline">
                  https://www.remindustrial.mx/aviso-de-privacidad
                </a>.
              </p>
            </section>

            {/* Consentimiento */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-xs sm:text-sm text-emerald-900">
              <p className="font-bold mb-1">Aceptación Expresa del Aviso de Privacidad:</p>
              <p>
                Al registrarse como usuario, solicitar cotizaciones o realizar pedidos a través del portal de <strong>REM Industrial</strong>, el titular manifiesta haber leído, comprendido y aceptado en su totalidad los términos contenidos en el presente Aviso de Privacidad Integral.
              </p>
            </div>

          </div>

          {/* Navegación al final */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <Link
              href="/terminos-y-condiciones"
              className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Consultar Términos y Condiciones Comerciales
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/catalogo"
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              Volver al Catálogo Industrial
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
