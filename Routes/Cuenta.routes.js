const express = require('express');
const router = express.Router();
const cuentaController = require('../Controllers/CuentaController');

router.post('/', cuentaController.crearCuenta);
router.get('/:id/saldo', cuentaController.consultarSaldo);
router.get('/', cuentaController.obtenerTodasCuentas);
router.get('/:id', cuentaController.obtenerCuentaPorId);
router.get('/cliente/:clienteId', cuentaController.obtenerCuentasPorCliente);
router.delete('/:id', cuentaController.eliminarCuenta);

module.exports = router;