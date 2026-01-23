import { submitCitasUrl } from "./config";

export type CitaPayload = {
  nombre: string;
  correo: string;
  telefono?: string;
  servicio?: string;
  fecha?: string;
  comentarios?: string;
};

/**
 * Envía los datos de cita a la Cloud Function HTTP `submitCitas`.
 * Ajusta `functionsBaseUrl` en config.ts con tu PROJECT_ID (y región si cambia).
 */
export const submitCita = async (payload: CitaPayload): Promise<void> => {
  if (!submitCitasUrl || submitCitasUrl.includes("<PROJECT_ID>")) {
    console.warn("Configura submitCitasUrl en src/firebase/config.ts con tu URL real.");
  }

  const response = await fetch(submitCitasUrl, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      nombre: payload.nombre,
      telefono: payload.telefono,
      correo: payload.correo,
    }),
  });

  if (!response.ok) {
    const errorData = await safeJson(response);
    throw new Error(errorData?.error || `Error HTTP ${response.status}`);
  }
};

const safeJson = async (resp: Response): Promise<any> => {
  try {
    return await resp.json();
  } catch {
    return null;
  }
};

