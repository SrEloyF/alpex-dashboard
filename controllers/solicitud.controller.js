const Solicitud = require('./../models/solicitud.model');
const { ValidationError, UniqueConstraintError, Op } = require("sequelize");
const sendEmail = require("../utils/resendMailer");
const verifyTurnstile = require("../utils/verifyTurnstile");

exports.createSolicitud = async (req, res, next) => {
  try {
    try {
      const token = req.body["cf-turnstile-response"];
      if (!token) {
        return res.status(400).json({
          error: "Captcha no enviado"
        });
      }
      const valid = await verifyTurnstile(token, req.ip);
      if (!valid) {
        return res.status(400).json({ error: "Captcha inválido" });
      }
    } catch (err) {
      console.error("Error validando captcha:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    const nuevaSolicitud = await Solicitud.create(req.body);
    const fechaRegistro = new Date(nuevaSolicitud.fecha_registro).toLocaleDateString('es-ES');
    const interesesMap = {
      Reinos: "Reinos de Gondor",
      Colinas: "Colinas del Golf",
      Inversion: "Quiero ser inversionista"
    };
    const interesAMostrar = interesesMap[nuevaSolicitud.interes_principal] || nuevaSolicitud.interes_principal;

    const emailHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin:0; padding:0; background-color:#0f1724; font-family: Arial, sans-serif; color:#fff;">
        <div style="max-width: 600px; margin: 40px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
          
          <div style="background-color:#111827; padding:20px; text-align:center;">
            <img src="https://alpex-seven.vercel.app/assets/logo_alpex.png" alt="ALPEX" style="max-width:150px; margin-bottom:10px;">
            <h1 style="color:#C89D40; margin:0; font-size:24px;">¡Bienvenido a ALPEX, ${nuevaSolicitud.nombre_completo}!</h1>
            <p style="color:#E7C77A; margin:5px 0 0;">Gracias por registrarte. Estamos encantados de tenerte con nosotros.</p>
          </div>

          <div style="background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:30px;">
            
            <div style="background: rgba(255,255,255,0.03); padding:20px; border-radius:8px; margin-bottom:20px;">
              <h2 style="margin-top:0; color:#fff;">Detalles de tu registro:</h2>
              <p><strong>Nombre:</strong> ${nuevaSolicitud.nombre_completo}</p>
              <p><strong>Correo:</strong> ${nuevaSolicitud.correo}</p>
              <p><strong>Teléfono:</strong> ${nuevaSolicitud.telefono}</p>
              <p><strong>Interés:</strong> ${interesAMostrar}</p>
              <p><strong>Mensaje:</strong> ${nuevaSolicitud.mensaje || '—'}</p>
              <p><strong>Fecha de registro:</strong> ${fechaRegistro}</p>
            </div>

            <div style="text-align:center; margin-top:20px;">
              <a href="https://alpex-seven.vercel.app" style="display:inline-block; padding:12px 25px; background-color:#C89D40; color:#0f1724; text-decoration:none; border-radius:5px; font-weight:bold;">
                Visita nuestro sitio
              </a>
            </div>
            
          </div>

          <div style="background-color:#111827; padding:20px; text-align:center; font-size:12px; color:#aaa;">
            <p>ALPEX © 2026. Todos los derechos reservados.</p>
            <p>Si no solicitaste este registro, ignora este correo.</p>
            <p>
              <a href="https://alpex-seven.vercel.app" style="color:#C89D40; text-decoration:none;">Política de privacidad</a> |
              <a href="https://alpex-seven.vercel.app" style="color:#C89D40; text-decoration:none;">Contacto</a>
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: nuevaSolicitud.correo,
      subject: `¡Bienvenido a ALPEX ${nuevaSolicitud.nombre_completo}!`,
      html: emailHTML,
    });

    return res.status(201).json(nuevaSolicitud);

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

exports.getSolicitudesByStatus = async (estado, page = 1, limit = 5, filters = {}) => {
  const offset = (page - 1) * limit;
  const where = { estado };

  if (filters.search) {
    where[Op.or] = [
      { nombre_completo: { [Op.like]: `%${filters.search}%` } },
      { correo: { [Op.like]: `%${filters.search}%` } }
    ];
  }
  if (filters.startDate && filters.endDate) {
    where.fecha_registro = {
      [Op.between]: [new Date(filters.startDate), new Date(`${filters.endDate}T23:59:59.999Z`)]
    };
  }

  const { count: total, rows: registros } = await Solicitud.findAndCountAll({
    where,
    order: [['fecha_registro', 'DESC']],
    limit,
    offset,
  });

  return { registros, totalPages: Math.ceil(total / limit) || 1, total, page };
};

exports.getSolicitudes = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const total = await Solicitud.count();

    const registros = await Solicitud.findAll({
      order: [['fecha_registro', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);

    return { registros, totalPages, total };

  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.updateSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params;

    const camposPermitidos = [
      'estado',
      'notas_internas'
    ];

    const datosActualizar = {};

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosActualizar[campo] = req.body[campo];
      }
    });

    if (Object.keys(datosActualizar).length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'No se enviaron campos válidos para actualizar'
      });
    }

    const [updated] = await Solicitud.update(datosActualizar, {
      where: { id }
    });

    if (!updated) {
      return res.status(404).json({
        ok: false,
        message: 'Solicitud no encontrada'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Solicitud actualizada correctamente'
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.deleteSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params;

    const solicitud = await Solicitud.findByPk(id);

    if (!solicitud) {
      return res.status(404).json({
        ok: false,
        message: 'Solicitud no encontrada'
      });
    }

    await solicitud.destroy();

    return res.status(200).json({
      ok: true,
      message: 'Solicitud eliminada correctamente'
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
};