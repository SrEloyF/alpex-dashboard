const Newsletter = require('./../models/newsletter.model');
const { ValidationError, UniqueConstraintError, Op } = require("sequelize");
const sendEmail = require("../utils/resendMailer");

exports.createNewsletter = async (req, res, next) => {
  try {
    const nuevoRegistro = await Newsletter.create(req.body);
    const fechaRegistro = new Date(nuevoRegistro.fecha_registro).toLocaleDateString('es-ES');

    const emailHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin:0; padding:0; background-color:#0f1724; font-family: Arial, sans-serif; color:#fff;">
        <div style="max-width: 600px; margin: 40px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
          
          <div style="background-color:#111827; padding:30px; text-align:center;">
            <img src="https://alpex-seven.vercel.app/assets/logo_alpex.png" alt="ALPEX" style="max-width:150px; margin-bottom:15px;">
            <h1 style="color:#C89D40; margin:0; font-size:24px;">
              Bienvenido a la Newsletter de ALPEX
            </h1>
            <p style="color:#E7C77A; margin:8px 0 0;">
              Gracias por formar parte de nuestra comunidad inmobiliaria.
            </p>
          </div>

          <div style="background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:30px;">
            
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:8px; margin-bottom:20px;">
              <h2 style="margin-top:0; color:#fff;">Detalles de tu suscripción:</h2>
              <p><strong>Correo registrado:</strong> ${nuevoRegistro.correo}</p>
              <p><strong>Fecha de registro:</strong> ${fechaRegistro}</p>
            </div>

            <p style="color:#ccc; line-height:1.6;">
              A partir de ahora recibirás:
            </p>

            <ul style="color:#ddd; line-height:1.8; padding-left:20px;">
              <li>Oportunidades exclusivas de inversión</li>
              <li>Nuevos proyectos inmobiliarios</li>
              <li>Información estratégica del mercado</li>
              <li>Beneficios especiales para suscriptores</li>
            </ul>

            <div style="text-align:center; margin-top:30px;">
              <a href="https://alpex-seven.vercel.app" 
                 style="display:inline-block; padding:14px 28px; background-color:#C89D40; color:#0f1724; text-decoration:none; border-radius:6px; font-weight:bold;">
                Explorar proyectos
              </a>
            </div>
            
          </div>

          <div style="background-color:#111827; padding:20px; text-align:center; font-size:12px; color:#aaa;">
            <p>ALPEX © 2026. Todos los derechos reservados.</p>
            <p>Recibes este correo porque te suscribiste a nuestra newsletter.</p>
            <p>
              <a href="https://alpex-seven.vercel.app" style="color:#C89D40; text-decoration:none;">Política de privacidad</a> |
              <a href="https://alpex-seven.vercel.app" style="color:#C89D40; text-decoration:none;">Contacto</a>
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: nuevoRegistro.correo,
        subject: "¡Bienvenido a la Newsletter de ALPEX!",
        html: emailHTML,
      });

      console.log("Correo enviado correctamente");

    } catch (err) {
      console.error("Error enviando correo:", err);
    }

    return res.status(201).json(nuevoRegistro);

  } catch (error) {

    if (error instanceof ValidationError) {
      const camposFaltantes = error.errors
        .filter(e => e.type === "notNull Violation")
        .map(e => e.path);

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          error: "Faltan campos obligatorios",
          campos_faltantes: camposFaltantes
        });
      }
    }

    if (error instanceof UniqueConstraintError) {
      const camposDuplicados = error.errors.map(e => e.path);

      return res.status(400).json({
        error: "El registro ya existe",
        campos_duplicados: camposDuplicados,
        mensaje: error.errors[0].message
      });
    }

    next(error);
  }
};

exports.getNewsletters = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (filters.search) {
    where.correo = { [Op.like]: `%${filters.search}%` };
  }
  if (filters.startDate && filters.endDate) {
    where.fecha_registro = {
      [Op.between]: [new Date(filters.startDate), new Date(`${filters.endDate}T23:59:59.999Z`)]
    };
  }

  const { count: total, rows: registros } = await Newsletter.findAndCountAll({
    where,
    order: [['fecha_registro', 'DESC']],
    limit,
    offset,
  });

  return { registros, totalPages: Math.ceil(total / limit) || 1, total, page };
};