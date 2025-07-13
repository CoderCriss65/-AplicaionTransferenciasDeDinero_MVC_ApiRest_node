const ClienteModel = require('../Models/ClienteModel');
const CuentaModel = require('../Models/CuentaModel'); // Importamos el modelo de cuentas

exports.crearCliente = async (req, res) => {
  try {
    const { numero_identificacion, nombre, apellido, email } = req.body;
    const id = await ClienteModel.crear({ numero_identificacion, nombre, apellido, email });
    res.status(201).json({ id, numero_identificacion, nombre, apellido, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerClientes = async (req, res) => {
  try {
    const clientes = await ClienteModel.obtenerTodos();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerCliente = async (req, res) => {
  try {
    const cliente = await ClienteModel.obtenerPorId(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarCliente = async (req, res) => {
  try {
    const affectedRows = await ClienteModel.actualizar(req.params.id, req.body);
    if (affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.eliminarCliente = async (req, res) => {
  try {
    const clienteId = req.params.id;
    
    // Primero eliminar la cuenta del cliente
    await CuentaModel.eliminarPorCliente(clienteId);
    
    // Luego eliminar el cliente
    const affectedRows = await ClienteModel.eliminar(clienteId);
    
    if (affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente y su cuenta eliminados correctamente' });
  } catch (err) {
    // Manejar error de clave foránea (si tiene movimientos asociados)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene movimientos asociados' 
      });
    }
    res.status(500).json({ error: err.message });
  }
};