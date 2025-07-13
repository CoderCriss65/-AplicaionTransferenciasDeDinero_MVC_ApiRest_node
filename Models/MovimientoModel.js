const pool = require('../config/db');

class MovimientoModel {
  static async registrar({
    tipo, 
    cuenta_id, 
    monto, 
    saldo_anterior, 
    saldo_actual, 
    descripcion, 
    cuenta_origen_id, 
    cuenta_destino_id, 
    connection
  }) {
    await connection.execute(
      `INSERT INTO movimientos 
        (tipo, cuenta_id, monto, saldo_anterior, saldo_actual, cuenta_origen_id, cuenta_destino_id,descripcion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, cuenta_id, monto, saldo_anterior, saldo_actual, cuenta_origen_id, cuenta_destino_id,descripcion]
    );
  }

  static async obtenerPorCuenta(cuentaId) {
    const [movimientos] = await pool.execute(
      'SELECT * FROM movimientos WHERE cuenta_id = ? ORDER BY fecha DESC',
      [cuentaId]
    );
    return movimientos;
  }
}

module.exports = MovimientoModel;