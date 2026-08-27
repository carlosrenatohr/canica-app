# SPEC-PANEL-BRANDING-SCOPE: Branding — solo logo de mi agencia + datos reales

**Repo:** hit-panel + hit-ever2 + data (InsForge)
**Componentes:** `src/modules/config/service/config-service.ts`, `src/components/Configuracion.tsx` (BrandingTab), InsForge Storage bucket `branding`
**Estado:** Ready
**Rama worker:** `fix/worker-branding-scope`
**Rama panel:** `fix/panel-branding-scope`

---

## Resumen

El tab de Branding del panel muestra todos los logos de todas las agencias al admin (mini-galería), y el preview muestra un mockup (icono `Building2`) en vez de la imagen real porque `agencies.logo_url` está en `null` (no se subieron logos al bucket `branding`). Se restringe el branding a la única agencia de la sesión de cada usuario, y se cargan los datos reales para que el `<img>` funcione.

## Problema

- `ConfigService.getBranding()` devuelve todas las agencias para el admin (`config-service.ts:24`), y la UI las lista todas → el admin de hit ve también el logo de suite.
- `agencies.logo_url` es `null` en la DB → el mini-preview cae al placeholder `Building2` (mockup), no la imagen real.
- El CSP del panel ya incluye `img-src https://a4qvtp8s.us-east.insforge.app https://cdn.insforge.dev`, por lo que la URL del logo (302 → CDN) debería renderizar.

## Solución

### Worker (`fix/worker-branding-scope`)
- `getBranding(session)`: devolver **siempre** solo la agencia de `session.agency` (borrar la rama `admin ? all : own`).
- `updateBranding`: sin cambios de lógica (ya es logoKey-only y scoped; el admin puede tocar su propia agencia; no habrá cross-org visible). Mantener el `agency not found` guard.
- Test `config.test.ts:98` `admin sees every agency` → `everyone sees only their own agency` (admin de hit ve 1 agencia, no 2; staff ve 1; el PATCH branding cross-agency sigue 404 para no-admin).

### Panel (`fix/panel-branding-scope`)
- `BrandingTab.load()`: el server ya devuelve solo la agencia propia → remover el `filter` client-side de admin (no es necesario, pero simplifica). Conservar el resto (upload, preview 48px… → miniatura 44x44, "Logo actual"/"Sin logo").
- El mini-preview ya muestra `a.logoUrl`; con los datos cargados renderiza el `<img>`.

### Data (ops, con acceso admin)
- Subir al bucket público `branding`:
  - `logos/hit.webp` ← `hit-panel/public/logo-mark.png`
  - `logos/suite.webp` ← `hit-panel/public/suite-cargo-demo-logo.png`
  - (optimizar a ≤512 px webp, como el panel ya hace en `downscaleLogo`).
- `PATCH /api/config/branding/hit { logoKey: "logos/hit.webp" }` y `PATCH /api/config/branding/suite { logoKey: "logos/suite.webp" }` con el JWT del admin.
- Verificar: `GET /api/config/branding` devuelve las 2 agencias con `logoUrl` real (el admin ve 1 ahora → hit); el `<img>` del sidebar y el preview renderizan (200 CDN, no placeholder).

## Out of scope
- El "selector de agencia" del Shell no existe (ya se borró en `fix/tenant-provider-filters`).
- La mini-galería multi-agencia del board #15 se revierte (documentarlo).

## Acceptance Criteria
- [ ] Worker: `GET /api/config/branding` devuelve 1 agencia (la de la sesión) para admin/staff.
- [ ] Worker: test `admin sees only their own agency` pasa; el resto de branding tests siguen verdes.
- [ ] Panel: `BrandingTab` muestra una sola card (agencia propia).
- [ ] Panel: el `<img>` del logo renderiza la imagen real (no el placeholder) para hit y suite (verificado con JWT).
- [ ] CSP `img-src` incluye los dominios de InsForge (ya incluido).
- [ ] `pnpm check` verde en worker y panel.
- [ ] Dredd full sin findings Alta.

## Archivos a modificar
- `hit-ever2/src/modules/config/service/config-service.ts` (getBranding)
- `hit-ever2/src/modules/config/routes/config.test.ts` (test branding)
- `hit-panel/src/components/Configuracion.tsx` (BrandingTab load)
- Data: InsForge Storage `branding` + `agencies.logo_key/logo_url` (via worker PATCH)
