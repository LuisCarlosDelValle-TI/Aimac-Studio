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

  /* Fotos de la clienta (Supabase Storage).
     Pega aquí los datos de tu proyecto de Supabase (Settings → API). */
  supabaseUrl: "https://tiktbpmqcaktprwvcdxx.supabase.co",
  supabaseAnonKey: "sb_publishable_UkHphs0B6Gh6rz2RSC5-Ug_uQdR72vp",   // la "anon" (empieza con eyJ) o la "publishable" (sb_publishable_...)
  bucket: "fotos-citas",
  maxPhotoSidePx: 1280,               // lado máximo de la foto ya reducida
  photoQuality: 0.8,                  // calidad JPEG (0 a 1)
  maxOriginalMB: 15,                  // peso máximo de la foto original
  uploadTimeoutMs: 25000
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

/* ---------- Formulario ---------- */
const form = $("#booking");
const setErr = (k, msg) => { const el = $(`[data-err="${k}"]`); if (el) el.textContent = msg || ""; };

/* ---------- Fotos ---------- */
const PHOTO_IDS = ["foto1", "foto2", "foto3"];   // la primera es obligatoria
const photos = [null, null, null];               // fotos ya reducidas (Blob JPEG)
const photoJobs = [null, null, null];            // promesas mientras se reducen

/* Lee la imagen respetando la orientación del celular */
async function fileToBitmap(file) {
  if ("createImageBitmap" in window) {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (_) { /* usa el plan B */ }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
    img.src = url;
  });
}

/* Reduce la foto (≈300 KB) y le quita datos ocultos como la ubicación */
async function shrinkPhoto(file) {
  const src = await fileToBitmap(file);
  const w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height;
  const k = Math.min(1, CONFIG.maxPhotoSidePx / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);   // fondo blanco para PNG con transparencia
  ctx.drawImage(src, 0, 0, c.width, c.height);
  if (src.close) src.close();
  return await new Promise((resolve, reject) =>
    c.toBlob(b => b ? resolve(b) : reject(new Error("No se pudo comprimir")), "image/jpeg", CONFIG.photoQuality));
}

PHOTO_IDS.forEach((id, i) => {
  const input = $("#" + id), slot = input.closest(".photo-slot");
  const prev = $(".photo-prev", slot), del = $(".photo-del", slot);
  let objUrl = null;

  const clear = () => {
    photos[i] = null; photoJobs[i] = null; input.value = "";
    if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
    prev.hidden = true; prev.removeAttribute("src"); del.hidden = true;
    slot.classList.remove("has-photo", "is-loading");
  };

  del.addEventListener("click", () => { clear(); setErr("fotos", ""); });

  input.addEventListener("change", () => {
    const f = input.files && input.files[0];
    if (!f) return;                                   // cancelaron el selector: se conserva la foto anterior
    setErr("fotos", "");
    if (!f.type.startsWith("image/")) { setErr("fotos", "Elige un archivo de imagen."); input.value = ""; return; }
    if (f.size > CONFIG.maxOriginalMB * 1048576) { setErr("fotos", `La foto pesa más de ${CONFIG.maxOriginalMB} MB. Elige otra.`); input.value = ""; return; }

    slot.classList.add("is-loading");
    photoJobs[i] = shrinkPhoto(f).then(blob => {
      photos[i] = blob;
      if (objUrl) URL.revokeObjectURL(objUrl);
      objUrl = URL.createObjectURL(blob);
      prev.src = objUrl; prev.hidden = false; del.hidden = false;
      slot.classList.add("has-photo");
    }).catch(() => {
      setErr("fotos", "No pudimos leer esa foto. Prueba con otra (JPG o PNG).");
      input.value = "";
    }).finally(() => slot.classList.remove("is-loading"));
  });
});

/* Subida a Supabase Storage (ruta: fecha-de-la-cita/nombre-aleatorio.jpg) */
const randomId = (bytes = 8) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))].map(b => b.toString(16).padStart(2, "0")).join("");

const storageConfigured = () =>
  CONFIG.supabaseUrl && CONFIG.supabaseAnonKey &&
  !CONFIG.supabaseUrl.includes("TU-PROYECTO") && !CONFIG.supabaseAnonKey.includes("TU-LLAVE");

