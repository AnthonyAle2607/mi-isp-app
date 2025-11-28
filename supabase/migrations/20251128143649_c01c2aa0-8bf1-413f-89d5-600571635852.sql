
-- Update servers to Data Center Principal
UPDATE network_devices 
SET 
  ip_address = CASE 
    WHEN ip_address = '10.255.255.1' THEN '10.0.1.1'
    WHEN ip_address = '10.255.255.2' THEN '10.0.1.2'
    WHEN ip_address = '10.255.255.3' THEN '10.0.1.3'
    ELSE ip_address
  END,
  subnet = '10.0.1.0/24',
  location = 'Data Center Principal'
WHERE device_type = 'servidor';

-- Update nodes to different zones
UPDATE network_devices 
SET 
  ip_address = CASE 
    WHEN ip_address = '10.255.255.10' THEN '10.0.2.10'
    WHEN ip_address = '10.255.255.11' THEN '10.0.2.11'
    WHEN ip_address = '10.255.255.12' THEN '192.168.100.12'
    ELSE ip_address
  END,
  subnet = CASE 
    WHEN ip_address IN ('10.255.255.10', '10.255.255.11') THEN '10.0.2.0/24'
    ELSE '192.168.100.0/24'
  END,
  location = CASE 
    WHEN ip_address IN ('10.255.255.10', '10.255.255.11') THEN 'Zona Norte'
    ELSE 'Zona Sur'
  END
WHERE device_type = 'nodo';

-- Update trunks 
UPDATE network_devices 
SET 
  ip_address = CASE 
    WHEN ip_address = '10.255.255.50' THEN '172.16.1.50'
    WHEN ip_address = '10.255.255.51' THEN '172.16.1.51'
    WHEN ip_address = '10.255.255.52' THEN '172.16.2.52'
    ELSE ip_address
  END,
  subnet = CASE 
    WHEN ip_address IN ('10.255.255.50', '10.255.255.51') THEN '172.16.1.0/24'
    ELSE '172.16.2.0/24'
  END,
  location = CASE 
    WHEN ip_address IN ('10.255.255.50', '10.255.255.51') THEN 'Zona Norte'
    ELSE 'Zona Sur'
  END
WHERE device_type = 'troncal';

-- Update CPEs to different subnets
UPDATE network_devices 
SET 
  ip_address = CASE 
    WHEN ip_address = '10.255.255.100' THEN '192.168.1.100'
    WHEN ip_address = '10.255.255.101' THEN '192.168.1.101'
    WHEN ip_address = '10.255.255.102' THEN '192.168.2.102'
    WHEN ip_address = '10.255.255.103' THEN '10.10.1.103'
    ELSE ip_address
  END,
  subnet = CASE 
    WHEN ip_address IN ('10.255.255.100', '10.255.255.101') THEN '192.168.1.0/24'
    WHEN ip_address = '10.255.255.102' THEN '192.168.2.0/24'
    ELSE '10.10.1.0/24'
  END,
  location = CASE 
    WHEN ip_address IN ('10.255.255.100', '10.255.255.101') THEN 'Zona Norte'
    WHEN ip_address = '10.255.255.102' THEN 'Zona Sur'
    ELSE 'Zona Centro'
  END
WHERE device_type = 'cpe';
