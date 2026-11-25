import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-white p-6 text-[#111827]">
          <div className="max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
            <h1 className="font-display text-2xl font-extrabold text-[#111827]">
              Ocurrió un problema inesperado
            </h1>
            <p className="mt-2 text-base text-gray-700">
              No pudimos completar esta operación. Recarga la página o verifica los permisos de Firestore en tu proyecto.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-[44px] cursor-pointer rounded-xl bg-[#F97316] px-5 py-2.5 text-base font-bold text-[#111827] hover:bg-[#ea580c]"
            >
              Recargar página
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
