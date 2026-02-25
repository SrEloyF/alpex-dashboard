const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const newsletterController = require('../controllers/newsletter.controller');
const solicitudController = require('../controllers/solicitud.controller');
const authMiddleware = require('../middlewares/adminAuth');

router.get('/login', adminController.loginView);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const solicitudPage = parseInt(req.query.solicitudPage) || 1;
    const newsletterPage = parseInt(req.query.newsletterPage) || 1;
    const limit = 8;

    const newsletterData = await newsletterController.getNewsletters(newsletterPage, limit);
    const solicitudesData = await solicitudController.getSolicitudes(solicitudPage, limit);

    res.render('admin/dashboard', {
      newsletter: newsletterData.registros,
      newsletterTotalPages: newsletterData.totalPages,
      newsletterTotal: newsletterData.total,
      newsletterPage,
      solicitudes: solicitudesData.registros,
      solicitudesTotalPages: solicitudesData.totalPages,
      solicitudesTotal: solicitudesData.total,
      solicitudPage,
    });
    
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;