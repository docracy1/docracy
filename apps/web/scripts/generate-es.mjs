/**
 * One-off helper: merge existing es.ts with missing keys from en.ts.
 * Missing keys get Spanish from NEW_ES below; run: node scripts/generate-es.mjs
 */
import fs from "fs";
import path from "path";

const dir = path.join(import.meta.dirname, "../src/lib/i18n");
const enSrc = fs.readFileSync(path.join(dir, "en.ts"), "utf8");
let esSrc = fs.readFileSync(path.join(dir, "es.ts"), "utf8");

function parseMessages(src) {
  const out = {};
  for (const m of src.matchAll(/^\s+"([^"]+)":\s*(?:"((?:\\.|[^"\\])*)"|(\n\s*"))/gm)) {
    const key = m[1];
    if (m[2] !== undefined) out[key] = m[2].replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
  // multiline strings
  for (const m of src.matchAll(/^\s+"([^"]+)":\s*\n\s*"([^"]*(?:\\.\n\s*"[^"]*)*)"/gm)) {
    const key = m[1];
    out[key] = m[2].replace(/\n\s*/g, " ").replace(/\\"/g, '"');
  }
  return out;
}

/** Simpler: line-by-line key: value */
function parseSimple(src) {
  const out = {};
  const re = /^\s+"([^"]+)":\s*"((?:\\.|[^"\\])*)",?\s*$/;
  const reMultiStart = /^\s+"([^"]+)":\s*$/;
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (m) {
      out[m[1]] = m[2].replace(/\\"/g, '"');
      continue;
    }
    const ms = lines[i].match(reMultiStart);
    if (ms && lines[i + 1]?.trim().startsWith('"')) {
      let val = lines[i + 1].trim();
      if (val.endsWith(",")) val = val.slice(0, -1);
      out[ms[1]] = val.slice(1, -1);
      i++;
    }
  }
  return out;
}

const en = parseSimple(enSrc);
const es = parseSimple(esSrc);

const NEW_ES = {
  "how.1.title": "Subir",
  "how.1.body": "Agrega el PDF que quieres firmar, o empieza con una plantilla gratis.",
  "how.2.title": "Agregar firmantes y campos",
  "how.2.body": "Indica quién debe firmar, en qué orden, y coloca campos de firma y fecha en el documento.",
  "how.3.title": "Enviar",
  "how.3.body": "Todos en la cadena reciben un enlace por correo — no necesitan cuenta para firmar.",
  "how.4.title": "Firmado y listo",
  "how.4.body": "Cuando todos firmen, descarga el PDF final y su certificado de finalización.",
  "landing.useTemplate": "Usar esta plantilla →",
  "landing.browseTemplates": "Ver las {{count}} plantillas gratis →",
  "sign.reason": "Motivo: {{reason}}",
  "sign.pinBody": "Este documento tiene un PIN extra en tu enlace de firma. Ingrésalo para continuar.",
  "sign.pinPlaceholder": "PIN",
  "sign.continue": "Continuar",
  "sign.checking": "Verificando…",
  "sign.notTurnBody": "Alguien antes en el orden de firma aún no ha firmado. Así va el proceso:",
  "sign.declinedBody": "Rechazaste firmar. El remitente y las demás partes fueron notificados.",
  "sign.cancelledBody": "Este documento fue cancelado y ya no está disponible para firmar.",
  "sign.declinedDocBody": "Un firmante rechazó este documento, así que ya no está disponible para firmar.",
  "sign.viral": "Creado con Docracy — envía tus propios documentos gratis.",
  "sign.sendDoc": "Enviar un documento",
  "sign.clickInitial": "Haz clic para poner iniciales",
  "sign.drawInitials": "Dibuja tus iniciales",
  "sign.useSig": "Usar esta firma",
  "sign.uploadAttachment": "Subir adjunto",
  "sign.uploadAttachmentBody": "Sube al menos un archivo (PDF o imagen, hasta {{mb}}MB cada uno) antes de firmar.",
  "sign.uploading": "Subiendo…",
  "sign.choose": "Elige…",
  "sign.typeHere": "Escribe aquí",
  "sign.dateField": "Fecha",
  "sign.textField": "Campo de texto",
  "sign.dropdownField": "Campo desplegable",
  "sign.optionalCheckbox": "Casilla opcional",
  "sign.requiredCheckbox": "Casilla obligatoria",
  "sign.yourSignature": "Tu firma",
  "sign.senderLogo": "Logo del remitente",
  "sign.declinePrompt": "Motivo opcional para rechazar (déjalo en blanco para omitir):",
  "common.notAvailable": "No disponible",
  "common.redirecting": "Redirigiendo…",
  "common.saving": "Guardando…",
  "common.deleting": "Eliminando…",
  "common.adding": "Agregando…",
  "common.removing": "Quitando…",
  "common.generating": "Generando…",
  "common.connecting": "Conectando…",
  "common.disconnecting": "Desconectando…",
  "common.copied": "Copiado",
  "common.dismiss": "Descartar",
  "common.delete": "Eliminar",
  "common.reload": "Recargar",
  "common.backHome": "Volver al inicio",
  "common.included": "Incluido",
  "common.notIncluded": "No incluido",
  "common.bestValue": "Mejor valor",
  "common.goDashboard": "Ir al panel",
  "common.manageSubscription": "Administrar suscripción",
  "common.person": "persona",
  "common.people": "personas",
  "pricing.colFree": "Gratis",
  "pricing.colPaid": "Pago",
  "pricing.colEnt": "Enterprise",
  "pricing.colPaidSub": "$10/mes",
  "pricing.colEntSub": "Personalizado —",
  "plan.signersPerDoc": "Firmantes por documento",
  "plan.sequentialOrParallel": "Firma secuencial o todos a la vez",
  "plan.pinLinks": "Enlaces de firma protegidos con PIN",
  "plan.fieldTypes": "Campos de texto, fecha, iniciales, casilla y desplegable",
  "plan.anchorTags": "Etiquetas ancla en PDFs ({{sig1}}, etc.)",
  "plan.smsLinks": "Enlaces de firma por SMS (solo números de EE. UU.)",
  "plan.signerAttachments": "Adjuntos del firmante",
  "plan.ccRecipients": "Destinatarios CC / espectadores",
  "plan.declineCancel": "Rechazar o cancelar un documento",
  "plan.auditCert": "Registro de auditoría + certificado de finalización",
  "plan.dashboard": "Panel con historial de documentos",
  "plan.templates": "Plantillas reutilizables",
  "plan.bulkSend": "Envío masivo",
  "plan.customExpiry": "Vencimiento personalizado del documento",
  "plan.embedded": "Firma integrada",
  "plan.contactsReassign": "Contactos guardados + reasignación de firmantes",
  "plan.webhooks": "Webhooks para tus propios sistemas",
  "plan.mcp": "Conector MCP (Claude, ChatGPT, Grok, Perplexity)",
  "plan.teamAccounts": "Cuentas de equipo (espacio compartido)",
  "plan.whiteLabel": "Marca blanca (tu propio logo)",
  "plan.aiDetect": "IA: detección automática de campos de firma y fecha",
  "plan.aiExplain": "IA: resumen claro del contrato",
  "plan.aiRisk": "IA: resaltador de riesgos y cláusulas",
  "plan.aiGenerate": "IA: generador de contratos (descríbelo, obtén un PDF firmable)",
  "plan.support": "Soporte al cliente",
  "plan.dropbox": "Conector Dropbox (carga automática de PDFs firmados)",
  "plan.onedrive": "Conector OneDrive (carga automática de PDFs firmados)",
  "plan.box": "Conector Box (carga automática de PDFs firmados)",
  "plan.googleDrive": "Conector Google Drive (carga automática de PDFs firmados)",
  "plan.invoiceBilling": "Facturación y contratos anuales",
  "plan.volumeDiscounts": "Descuentos por volumen e incorporación personalizada",
  "plan.val.upTo2": "Hasta 2",
  "plan.val.unlimited": "Ilimitado",
  "plan.val.days9": "9 días",
  "plan.val.days90": "Hasta 90 días",
  "plan.val.premium": "Premium",
  "dash.welcome": "Bienvenido",
  "dash.welcomeSub": "Esto es lo que necesita tu atención hoy.",
  "dash.new": "+ Nuevo",
  "dash.dashboard": "Panel",
  "dash.templates": "Plantillas",
  "dash.documents": "Documentos",
  "dash.tools": "Herramientas",
  "dash.awaitingYou": "Esperando tu firma",
  "dash.waitingOthers": "Esperando a otros",
  "dash.completed": "Completados",
  "dash.allDocs": "Todos los documentos",
  "dash.connector": "Conector y clave API",
  "dash.webhooks": "Webhooks",
  "dash.contacts": "Contactos",
  "dash.connectors": "Conectores",
  "dash.branding": "Marca",
  "dash.team": "Equipo",
  "dash.subscription": "Suscripción",
  "dash.admin": "Admin",
  "dash.support": "Soporte",
  "dash.more": "Más",
  "dash.newDocument": "Nuevo documento",
  "dash.completedMonth": "Completados este mes",
  "dash.caughtUp": "Estás al día.",
  "dash.caughtUpSub": "Nada está esperando tu firma ahora mismo.",
  "dash.signNow": "Firmar ahora",
  "dash.startNew": "Empezar algo nuevo",
  "dash.newDocBtn": "+ Nuevo documento",
  "dash.quickActions": "Acciones rápidas",
  "dash.quickActionsSub": "Documentos que envías seguido — vuelve a uno al instante.",
  "dash.sendAgain": "Enviar de nuevo",
  "dash.sentTimes": "— enviado {{count}} vez",
  "dash.sentTimesPlural": "— enviado {{count}} veces",
  "dash.upgradeTitle": "Mejorar a plan de pago — $10/mes",
  "dash.upgradeBody": "Firmantes ilimitados, un conector para que Claude, ChatGPT, Grok o Perplexity consulten tus documentos, cuentas de equipo, marca blanca y herramientas de IA — detección automática de campos, resumen claro con riesgos y un generador de contratos a partir de una línea.",
  "dash.freeTemplates": "Plantillas gratis",
  "dash.freeTemplatesSub": "Documentos listos para usar, sin cuenta — elige uno para rellenar sus campos de firma automáticamente.",
  "dash.browseFreeTemplates": "Ver todas las plantillas gratis →",
  "dash.templatesPaid": "Las plantillas son de pago",
  "dash.templatesPaidSub": "Mejora tu plan para guardar plantillas reutilizables de cualquier documento que prepares.",
  "dash.nothingHere": "Nada aquí todavía.",
  "dash.statusSigned": "Firmado",
  "dash.statusVoided": "Anulado",
  "dash.statusPending": "Pendiente",
  "dash.void": "Anular",
  "dash.voiding": "Anulando…",
  "dash.notSignedIn": "No has iniciado sesión",
  "dash.notSignedInSub": "Debes iniciar sesión para ver tu panel.",
  "dash.paymentFailed": "Por favor liquida tu factura pendiente para mantener activa tu cuenta de Docracy. ¡Gracias por tu comprensión!",
  "dash.updatePayment": "Actualizar método de pago",
  "dash.connectorConnected": "Conectado — los documentos firmados se subirán allí automáticamente.",
  "dash.connectorFailed": "No se pudo conectar ese proveedor. Inténtalo de nuevo.",
  "dash.voidPrompt": "Motivo opcional para anular (déjalo en blanco para omitir):",
  "prepare.title": "Preparar un documento",
  "prepare.loadingTemplate": "Cargando plantilla…",
  "prepare.startFromTemplate": "Empezar desde una plantilla",
  "prepare.signersCount": "{{count}} firmante",
  "prepare.signersCountPlural": "{{count}} firmantes",
  "prepare.recurring": "🔁 Recurrente",
  "prepare.uploadHint": "Sube el PDF que quieres firmar, o arrástralo abajo.",
  "prepare.dropPdf": "Suelta tu PDF aquí",
  "prepare.dragOr": "Arrastra y suelta un PDF aquí, o",
  "prepare.maxSize": "Tamaño máximo: 15MB.",
  "prepare.describeAgreement": "Describe el acuerdo que necesitas",
  "prepare.generatePlaceholder": "p. ej. \"Un contrato simple de diseño web por $2,500 a precio fijo con plazo de 2 semanas\"",
  "prepare.drafting": "Redactando…",
  "prepare.generate": "Generar",
  "prepare.aiDisclaimer": "Redactado por IA — revísalo con cuidado antes de enviar; esto no es asesoría legal.",
  "prepare.generateWithAi": "O genera uno con IA",
  "prepare.signInPaidAi": "Inicia sesión con una cuenta de pago",
  "prepare.signInPaidAiSub": "para generar un contrato con IA en lugar de subir uno.",
  "prepare.untitled": "Documento sin título",
  "prepare.startOver": "Empezar de nuevo",
  "prepare.send": "Enviar",
  "prepare.signersViewers": "Firmantes y espectadores",
  "prepare.myself": "+ Yo",
  "prepare.addSigner": "+ Firmante",
  "prepare.addViewer": "+ Espectador (CC)",
  "prepare.you": "Tú",
  "prepare.signerN": "Firmante {{n}}",
  "prepare.viewerN": "Espectador {{n}}",
  "prepare.seePaidPlans": "Ver planes de pago",
  "prepare.signInUpgrade": "Inicia sesión para mejorar el plan",
  "prepare.upgradeMonthly": "Mejorar plan — $10/mes",
  "prepare.fields": "Campos",
  "prepare.editPdf": "Editar PDF",
  "prepare.signHere": "Firma aquí",
  "prepare.initialHere": "Iniciales aquí",
  "prepare.fieldText": "Texto",
  "prepare.fieldDate": "Fecha",
  "prepare.fieldCheckbox": "Casilla",
  "prepare.fieldDropdown": "Desplegable",
  "prepare.fieldSignature": "Firma",
  "prepare.fieldInitials": "Iniciales",
  "prepare.inviteEmail": "Correo de invitación",
  "prepare.customized": "Personalizado",
  "prepare.defaultInvite": "Asunto y mensaje predeterminados",
  "prepare.files": "Archivos",
  "prepare.signers": "Firmantes",
  "prepare.fieldsPlaced": "Campos colocados",
  "prepare.expiration": "Vencimiento",
  "prepare.inDays": "en",
  "prepare.days": "días",
  "prepare.identityNote": "La identidad del firmante no se verifica — úsalo solo para documentos donde eso sea aceptable.",
  "prepare.saveTemplate": "Guardar como plantilla",
  "prepare.dropToPlace": "Suelta para colocar",
  "prepare.dragOntoDoc": "⠿ Arrastra al documento",
  "status.fullySigned": "Completamente firmado",
  "status.inProgress": "Firma en curso",
  "status.download": "Descargar PDF firmado",
  "status.cancelDoc": "Cancelar documento",
  "status.cancelling": "Cancelando…",
  "status.cancelPrompt": "Motivo opcional para cancelar (déjalo en blanco para omitir):",
  "status.viewer": "Espectador: {{info}}",
  "status.keepPdfs": "Guarda todos tus PDFs firmados en un solo lugar",
  "status.keepPdfsSub": "Las cuentas gratis guardan el historial. El plan de pago desbloquea plantillas, firmantes ilimitados y equipo — $10/mes.",
  "status.createAccount": "Crear cuenta gratis",
  "status.seePaidPlans": "Ver planes de pago",
  "status.dontLoseLink": "No pierdas este enlace de estado",
  "status.dontLoseLinkSub": "Crea una cuenta gratis para que todos tus documentos vivan en un panel — sin contraseña.",
  "sent.title": "En camino",
  "sent.titleFallback": "Enviado",
  "sent.fallbackBody": "Tu documento fue creado. Revisa tu correo para actualizaciones de estado.",
  "sent.parallel": "Cada firmante recibió su enlace por correo — pueden firmar en cualquier orden.",
  "sent.sequential": "El primer firmante recibió su enlace. Los demás en la cadena serán notificados en turno.",
  "sent.bookmark": "Guarda este enlace para consultar el progreso en cualquier momento:",
  "sent.copyStatus": "Copiar enlace de estado",
  "sent.shareColleague": "Comparte Docracy con un colega",
  "sent.saveAccount": "Guardar este envío en una cuenta",
  "sent.saveAccountSub": "Las cuentas gratis guardan cada documento que envías en un solo lugar — sin contraseña, solo un enlace mágico.",
  "sent.sendAnother": "Enviar otro",
  "firstDoc.prompt": "Envía tu primer documento — toma 30 segundos.",
  "firstDoc.upload": "Subir documento",
  "firstDoc.modalTitle": "Sube tu PDF",
  "firstDoc.modalSub": "No necesitas cuenta para enviar o firmar.",
  "firstDoc.uploadPdf": "Subir PDF",
  "integrations.title": "Conecta Docracy con las herramientas que ya usas",
  "integrations.sub": "Integra las plataformas que ya usas — almacenamiento en la nube, automatización y asistentes de IA. Las cuentas de pago desbloquean conectores nativos; todo lo listado aquí es real hoy.",
  "integrations.detail": "Dropbox, OneDrive, Box y Google Drive suben PDFs firmados automáticamente. Zapier y webhooks automatizan tu stack. MCP conecta Claude, ChatGPT, Grok, Perplexity y Cursor a tus documentos.",
  "integrations.learnMore": "Saber más →",
  "calc.title": "Cómo se compara Docracy en precio",
  "calc.sub": "El plan de pago de Docracy es una tarifa fija por espacio de trabajo, no por asiento — agrega tantos compañeros como quieras sin costo extra. Esto es lo que cuesta el mismo tamaño de equipo en las herramientas de firma electrónica con las que más nos comparan, según sus precios publicados.",
  "calc.teamSize": "Tamaño del equipo",
  "calc.unlimitedMembers": "Miembros de equipo ilimitados, un espacio de trabajo",
  "calc.pricingLink": "precios →",
  "calc.perUser": "{{price}}/usuario × {{seats}} usuarios, {{billing}}",
  "calc.minSeats": " (mínimo de {{min}} asientos aplica)",
  "calc.footer": "Los precios son el plan comercial/equipo estándar de cada proveedor según su propia página — los conjuntos de funciones difieren; haz clic para comparar exactamente qué incluye cada uno.",
  "auth.failed": "Error al iniciar sesión",
  "auth.missingToken": "Falta el token de acceso.",
  "auth.signingIn": "Iniciando sesión…",
  "team.failed": "No se pudo aceptar la invitación",
  "team.missingToken": "Falta el token de invitación.",
  "team.joining": "Uniéndote al espacio de trabajo…",
  "imprint.title": "Aviso legal",
  "imprint.sub": "Información según §5 ECG (Ley de Comercio Electrónico de Austria).",
  "imprint.operator": "Operador",
  "imprint.contact": "Contacto",
  "about.title": "Acerca de Docracy",
  "about.why": "Por qué existe",
  "about.whatNot": "Qué no es",
  "about.who": "Quién está detrás",
  "about.contact": "Contáctanos",
  "privacy.title": "Privacidad",
  "privacy.collect": "Qué recopilamos",
  "privacy.audit": "Registro de auditoría",
  "privacy.retention": "Retención",
  "privacy.analytics": "Analítica de tráfico",
  "privacy.thirdParties": "Terceros",
  "privacy.contact": "Contacto",
  "terms.title": "Términos",
  "terms.what": "Qué es Docracy",
  "terms.noVerify": "Sin verificación de identidad",
  "terms.noGuarantees": "Sin garantías",
  "terms.acceptableUse": "Uso aceptable",
  "blog.title": "Blog",
  "docs.title": "Documentación",
  "docs.sub": "Cómo funciona todo en Docracy, en un solo lugar.",
  "feature.problem": "El problema",
  "feature.solution": "La forma Docracy",
  "feature.features": "Funciones",
  "feature.cta": "Empezar",
  "feature.related": "Relacionado",
  "freeTemplates.title": "Plantillas gratis",
  "freeTemplates.sub": "Documentos listos para firmar — elige uno, completa tus datos y envía a firmar en minutos.",
  "mcp.eyebrow": "Para desarrolladores y usuarios avanzados de IA",
  "mcp.title": "Conecta Docracy a tu asistente de IA",
  "mcp.paidRequired": "Se requiere cuenta de pago",
  "chat.title": "Asistente Docracy",
  "chat.greeting": "Hola 👋 Puedo ayudarte a encontrar lo que necesitas:",
  "chat.sales": "Quiero hablar con ventas",
  "chat.support": "Necesito soporte al cliente",
  "chat.joke": "Cuéntame un chiste",
  "chat.other": "Necesito algo más",
  "chat.salesReply": "Escríbenos directamente y te responderemos pronto:",
  "chat.formReply": "Claro — deja tu correo y cuéntanos, y te responderemos.",
  "chat.thanks": "Gracias — recibido. Responderemos por correo.",
  "chat.emailPlaceholder": "tu@email.com",
  "chat.messagePlaceholder": "¿Qué necesitas?",
  "chat.yourEmail": "Tu correo",
  "chat.yourMessage": "Tu mensaje",
  "chat.open": "Abrir chat",
  "chat.close": "Cerrar chat",
  "error.title": "Algo salió mal",
  "error.body": "Esta página tuvo un error inesperado. Recargar suele solucionarlo.",
  "attachments.title": "Archivos subidos por firmantes",
  "pdf.zoomIn": "Acercar",
  "pdf.zoomOut": "Alejar",
  "uptime.title": "Estado del sistema",
  "uptime.checking": "Verificando…",
  "uptime.allOk": "Todos los sistemas operativos",
  "uptime.issues": "Algunos sistemas tienen problemas",
  "uptime.currentChecks": "Comprobaciones actuales",
  "uptime.incidentHistory": "Historial de incidentes",
  "uptime.noIncidents": "Sin incidentes reportados — el seguimiento diario empezó hoy.",
  "uptime.lastChecked": "Última comprobación {{time}}. Las comprobaciones se ejecutan en vivo en cada carga y una vez al día para el historial.",
  "uptime.loadFailed": "No se pudo cargar el estado:",
};

const merged = { ...es, ...NEW_ES };
for (const key of Object.keys(en)) {
  if (merged[key] === undefined) {
    console.warn("MISSING ES for:", key, "->", en[key]);
    merged[key] = en[key];
  }
}

const keys = Object.keys(en).sort();
const lines = keys.map((k) => {
  const raw = merged[k] ?? en[k] ?? k;
  const v = String(raw).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (v.length > 80) {
    return `  "${k}":\n    "${v}",`;
  }
  return `  "${k}": "${v}",`;
});

const out = `import type { Messages } from "./types";

/** US Spanish — clear, professional, tú-form for product UI (common for US Hispanic SaaS). */
const es: Messages = {
${lines.join("\n")}
};

export default es;
`;

fs.writeFileSync(path.join(dir, "es.ts"), out);
console.log("Wrote es.ts with", keys.length, "keys");
