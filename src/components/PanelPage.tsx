import React, { useEffect, useMemo, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  Download,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  X,
} from 'lucide-react';
import {
  AUTHORIZED_TEAM_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import {
  LeadCategory,
  LeadRecord,
  LeadStatus,
  NextStep,
  buildWhatsAppUrl,
} from '../types/lead';

interface PanelPageProps {
  user: User | null;
  authReady: boolean;
  authError: string;
  onAuthError: (msg: string) => void;
  onGoToQuiz: () => void;
}

const CATEGORY_ORDER: Record<LeadCategory, number> = {
  caliente: 0,
  tibio: 1,
  frio: 2,
  descalificado: 3,
};

const CATEGORY_META: Record<
  LeadCategory,
  { label: string; badgeClass: string }
> = {
  caliente: {
    label: 'Caliente',
    badgeClass: 'bg-[#F97316] text-[#111827]',
  },
  tibio: {
    label: 'Tibio',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
  },
  frio: {
    label: 'Frío',
    badgeClass: 'bg-gray-200 text-gray-800',
  },
  descalificado: {
    label: 'Descalificado',
    badgeClass: 'bg-red-100 text-red-900 border border-red-200',
  },
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  cita: 'Cita',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

const NEXT_STEP_LABELS: Record<NextStep, string> = {
  llamar_hoy: 'Llamar hoy',
  escribir_whatsapp: 'Escribir por WhatsApp',
  enviar_informacion: 'Enviar información',
  no_contactar: 'No contactar',
};

function toIsoString(value: unknown, fallbackIso: string): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return fallbackIso;
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return 'Hace un momento';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hace 1 día';
  return `Hace ${diffDays} días`;
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const hours = (mins / 60).toFixed(1);
  return `${hours} h`;
}

function sanitizeCsvCell(value: string | number | boolean): string {
  let str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export const PanelPage: React.FC<PanelPageProps> = ({
  user,
  authReady,
  authError,
  onAuthError,
  onGoToQuiz,
}) => {
  const [signingIn, setSigningIn] = useState(false);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'todas' | LeadCategory>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | LeadStatus>('todos');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const isAuthorizedAdmin =
    Boolean(user) &&
    user?.email?.toLowerCase() === AUTHORIZED_TEAM_EMAIL &&
    user?.emailVerified === true;

  // Suscripción en tiempo real a Firestore solo cuando el usuario autorizado inició sesión
  useEffect(() => {
    if (!authReady || !isAuthorizedAdmin) {
      setLeads([]);
      setIsLoadingLeads(false);
      return;
    }

    setIsLoadingLeads(true);
    setPanelError('');

    const leadsPath = 'leads';
    const unsubscribe = onSnapshot(
      collection(db, leadsPath),
      (snapshot) => {
        const nowIso = new Date().toISOString();
        const items: LeadRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const rawResp =
            data.respuestas && typeof data.respuestas === 'object'
              ? (data.respuestas as Record<string, unknown>)
              : {};
          const rawConsent =
            data.consentimiento && typeof data.consentimiento === 'object'
              ? (data.consentimiento as Record<string, unknown>)
              : {};

          const creadoEnIso = toIsoString(data.creadoEn, nowIso);
          const primerContactoIso = data.primerContactoEn
            ? toIsoString(data.primerContactoEn, nowIso)
            : null;

          return {
            id: docSnap.id,
            nombre: String(data.nombre ?? ''),
            whatsapp: String(data.whatsapp ?? ''),
            respuestas: {
              marca: String(rawResp.marca ?? ''),
              uso: String(rawResp.uso ?? ''),
              presupuesto: String(rawResp.presupuesto ?? ''),
              cuando: String(rawResp.cuando ?? ''),
              zona: String(rawResp.zona ?? ''),
              entrega: String(rawResp.entrega ?? ''),
            },
            comentario: String(data.comentario ?? ''),
            score: typeof data.score === 'number' ? data.score : 0,
            categoria: (data.categoria as LeadCategory) || 'tibio',
            motivo: String(data.motivo ?? ''),
            resumen: String(data.resumen ?? ''),
            mensajeParaLead: String(data.mensajeParaLead ?? ''),
            siguientePaso: (data.siguientePaso as NextStep) || 'escribir_whatsapp',
            calificadoPorIA: Boolean(data.calificadoPorIA),
            estado: (data.estado as LeadStatus) || 'nuevo',
            consentimiento: {
              aceptado: Boolean(rawConsent.aceptado),
              fecha: toIsoString(rawConsent.fecha, creadoEnIso),
            },
            creadoEn: creadoEnIso,
            primerContactoEn: primerContactoIso,
            llegoACita: Boolean(data.llegoACita),
          };
        });

        setLeads(items);
        setIsLoadingLeads(false);
      },
      (error) => {
        setIsLoadingLeads(false);
        setPanelError(
          'No se pudieron leer los contactos de Firestore. Verifica que las reglas de seguridad estén publicadas.'
        );
        handleFirestoreError(error, OperationType.LIST, leadsPath);
      }
    );

    return () => unsubscribe();
  }, [authReady, isAuthorizedAdmin]);

  const handleGoogleSignIn = async () => {
    onAuthError('');
    setSigningIn(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const email = credential.user.email?.toLowerCase() ?? '';
      if (email !== AUTHORIZED_TEAM_EMAIL || !credential.user.emailVerified) {
        await signOut(auth);
        onAuthError(
          `Acceso denegado: este panel es exclusivo para ${AUTHORIZED_TEAM_EMAIL}.`
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('popup-closed-by-user')) {
        onAuthError('Cerraste la ventana de Google antes de completar el ingreso.');
      } else if (msg.includes('unauthorized-domain')) {
        onAuthError(
          'Agrega el dominio de esta vista previa en Firebase Console > Authentication > Settings > Authorized domains.'
        );
      } else {
        onAuthError('No se pudo iniciar sesión con Google. Inténtalo nuevamente.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setSelectedLeadId(null);
    await signOut(auth);
  };

  const handleStatusChange = async (leadId: string, nextStatus: LeadStatus) => {
    const target = leads.find((item) => item.id === leadId);
    if (!target) return;

    setUpdatingStatusId(leadId);
    setPanelError('');

    const docPath = `leads/${leadId}`;
    const updates: Record<string, unknown> = {
      estado: nextStatus,
    };

    if (nextStatus !== 'nuevo' && target.primerContactoEn === null) {
      updates.primerContactoEn = serverTimestamp();
    }
    if (nextStatus === 'cita' || nextStatus === 'ganado') {
      updates.llegoACita = true;
    }

    try {
      await updateDoc(doc(db, 'leads', leadId), updates);
    } catch (error) {
      setPanelError('No se pudo actualizar el estado en Firestore.');
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const sortedAndFilteredLeads = useMemo(() => {
    return [...leads]
      .filter((item) => {
        if (categoryFilter !== 'todas' && item.categoria !== categoryFilter) {
          return false;
        }
        if (statusFilter !== 'todos' && item.estado !== statusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const catDiff = CATEGORY_ORDER[a.categoria] - CATEGORY_ORDER[b.categoria];
        if (catDiff !== 0) return catDiff;
        return b.creadoEn.localeCompare(a.creadoEn);
      });
  }, [leads, categoryFilter, statusFilter]);

  const metrics = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyCount = leads.filter(
      (item) => new Date(item.creadoEn).getTime() >= sevenDaysAgo
    ).length;

    const totalCount = leads.length;
    const hotCount = leads.filter((item) => item.categoria === 'caliente').length;
    const hotPercent =
      totalCount > 0 ? Math.round((hotCount / totalCount) * 100) : 0;

    const contactedLeads = leads.filter((item) => item.primerContactoEn !== null);
    let avgFirstContactLabel = '—';
    if (contactedLeads.length > 0) {
      const totalDurationMs = contactedLeads.reduce((acc, item) => {
        const start = new Date(item.creadoEn).getTime();
        const end = new Date(item.primerContactoEn!).getTime();
        return acc + Math.max(0, end - start);
      }, 0);
      avgFirstContactLabel = formatDuration(totalDurationMs / contactedLeads.length);
    }

    const citaCount = leads.filter(
      (item) => item.llegoACita || item.estado === 'cita' || item.estado === 'ganado'
    ).length;
    const citaPercent =
      totalCount > 0 ? Math.round((citaCount / totalCount) * 100) : 0;

    return {
      weeklyCount,
      hotPercent,
      avgFirstContactLabel,
      citaPercent,
    };
  }, [leads]);

  const selectedLead = useMemo(
    () => leads.find((item) => item.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  useEffect(() => {
    if (!selectedLead) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLeadId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedLead]);

  const handleExportCsv = () => {
    const headers = [
      'Nombre',
      'WhatsApp',
      'Categoría',
      'Score',
      'Estado',
      'Siguiente paso',
      'Marca',
      'Uso',
      'Presupuesto',
      'Cuándo compra',
      'Zona',
      'Entrega',
      'Comentario',
      'Motivo',
      'Resumen',
      'Mensaje para lead',
      'Calificado por IA',
      'Consentimiento',
      'Fecha consentimiento',
      'Creado en',
    ];

    const rows = sortedAndFilteredLeads.map((item) => [
      item.nombre,
      item.whatsapp,
      CATEGORY_META[item.categoria].label,
      item.score,
      STATUS_LABELS[item.estado],
      NEXT_STEP_LABELS[item.siguientePaso],
      item.respuestas.marca,
      item.respuestas.uso,
      item.respuestas.presupuesto,
      item.respuestas.cuando,
      item.respuestas.zona,
      item.respuestas.entrega,
      item.comentario,
      item.motivo,
      item.resumen,
      item.mensajeParaLead,
      item.calificadoPorIA ? 'Sí' : 'No',
      item.consentimiento.aceptado ? 'Sí' : 'No',
      item.consentimiento.fecha,
      item.creadoEn,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => sanitizeCsvCell(cell)).join(','))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `respeten-los-rangos-leads-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Pantalla de acceso con Google SOLO para dpaneztorres@gmail.com ---
  if (!authReady || !isAuthorizedAdmin) {
    return (
      <main className="min-h-[calc(100vh-14rem)] bg-gray-50 py-10 text-[#111827] sm:py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-[#F97316]">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>

            <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-[#111827]">
              Panel privado del equipo
            </h1>
            <p className="mt-2 text-base leading-relaxed text-gray-700">
              Inicia sesión con Google para revisar y gestionar los contactos en Firestore. Acceso exclusivo para{' '}
              <strong className="font-semibold text-[#111827]">
                {AUTHORIZED_TEAM_EMAIL}
              </strong>
              .
            </p>

            {!authReady ? (
              <div className="mt-6 flex items-center gap-2 text-base text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Verificando sesión...</span>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {authError && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-800"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{authError}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#F97316] px-6 py-3.5 text-base font-bold text-[#111827] transition-colors hover:bg-[#ea580c] disabled:cursor-wait disabled:opacity-75"
                >
                  {signingIn ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      <span>Conectando con Google...</span>
                    </>
                  ) : (
                    <span>Iniciar sesión con Google</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // --- Vista principal de /panel ---
  return (
    <main className="min-h-[calc(100vh-14rem)] bg-gray-50 py-6 text-[#111827] sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Encabezado del workspace */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
              Panel de contactos
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-600">
              Sesión activa: {user?.email} ·{' '}
              <span className="tabular-nums">{leads.length}</span> contactos totales
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={sortedAndFilteredLeads.length === 0}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* 4 métricas arriba */}
        <section
          aria-label="Resumen de contactos"
          className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-600">
              Contactos de la semana
            </p>
            <p className="font-display mt-1.5 text-3xl font-extrabold text-[#111827] tabular-nums sm:text-4xl">
              {metrics.weeklyCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-600">
              Porcentaje calientes
            </p>
            <p className="font-display mt-1.5 text-3xl font-extrabold text-[#ea580c] tabular-nums sm:text-4xl">
              {metrics.hotPercent}%
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-600">
              Tiempo al 1er contacto
            </p>
            <p className="font-display mt-1.5 text-3xl font-extrabold text-[#111827] tabular-nums sm:text-4xl">
              {metrics.avgFirstContactLabel}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-gray-600">
              Llegó a cita
            </p>
            <p className="font-display mt-1.5 text-3xl font-extrabold text-[#111827] tabular-nums sm:text-4xl">
              {metrics.citaPercent}%
            </p>
          </div>
        </section>

        {/* Filtros por categoría y estado */}
        <section
          aria-label="Filtros de contactos"
          className="mt-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="filter-category"
              className="block text-sm font-semibold text-[#111827]"
            >
              Filtrar por categoría
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'todas' | LeadCategory)
              }
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base font-medium text-[#111827] focus:border-[#111827] focus:outline-none"
            >
              <option value="todas">Todas las categorías</option>
              <option value="caliente">Caliente</option>
              <option value="tibio">Tibio</option>
              <option value="frio">Frío</option>
              <option value="descalificado">Descalificado</option>
            </select>
          </div>

          <div className="flex-1">
            <label
              htmlFor="filter-status"
              className="block text-sm font-semibold text-[#111827]"
            >
              Filtrar por estado
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'todos' | LeadStatus)
              }
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base font-medium text-[#111827] focus:border-[#111827] focus:outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="contactado">Contactado</option>
              <option value="cita">Cita</option>
              <option value="ganado">Ganado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          {(categoryFilter !== 'todas' || statusFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('todas');
                setStatusFilter('todos');
              }}
              className="min-h-[44px] shrink-0 cursor-pointer whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-100"
            >
              Limpiar filtros
            </button>
          )}
        </section>

        {panelError && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{panelError}</span>
          </div>
        )}

        {/* Lista de contactos */}
        <section aria-label="Lista de contactos" className="mt-6">
          {isLoadingLeads && leads.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white"
                />
              ))}
            </div>
          ) : sortedAndFilteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="font-display text-2xl font-bold text-[#111827]">
                {leads.length === 0
                  ? 'Aún no hay contactos registrados en Firestore'
                  : 'Ningún contacto coincide con los filtros'}
              </p>
              <p className="mt-2 text-base text-gray-600">
                {leads.length === 0
                  ? 'Completa una cotización en el cuestionario para guardarla en Firestore y verla ordenada aquí.'
                  : 'Prueba seleccionando otra categoría o estado.'}
              </p>
              {leads.length === 0 && (
                <button
                  type="button"
                  onClick={onGoToQuiz}
                  className="mt-5 inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl bg-[#F97316] px-6 py-3 text-base font-bold text-[#111827] transition-colors hover:bg-[#ea580c]"
                >
                  Ir al cuestionario de prueba
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <ul className="divide-y divide-gray-200">
                {sortedAndFilteredLeads.map((lead) => {
                  const cat = CATEGORY_META[lead.categoria];
                  return (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="flex min-h-[76px] w-full cursor-pointer flex-col gap-2.5 p-4 text-left transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-lg font-bold text-[#111827]">
                              {lead.nombre}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold ${cat.badgeClass}`}
                            >
                              {cat.label}
                            </span>
                            <span className="text-sm font-bold text-[#111827] tabular-nums">
                              {lead.score}/100
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-relaxed text-gray-700">
                            {lead.resumen}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                          <span className="text-sm font-semibold text-[#111827]">
                            {STATUS_LABELS[lead.estado]}
                          </span>
                          <span className="text-xs font-medium text-gray-600 tabular-nums">
                            {formatRelativeTime(lead.creadoEn)}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Detalle del contacto */}
      {selectedLead && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-detail-title"
          className="fixed inset-0 z-50 flex justify-end bg-black/50"
          onClick={() => setSelectedLeadId(null)}
        >
          <div
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 text-[#111827] shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2
                    id="lead-detail-title"
                    className="font-display text-3xl font-extrabold tracking-tight text-[#111827]"
                  >
                    {selectedLead.nombre}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold ${
                      CATEGORY_META[selectedLead.categoria].badgeClass
                    }`}
                  >
                    {CATEGORY_META[selectedLead.categoria].label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-600 tabular-nums">
                  {selectedLead.whatsapp} · Score {selectedLead.score}/100 ·{' '}
                  {formatRelativeTime(selectedLead.creadoEn)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                aria-label="Cerrar detalle del contacto"
                className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-[#111827] transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Acciones principales */}
            <div className="mt-5 space-y-4">
              <a
                href={buildWhatsAppUrl(
                  selectedLead.mensajeParaLead,
                  selectedLead.whatsapp
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#F97316] px-6 py-3.5 text-base font-bold text-[#111827] transition-colors hover:bg-[#ea580c]"
              >
                <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Escribir por WhatsApp</span>
              </a>

              <div>
                <label
                  htmlFor="detail-status-select"
                  className="block text-sm font-semibold text-[#111827]"
                >
                  Estado del contacto
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <select
                    id="detail-status-select"
                    value={selectedLead.estado}
                    disabled={updatingStatusId === selectedLead.id}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedLead.id,
                        e.target.value as LeadStatus
                      )
                    }
                    className="min-h-[48px] w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-semibold text-[#111827] focus:border-[#111827] focus:outline-none disabled:opacity-60"
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="contactado">Contactado</option>
                    <option value="cita">Cita</option>
                    <option value="ganado">Ganado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                  {updatingStatusId === selectedLead.id && (
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin text-[#111827]"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Calificación y siguiente paso */}
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-5">
              <div>
                <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Siguiente paso sugerido
                </p>
                <p className="mt-1 text-base font-bold text-[#111827]">
                  {NEXT_STEP_LABELS[selectedLead.siguientePaso]}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Motivo de la puntuación
                </p>
                <p className="mt-1 text-base leading-relaxed text-gray-800">
                  {selectedLead.motivo}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Resumen para el equipo
                </p>
                <p className="mt-1 text-base leading-relaxed text-gray-800">
                  {selectedLead.resumen}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Mensaje inicial sugerido (WhatsApp)
                </p>
                <p className="mt-1 rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-800">
                  {selectedLead.mensajeParaLead}
                </p>
              </div>
            </div>

            {/* Respuestas completas y comentario */}
            <div className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="font-display text-xl font-bold text-[#111827]">
                Respuestas completas
              </h3>
              <dl className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-gray-600">Marca</dt>
                  <dd className="font-semibold text-[#111827]">
                    {selectedLead.respuestas.marca}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-gray-600">Uso</dt>
                  <dd className="font-semibold text-[#111827]">
                    {selectedLead.respuestas.uso}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-gray-600">Presupuesto</dt>
                  <dd className="font-semibold text-[#111827] tabular-nums">
                    {selectedLead.respuestas.presupuesto}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-gray-600">Cuándo compra</dt>
                  <dd className="font-semibold text-[#111827]">
                    {selectedLead.respuestas.cuando}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-gray-600">Zona</dt>
                  <dd className="font-semibold text-[#111827]">
                    {selectedLead.respuestas.zona}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-gray-600">Entrega</dt>
                  <dd className="font-semibold text-[#111827]">
                    {selectedLead.respuestas.entrega}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">
                  Comentario del cliente
                </p>
                <p className="mt-1 rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-800">
                  {selectedLead.comentario || 'Sin comentario adicional.'}
                </p>
              </div>

              <p className="mt-4 text-xs text-gray-600">
                Consentimiento: {selectedLead.consentimiento.aceptado ? 'Aceptado' : 'No'}{' '}
                · {new Date(selectedLead.consentimiento.fecha).toLocaleString('es-PE')} ·{' '}
                {selectedLead.calificadoPorIA
                  ? 'Calificado con Gemini'
                  : 'Regla fija / respaldo'}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
