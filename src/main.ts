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
  const horizontalCards = document.querySelectorAll<HTMLElement>(".service-card");

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

  [...animated, ...horizontalCards].forEach((el) => observer.observe(el));
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

  // 🚫 Desactivar scroll horizontal en móvil/tablet
  if (window.innerWidth < 900) {
    return;
  }

  const section = document.querySelector(".horizontal-section") as HTMLElement;
  const track = document.querySelector(".horizontal-track") as HTMLElement;
  const arrowNext = document.getElementById("arrow-next") as HTMLElement;
  const arrowPrev = document.getElementById("arrow-prev") as HTMLElement;

  if (!section || !track || !arrowNext || !arrowPrev) return;

  const cards = Array.from(track.children) as HTMLElement[];
  const cardWidth = cards[0].offsetWidth + 32;
  const totalScroll = track.scrollWidth - window.innerWidth;

  section.style.height = `${window.innerHeight + totalScroll * 1.05}px`;

  let lockTriggered = false;

  function updateArrows(index: number) {
    if (index >= 5) {
      arrowNext.classList.add("visible");
      arrowPrev.classList.add("visible");
    }

    arrowPrev.classList.remove("disabled");

    if (index >= cards.length - 2) arrowNext.classList.add("disabled");
    else arrowNext.classList.remove("disabled");
  }

  /* --- FLECHAS CON CLICK --- */
  arrowNext.addEventListener("click", () => {
    const current = Math.abs(parseInt(track.style.transform.replace("translateX(-", ""))) || 0;
    const next = Math.min(current + cardWidth, totalScroll);
    track.style.transform = `translateX(-${next}px)`;
  });

  arrowPrev.addEventListener("click", () => {
    const current = Math.abs(parseInt(track.style.transform.replace("translateX(-", ""))) || 0;
    const prev = Math.max(current - cardWidth, 0);
    track.style.transform = `translateX(-${prev}px)`;
  });

  /* --- SCROLL VERTICAL CONTROLANDO EL HORIZONTAL --- */
  window.addEventListener("scroll", () => {
    const rect = section.getBoundingClientRect();
    const start = rect.top;
    const end = rect.bottom - window.innerHeight;

    if (start > 0) return;

    if (start <= 0 && end >= 0) {
      const scrollAmount = Math.min(Math.max(-start, 0), totalScroll);
      const index = Math.round(scrollAmount / cardWidth);

      track.style.transform = `translateX(-${scrollAmount}px)`;
      updateArrows(index);

      if (index === cards.length - 1 && !lockTriggered) {
        lockTriggered = true;
        document.body.style.overflowY = "hidden";

        setTimeout(() => {
          const current = window.scrollY;
          window.scrollTo({ top: current });
          document.body.style.overflowY = "auto";
          lockTriggered = false;
        }, 1500);
      }
    }
  });

  /* --- MENÚ HAMBURGUESA --- */
  const menuToggle = document.querySelector(".menu-toggle") as HTMLElement;
  const mobileNav = document.querySelector(".mobile-nav") as HTMLElement;

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open");
      document.body.classList.toggle("no-scroll");
    });
  }
});
