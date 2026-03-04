const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const newsletterController = require('../controllers/newsletter.controller');
const solicitudController = require('../controllers/solicitud.controller');
const authMiddleware = require('../middlewares/adminAuth');

router.get('/login', adminController.loginView);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);
router.patch('/solicitudes/:id', authMiddleware, solicitudController.updateSolicitud);
router.delete('/solicitudes/:id',authMiddleware, solicitudController.deleteSolicitud);

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const pageNuevo = parseInt(req.query.pageNuevo) || 1;
    const pageContactado = parseInt(req.query.pageContactado) || 1;
    const pageNegociacion = parseInt(req.query.pageNegociacion) || 1;
    const pageCerrado = parseInt(req.query.pageCerrado) || 1;
    const newsletterPage = parseInt(req.query.newsletterPage) || 1;
    
    const filtersLeads = {
      search: req.query.searchLeads || '',
      startDate: req.query.startLeads || '',
      endDate: req.query.endLeads || ''
    };

    const filtersNews = {
      search: req.query.searchNews || '',
      startDate: req.query.startNews || '',
      endDate: req.query.endNews || ''
    };

    const [nuevoData, contactadoData, negociacionData, cerradoData, newsletterData] = await Promise.all([
      solicitudController.getSolicitudesByStatus('Nuevo', pageNuevo, 5, filtersLeads),
      solicitudController.getSolicitudesByStatus('Contactado', pageContactado, 5, filtersLeads),
      solicitudController.getSolicitudesByStatus('Negociacion', pageNegociacion, 5, filtersLeads),
      solicitudController.getSolicitudesByStatus('Cerrado', pageCerrado, 5, filtersLeads),
      newsletterController.getNewsletters(newsletterPage, 10, filtersNews)
    ]);

    const board = {
      'Nuevo': nuevoData,
      'Negociacion': negociacionData,
      'Cerrado': cerradoData,
      'Contactado': contactadoData
    };

    res.render('admin/dashboard', {
      board,
      newsletterData,
      query: req.query, 
      solicitudesTotal: nuevoData.total + contactadoData.total + negociacionData.total + cerradoData.total
    });
    
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;