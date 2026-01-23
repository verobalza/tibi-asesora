/**
 * Configuración de Firebase (si la necesitas en el frontend) y la URL de tu
 * Cloud Function HTTP para enviar citas.
 *
 * Ajusta `functionsBaseUrl` con tu proyecto real. Si usas el emulador,
 * actualiza al host/puerto del emulador.
 */
export type FirebaseAppConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

export const firebaseConfig: FirebaseAppConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
};

/**
 * URL completa de la Cloud Function HTTP (2nd gen) ya desplegada.
 * No agregues sufijos como /submitCitas; la URL ya es la función.
 */
export const submitCitasUrl = "https://submitcitas-3zatfvea5q-uc.a.run.app";

export const getFirebaseConfig = (): FirebaseAppConfig => firebaseConfig;

