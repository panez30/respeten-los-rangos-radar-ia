export type BrandChoice = 'Adidas' | 'Puma' | 'Nike' | 'Otra marca';
export type UsageChoice =
  | 'Uso diario o urbano'
  | 'Running o gimnasio'
  | 'Fútbol o deporte'
  | 'Colección o edición especial';
export type BudgetChoice =
  | 'Menos de S/ 200'
  | 'S/ 220 – S/ 320'
  | 'S/ 320 – S/ 480'
  | 'Más de S/ 480';
export type TimeframeChoice =
  | 'Esta semana'
  | 'Dentro de este mes'
  | 'Solo estoy cotizando';
export type ZoneChoice =
  | 'Villa de Pasco'
  | 'Cerro de Pasco - Chaupimarca'
  | 'Colquijirca - Tinyahuarco'
  | 'Otra provincia fuera de Pasco';
export type DeliveryChoice =
  | 'Recojo en punto de Villa de Pasco'
  | 'Delivery local en Pasco';

export interface QuizAnswers {
  marca: BrandChoice | '';
  uso: UsageChoice | '';
  presupuesto: BudgetChoice | '';
  cuando: TimeframeChoice | '';
  zona: ZoneChoice | '';
  entrega: DeliveryChoice | '';
  detalle: string;
}

export interface LeadContact {
  nombre: string;
  prefijo: string;
  whatsapp: string;
  consentimiento: boolean;
}

export type LeadCategory = 'caliente' | 'tibio' | 'frio' | 'descalificado';
export type NextStep =
  | 'llamar_hoy'
  | 'escribir_whatsapp'
  | 'enviar_informacion'
  | 'no_contactar';
export type LeadStatus =
  | 'nuevo'
  | 'contactado'
  | 'cita'
  | 'ganado'
  | 'perdido';

export interface LeadQualificationResult {
  score: number;
  categoria: LeadCategory;
  motivo: string;
  resumen_equipo: string;
  mensaje_para_el_lead: string;
  siguiente_paso: NextStep;
  calificadoPorIA: boolean;
}

export interface LeadRecord {
  id: string;
  nombre: string;
  whatsapp: string;
  respuestas: {
    marca: string;
    uso: string;
    presupuesto: string;
    cuando: string;
    zona: string;
    entrega: string;
  };
  comentario: string;
  score: number;
  categoria: LeadCategory;
  motivo: string;
  resumen: string;
  mensajeParaLead: string;
  siguientePaso: NextStep;
  calificadoPorIA: boolean;
  estado: LeadStatus;
  consentimiento: {
    aceptado: boolean;
    fecha: string;
  };
  creadoEn: string;
  primerContactoEn: string | null;
  llegoACita: boolean;
}

export interface QualifiedLead {
  id: string;
  createdAt: string;
  answers: QuizAnswers;
  contact: LeadContact;
  qualification: LeadQualificationResult;
}

export interface CountryPrefix {
  code: string;
  label: string;
  minDigits: number;
  maxDigits: number;
}

export const COUNTRY_PREFIXES: CountryPrefix[] = [
  { code: '+51', label: 'Perú (+51)', minDigits: 9, maxDigits: 9 },
  { code: '+56', label: 'Chile (+56)', minDigits: 9, maxDigits: 9 },
  { code: '+57', label: 'Colombia (+57)', minDigits: 10, maxDigits: 10 },
  { code: '+54', label: 'Argentina (+54)', minDigits: 10, maxDigits: 11 },
  { code: '+593', label: 'Ecuador (+593)', minDigits: 9, maxDigits: 9 },
  { code: '+591', label: 'Bolivia (+591)', minDigits: 8, maxDigits: 8 },
  { code: '+52', label: 'México (+52)', minDigits: 10, maxDigits: 10 },
  { code: '+34', label: 'España (+34)', minDigits: 9, maxDigits: 9 },
  { code: '+1', label: 'EE. UU. (+1)', minDigits: 10, maxDigits: 10 },
];

export interface QuizQuestionStep {
  key: keyof Omit<QuizAnswers, 'detalle'>;
  question: string;
  helper: string;
  options: string[];
}

