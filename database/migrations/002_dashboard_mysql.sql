-- Dashboard compatibility migration; apply once after 001 to a backed-up database.
ALTER TABLE companies ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE users ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_users_external (company_id,external_id);
ALTER TABLE drivers ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_drivers_external (company_id,external_id);
ALTER TABLE vehicles ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_vehicles_external (company_id,external_id);
ALTER TABLE trips ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_trips_external (company_id,external_id);
ALTER TABLE trip_waypoints ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_waypoints_external (company_id,external_id);
ALTER TABLE rto_contracts ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_contracts_external (company_id,external_id);
ALTER TABLE rto_transactions ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_transactions_external (company_id,external_id);
ALTER TABLE etle_violations ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_etle_external (company_id,external_id);
ALTER TABLE notifications ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_notifications_external (company_id,external_id);
ALTER TABLE vehicle_health_snapshots ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_health_external (company_id,external_id);
ALTER TABLE driver_safety_snapshots ADD COLUMN external_id VARCHAR(100) NULL, ADD UNIQUE KEY uq_driver_safety_external (company_id,external_id);
ALTER TABLE epod_records MODIFY photo_url MEDIUMTEXT NOT NULL, MODIFY signature_url MEDIUMTEXT NOT NULL;
CREATE TABLE locations (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 company_id BIGINT UNSIGNED NOT NULL,
 location_index INT UNSIGNED NOT NULL,
 name VARCHAR(180) NOT NULL,
 address VARCHAR(255) NOT NULL,
 latitude DECIMAL(10,7) NOT NULL,
 longitude DECIMAL(10,7) NOT NULL,
 UNIQUE KEY uq_location_index (company_id, location_index),
 CONSTRAINT fk_locations_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
