/* AIMAC STUDIO — Landing Fase 0
   Toda la configuración editable está en CONFIG. */
const CONFIG = {
  whatsapp: "522294651656",           // formato internacional sin "+": 52 + 10 dígitos
  openHour: 9,                        // 9:00 a.m.
  closeHour: 18,                      // 6:00 p.m. (última cita 17:30)
  slotMinutes: 30,
  minDaysAhead: 0,                    // 0 = permite pedir para hoy
  closedWeekdays: [],                 // 0=domingo ... 6=sábado. Ej.: [0] si no abren domingos
  studio: "AIMAC STUDIO Beauty"
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const waUrl = (text) => `https://wa.me/${CONFIG.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;

/* Menú móvil */
const burger = $(".burger"), menu = $("#menu");
burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
$$("#menu a").forEach(a => a.addEventListener("click", () => {
  menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false");
}));

/* Enlaces de WhatsApp */
$$("[data-wa-link]").forEach(a => {
  a.href = waUrl(`Hola ${CONFIG.studio}, me gustaría recibir información.`);
  a.target = "_blank"; a.rel = "noopener";
});

/* Botones "Solicitar" de cada servicio preseleccionan el servicio */
$$("[data-service]").forEach(a => a.addEventListener("click", () => {
  $("#servicio").value = a.dataset.service;
}));

/* Horas disponibles */
const hora = $("#hora");
hora.innerHTML = '<option value="">Selecciona una hora</option>';
for (let m = CONFIG.openHour * 60; m < CONFIG.closeHour * 60; m += CONFIG.slotMinutes) {
  const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12, ap = h < 12 ? "a.m." : "p.m.";
  const o = document.createElement("option");
  o.value = `${h12}:${mm} ${ap}`; o.textContent = o.value; hora.appendChild(o);
}

/* Fecha mínima */
const fecha = $("#fecha");
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const min = new Date(); min.setDate(min.getDate() + CONFIG.minDaysAhead);
fecha.min = iso(min);

/* Validación y envío */
const form = $("#booking");
const setErr = (k, msg) => { const el = $(`[data-err="${k}"]`); if (el) el.textContent = msg || ""; };

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (form.web.value) return; // honeypot anti-spam
  const d = Object.fromEntries(new FormData(form));
  let ok = true;
  ["nombre", "tel", "servicio", "fecha", "hora"].forEach(k => setErr(k, ""));

  if (!d.nombre || d.nombre.trim().length < 2) { setErr("nombre", "Escribe tu nombre."); ok = false; }
  const digits = (d.tel || "").replace(/\D/g, "");
  if (digits.length < 10) { setErr("tel", "Escribe un teléfono de 10 dígitos."); ok = false; }
  if (!d.servicio) { setErr("servicio", "Elige un servicio."); ok = false; }
  if (!d.fecha) { setErr("fecha", "Elige una fecha."); ok = false; }
  else {
    const [y, m, dd] = d.fecha.split("-").map(Number);
    const dt = new Date(y, m - 1, dd);
    if (dt < new Date(min.getFullYear(), min.getMonth(), min.getDate())) { setErr("fecha", "Elige una fecha futura."); ok = false; }
    else if (CONFIG.closedWeekdays.includes(dt.getDay())) { setErr("fecha", "Ese día no hay servicio. Elige otro."); ok = false; }
  }
  if (!d.hora) { setErr("hora", "Elige una hora."); ok = false; }
  if (!ok) { const first = $(".err:not(:empty)"); first && first.previousElementSibling.focus(); return; }

  const [y, m, dd] = d.fecha.split("-").map(Number);
  const fechaTxt = new Date(y, m - 1, dd).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const msg = [
    `Hola ${CONFIG.studio}, quiero solicitar una cita:`,
    ``,
    `• Nombre: ${d.nombre.trim()}`,
    `• Teléfono: ${digits}`,
    `• Servicio: ${d.servicio}`,
    `• Fecha preferida: ${fechaTxt}`,
    `• Hora preferida: ${d.hora}`,
    d.notas && d.notas.trim() ? `• Comentarios: ${d.notas.trim()}` : null,
    ``,
    `Quedo atento/a a su confirmación. ¡Gracias!`
  ].filter(x => x !== null).join("\n");

  window.open(waUrl(msg), "_blank", "noopener");
});

/* Revelado al hacer scroll */
const rv = $$(".rv");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: .12 });
  rv.forEach(el => io.observe(el));
} else rv.forEach(el => el.classList.add("in"));

$("#year").textContent = new Date().getFullYear();
