# AIMAC STUDIO Beauty — Landing (Fase 1)

Sitio estático: HTML + CSS + JS, sin dependencias ni build.

## Probar en local
    cd aimac-landing && python3 -m http.server 8080   # abrir http://localhost:8080

## Editar contenido
- Textos, servicios y FAQ: `index.html`
- WhatsApp, horario, días cerrados: objeto `CONFIG` al inicio de `main.js`
- Colores: variables `:root` en `styles.css`
- Fotos: el rediseño trae ilustraciones de respaldo en `assets/img/*.svg`. Para usar fotos reales, guarda
  tu imagen en `assets/img/` y en `styles.css` (bloque `FOTOGRAFÍAS` de `:root`) cambia, por ejemplo,
  `--photo-hero:none;` por `--photo-hero:url("assets/img/hero.jpg");`. Variables: `--photo-hero`, `--photo-banner`,
  `--photo-cortes`, `--photo-maquillaje`, `--photo-peinados`, `--photo-color`, `--photo-permanentes`, `--photo-keratinas`.

## Publicar gratis (Cloudflare Pages)
1. Subir esta carpeta a un repositorio de GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → conectar el repo.
3. Build command: (vacío) · Output directory: `/`
4. Conectar el dominio en Custom domains.
Alternativa sin Git: "Upload assets" arrastrando la carpeta.

## Pendientes
- Dirección en texto, días de atención, URL de Facebook e Instagram.
- Fotos (galería) y testimonios cuando existan.
- Revisar y completar aviso de privacidad.
- `sitemap.xml`, `robots.txt` y analítica cuando exista el dominio.
