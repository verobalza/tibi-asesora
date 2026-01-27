import "./styles.css";
import { submitCita, type CitaPayload } from "./firebase/submitCitas";
import { showToast } from "./components/notifications";

/* ------------------------------
   UTILIDADES GENERALES
--------------------------------*/
const topbar = document.querySelector(".topbar");

const getForm = (): HTMLFormElement | null =>
  document.getElementById("citas-form") as HTMLFormElement | null;

const getFormStatus = (): HTMLElement | null =>
  document.getElementById("form-status");

const smoothScroll = (selector: string): void => {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const initSmoothAnchors = (): void => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = (event.currentTarget as HTMLAnchorElement).getAttribute("href");
      if (!href || href === "#") return;
      event.preventDefault();
      smoothScroll(href);
    });
  });
};

const initIntersectionObserver = (): void => {
  const animated = document.querySelectorAll<HTMLElement>(".fade-in");

  if (!("IntersectionObserver" in window) || animated.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  [...animated].forEach((el) => observer.observe(el));
};

const handleHeaderScroll = (): void => {
  if (!topbar) return;
  const onScroll = (): void => {
    const offset = window.scrollY || document.documentElement.scrollTop;
    if (offset > 8) topbar.classList.add("topbar--scrolled");
    else topbar.classList.remove("topbar--scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
};

/* ------------------------------
   FORMULARIO DE CITAS
--------------------------------*/
const initCitasForm = (): void => {
  const form = getForm();
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const statusEl = getFormStatus();

    const data = new FormData(form);

    const payload: CitaPayload = {
      nombre: (data.get("nombre") as string) ?? "",
      correo: (data.get("correo") as string) ?? "",
      telefono: (data.get("telefono") as string) ?? "",
      servicio: "",
      fecha: "",
      comentarios: "",
    };

    setFormStatus(statusEl, "Enviando datos...", false);

    try {
      await submitCita(payload);
      form.reset();
      setFormStatus(statusEl, "¡Gracias! Recibí tus datos y te contactaré pronto.", true);
      showToast("Datos enviados correctamente.");
    } catch (error) {
      console.error(error);
      setFormStatus(
        statusEl,
        "No pude enviar tus datos. Intenta de nuevo en unos minutos.",
        false
      );
      showToast("Hubo un error al enviar el formulario.");
    }
  });
};

const setFormStatus = (
  statusEl: HTMLElement | null,
  message: string,
  success: boolean
): void => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = success ? "#22c55e" : "#e5e7eb";
};

/* ------------------------------
   INICIALIZACIÓN GENERAL
--------------------------------*/
const init = (): void => {
  document.documentElement.classList.remove("no-js");
  document.body.classList.add("is-loaded");
  initSmoothAnchors();
  initIntersectionObserver();
  handleHeaderScroll();
  initCitasForm();
};

/* ------------------------------
   SCROLL HORIZONTAL + FLECHAS
--------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  init();
});
