import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-[#111827] shadow-xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="privacy-modal-title"
            className="font-display text-2xl font-extrabold tracking-tight text-[#111827]"
          >
            Aviso de Privacidad — Ley N.° 29733
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso de privacidad"
            className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-[#111827] transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-base leading-relaxed text-gray-700">
          <p>
            En cumplimiento de la{' '}
            <strong className="font-semibold text-[#111827]">
              Ley N.° 29733, Ley de Protección de Datos Personales
            </strong>{' '}
            y su reglamento en el Perú,{' '}
            <strong className="font-semibold text-[#111827]">
              Respeten los Rangos
            </strong>{' '}
            (Villa de Pasco, Perú) informa lo siguiente:
          </p>
          <p>
            <strong className="font-semibold text-[#111827]">1. Finalidad:</strong>{' '}
            Los datos que ingresas (nombre, número de WhatsApp y preferencias de calzado) se utilizan únicamente para atender tu cotización, informarte disponibilidad de stock y coordinar entrega o recojo.
          </p>
          <p>
            <strong className="font-semibold text-[#111827]">2. Confidencialidad:</strong>{' '}
            No vendemos ni compartimos tu información con terceros ajenos a la atención de tu pedido.
          </p>
          <p>
            <strong className="font-semibold text-[#111827]">3. Derechos ARCO:</strong>{' '}
            Puedes solicitar el acceso, rectificación, cancelación u oposición de tus datos en cualquier momento escribiendo al WhatsApp +51 992 911 064.
          </p>
          <p className="text-sm font-medium text-gray-600">
            Los datos de tu solicitud se registran de forma segura en la base de datos privada de Respeten los Rangos únicamente para atender tu pedido. Los resultados y disponibilidad pueden variar.
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full cursor-pointer rounded-xl bg-[#111827] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-gray-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
