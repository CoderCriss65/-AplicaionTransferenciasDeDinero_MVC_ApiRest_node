const pool = require('../config/db');
const CuentaModel = require('../Models/CuentaModel');
const MovimientoModel = require('../Models/MovimientoModel');

// Función para realizar operaciones bancarias
const realizarOperacion = async (tipo, req, res) => {
  const { cuenta_id, monto, descripcion = tipo.charAt(0).toUpperCase() + tipo.slice(1) } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtener cuenta actual
    const cuenta = await CuentaModel.obtenerPorId(cuenta_id);
    if (!cuenta) throw new Error('Cuenta no encontrada');
    
    const saldo_anterior = parseFloat(cuenta.saldo);
    let saldo_posterior;
    
    if (tipo === 'deposito') {
      saldo_posterior = saldo_anterior + parseFloat(monto);
    } else if (tipo === 'retiro') {
      if (saldo_anterior < parseFloat(monto)) throw new Error('Saldo insuficiente');
      saldo_posterior = saldo_anterior - parseFloat(monto);
    }

    // Actualizar saldo
    await CuentaModel.actualizarSaldo(cuenta_id, saldo_posterior, connection);

    // Registrar movimiento
    await MovimientoModel.registrar({
      tipo,
      cuenta_id,
      monto,
      saldo_anterior,
      saldo_posterior,
      descripcion,
      cuenta_origen_id: null,
      cuenta_destino_id: null,
      connection
    });

    await connection.commit();
    res.json({ 
      mensaje: `${descripcion} realizado`,
      saldo_anterior,
      saldo_posterior
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// Transferir dinero entre cuentas
exports.transferir = async (req, res) => {
  const { cuenta_origen, cuenta_destino, monto, descripcion = 'Transferencia' } = req.body;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtener cuentas
    const cuentaOrigen = await CuentaModel.obtenerPorId(cuenta_origen);
    const cuentaDestino = await CuentaModel.obtenerPorId(cuenta_destino);
    
    if (!cuentaOrigen) throw new Error('Cuenta origen no encontrada');
    if (!cuentaDestino) throw new Error('Cuenta destino no encontrada');
    
    const saldo_origen_anterior = parseFloat(cuentaOrigen.saldo);
    const saldo_destino_anterior = parseFloat(cuentaDestino.saldo);
    
    if (saldo_origen_anterior < parseFloat(monto)) throw new Error('Saldo insuficiente');

    const saldo_origen_posterior = saldo_origen_anterior - parseFloat(monto);
    const saldo_destino_posterior = saldo_destino_anterior + parseFloat(monto);

    // Actualizar saldos
    await CuentaModel.actualizarSaldo(cuenta_origen, saldo_origen_posterior, connection);
    await CuentaModel.actualizarSaldo(cuenta_destino, saldo_destino_posterior, connection);

    // Registrar movimientos para ambas cuentas
    await MovimientoModel.registrar({
      tipo: 'transferencia',
      cuenta_id: cuenta_origen,
      monto: -monto,
      saldo_anterior: saldo_origen_anterior,
      saldo_posterior: saldo_origen_posterior,
      descripcion: `${descripcion} a cuenta ${cuenta_destino}`,
      cuenta_origen_id: cuenta_origen,
      cuenta_destino_id: cuenta_destino,
      connection
    });
    
    await MovimientoModel.registrar({
      tipo: 'transferencia',
      cuenta_id: cuenta_destino,
      monto: monto,
      saldo_anterior: saldo_destino_anterior,
      saldo_posterior: saldo_destino_posterior,
      descripcion: `${descripcion} de cuenta ${cuenta_origen}`,
      cuenta_origen_id: cuenta_origen,
      cuenta_destino_id: cuenta_destino,
      connection
    });

    await connection.commit();
    res.json({ 
      mensaje: 'Transferencia exitosa',
      cuenta_origen: {
        saldo_anterior: saldo_origen_anterior,
        saldo_posterior: saldo_origen_posterior
      },
      cuenta_destino: {
        saldo_anterior: saldo_destino_anterior,
        saldo_posterior: saldo_destino_posterior
      }
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.depositar = (req, res) => realizarOperacion('deposito', req, res);
exports.retirar = (req, res) => realizarOperacion('retiro', req, res);

exports.obtenerMovimientos = async (req, res) => {
  try {
    const movimientos = await MovimientoModel.obtenerPorCuenta(req.params.cuentaId);
    res.json(movimientos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todas las transacciones
exports.obtenerTodasTransacciones = async (req, res) => {
    try {
      const [transacciones] = await pool.query(`
        SELECT m.*, 
          co.numero_cuenta AS cuenta_origen_numero,
          cd.numero_cuenta AS cuenta_destino_numero,
          c1.nombre AS cliente_origen_nombre,
          c1.apellido AS cliente_origen_apellido,
          c2.nombre AS cliente_destino_nombre,
          c2.apellido AS cliente_destino_apellido
        FROM movimientos m
        LEFT JOIN cuentas co ON m.cuenta_origen_id = co.id
        LEFT JOIN cuentas cd ON m.cuenta_destino_id = cd.id
        LEFT JOIN clientes c1 ON co.cliente_id = c1.id
        LEFT JOIN clientes c2 ON cd.cliente_id = c2.id
        ORDER BY m.fecha DESC
      `);
      
      res.json(transacciones);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };