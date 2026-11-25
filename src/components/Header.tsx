import React from 'react';

export type AppView = 'inicio' | 'cuestionario' | 'gracias' | 'panel';

interface HeaderProps {
  currentView: AppView;
  onNavigateHome: () => void;
  onStartQuiz: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  onStartQuiz,
  onScrollToSection,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className="font-display min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap text-left text-2xl font-extrabold tracking-tight text-[#111827] uppercase transition-opacity hover:opacity-80"
        >
          Respeten los Rangos
        </button>

        {currentView !== 'panel' && (
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-6 md:flex"
          >
            <button
              type="button"
              onClick={() => onScrollToSection('beneficios')}
              className="min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-[#111827] hover:underline"
            >
              Beneficios
            </button>
            <button
              type="button"
              onClick={() => onScrollToSection('como-funciona')}
              className="min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-[#111827] hover:underline"
            >
              Cómo funciona
            </button>
            <button
              type="button"
              onClick={() => onScrollToSection('testimonios')}
              className="min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-[#111827] hover:underline"
            >
              Testimonios
            </button>
          </nav>
        )}

        <div className="flex shrink-0 items-center">
          {currentView === 'cuestionario' || currentView === 'panel' ? (
            <button
              type="button"
              onClick={onNavigateHome}
              className="min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-100"
            >
              Volver a la tienda
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartQuiz}
              className="min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-[#F97316] px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-[#ea580c]"
            >
              Cotizar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
