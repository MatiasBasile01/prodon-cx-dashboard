# Prodon Support Metrics — CX Dashboard

Dashboard en vivo que muestra KPIs de atención al cliente del equipo Prodon, conectado a Google Sheets.

## 🔗 Links
- **Dashboard en vivo:** https://prodon-cx-dashboard.vercel.app
- **Fuente de datos:** Google Sheets publicado como CSV

---

## 📊 Qué muestra

- **CSAT** — Satisfacción del cliente (target: 94%)
- **SLA Attainment** — Cumplimiento de SLA (target: 90%)
- **TTR <48h** — Tickets resueltos en tiempo (target: 90%)
- **Tickets Creados vs Cerrados** — Balance de volumen
- **Incoming vs KPIs** — Correlación entre volumen y calidad

## 🔄 Filtros disponibles

| Vista | Descripción |
|-------|-------------|
| **Mensual** | Resumen consolidado de un mes (valor del Sheet) |
| **Rango meses** | Evolución entre varios meses |
| **Semanal** | Una semana individual |
| **Rango semanas** | Período libre entre semanas |

> ⚠️ Las semanas pueden cruzar meses. Los valores mensuales son los consolidados del Sheet, no la suma de semanas.

---

## 🏗️ Estructura del proyecto

```
prodon-cx-dashboard/
├── index.html    ← Dashboard completo (HTML + CSS + JS)
└── api/
    └── csv.js    ← Proxy server-side para evitar CORS con Google Sheets
```

---

## 📋 Requisitos del Google Sheet

El dashboard parsea el CSV automáticamente. Para que funcione, el Sheet debe tener estas filas (columna A):

| Fila | Contenido columna A | Qué hace |
|------|---------------------|----------|
| `MES` | Formato `MM/YYYY` en columnas de resumen mensual (ej: `08/2025`) | Identifica columnas de resumen mensual |
| `EQUIPO` | `POMS` o `Prodon` en cada columna | Identifica desde dónde arrancan los datos Prodon |
| `[AR] Prodon` | Nombres de semanas (`week 32`, `33`, etc.) | Labels de cada semana |
| `Week` | Fechas de inicio de semana (`04/08/2025`, etc.) | Fechas para los selectores |
| `[CSAT] CSAT consolidado en 94%` | Valores % | Datos de CSAT |
| Contiene `SLA Att` | Valores % | Datos de SLA Attainment |
| Contiene `TTR en Target` | Valores % | Datos de TTR |
| `# Tickets Created` | Valores numéricos | Tickets creados |
| `# Tickets Closed` | Valores numéricos | Tickets cerrados |

### Estructura de columnas

```
Columnas POMS... | 08/2025 (mes) | W32 | W33 | W34 | W35 | 09/2025 (mes) | W36 | ...
                   ↑ resumen mes    ↑ semanas individuales
```

- Las columnas con `MM/YYYY` en fila `MES` son **resúmenes mensuales**
- Las demás columnas después del primer `Prodon` en fila `EQUIPO` son **semanas**
- El parser para automáticamente después de 5 columnas vacías consecutivas

---

## 🚀 Cómo deployar tu propio dashboard

### Paso 1 — Publicar el Sheet como CSV
1. Abrí tu Google Sheet
2. **Archivo → Compartir → Publicar en la web**
3. Seleccioná la hoja correcta → formato **CSV**
4. Click en **Publicar** → copiá la URL

### Paso 2 — Crear el repo en GitHub
1. Creá un repo nuevo en GitHub
2. Creá `index.html` con el código del dashboard
3. Creá `api/csv.js` con el proxy (ver abajo)

### Paso 3 — Configurar el proxy (`api/csv.js`)
Cambiá la URL del Sheet en este archivo:

```javascript
export default async function handler(req, res) {
  const url = "TU_URL_CSV_AQUÍ";
  try {
    const response = await fetch(url);
    let text = await response.text();
    // Convertir tabs a comas si es necesario
    const firstLine = text.split("\n")[0];
    if ((firstLine.match(/\t/g)||[]).length > (firstLine.match(/,/g)||[]).length) {
      text = text.split("\n").map(line =>
        line.split("\t").map(cell => {
          const c = cell.trim();
          return c.includes(",") ? `"${c}"` : c;
        }).join(",")
      ).join("\n");
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
```

### Paso 4 — Deploy en Vercel
1. Andá a [vercel.com/new](https://vercel.com/new)
2. Importá el repo de GitHub
3. Click en **Deploy**
4. Listo — URL pública en segundos

---

## 🔧 Cómo adaptarlo para otro equipo

1. **Cambiar la URL del CSV** en `api/csv.js`
2. **Cambiar `Prodon`** por el nombre de tu equipo en la fila `EQUIPO` del Sheet
3. **Cambiar targets** en el código JS:
   - Buscá `target=kpi==="csat"?94:90` y ajustá los valores
   - Buscá `tgts=m==="all"?[90,94]` y ajustá

4. **Cambiar branding** — los colores están en el `:root` CSS:
   ```css
   --primary:#2E3192;    /* Color principal del header */
   --accent:#00B4D8;     /* Color de acento */
   --teal:#10B981;       /* SLA / Cerrados */
   --blue:#3B82F6;       /* TTR */
   --coral:#F97316;      /* Incoming / Creados */
   ```

---

## 📡 Cómo se actualiza

El dashboard **no requiere mantenimiento**:
- Cada vez que alguien abre la URL, fetchea el CSV en vivo
- Cuando agregás una semana nueva en el Sheet, aparece automáticamente
- El caché del proxy es de 5 minutos (`s-maxage=300`)

Para forzar actualización inmediata: `Ctrl + Shift + R` en el navegador.

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Cargando datos..." infinito | Verificá que `/api/csv` devuelve datos |
| "No se encontró fila EQUIPO" | La fila con nombre `EQUIPO` no existe en el Sheet |
| "No se encontró Prodon" | Ninguna columna dice `Prodon` en la fila EQUIPO |
| Datos mensuales vacíos | Verificá que la fila `MES` tenga formato `MM/YYYY` |
| Datos incorrectos | Verificá la URL del CSV en `api/csv.js` |

Para ver el CSV crudo: `https://tu-dashboard.vercel.app/api/csv`
