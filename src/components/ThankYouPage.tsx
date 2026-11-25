import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import {
  QualifiedLead,
  buildWhatsAppUrl,
  truncateForWhatsApp,
} from '../types/lead';

interface ThankYouPageProps {
  lead: QualifiedLead;
  onNewQuote: () => void;
  onBackHome: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  lead,
  onNewQuote,
  onBackHome,
}) => {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const leadMessage = lead.qualification.mensaje_para_el_lead;
  const whatsappText = truncateForWhatsApp(leadMessage, 280);
  const whatsappUrl = buildWhatsAppUrl(whatsappText);

  return (
    <main className="min-h-[calc(100vh-14rem)] bg-white py-8 text-[#111827] sm:py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827] text-[#F97316]">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display mt-5 text-3xl leading-[1.08] font-extrabold tracking-tight text-[#111827] outline-none sm:text-4xl [text-wrap:balance]"
          >
            ¡Gracias, {lead.contact.nombre}! Recibimos tu solicitud
          </h1>

          {/* Mensaje personalizado para el lead */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-lg leading-relaxed font-medium text-[#111827]">
              {leadMessage}
            </p>
          </div>

          <div className="mt-6">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-[#F97316] px-6 py-4 text-lg font-bold text-[#111827] transition-colors hover:bg-[#ea580c] active:scale-[0.99]"
            >
              <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>Escribir por WhatsApp</span>
            </a>
            <p className="mt-2.5 text-center text-sm text-gray-600">
              Se abrirá WhatsApp al número +51 992 911 064 con este mensaje listo para enviar.
            </p>
          </div>

          {/* Vista previa del texto exacto que se enviará por WhatsApp */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#111827]">
                Mensaje preparado para WhatsApp
              </p>
              <span className="text-xs font-semibold text-gray-600 tabular-nums">
                {whatsappText.length} / 280 caracteres
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              {whatsappText}
            </p>
          </div>

          {/* Resumen ordenado de la solicitud */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#111827]">
              Resumen de tu búsqueda
            </h2>

            <dl className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-gray-50">
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Marca principal</dt>
                <dd className="text-base font-semibold text-[#111827]">
                  {lead.answers.marca}
                </dd>
              </div>
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Uso</dt>
                <dd className="text-base font-semibold text-[#111827]">
                  {lead.answers.uso}
                </dd>
              </div>
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Presupuesto</dt>
                <dd className="text-base font-semibold text-[#111827] tabular-nums">
                  {lead.answers.presupuesto}
                </dd>
              </div>
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Tiempo de compra</dt>
                <dd className="text-base font-semibold text-[#111827]">
                  {lead.answers.cuando}
                </dd>
              </div>
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Zona</dt>
                <dd className="text-base font-semibold text-[#111827]">
                  {lead.answers.zona}
                </dd>
              </div>
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Entrega</dt>
                <dd className="text-base font-semibold text-[#111827]">
                  {lead.answers.entrega}
                </dd>
              </div>
              {lead.answers.detalle && (
                <div className="flex flex-col gap-1 px-4 py-3">
                  <dt className="text-sm font-medium text-gray-600">
                    Modelo, color o talla
                  </dt>
                  <dd className="text-base font-semibold text-[#111827]">
                    {lead.answers.detalle}
                  </dd>
                </div>
              )}
              <div className="flex flex-col justify-between gap-1 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="text-sm font-medium text-gray-600">Tu WhatsApp</dt>
                <dd className="text-base font-semibold text-[#111827] tabular-nums">
                  {lead.contact.prefijo} {lead.contact.whatsapp}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onNewQuote}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-base font-semibold text-[#111827] transition-colors hover:border-[#111827] hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Cotizar otro par</span>
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#111827] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
