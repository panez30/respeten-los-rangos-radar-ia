import React from 'react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenPanel: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenPanel,
}) => {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-[#111827]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="font-display text-xl font-bold tracking-tight uppercase text-[#111827]">
              Respeten los Rangos
            </p>
            <p className="text-base leading-relaxed text-gray-700">
              Tienda de zapatillas originales Adidas, Puma y Nike en Villa de Pasco, Perú.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              Aviso de privacidad: Tratamos tus datos personales únicamente para responder tu cotización por WhatsApp conforme a la{' '}
              <strong className="font-semibold text-[#111827]">
                Ley N.° 29733 de Protección de Datos Personales
              </strong>{' '}
              del Perú.
            </p>
            <p className="text-sm font-medium text-gray-700">
              Los resultados y disponibilidad pueden variar.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="min-h-[44px] cursor-pointer text-sm font-semibold text-[#111827] underline underline-offset-4 transition-colors hover:text-[#ea580c]"
            >
              Leer aviso de privacidad (Ley N.° 29733)
            </button>

            <button
              type="button"
              onClick={onOpenPanel}
              className="min-h-[44px] cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-100"
            >
              Panel del equipo (/panel)
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-600">
          © {new Date().getFullYear()} Respeten los Rangos · Villa de Pasco, Perú
        </div>
      </div>
    </footer>
  );
};
