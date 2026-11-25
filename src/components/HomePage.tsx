import React from 'react';
import {
  ArrowRight,
  Camera,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HomePageProps {
  onStartQuiz: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartQuiz }) => {
  return (
    <main className="bg-white text-[#111827]">
      {/* HERO SECTION: Diseñado para que titular, apoyo y CTA sean visibles sin scroll en 360px */}
      <section className="border-b border-gray-200 bg-white pt-5 pb-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-sm font-semibold tracking-wide text-gray-600 sm:text-base">
                Villa de Pasco, Perú · Adidas, Puma y Nike
              </p>

              <h1 className="font-display mt-2.5 text-[31px] leading-[1.06] font-extrabold tracking-tight text-[#111827] sm:text-5xl lg:text-[56px] [text-wrap:balance]">
                Encuentra tus zapatillas Adidas, Puma o Nike originales en Villa de Pasco sin perder tiempo
              </h1>

              <p className="mt-3 max-w-xl text-lg leading-relaxed text-gray-700 sm:mt-4 sm:text-xl">
                Cuéntanos qué buscas en 45 segundos y recibe atención inmediata por WhatsApp
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onStartQuiz}
                  className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#F97316] px-7 py-3.5 text-lg font-bold text-[#111827] transition-colors hover:bg-[#ea580c] active:scale-[0.99] sm:w-auto"
                >
                  <span>Cotizar mis zapatillas</span>
                  <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-600">
                <span>Sin compromiso</span>
                <span aria-hidden="true">·</span>
                <span>Tallas y precios al momento</span>
                <span aria-hidden="true">·</span>
                <span>Atención directa</span>
              </div>
            </div>

            {/* Espacio reservado para foto real principal */}
            <div className="lg:col-span-5">
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 p-6 text-center sm:min-h-[300px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-white">
                  <Camera className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-4 text-base font-bold text-[#111827]">
                  [AGREGAR]
                </p>
                <p className="mt-1 max-w-xs text-base leading-relaxed text-gray-700">
                  Foto real de tus zapatillas Adidas, Puma y Nike originales disponibles en tienda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS PRINCIPALES */}
      <section id="beneficios" className="border-b border-gray-200 bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
              Por qué cotizar con Respeten los Rangos
            </h2>
            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              Ahorra vueltas innecesarias. Confirmamos disponibilidad, talla y precio real antes de que salgas de casa.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-[#F97316]">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-bold tracking-tight text-[#111827]">
                Modelos originales Adidas, Puma y Nike
              </h3>
              <p className="mt-2 text-base leading-relaxed text-gray-700">
                Pares auténticos para uso urbano, running, entrenamiento y fútbol según tu presupuesto.
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-[#F97316]">
                <Zap className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-bold tracking-tight text-[#111827]">
                Atención rápida en Villa de Pasco
              </h3>
              <p className="mt-2 text-base leading-relaxed text-gray-700">
                Nuestro equipo revisa tu pedido ordenado y te responde directo por WhatsApp con opciones reales.
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-[#F97316]">
                <MapPin className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-bold tracking-tight text-[#111827]">
                Entrega local o recojo coordinado
              </h3>
              <p className="mt-2 text-base leading-relaxed text-gray-700">
                Recoge en punto de Villa de Pasco o coordina delivery hacia Chaupimarca, Colquijirca y alrededores.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA + ESPACIOS [AGREGAR] PARA CIFRAS Y FOTO REAL */}
      <section id="como-funciona" className="border-b border-gray-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
                Así de simple funciona tu cotización
              </h2>
              <ol className="mt-6 space-y-5">
                <li className="flex gap-4">
                  <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-xl font-bold text-[#F97316] tabular-nums">
                    1
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">
                      Responde 6 preguntas rápidas
                    </h3>
                    <p className="mt-1 text-base leading-relaxed text-gray-700">
                      Elige marca, uso, presupuesto aproximado, cuándo compras y tu zona en Pasco.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-xl font-bold text-[#F97316] tabular-nums">
                    2
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">
                      Indica modelo, color o talla (opcional)
                    </h3>
                    <p className="mt-1 text-base leading-relaxed text-gray-700">
                      Si ya tienes un par en mente, escríbelo para ir directo al grano.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-xl font-bold text-[#F97316] tabular-nums">
                    3
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">
                      Recibe respuesta ordenada por WhatsApp
                    </h3>
                    <p className="mt-1 text-base leading-relaxed text-gray-700">
                      Tu consulta llega lista a nuestro equipo para mostrarte stock disponible y coordinar entrega.
                    </p>
                  </div>
                </li>
              </ol>

              {/* Cifras marcadas [AGREGAR] sin inventar datos */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="font-display text-2xl font-extrabold text-[#111827]">
                    [AGREGAR]
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Cifra real de pares entregados en Pasco
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="font-display text-2xl font-extrabold text-[#111827]">
                    [AGREGAR]
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Tiempo promedio de respuesta por WhatsApp
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="font-display text-2xl font-extrabold text-[#111827]">
                    [AGREGAR]
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    Cifra real de clientes atendidos
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-white">
                  <Camera className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-4 text-base font-bold text-[#111827]">
                  [AGREGAR]
                </p>
                <p className="mt-1 max-w-xs text-base leading-relaxed text-gray-700">
                  Foto real del punto de entrega en Villa de Pasco o clientes recogiendo su pedido.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS: ESPACIOS MARCADOS [AGREGAR] */}
      <section id="testimonios" className="border-b border-gray-200 bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
              Opiniones de compradores en Pasco
            </h2>
            <p className="mt-2 text-lg text-gray-700">
              Espacios reservados para testimonios reales verificados de la tienda.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6"
              >
                <div>
                  <MessageSquareQuote className="h-6 w-6 text-gray-500" aria-hidden="true" />
                  <p className="mt-3 text-base font-bold text-[#111827]">
                    [AGREGAR]
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-gray-700">
                    Testimonio real #{slot}: comentario del cliente sobre su compra, talla y atención recibida.
                  </p>
                </div>
                <p className="mt-5 border-t border-gray-200 pt-3 text-sm font-medium text-gray-600">
                  [AGREGAR: Nombre · Zona · Modelo]
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CIERRE CON CTA */}
      <section className="bg-[#111827] py-12 text-white sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              ¿Listo para ubicar tu próximo par original?
            </h2>
            <p className="mt-2 text-lg leading-relaxed text-gray-300">
              Completa el cuestionario breve y conversa directo con nuestro equipo en Villa de Pasco.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartQuiz}
            className="inline-flex min-h-[52px] w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#F97316] px-7 py-3.5 text-lg font-bold text-[#111827] transition-colors hover:bg-[#ea580c] active:scale-[0.99] sm:w-auto"
          >
            <span>Cotizar mis zapatillas</span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
};
