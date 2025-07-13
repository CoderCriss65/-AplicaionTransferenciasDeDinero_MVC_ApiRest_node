const pool = require('../config/db');

class ClienteModel {
  static async crear({ numero_identificacion, nombre, apellido, email }) {
    const [result] = await pool.execute(
      'INSERT INTO clientes (numero_identificacion, nombre, apellido, email) VALUES (?, ?, ?, ?)',
      [numero_identificacion, nombre, apellido, email]
    );
    return result.insertId;
  }

  static async obtenerTodos() {
    const [clientes] = await pool.query('SELECT * FROM clientes');
    return clientes;
  }

  static async obtenerPorId(id) {
    const [cliente] = await pool.execute('SELECT * FROM clientes WHERE id = ?', [id]);
    return cliente[0];
  }

  static async actualizar(id, { numero_identificacion, nombre, apellido, email }) {
    const [result] = await pool.execute(
      `UPDATE clientes 
       SET numero_identificacion = ?, nombre = ?, apellido = ?, email = ?
       WHERE id = ?`,
      [numero_identificacion, nombre, apellido, email, id]
    );
    return result.affectedRows;
  }

  static async eliminar(id) {
    const [result] = await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = ClienteModel;