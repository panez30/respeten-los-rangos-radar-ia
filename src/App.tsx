import { useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { AppView, Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { QuizPage } from './components/QuizPage';
import { ThankYouPage } from './components/ThankYouPage';
import { PanelPage } from './components/PanelPage';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import {
  AUTHORIZED_TEAM_EMAIL,
  OperationType,
  auth,
  db,
  handleFirestoreError,
} from './lib/firebase';
import {
  LeadCategory,
  LeadContact,
  LeadQualificationResult,
  NextStep,
  QualifiedLead,
  QuizAnswers,
  buildClientFallbackQualification,
} from './types/lead';

const INITIAL_ANSWERS: QuizAnswers = {
  marca: '',
  uso: '',
  presupuesto: '',
  cuando: '',
  zona: '',
  entrega: '',
  detalle: '',
};

const INITIAL_CONTACT: LeadContact = {
  nombre: '',
  prefijo: '+51',
  whatsapp: '',
  consentimiento: false,
};

const SUBMISSION_COOLDOWN_MS = 30_000;
const ALLOWED_CATEGORIES: LeadCategory[] = [
  'caliente',
  'tibio',
  'frio',
  'descalificado',
];
const ALLOWED_NEXT_STEPS: NextStep[] = [
  'llamar_hoy',
  'escribir_whatsapp',
  'enviar_informacion',
  'no_contactar',
];

function getInitialViewFromPath(): AppView {
  if (typeof window !== 'undefined' && window.location.pathname === '/panel') {
    return 'panel';
  }
  return 'inicio';
}

function parseQualificationResponse(
  raw: unknown,
  fallback: LeadQualificationResult
): LeadQualificationResult {
  if (!raw || typeof raw !== 'object') return fallback;
  const obj = raw as Record<string, unknown>;

  if (
    typeof obj.score !== 'number' ||
    !Number.isFinite(obj.score) ||
    typeof obj.categoria !== 'string' ||
    !ALLOWED_CATEGORIES.includes(obj.categoria as LeadCategory) ||
    typeof obj.siguiente_paso !== 'string' ||
    !ALLOWED_NEXT_STEPS.includes(obj.siguiente_paso as NextStep) ||
    typeof obj.motivo !== 'string' ||
    !obj.motivo.trim() ||
    typeof obj.resumen_equipo !== 'string' ||
    !obj.resumen_equipo.trim() ||
    typeof obj.mensaje_para_el_lead !== 'string' ||
    !obj.mensaje_para_el_lead.trim()
  ) {
    return fallback;
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(obj.score))),
    categoria: obj.categoria as LeadCategory,
    motivo: obj.motivo.trim(),
    resumen_equipo: obj.resumen_equipo.trim(),
    mensaje_para_el_lead: obj.mensaje_para_el_lead.trim(),
    siguiente_paso: obj.siguiente_paso as NextStep,
    calificadoPorIA: Boolean(obj.calificadoPorIA),
  };
}

