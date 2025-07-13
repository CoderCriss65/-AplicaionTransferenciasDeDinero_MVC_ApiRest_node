const CuentaModel = require('../Models/CuentaModel');
const ClienteModel=require('../Models/ClienteModel');

exports.crearCuenta = async (req, res) => {
  try {
    const { cliente_id, numero_cuenta } = req.body;
    
    // Validar que el cliente no tenga cuenta existente
    const cuentasExistente = await CuentaModel.obtenerPorCliente(cliente_id);
    if (cuentasExistente.length > 0) {
      return res.status(400).json({ 
        error: 'El cliente ya tiene una cuenta asociada' 
      });
    }
    
    const id = await CuentaModel.crear({ cliente_id, numero_cuenta });
    res.status(201).json({ id, cliente_id, numero_cuenta, saldo: 0.00 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.consultarSaldo = async (req, res) => {
    try {
      const cuentaId = req.params.id;
      
      // Obtener la cuenta completa en lugar de solo el saldo
      const cuenta = await CuentaModel.obtenerPorId(cuentaId);
      
      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }
      
      // Obtener información del cliente asociado
      const cliente = await ClienteModel.obtenerPorId(cuenta.cliente_id);
      
      // Construir respuesta detallada
      const respuesta = {
        cuenta_id: cuenta.id,
        numero_cuenta: cuenta.numero_cuenta,
        saldo: cuenta.saldo,
        moneda: "USD",  // Asumiendo que trabajamos con dólares
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          identificacion: cliente.numero_identificacion
        },
        fecha_consulta: new Date().toISOString()
      };
      
      res.json(respuesta);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
exports.obtenerTodasCuentas = async (req, res) => {
  try {
    const cuentas = await CuentaModel.obtenerTodas();
    res.json(cuentas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerCuentaPorId = async (req, res) => {
  try {
    const cuenta = await CuentaModel.obtenerPorId(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerCuentasPorCliente = async (req, res) => {
  try {
    const cuentas = await CuentaModel.obtenerPorCliente(req.params.clienteId);
    res.json(cuentas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.eliminarCuenta = async (req, res) => {
  try {
    const affectedRows = await CuentaModel.eliminar(req.params.id);
    if (affectedRows === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (err) {
    // Manejar error si tiene movimientos asociados
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar la cuenta porque tiene movimientos asociados' 
      });
    }
    res.status(500).json({ error: err.message });
  }
};