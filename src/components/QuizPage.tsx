import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  COUNTRY_PREFIXES,
  LeadContact,
  QUIZ_QUESTIONS,
  QuizAnswers,
} from '../types/lead';

interface QuizPageProps {
  answers: QuizAnswers;
  contact: LeadContact;
  isSubmitting: boolean;
  submitCooldownError: string;
  onUpdateAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  onUpdateContact: <K extends keyof LeadContact>(key: K, value: LeadContact[K]) => void;
  onSubmitLead: (honeypotValue: string) => void;
  onBackHome: () => void;
  onOpenPrivacy: () => void;
}

const TOTAL_STEPS = QUIZ_QUESTIONS.length + 2; // 6 preguntas + texto libre + contacto

export const QuizPage: React.FC<QuizPageProps> = ({
  answers,
  contact,
  isSubmitting,
  submitCooldownError,
  onUpdateAnswer,
  onUpdateContact,
  onSubmitLead,
  onBackHome,
  onOpenPrivacy,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<{
    nombre?: string;
    whatsapp?: string;
    consentimiento?: string;
    detalle?: string;
  }>({});
  const advanceTimerRef = useRef<number | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIndex]);

  const progressPercent = Math.round(((stepIndex + 1) / TOTAL_STEPS) * 100);

  const handleBack = () => {
    if (isSubmitting) return;
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
    if (stepIndex === 0) {
      onBackHome();
    } else {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSelectOption = (
    key: keyof Omit<QuizAnswers, 'detalle'>,
    option: string
  ) => {
    if (isSubmitting) return;
    onUpdateAnswer(key, option as QuizAnswers[typeof key]);

    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }, 150);
  };

  const validateDetalleAndContinue = () => {
    if (answers.detalle.length > 300) {
      setErrors({
        detalle: 'Por favor reduce el texto a un máximo de 300 caracteres.',
      });
      return;
    }
    setErrors({});
    setStepIndex((prev) => prev + 1);
  };

  const validateContactForm = (): boolean => {
    const nextErrors: typeof errors = {};
    const cleanName = contact.nombre.trim();

    if (!cleanName) {
      nextErrors.nombre = 'Por favor escribe tu nombre para poder dirigirnos a ti.';
    } else if (cleanName.length < 2) {
      nextErrors.nombre = 'Tu nombre debe tener al menos 2 letras.';
    } else if (/^\d+$/.test(cleanName)) {
      nextErrors.nombre = 'Ingresa un nombre válido, no solo números.';
    }

    const digitsOnly = contact.whatsapp.replace(/\D/g, '');
    const prefixConfig =
      COUNTRY_PREFIXES.find((p) => p.code === contact.prefijo) ||
      COUNTRY_PREFIXES[0];

    if (!digitsOnly) {
      nextErrors.whatsapp = 'Ingresa tu número de WhatsApp para enviarte la cotización.';
    } else if (contact.prefijo === '+51') {
      if (digitsOnly.length !== 9 || !digitsOnly.startsWith('9')) {
        nextErrors.whatsapp =
          'Ingresa un celular válido en Perú de 9 dígitos empezando con 9 (ejemplo: 992911064).';
      }
    } else if (
      digitsOnly.length < prefixConfig.minDigits ||
      digitsOnly.length > prefixConfig.maxDigits
    ) {
      nextErrors.whatsapp = `Ingresa un número válido para ${prefixConfig.label} (${prefixConfig.minDigits} dígitos).`;
    }

    if (!contact.consentimiento) {
      nextErrors.consentimiento =
        'Necesitamos tu autorización para poder responderte por WhatsApp.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateContactForm()) return;
    onSubmitLead(honeypot);
  };

  const currentQuestion =
    stepIndex < QUIZ_QUESTIONS.length ? QUIZ_QUESTIONS[stepIndex] : null;
  const isDetalleStep = stepIndex === QUIZ_QUESTIONS.length;
  const isContactStep = stepIndex === QUIZ_QUESTIONS.length + 1;

  return (
    <main className="min-h-[calc(100vh-14rem)] bg-white py-6 text-[#111827] sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Barra de avance y botón Volver */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-base font-semibold text-[#111827] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{stepIndex === 0 ? 'Volver al inicio' : 'Volver'}</span>
            </button>

            <span className="text-sm font-semibold text-gray-700 tabular-nums sm:text-base">
              Paso {stepIndex + 1} de {TOTAL_STEPS} · {progressPercent}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Avance del cuestionario"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
          >
            <div
              className="h-full rounded-full bg-[#F97316] transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Preguntas 1 a 6: una pregunta por pantalla */}
        {currentQuestion && (
          <section aria-labelledby="quiz-step-heading">
            <h1
              id="quiz-step-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-[#111827] outline-none sm:text-4xl [text-wrap:balance]"
            >
              {currentQuestion.question}
            </h1>
            <p className="mt-2.5 text-base leading-relaxed text-gray-700 sm:text-lg">
              {currentQuestion.helper}
            </p>

            <div className="mt-6 space-y-3" role="radiogroup" aria-labelledby="quiz-step-heading">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.key] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(currentQuestion.key, option)}
                    className={`flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-4 rounded-xl border-2 px-5 py-3.5 text-left text-lg font-semibold transition-colors ${
                      isSelected
                        ? 'border-[#111827] bg-[#111827] text-white'
                        : 'border-gray-300 bg-white text-[#111827] hover:border-[#111827] hover:bg-gray-50'
                    }`}
                  >
                    <span>{option}</span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-[#F97316] bg-[#F97316] text-[#111827]'
                          : 'border-gray-400 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {answers[currentQuestion.key] && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setStepIndex((prev) => prev + 1)}
                  className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-lg font-bold text-[#111827] transition-colors hover:bg-[#ea580c] sm:w-auto"
                >
                  <span>Continuar</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Paso 7: Campo de texto libre (opcional) con contador visible */}
        {isDetalleStep && (
          <section aria-labelledby="quiz-step-heading">
            <h1
              id="quiz-step-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-[#111827] outline-none sm:text-4xl [text-wrap:balance]"
            >
              Cuéntanos qué modelo, color o talla buscas (opcional)
            </h1>
            <p className="mt-2.5 text-base leading-relaxed text-gray-700 sm:text-lg">
              Ejemplo: Nike Air Force 1 blancas talla 42, Adidas Ultraboost negras talla 40, o déjalo en blanco si quieres ver opciones.
            </p>

            <div className="mt-6">
              <label
                htmlFor="lead-detalle"
                className="block text-base font-semibold text-[#111827]"
              >
                Modelo, color o talla
              </label>
              <textarea
                id="lead-detalle"
                rows={4}
                maxLength={300}
                value={answers.detalle}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 300);
                  onUpdateAnswer('detalle', val);
                  if (errors.detalle) setErrors((prev) => ({ ...prev, detalle: undefined }));
                }}
                placeholder="Escribe aquí el modelo, color o talla que prefieres..."
                className="mt-2 w-full rounded-xl border-2 border-gray-300 bg-white p-4 text-lg text-[#111827] placeholder:text-gray-500 focus:border-[#111827] focus:outline-none"
                aria-describedby="detalle-counter"
              />
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">
                  Campo opcional
                </span>
                <span
                  id="detalle-counter"
                  className={`text-sm font-semibold tabular-nums ${
                    answers.detalle.length >= 280 ? 'text-[#ea580c]' : 'text-gray-700'
                  }`}
                >
                  {answers.detalle.length} / 300 caracteres
                </span>
              </div>

              {errors.detalle && (
                <p
                  role="alert"
                  className="mt-2 flex items-center gap-2 text-sm font-semibold text-red-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.detalle}</span>
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={validateDetalleAndContinue}
                className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F97316] px-7 py-3.5 text-lg font-bold text-[#111827] transition-colors hover:bg-[#ea580c] sm:w-auto"
              >
                <span>Continuar al último paso</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* Paso 8: Nombre, WhatsApp, 3 señales de confianza y consentimiento */}
        {isContactStep && (
          <section aria-labelledby="quiz-step-heading">
            <h1
              id="quiz-step-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-[#111827] outline-none sm:text-4xl [text-wrap:balance]"
            >
              ¿A dónde te enviamos las opciones disponibles?
            </h1>
            <p className="mt-2.5 text-base leading-relaxed text-gray-700 sm:text-lg">
              Deja tu nombre y WhatsApp para que nuestro equipo en Villa de Pasco te atienda de inmediato.
            </p>

            <form onSubmit={handleFinalSubmit} noValidate className="mt-6 space-y-5">
              {/* Campo oculto anti-spam (honeypot) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
              >
                <label htmlFor="website_url">Sitio web</label>
                <input
                  id="website_url"
                  name="website_url"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="lead-nombre"
                  className="block text-base font-semibold text-[#111827]"
                >
                  Tu nombre completo
                </label>
                <input
                  id="lead-nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  required
                  value={contact.nombre}
                  onChange={(e) => {
                    onUpdateContact('nombre', e.target.value);
                    if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }));
                  }}
                  placeholder="Ejemplo: Luis Mendoza"
                  aria-invalid={Boolean(errors.nombre)}
                  aria-describedby={errors.nombre ? 'error-nombre' : undefined}
                  className={`mt-2 min-h-[52px] w-full rounded-xl border-2 bg-white px-4 py-3 text-lg text-[#111827] placeholder:text-gray-500 focus:outline-none ${
                    errors.nombre
                      ? 'border-red-600 focus:border-red-700'
                      : 'border-gray-300 focus:border-[#111827]'
                  }`}
                />
                {errors.nombre && (
                  <p
                    id="error-nombre"
                    role="alert"
                    className="mt-2 flex items-start gap-2 text-sm font-semibold text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errors.nombre}</span>
                  </p>
                )}
              </div>

              {/* WhatsApp con prefijo de país (+51 por defecto) */}
              <div>
                <label
                  htmlFor="lead-whatsapp"
                  className="block text-base font-semibold text-[#111827]"
                >
                  Tu número de WhatsApp
                </label>
                <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                  <div className="sm:w-44 sm:shrink-0">
                    <label htmlFor="lead-prefijo" className="sr-only">
                      Prefijo de país
                    </label>
                    <select
                      id="lead-prefijo"
                      name="prefijo"
                      value={contact.prefijo}
                      onChange={(e) => {
                        onUpdateContact('prefijo', e.target.value);
                        if (errors.whatsapp) {
                          setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                        }
                      }}
                      className="min-h-[52px] w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-3 py-3 text-base font-semibold text-[#111827] focus:border-[#111827] focus:outline-none"
                    >
                      {COUNTRY_PREFIXES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <input
                      id="lead-whatsapp"
                      name="whatsapp"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                      value={contact.whatsapp}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^\d\s-]/g, '');
                        onUpdateContact('whatsapp', sanitized);
                        if (errors.whatsapp) {
                          setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                        }
                      }}
                      placeholder={
                        contact.prefijo === '+51' ? 'Ej. 992 911 064' : 'Ingresa tu número'
                      }
                      aria-invalid={Boolean(errors.whatsapp)}
                      aria-describedby={errors.whatsapp ? 'error-whatsapp' : undefined}
                      className={`min-h-[52px] w-full rounded-xl border-2 bg-white px-4 py-3 text-lg text-[#111827] placeholder:text-gray-500 tabular-nums focus:outline-none ${
                        errors.whatsapp
                          ? 'border-red-600 focus:border-red-700'
                          : 'border-gray-300 focus:border-[#111827]'
                      }`}
                    />
                  </div>
                </div>
                {errors.whatsapp && (
                  <p
                    id="error-whatsapp"
                    role="alert"
                    className="mt-2 flex items-start gap-2 text-sm font-semibold text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errors.whatsapp}</span>
                  </p>
                )}
              </div>

              {/* Tres señales de confianza */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#111827]">
                  <Clock className="h-5 w-5 shrink-0 text-[#F97316]" aria-hidden="true" />
                  <span>Respuesta rápida</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#111827]">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#F97316]" aria-hidden="true" />
                  <span>Sin compromiso</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#111827]">
                  <Lock className="h-5 w-5 shrink-0 text-[#F97316]" aria-hidden="true" />
                  <span>Datos protegidos</span>
                </div>
              </div>

              {/* Casilla obligatoria de consentimiento */}
              <div>
                <div
                  className={`rounded-xl border-2 p-4 ${
                    errors.consentimiento
                      ? 'border-red-600 bg-red-50/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <label
                    htmlFor="lead-consentimiento"
                    className="flex min-h-[44px] cursor-pointer items-start gap-3"
                  >
                    <input
                      id="lead-consentimiento"
                      name="consentimiento"
                      type="checkbox"
                      checked={contact.consentimiento}
                      onChange={(e) => {
                        onUpdateContact('consentimiento', e.target.checked);
                        if (errors.consentimiento) {
                          setErrors((prev) => ({ ...prev, consentimiento: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(errors.consentimiento)}
                      aria-describedby={
                        errors.consentimiento ? 'error-consentimiento' : undefined
                      }
                      className="mt-1 h-6 w-6 shrink-0 cursor-pointer rounded border-2 border-gray-400 accent-[#111827]"
                    />
                    <span className="text-base leading-relaxed text-[#111827]">
                      Acepto que Respeten los Rangos me contacte por WhatsApp para responder mi consulta según su{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenPrivacy();
                        }}
                        className="inline cursor-pointer font-bold text-[#111827] underline underline-offset-4 hover:text-[#ea580c]"
                      >
                        aviso de privacidad
                      </button>
                      .
                    </span>
                  </label>
                </div>
                {errors.consentimiento && (
                  <p
                    id="error-consentimiento"
                    role="alert"
                    className="mt-2 flex items-start gap-2 text-sm font-semibold text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errors.consentimiento}</span>
                  </p>
                )}
              </div>

              {/* Aviso anti envíos repetidos */}
              {submitCooldownError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{submitCooldownError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#F97316] px-7 py-4 text-lg font-bold text-[#111827] transition-colors hover:bg-[#ea580c] disabled:cursor-wait disabled:opacity-80"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>Enviando tu solicitud...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar cotización y continuar</span>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
};