export const QUIZ_QUESTIONS: QuizQuestionStep[] = [
  {
    key: 'marca',
    question: '¿Qué marca de zapatillas buscas principalmente?',
    helper: 'Elige una opción para revisar modelos disponibles en tu talla.',
    options: ['Adidas', 'Puma', 'Nike', 'Otra marca'],
  },
  {
    key: 'uso',
    question: '¿Para qué uso las necesitas?',
    helper: 'Así te recomendamos la suela y horma más adecuada.',
    options: [
      'Uso diario o urbano',
      'Running o gimnasio',
      'Fútbol o deporte',
      'Colección o edición especial',
    ],
  },
  {
    key: 'presupuesto',
    question: '¿Cuál es tu presupuesto aproximado?',
    helper: 'Nos ayuda a mostrarte opciones reales dentro de tu rango.',
    options: [
      'Menos de S/ 200',
      'S/ 220 – S/ 320',
      'S/ 320 – S/ 480',
      'Más de S/ 480',
    ],
  },
  {
    key: 'cuando',
    question: '¿Cuándo planeas comprar?',
    helper: 'Priorizamos stock inmediato si buscas para esta semana.',
    options: [
      'Esta semana',
      'Dentro de este mes',
      'Solo estoy cotizando',
    ],
  },
  {
    key: 'zona',
    question: '¿En qué zona te encuentras?',
    helper: 'Coordinamos entrega directa en Pasco o envíos desde Villa de Pasco.',
    options: [
      'Villa de Pasco',
      'Cerro de Pasco - Chaupimarca',
      'Colquijirca - Tinyahuarco',
      'Otra provincia fuera de Pasco',
    ],
  },
  {
    key: 'entrega',
    question: '¿Cómo prefieres recibir tu pedido?',
    helper: 'Elige la modalidad que te quede más cómoda.',
    options: [
      'Recojo en punto de Villa de Pasco',
      'Delivery local en Pasco',
    ],
  },
];

export const STORE_WHATSAPP_NUMBER = '51992911064';

export function buildClientFallbackQualification(
  nombre: string,
  answers: QuizAnswers
): LeadQualificationResult {
  if (
    answers.zona === 'Otra provincia fuera de Pasco' ||
    answers.presupuesto === 'Menos de S/ 200' ||
    answers.marca === 'Otra marca'
  ) {
    return {
      score: 0,
      categoria: 'descalificado',
      motivo: 'Fuera de cobertura, marca o presupuesto mínimo de la tienda',
      resumen_equipo: 'No contactar: fuera de criterio fijo',
      mensaje_para_el_lead:
        'Gracias por escribir a Respeten los Rangos. Por ahora solo atendemos pedidos de Adidas, Puma y Nike en Pasco desde S/ 220. ¡Un saludo!',
      siguiente_paso: 'no_contactar',
      calificadoPorIA: false,
    };
  }

  const safeName = nombre.trim() || 'amigo';
  const safeMarca = answers.marca || 'zapatillas originales';

  return {
    score: 50,
    categoria: 'tibio',
    motivo: 'Calificación automática de respaldo',
    resumen_equipo: `Cliente interesado en ${safeMarca} (${answers.uso}, ${answers.presupuesto}) en ${answers.zona}. Contactar por WhatsApp.`,
    mensaje_para_el_lead: `Hola ${safeName}, gracias por escribir a Respeten los Rangos. Recibimos tu consulta sobre zapatillas ${safeMarca} y pronto revisaremos opciones según tu búsqueda.`,
    siguiente_paso: 'escribir_whatsapp',
    calificadoPorIA: false,
  };
}

export function truncateForWhatsApp(message: string, maxChars = 280): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
}

export function buildWhatsAppUrl(
  message: string,
  phoneNumber = STORE_WHATSAPP_NUMBER
): string {
  const digits = phoneNumber.replace(/\D/g, '') || STORE_WHATSAPP_NUMBER;
  const truncated = truncateForWhatsApp(message, 280);
  return `https://wa.me/${digits}?text=${encodeURIComponent(truncated)}`;
}
