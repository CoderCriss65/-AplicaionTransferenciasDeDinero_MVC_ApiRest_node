const pool = require('../config/db');
const CuentaModel = require('../Models/CuentaModel');
const MovimientoModel = require('../Models/MovimientoModel');

const realizarOperacion = async (tipo, req, res) => {
    const { cuenta_id, monto, descripcion = tipo.charAt(0).toUpperCase() + tipo.slice(1) } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Validar y convertir monto
        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            throw new Error('Monto inválido');
        }

        // Obtener cuenta actual
        const cuenta = await CuentaModel.obtenerPorId(cuenta_id);
        if (!cuenta) throw new Error('Cuenta no encontrada');
        
        const saldo_anterior = parseFloat(cuenta.saldo);
        if (isNaN(saldo_anterior)) {
            throw new Error('Saldo inválido');
        }

        let saldo_actual;
        
        if (tipo === 'deposito') {
            saldo_actual = saldo_anterior + montoNum;
        } else if (tipo === 'retiro') {
            if (saldo_anterior < montoNum) throw new Error('Saldo insuficiente');
            saldo_actual = saldo_anterior - montoNum;
        } else {
            throw new Error('Tipo de operación no válido');
        }

        // Actualizar saldo
        await CuentaModel.actualizarSaldo(cuenta_id, saldo_actual, connection);

        // Registrar movimiento (CORRECCIÓN: usar saldo_actual en lugar de saldo_posterior)
        await MovimientoModel.registrar({
            tipo,
            cuenta_id,
            monto: montoNum,
            saldo_anterior,
            saldo_actual,
            descripcion,
            cuenta_origen_id: null,
            cuenta_destino_id: null,
            connection
        });

        await connection.commit();
        res.json({ 
            mensaje: `${descripcion} realizado`,
            saldo_anterior,
            saldo_actual
        });
    } catch (err) {
        await connection.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
};

exports.transferir = async (req, res) => {
    const { cuenta_origen, cuenta_destino, monto, descripcion = 'Transferencia' } = req.body;
    const montoNum = parseFloat(monto);
    
    if (isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ error: "Monto inválido" });
    }

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
        
        if (saldo_origen_anterior < montoNum) throw new Error('Saldo insuficiente');

        const saldo_origen_actual = saldo_origen_anterior - montoNum;
        const saldo_destino_actual = saldo_destino_anterior + montoNum;

        // Actualizar saldos
        await CuentaModel.actualizarSaldo(cuenta_origen, saldo_origen_actual, connection);
        await CuentaModel.actualizarSaldo(cuenta_destino, saldo_destino_actual, connection);

        // Registrar movimientos (CORRECCIÓN: usar saldo_actual en lugar de saldo_posterior)
        await MovimientoModel.registrar({
            tipo: 'transferencia',
            cuenta_id: cuenta_origen,
            monto: -montoNum,
            saldo_anterior: saldo_origen_anterior,
            saldo_actual: saldo_origen_actual,
            descripcion: `${descripcion} a cuenta ${cuenta_destino}`,
            cuenta_origen_id: cuenta_origen,
            cuenta_destino_id: cuenta_destino,
            connection
        });
        
        await MovimientoModel.registrar({
            tipo: 'transferencia',
            cuenta_id: cuenta_destino,
            monto: montoNum,
            saldo_anterior: saldo_destino_anterior,
            saldo_actual: saldo_destino_actual,
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
                saldo_actual: saldo_origen_actual
            },
            cuenta_destino: {
                saldo_anterior: saldo_destino_anterior,
                saldo_actual: saldo_destino_actual
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