export default function App() {
  const [view, setView] = useState<AppView>(getInitialViewFromPath);
  const [answers, setAnswers] = useState<QuizAnswers>(INITIAL_ANSWERS);
  const [contact, setContact] = useState<LeadContact>(INITIAL_CONTACT);
  const [lastSubmittedLead, setLastSubmittedLead] = useState<QualifiedLead | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldownError, setSubmitCooldownError] = useState('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Estado de Firebase Auth para /panel
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const lastSubmitTimestampRef = useRef<number>(0);
  const lastSubmittedPhoneRef = useRef<string>('');
  const submitLockRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const email = currentUser.email?.toLowerCase() ?? '';
        if (email !== AUTHORIZED_TEAM_EMAIL || !currentUser.emailVerified) {
          await signOut(auth);
          setAuthUser(null);
          setAuthError(
            `Acceso denegado: este panel es exclusivo para ${AUTHORIZED_TEAM_EMAIL}.`
          );
          setAuthReady(true);
          return;
        }
      }
      setAuthUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/panel') {
        setView('panel');
      } else {
        setView((prev) => (prev === 'panel' ? 'inicio' : prev));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const syncUrlPath = (targetPath: '/' | '/panel') => {
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleStartQuiz = () => {
    syncUrlPath('/');
    setAnswers(INITIAL_ANSWERS);
    setContact((prev) => ({
      ...INITIAL_CONTACT,
      nombre: prev.nombre,
      prefijo: '+51',
    }));
    setSubmitCooldownError('');
    setView('cuestionario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    syncUrlPath('/');
    setSubmitCooldownError('');
    setView('inicio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPanel = () => {
    syncUrlPath('/panel');
    setView('panel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (sectionId: string) => {
    if (view !== 'inicio') {
      syncUrlPath('/');
      setView('inicio');
      window.setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpdateAnswer = <K extends keyof QuizAnswers>(
    key: K,
    value: QuizAnswers[K]
  ) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateContact = <K extends keyof LeadContact>(
    key: K,
    value: LeadContact[K]
  ) => {
    setContact((prev) => ({ ...prev, [key]: value }));
    if (submitCooldownError) setSubmitCooldownError('');
  };

  const handleSubmitLead = async (honeypotValue: string) => {
    if (submitLockRef.current || isSubmitting) return;

    if (honeypotValue.trim().length > 0) {
      setSubmitCooldownError(
        'No se pudo procesar tu solicitud. Inténtalo nuevamente en unos segundos.'
      );
      return;
    }

    const now = Date.now();
    const normalizedPhone = `${contact.prefijo}${contact.whatsapp.replace(/\D/g, '')}`;
    const elapsedSinceLast = now - lastSubmitTimestampRef.current;

    if (
      lastSubmitTimestampRef.current > 0 &&
      elapsedSinceLast < SUBMISSION_COOLDOWN_MS &&
      lastSubmittedPhoneRef.current === normalizedPhone
    ) {
      const remainingSec = Math.ceil((SUBMISSION_COOLDOWN_MS - elapsedSinceLast) / 1000);
      setSubmitCooldownError(
        `Ya recibimos tu solicitud hace un momento. Si deseas enviar otra consulta, espera ${remainingSec} segundos.`
      );
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitCooldownError('');

    const cleanContact: LeadContact = {
      nombre: contact.nombre.trim().replace(/\s+/g, ' ').slice(0, 80),
      prefijo: contact.prefijo,
      whatsapp: contact.whatsapp.replace(/\s+/g, ' ').trim(),
      consentimiento: contact.consentimiento,
    };

    const cleanAnswers: QuizAnswers = {
      ...answers,
      detalle: answers.detalle.trim().slice(0, 300),
    };

    const fallbackQualification = buildClientFallbackQualification(
      cleanContact.nombre,
      cleanAnswers
    );

    let qualification: LeadQualificationResult = fallbackQualification;

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 11_000);

      try {
        const res = await fetch('/api/calificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: cleanContact.nombre,
            prefijo: cleanContact.prefijo,
            whatsapp: cleanContact.whatsapp,
            consentimiento: cleanContact.consentimiento,
            answers: cleanAnswers,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data: unknown = await res.json();
          qualification = parseQualificationResponse(data, fallbackQualification);
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch {
      qualification = fallbackQualification;
    }

    const formattedWhatsapp = `${cleanContact.prefijo} ${cleanContact.whatsapp.replace(/\D/g, '')}`.slice(0, 30);

    // Guardar contacto calificado en Firestore (colección "leads")
    let firestoreId = `lead-${Date.now()}`;
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        nombre: cleanContact.nombre,
        whatsapp: formattedWhatsapp,
        respuestas: {
          marca: cleanAnswers.marca,
          uso: cleanAnswers.uso,
          presupuesto: cleanAnswers.presupuesto,
          cuando: cleanAnswers.cuando,
          zona: cleanAnswers.zona,
          entrega: cleanAnswers.entrega,
        },
        comentario: cleanAnswers.detalle,
        score: qualification.score,
        categoria: qualification.categoria,
        motivo: qualification.motivo.slice(0, 220),
        resumen: qualification.resumen_equipo.slice(0, 280),
        mensajeParaLead: qualification.mensaje_para_el_lead.slice(0, 380),
        siguientePaso: qualification.siguiente_paso,
        calificadoPorIA: qualification.calificadoPorIA,
        estado: 'nuevo',
        consentimiento: {
          aceptado: true,
          fecha: serverTimestamp(),
        },
        creadoEn: serverTimestamp(),
        primerContactoEn: null,
        llegoACita: false,
      });
      firestoreId = docRef.id;
    } catch (error) {
      // Registrar error estructurado sin bloquear la pantalla de gracias para el visitante
      try {
        handleFirestoreError(error, OperationType.CREATE, 'leads');
      } catch {
        // Manejado silenciosamente para el visitante
      }
    }

    const completedAt = Date.now();
    const newLead: QualifiedLead = {
      id: firestoreId,
      createdAt: new Date(completedAt).toISOString(),
      answers: cleanAnswers,
      contact: cleanContact,
      qualification,
    };

    lastSubmitTimestampRef.current = completedAt;
    lastSubmittedPhoneRef.current = normalizedPhone;
    setLastSubmittedLead(newLead);
    setIsSubmitting(false);
    submitLockRef.current = false;
    setView('gracias');
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#111827]">
      <Header
        currentView={view}
        onNavigateHome={handleNavigateHome}
        onStartQuiz={handleStartQuiz}
        onScrollToSection={handleScrollToSection}
      />

      <div className="flex-1">
        {view === 'inicio' && <HomePage onStartQuiz={handleStartQuiz} />}

        {view === 'cuestionario' && (
          <QuizPage
            answers={answers}
            contact={contact}
            isSubmitting={isSubmitting}
            submitCooldownError={submitCooldownError}
            onUpdateAnswer={handleUpdateAnswer}
            onUpdateContact={handleUpdateContact}
            onSubmitLead={handleSubmitLead}
            onBackHome={handleNavigateHome}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        )}

        {view === 'gracias' && lastSubmittedLead && (
          <ThankYouPage
            lead={lastSubmittedLead}
            onNewQuote={handleStartQuiz}
            onBackHome={handleNavigateHome}
          />
        )}

        {view === 'panel' && (
          <PanelPage
            user={authUser}
            authReady={authReady}
            authError={authError}
            onAuthError={setAuthError}
            onGoToQuiz={handleStartQuiz}
          />
        )}
      </div>

      <Footer
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenPanel={handleOpenPanel}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
