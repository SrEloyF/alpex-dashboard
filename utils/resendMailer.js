const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Error al enviar correo:", error);
    throw new Error(error.message);
  }

  return data;
}

module.exports = sendEmail;