export default async function handler(req, res) {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGY7qrNl7BjggOazK0Jm3VbDryIKK6g1xIKym_cPzR8mi5hK_Se8sg2pbLzYs42rE7phc46XmnRwLy/pub?gid=2040730480&single=true&output=csv";
  try {
    const response = await fetch(url);
    let text = await response.text();
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
