/**
 * Backend para recepción de citas.
 *
 * Flujo:
 *  1. Recibe datos vía POST (nombre, telefono, correo).
 *  2. Valida datos de entrada.
 *  3. Guarda la cita en Firestore (colección "citas").
 *  4. Envía correo de confirmación al usuario.
 *  5. Envía correo de notificación al cliente (tú).
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Opciones globales para controlar costes / concurrencia.
setGlobalOptions({maxInstances: 10, region: "us-central1"});

// Inicialización de Firebase Admin SDK (una sola vez por contenedor).
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Configuración del transporte de correo con nodemailer.
 *
 * IMPORTANTE:
 *  - No dejes las credenciales hardcodeadas.
 *  - Configura variables de entorno seguras (por ejemplo con `firebase functions:config:set`
 *    o variables de entorno de Cloud Functions).
 */
const mailUser = process.env.MAIL_USER || "tibi@tibiasesora.com";
const mailPass = process.env.MAIL_PASS || "fgvp vdhx vxlg jqmx";
const clientNotifyEmail = 
  process.env.CLIENT_NOTIFY_EMAIL || "tibi@tibiasesora.com";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT || 465),
  secure: process.env.MAIL_SECURE !== "false", // true para 465, false para otros puertos
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

/**
 * Helper sencillo para validar email.
 */
const isValidEmail = (value) => {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

/**
 * Función HTTP para recibir citas desde el frontend.
 *
 * Endpoint esperado (ejemplo):
 *  POST https://<REGION>-<PROJECT>.cloudfunctions.net/submitCitas
 *  Body JSON: { nombre, telefono, correo }
 */
exports.submitCitas = onRequest(async (req, res) => {
  // Permitimos solo POST.
  if (req.method === "OPTIONS") {
    // Respuesta rápida para preflight CORS en desarrollo.
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({error: "Método no permitido. Usa POST."});
  }

  res.set("Access-Control-Allow-Origin", "*");

  try {
    const {nombre, telefono, correo} = req.body || {};

    // 1) Validación básica de datos
    const errors = [];
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      errors.push("El nombre es obligatorio.");
    }
    if (!correo || !isValidEmail(correo)) {
      errors.push("El correo es obligatorio y debe tener un formato válido.");
    }
    if (telefono && typeof telefono !== "string") {
      errors.push("El teléfono debe ser texto.");
    }

    if (errors.length > 0) {
      return res.status(400).json({error: "Datos inválidos", details: errors});
    }

    const cleaned = {
      nombre: nombre.trim(),
      telefono: telefono ? String(telefono).trim() : "",
      correo: correo.trim(),
    };

    // 2) Guardar en Firestore
    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection("citas").add({
      ...cleaned,
      createdAt: now,
      origen: "web-tibi-asesora",
    });

    // 3) Enviar correo al usuario (agradecimiento + enlace Meet placeholder)
    const userMailOptions = {
      from: `"Tibi Asesora" <${mailUser}>`,
      to: cleaned.correo,
      subject: "Gracias por agendar una cita con Tibi Asesora",
      text: `
Hola ${cleaned.nombre},

Gracias por compartir tus datos. En breve me pondré en contacto contigo para
coordinar día y hora de la sesión.

Mientras tanto, puedes guardar este enlace de Google Meet (placeholder) para nuestra llamada:
https://meet.google.com/tu-enlace-de-ejemplo

Un abrazo,
Tibi
      `.trim(),
      html: `
        <p>Hola <strong>${cleaned.nombre}</strong>,</p>
        <p>
          Gracias por compartir tus datos. En breve me pondré en contacto contigo para
          coordinar día y hora de la sesión.
        </p>
        <p>
          Mientras tanto, puedes guardar este enlace de Google Meet (placeholder) para nuestra llamada:<br />
          <a href="https://calendar.app.google/eWWCSsXedQZpS9tZ6" target="_blank" rel="noreferrer">
            Calendario de citas Tibi Asesora de importaciones
          </a>
        </p>
        <p>Un abrazo,<br/>Tibi</p>
      `,
    };

    // 4) Enviar correo a tu cliente (notificación interna con datos)
    const clientMailOptions = {
      from: `"Tibi Asesora - Notificaciones" <${mailUser}>`,
      to: clientNotifyEmail,
      subject: "Nueva solicitud de cita desde la web",
      text: `
Nueva cita registrada:

Nombre: ${cleaned.nombre}
Teléfono: ${cleaned.telefono || "-"}
Correo: ${cleaned.correo}
ID Firestore: ${docRef.id}
      `.trim(),
    };

    // Enviamos correos en paralelo para reducir latencia.
    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(clientMailOptions),
    ]);

    logger.info("Cita registrada y correos enviados", {
      uid: docRef.id,
      correo: cleaned.correo,
    });

    return res.status(201).json({
      ok: true,
      id: docRef.id,
      message: "Cita registrada correctamente.",
    });
  } catch (error) {
    logger.error("Error en submitCitas", error);
    return res.status(500).json({
      error: "Error interno al procesar la cita.",
    });
  }
});
