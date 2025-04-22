export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
  
    const { email } = req.body;
  
    try {
      const zapierRes = await fetch("https://hooks.zapier.com/hooks/catch/22625348/2xlaydx/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      if (!zapierRes.ok) {
        const text = await zapierRes.text();
        console.error("Zapier error response:", text);
        return res.status(500).json({ error: "Zapier request failed" });
      }
  
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Server error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  