async function uploadPhoto(blob, folder) {
  const path = `${folder}/${randomId()}.jpg`;
  const headers = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "image/jpeg", "x-upsert": "false" };
  if (CONFIG.supabaseAnonKey.startsWith("eyJ")) headers.Authorization = `Bearer ${CONFIG.supabaseAnonKey}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.uploadTimeoutMs);
  try {
    const r = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/${CONFIG.bucket}/${path}`,
      { method: "POST", headers, body: blob, signal: ctrl.signal });
    if (!r.ok) throw new Error(`La subida falló (${r.status})`);
  } finally { clearTimeout(timer); }
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.bucket}/${path}`;
}

/* ---------- Validación y envío ---------- */
const submitBtn = $("button[type=submit]", form), submitText = $("#submit-text");
const ready = $("#ready"), readyMsg = $("#ready-msg"), openWa = $("#open-wa");
const consent = $("#consent");
const submitLabel = submitText.textContent;

const setBusy = (busy, text) => {
  submitBtn.disabled = busy;
  submitBtn.setAttribute("aria-busy", busy);
  submitText.textContent = busy ? text : submitLabel;
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form.web.value) return; // honeypot anti-spam
  ready.hidden = true;

  await Promise.allSettled(photoJobs.filter(Boolean));   // espera a que terminen de prepararse las fotos

  const d = Object.fromEntries(new FormData(form));
  let ok = true;
  ["nombre", "tel", "servicio", "fecha", "hora", "fotos", "consent"].forEach(k => setErr(k, ""));

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
  if (!photos[0]) { setErr("fotos", "Sube tu foto. Es obligatoria."); ok = false; }
  if (!consent.checked) { setErr("consent", "Debes aceptar para continuar."); ok = false; }

  if (!ok) {
    const order = [["nombre", "nombre"], ["tel", "tel"], ["servicio", "servicio"], ["fecha", "fecha"],
                   ["hora", "hora"], ["fotos", "foto1"], ["consent", "consent"]];
    const bad = order.find(([k]) => { const el = $(`[data-err="${k}"]`); return el && el.textContent; });
    if (bad) { const el = $("#" + bad[1]); el.focus(); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    return;
  }

  /* Subir fotos (la primera es indispensable; si falla, se avisa y se sigue por WhatsApp) */
  setBusy(true, "Subiendo tus fotos…");
  const links = [];
  let uploadFailed = !storageConfigured();
  if (!uploadFailed) {
    for (const blob of photos.filter(Boolean)) {
      try { links.push(await uploadPhoto(blob, d.fecha)); }
      catch (err) {
        console.error(err);
        if (!links.length) { uploadFailed = true; break; }   // falló la foto principal
      }
    }
  }
  setBusy(false);

  const [y, m, dd] = d.fecha.split("-").map(Number);
  const fechaTxt = new Date(y, m - 1, dd).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const fotosLines = uploadFailed
    ? [`• Fotos: no se pudieron subir desde la página; las envío en este chat.`]
    : [`• Fotos:`, ...links.map((u, i) => `  ${i + 1}. ${u}`)];
  const msg = [
    `Hola ${CONFIG.studio}, quiero solicitar una cita:`,
    ``,
    `• Nombre: ${d.nombre.trim()}`,
    `• Teléfono: ${digits}`,
    `• Servicio: ${d.servicio}`,
    `• Fecha preferida: ${fechaTxt}`,
    `• Hora preferida: ${d.hora}`,
    d.notas && d.notas.trim() ? `• Comentarios: ${d.notas.trim()}` : null,
    ...fotosLines,
    ``,
    `Quedo atento/a a su confirmación. ¡Gracias!`
  ].filter(x => x !== null).join("\n");

  const url = waUrl(msg);
  openWa.href = url;
  readyMsg.textContent = uploadFailed
    ? "No pudimos subir tus fotos desde la página. Abre WhatsApp y envíalas directamente en el chat para completar tu solicitud."
    : "Tus fotos se subieron. Abre WhatsApp y envía el mensaje para terminar tu solicitud.";
  ready.hidden = false;
  ready.scrollIntoView({ block: "nearest", behavior: "smooth" });

  /* Intento automático; si el navegador lo bloquea, queda el botón de arriba */
  const w = window.open(url, "_blank");
  if (w) w.opener = null;
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