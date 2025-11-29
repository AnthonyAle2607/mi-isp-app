
-- Clear existing test data
DELETE FROM network_devices;

-- ========================
-- 🏢 CORE & DATA CENTER (10.0.0.0/16)
-- ========================

-- Core Servers
INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('SV-Core-LaPaz', '10.0.1.1', 'servidor', 'online', '10.0.1.0/24', 'Data Center La Paz', 'Servidor principal de núcleo - Alta disponibilidad'),
('SV-Backup-LaPaz', '10.0.1.2', 'servidor', 'online', '10.0.1.0/24', 'Data Center La Paz', 'Servidor de respaldo con replicación activa'),
('Monitor-Server', '10.0.2.1', 'servidor', 'online', '10.0.2.0/24', 'Data Center La Paz', 'Servidor de monitoreo Zabbix/PRTG'),
('DB-Server', '10.0.2.2', 'servidor', 'online', '10.0.2.0/24', 'Data Center La Paz', 'Base de datos PostgreSQL - Clientes y facturación');

-- ========================
-- 🌐 NODOS DE DISTRIBUCIÓN (172.16.0.0/16)
-- ========================

-- Zona Norte
INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('Nodo-Norte-Principal', '172.16.1.1', 'nodo', 'online', '172.16.1.0/24', 'Zona Norte', 'Nodo principal Zona Norte - 500 clientes'),
('Nodo-Norte-Backup', '172.16.1.2', 'nodo', 'online', '172.16.1.0/24', 'Zona Norte', 'Nodo de respaldo Zona Norte'),
('Nodo-Norte-Expansion', '172.16.1.3', 'nodo', 'online', '172.16.1.0/24', 'Zona Norte', 'Nodo de expansión - Nuevos sectores');

-- Zona Sur
INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('Nodo-Sur-Principal', '172.16.2.1', 'nodo', 'online', '172.16.2.0/24', 'Zona Sur', 'Nodo principal Zona Sur - 400 clientes'),
('Nodo-Sur-Backup', '172.16.2.2', 'nodo', 'online', '172.16.2.0/24', 'Zona Sur', 'Nodo de respaldo Zona Sur');

-- Zona Centro
INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('Nodo-Centro-Principal', '172.16.3.1', 'nodo', 'online', '172.16.3.0/24', 'Zona Centro', 'Nodo principal Zona Centro - 600 clientes'),
('Nodo-Centro-Comercial', '172.16.3.2', 'nodo', 'online', '172.16.3.0/24', 'Zona Centro', 'Nodo sector comercial - Alta demanda');

-- ========================
-- 🔗 ENLACES TRONCALES (10.10.0.0/16)
-- ========================

INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('Troncal-DC-Norte', '10.10.1.1', 'troncal', 'online', '10.10.1.0/24', 'Enlace DC-Norte', 'Fibra 10Gbps Data Center a Zona Norte'),
('Troncal-DC-Sur', '10.10.2.1', 'troncal', 'online', '10.10.2.0/24', 'Enlace DC-Sur', 'Fibra 10Gbps Data Center a Zona Sur'),
('Troncal-DC-Centro', '10.10.3.1', 'troncal', 'online', '10.10.3.0/24', 'Enlace DC-Centro', 'Fibra 10Gbps Data Center a Zona Centro'),
('Troncal-Norte-Sur', '10.10.4.1', 'troncal', 'online', '10.10.4.0/24', 'Enlace Norte-Sur', 'Redundancia entre zonas Norte y Sur'),
('Troncal-Backup-ISP', '10.10.5.1', 'troncal', 'maintenance', '10.10.5.0/24', 'Enlace ISP Backup', 'Enlace de respaldo con proveedor upstream');

-- ========================
-- 📡 CPEs ZONA NORTE (192.168.1.0/24)
-- ========================

INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('CPE-N001-Residencial', '192.168.1.10', 'cpe', 'online', '192.168.1.0/24', 'Zona Norte', 'Cliente residencial - Plan 50Mbps'),
('CPE-N002-Residencial', '192.168.1.11', 'cpe', 'online', '192.168.1.0/24', 'Zona Norte', 'Cliente residencial - Plan 100Mbps'),
('CPE-N003-Empresa', '192.168.1.12', 'cpe', 'online', '192.168.1.0/24', 'Zona Norte', 'Cliente empresarial - Plan Dedicado 200Mbps'),
('CPE-N004-Residencial', '192.168.1.13', 'cpe', 'offline', '192.168.1.0/24', 'Zona Norte', 'Cliente residencial - Suspendido por mora'),
('CPE-N005-Residencial', '192.168.1.14', 'cpe', 'online', '192.168.1.0/24', 'Zona Norte', 'Cliente residencial - Plan 50Mbps'),
('CPE-N006-Comercio', '192.168.1.15', 'cpe', 'online', '192.168.1.0/24', 'Zona Norte', 'Tienda comercial - Plan Pyme 100Mbps'),
('CPE-N007-Residencial', '192.168.1.16', 'cpe', 'online', '192.168.1.0/24', 'Zona Norte', 'Cliente residencial - Plan 30Mbps');

-- ========================
-- 📡 CPEs ZONA SUR (192.168.2.0/24)
-- ========================

INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('CPE-S001-Residencial', '192.168.2.10', 'cpe', 'online', '192.168.2.0/24', 'Zona Sur', 'Cliente residencial - Plan 50Mbps'),
('CPE-S002-Empresa', '192.168.2.11', 'cpe', 'online', '192.168.2.0/24', 'Zona Sur', 'Oficina corporativa - Plan Empresarial 500Mbps'),
('CPE-S003-Residencial', '192.168.2.12', 'cpe', 'online', '192.168.2.0/24', 'Zona Sur', 'Cliente residencial - Plan 100Mbps'),
('CPE-S004-Residencial', '192.168.2.13', 'cpe', 'offline', '192.168.2.0/24', 'Zona Sur', 'Cliente residencial - Equipo dañado'),
('CPE-S005-Gobierno', '192.168.2.14', 'cpe', 'online', '192.168.2.0/24', 'Zona Sur', 'Oficina gubernamental - Plan Dedicado'),
('CPE-S006-Residencial', '192.168.2.15', 'cpe', 'online', '192.168.2.0/24', 'Zona Sur', 'Cliente residencial - Plan 50Mbps');

-- ========================
-- 📡 CPEs ZONA CENTRO (192.168.3.0/24)
-- ========================

INSERT INTO network_devices (name, ip_address, device_type, status, subnet, location, description) VALUES
('CPE-C001-Hotel', '192.168.3.10', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Hotel 5 estrellas - Plan Corporativo 1Gbps'),
('CPE-C002-Banco', '192.168.3.11', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Sucursal bancaria - Enlace dedicado con SLA'),
('CPE-C003-Comercio', '192.168.3.12', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Centro comercial - Plan Empresarial 500Mbps'),
('CPE-C004-Residencial', '192.168.3.13', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Edificio residencial - Plan 100Mbps'),
('CPE-C005-Universidad', '192.168.3.14', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Campus universitario - Fibra dedicada 10Gbps'),
('CPE-C006-Hospital', '192.168.3.15', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Hospital principal - Enlace crítico con redundancia'),
('CPE-C007-Comercio', '192.168.3.16', 'cpe', 'maintenance', '192.168.3.0/24', 'Zona Centro', 'Restaurante - Actualización de equipo'),
('CPE-C008-Residencial', '192.168.3.17', 'cpe', 'online', '192.168.3.0/24', 'Zona Centro', 'Cliente residencial - Plan Premium 200Mbps');
