require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const sequelize = require('../config/database');
const solicitudRoutes = require('../routes/solicitud.routes');
const newsletterRoutes = require('../routes/newsletter.routes');
const adminRoutes = require('../routes/admin.routes');

require('../models/solicitud.model');
require('../models/newsletter.model');

const app = express();
app.set('trust proxy', 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const allowedOrigins = [
  'https://alpex-seven.vercel.app',
  'http://localhost:3000',
  'https://alpex-back.vercel.app',
];

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos. Intenta nuevamente más tarde."
  },
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use('/api/solicitudes', formLimiter, solicitudRoutes);
app.use('/api/newsletter', formLimiter, newsletterRoutes);
app.use('/', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(`Error interno del servidor:\n ${err}`);
});

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de datos sincronizada correctamente");
  } catch (error) {
    console.error("Error al sincronizar DB:", error);
  }
})();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;