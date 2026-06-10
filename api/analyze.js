export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en Vercel" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Body inválido" });
  }

  const { weeklyData } = body;
  if (!weeklyData) {
    return res.status(400).json({ error: "Falta weeklyData" });
  }

  const systemPrompt = `Sos el asistente de análisis semanal de métricas del equipo Prodon de TiendaNube / Nuvemshop.
Tu trabajo es generar un reporte ejecutivo semanal claro, accionable y conciso para el manager del equipo.

Los KPIs y sus targets son:
- CSAT: target 94%
- SLA Attainment: target 90%
- TTR en Target (<48h): target 90%
- Incoming (tickets creados): sin target fijo, analizar tendencia

Formato del reporte (usá exactamente esta estructura):

## 🚦 Semáforo de KPIs
Para cada KPI: nombre, valor, comparación vs semana anterior, estado (✅ en target / ⚠️ cerca / ❌ bajo target). Tabla simple.

## 📊 Análisis de la semana
Narrativa de 3-5 párrafos cruzando métricas con contexto, tópicos y DSATs. Sé específico: nombrá números, tópicos concretos, patrones en los DSATs. Evitá generalidades.

## 🔴 DSATs — puntos críticos
Listado de los principales motivos de insatisfacción con frecuencia o ejemplos concretos. Máximo 5 bullets.

## 💡 Acciones recomendadas
3-5 acciones concretas y priorizadas, con responsable sugerido si aplica.

## 📝 Resumen ejecutivo (3 líneas)
Para pegar en Slack o en una reunión. Sin jerga técnica.

Idioma de respuesta: español. Tono: profesional pero directo. No uses relleno ni frases genéricas de consultora.`;

  const userContent = `Analizá la siguiente data semanal del equipo Prodon:

\`\`\`json
${JSON.stringify(weeklyData, null, 2)}
\`\`\``;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Error de Claude API: " + errText });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ analysis: text });
  } catch (e) {
    res.status(500).json({ error: "Error llamando a Claude: " + e.message });
  }
}
