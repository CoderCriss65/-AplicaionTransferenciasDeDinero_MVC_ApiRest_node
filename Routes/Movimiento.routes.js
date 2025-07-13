const express = require('express');
const router = express.Router();
const movimientoController = require('../Controllers/MovimientoController');

router.post('/depositar', movimientoController.depositar);
router.post('/retirar', movimientoController.retirar);
router.post('/transferir', movimientoController.transferir);
router.get('/cuenta/:cuentaId', movimientoController.obtenerMovimientos);
router.get('/', movimientoController.obtenerTodasTransacciones); // Nueva ruta

module.exports = router;