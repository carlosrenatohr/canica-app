# SPEC-PANEL-08: Botón refresh + carga manual

**Repo:** hit-panel
**Componentes:** Overview, Shipments, Reports, Facturacion
**Estado:** Draft
**Autor:** hermitty (orchestrator)

---

## Resumen

Agregar botones de refresh manual en las vistas principales del panel para que el usuario pueda recargar datos sin navegar away y volver. Actualmente no existe ningún botón de refresh en ninguna vista.

## Problema

- Los datos se cargan una vez al montar el componente
- Para ver datos frescos, el usuario debe navegar a otra vista y volver
- No hay polling ni auto-refresh
- Los datos del scraper pueden estar desactualizados (el scraping corre cada 2h)

## Solución

### Componentes a modificar

| Componente | Ubicación del botón | Datos que recarga |
|---|---|---|
| `Overview.tsx` | Header, al lado de "Ver envíos" | `getStats()` + `getProviders()` |
| `Shipments.tsx` | Header, al lado de "Exportar CSV" | `listPackages(filters)` |
| `Reports.tsx` | Header | `exportPackages(filters)` |
| `Facturacion.tsx` | Ya tiene `reload()` — exponer como botón | `billingApi.listInvoices(filters)` |

### Comportamiento del botón

1. **Icono:** `RefreshCw` de lucide-preact (ya instalado)
2. **Componente:** `IconButton` existente en `ui.tsx`
3. **Label:** "Actualizar" (aria-label)
4. **Spinner inline:** Cuando está cargando, el icono gira (`animate-spin`)
5. **Deshabilitado:** El botón se deshabilita mientras carga para evitar doble-click
6. **Posición:** Siempre en el header de la vista, a la derecha

### Ejemplo de implementación (Overview.tsx)

```tsx
// Agregar import
import { RefreshCw } from 'lucide-preact'

// Extraer load function del useEffect
async function load() {
  setLoading(true)
  setErr(null)
  try {
    const [s, p] = await Promise.all([getStats(), getProviders()])
    setStats(s)
    setProviders(p)
  } catch {
    setErr('No se pudo cargar el resumen.')
  } finally {
    setLoading(false)
  }
}

useEffect(() => { load() }, [])

// En el header, agregar IconButton:
<IconButton label="Actualizar" onClick={load} disabled={loading}>
  <RefreshCw class={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
</IconButton>
```

### No incluido (out of scope)

- Auto-refresh / polling
- Skeleton screens (será task separada #09)
- Toast de éxito al refrescar
- Timestamp de "última actualización"

## Acceptance Criteria

- [ ] Overview: botón "Actualizar" en el header, al lado de "Ver envíos"
- [ ] Shipments: botón "Actualizar" en el header, al lado de "Exportar CSV"
- [ ] Reports: botón "Actualizar" en el header
- [ ] Facturacion: botón "Actualizar" usando el `reload()` existente
- [ ] El botón muestra spinner mientras carga
- [ ] El botón se deshabilita durante la carga
- [ ] Error handling se mantiene (muestra `err` state)
- [ ] No rompe tests existentes (9 smoke tests)
- [ ] `pnpm check` pasa (astro check)

## Archivos a modificar

- `src/components/Overview.tsx` — extract load fn + add refresh button
- `src/components/Shipments.tsx` — extract load fn + add refresh button
- `src/components/Reports.tsx` — extract load fn + add refresh button
- `src/components/billing/Facturacion.tsx` — expose existing reload() as button
