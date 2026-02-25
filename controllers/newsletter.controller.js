const Newsletter = require('./../models/newsletter.model');
const { ValidationError, UniqueConstraintError } = require("sequelize");

exports.createNewsletter = async (req, res, next) => {
  try {
    const nuevoRegistro = await Newsletter.create(req.body);
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

exports.getNewsletters = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const total = await Newsletter.count();

    const registros = await Newsletter.findAll({
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