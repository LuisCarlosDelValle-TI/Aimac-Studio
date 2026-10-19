/* AIMAC STUDIO — Landing Fase 0
   Toda la configuración editable está en CONFIG. */
const CONFIG = {
  whatsapp: "522294651656",           // formato internacional sin "+": 52 + 10 dígitos
  openHour: 9,                        // 9:00 a.m.
  closeHour: 18,                      // 6:00 p.m. (última cita 17:30)
  slotMinutes: 30,
  minDaysAhead: 0,                    // 0 = permite pedir para hoy
  closedWeekdays: [],                 // 0=domingo ... 6=sábado. Ej.: [0] si no abren domingos
  studio: "AIMAC STUDIO Beauty",

  /* Aviso que aparece al pulsar "Enviar solicitud", antes de abrir WhatsApp.
     Aquí se elige qué aviso corresponde a cada servicio. Los servicios que
     NO aparezcan en esta lista abren WhatsApp directo, sin aviso. */
  servicioAviso: {
    "Peinados": "peinado",
    "Diseños de color": "cabello",
    "Permanentes": "cabello",
    "Keratinas y botox capilar": "cabello",
    "Maquillaje para toda ocasión": "rostro"
  },

  /* Textos de cada aviso.
     titulo / texto / hint = lo que ve la clienta en la ventana.
     nota = línea que se agrega al mensaje de WhatsApp (borra la línea si no la quieres). */
  avisos: {
    peinado: {
      titulo: "Imagen de referencia de tu peinado",
      texto: "Para poder cotizar tu peinado necesitamos una imagen de referencia del estilo que te gustaría.",
      hint: "No necesitas subir nada aquí. Cuando se abra WhatsApp, envía la imagen directamente en la conversación.",
      nota: "Te enviaré en este chat la imagen de referencia de mi peinado."
    },
    cabello: {
      titulo: "Fotos de tu cabello",
      texto: "Para poder cotizar tu servicio necesitamos que nos envíes fotos de tu cabello actual, con buena luz. <strong>¡¡NO SELFIES!!</strong>",
      hint: "No necesitas subir nada aquí. Cuando se abra WhatsApp, envía las fotos directamente en la conversación.",
      nota: "Te enviaré en este chat fotos de mi cabello."
    },
    rostro: {
      titulo: "Foto de tu rostro",
      texto: "Para valorar tu maquillaje necesitamos una foto de tu rostro, de frente y con buena luz.",
      hint: "No necesitas subir nada aquí. Cuando se abra WhatsApp, envía la foto directamente en la conversación.",
      nota: "Te enviaré en este chat una foto de mi rostro."
    }
  }
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

/* Ventana de aviso (qué foto enviar por el chat) */
const modal = $("#aviso-modal");
const avisoTitulo = $("#aviso-titulo"), avisoTexto = $("#aviso-texto"), avisoHint = $("#aviso-hint");
let pendingOpen = null;   // acción que se ejecuta al pulsar "Entendido"

const closeModal = () => { pendingOpen = null; if (modal.open) modal.close(); };
$("#aviso-ok").addEventListener("click", () => {
  const go = pendingOpen; pendingOpen = null;
  if (modal.open) modal.close();
  if (go) go();                                    // se abre WhatsApp desde un clic real (no lo bloquea el navegador)
});
$("#aviso-cancel").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });   // clic en el fondo oscuro
modal.addEventListener("close", () => { pendingOpen = null; });                       // también con la tecla Esc

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

  const aviso = CONFIG.avisos[CONFIG.servicioAviso[d.servicio]] || null;   // null = este servicio no lleva aviso

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
    aviso && aviso.nota ? `• ${aviso.nota}` : null,
    ``,
    `Quedo atento/a a su confirmación. ¡Gracias!`
  ].filter(x => x !== null).join("\n");

  const abrirWhatsApp = () => window.open(waUrl(msg), "_blank", "noopener");

  if (!aviso) { abrirWhatsApp(); return; }

  /* Navegadores muy viejos sin <dialog>: se muestra el aviso con alert */
  if (typeof modal.showModal !== "function") {
    alert(`${aviso.titulo}\n\n${aviso.texto}\n\n${aviso.hint}`);
    abrirWhatsApp();
    return;
  }

  avisoTitulo.textContent = aviso.titulo;
  avisoTexto.innerHTML = aviso.texto;
  avisoHint.textContent = aviso.hint;
  pendingOpen = abrirWhatsApp;
  modal.showModal();
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

/* Navegación: marca la sección visible (aria-current) */
const navLinks = $$('#menu a[href^="#"]:not(.btn)');
const spyTargets = navLinks.map(a => ({ a, el: $(a.getAttribute("href")) })).filter(t => t.el);
if ("IntersectionObserver" in window && spyTargets.length) {
  const spy = new IntersectionObserver((entries) => entries.forEach(en => {
    const t = spyTargets.find(x => x.el === en.target);
    if (t) en.isIntersecting ? t.a.setAttribute("aria-current", "true") : t.a.removeAttribute("aria-current");
  }), { rootMargin: "-45% 0px -50% 0px" });
  spyTargets.forEach(t => spy.observe(t.el));
}
