--CREATE DATABASE IF NOT EXISTS banco_Aplicacion;
---USE banco_Aplicacion;

USE b3jxqe5g7phe0cpxue8r;

-- Tabla Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_identificacion VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Tabla Cuentas
CREATE TABLE cuentas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    numero_cuenta VARCHAR(20) UNIQUE NOT NULL,
    saldo DECIMAL(15, 2) DEFAULT 0.00,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla Movimientos
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuenta_id INT NOT NULL,
    tipo ENUM('deposito', 'retiro', 'transferencia') NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    saldo_anterior DECIMAL(15, 2) NOT NULL,
    saldo_posterior DECIMAL(15, 2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cuenta_origen_id INT,
    cuenta_destino_id INT,
    descripcion VARCHAR(255),
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id),
    FOREIGN KEY (cuenta_origen_id) REFERENCES cuentas(id),
    FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id)
);