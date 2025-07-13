const pool = require('../config/db');

class CuentaModel {
  static async crear({ cliente_id, numero_cuenta }) {
    const [result] = await pool.execute(
      'INSERT INTO cuentas (cliente_id, numero_cuenta) VALUES (?, ?)',
      [cliente_id, numero_cuenta]
    );
    return result.insertId;
  }

  static async obtenerPorId(id) {
    const [cuenta] = await pool.execute(
      'SELECT * FROM cuentas WHERE id = ?', 
      [id]
    );
    return cuenta[0];
  }

  static async obtenerPorCliente(clienteId) {
    const [cuentas] = await pool.execute(
      'SELECT * FROM cuentas WHERE cliente_id = ?',
      [clienteId]
    );
    return cuentas;
  }

  static async obtenerTodas() {
    const [cuentas] = await pool.query(`
      SELECT c.*, cl.nombre, cl.apellido 
      FROM cuentas c
      JOIN clientes cl ON c.cliente_id = cl.id
    `);
    return cuentas;
  }

  static async actualizarSaldo(id, nuevoSaldo, connection) {
    await connection.execute(
      'UPDATE cuentas SET saldo = ? WHERE id = ?',
      [nuevoSaldo, id]
    );
  }

  static async obtenerSaldo(id) {
    const [cuenta] = await pool.execute(
      'SELECT saldo FROM cuentas WHERE id = ?', 
      [id]
    );
    return cuenta[0]?.saldo;
  }

  static async eliminar(id) {
    const [result] = await pool.execute(
      'DELETE FROM cuentas WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }

  static async eliminarPorCliente(clienteId) {
    const [result] = await pool.execute(
      'DELETE FROM cuentas WHERE cliente_id = ?',
      [clienteId]
    );
    return result.affectedRows;
  }
}

module.exports = CuentaModel;