require('dotenv').config();

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const allowedDomains = process.env.DOMAINS
    ? process.env.DOMAINS.split(",").map(d => d.trim().replace(/^https?:\/\//, ""))
    : [];

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY no definido");
    return false;
  }

  const formData = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip
  });

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      }
    );

    if (!response.ok) {
      console.error("Turnstile HTTP error:", response.status);
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Errores de Turnstile:", data["error-codes"]);
      return false;
    }

    if (allowedDomains.length > 0 && !allowedDomains.includes(data.hostname)) {
      console.error("Hostname no permitido:", data.hostname);
      return false;
    }

    return true;

  } catch (err) {
    console.error("Error verificando Turnstile:", err);
    return false;
  }
}

module.exports = verifyTurnstile;