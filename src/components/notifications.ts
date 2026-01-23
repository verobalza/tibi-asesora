const toastEl = document.getElementById("toast");

export const showToast = (message: string, timeout = 3200): void => {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");

  window.clearTimeout((toastEl as any).__timeout);
  (toastEl as any).__timeout = window.setTimeout(() => {
    toastEl.classList.remove("is-visible");
  }, timeout);
};

