export default async function handler(req, res) {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGY7qrNl7BjggOazK0Jm3VbDryIKK6g1xIKym_cPzR8mi5hK_Se8sg2pbLzYs42rE7phc46XmnRwLy/pub?gid=663980449&single=true&output=csv";
  try {
    const response = await fetch(url);
    const text = await response.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
