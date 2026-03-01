const Newsletter = require('./../models/newsletter.model');
const { ValidationError, UniqueConstraintError, Op } = require("sequelize");

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