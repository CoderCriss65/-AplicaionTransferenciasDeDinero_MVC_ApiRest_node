const express = require('express');
const router = express.Router();
const clienteController = require('../Controllers/ClienteController');

router.post('/', clienteController.crearCliente);
router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerCliente);
router.put('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

module.exports = router;