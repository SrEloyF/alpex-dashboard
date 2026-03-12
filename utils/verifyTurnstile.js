require('dotenv').config();
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return false;
  }
  const formData = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip
  });

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    }
  );

  const data = await response.json();

  if (!data.success && data["error-codes"]) {
    console.error("Errores de Turnstile:", data["error-codes"]);
  }

  return data.success;
}

module.exports = verifyTurnstile;
