-- FLEETRA proposal ERD and dashboard MVP. MySQL 8.0.16+ / InnoDB.
-- Run against a new, explicitly selected database. Times are UTC.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE companies (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 slug VARCHAR(100) NOT NULL UNIQUE, name VARCHAR(180) NOT NULL,
 address VARCHAR(255), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 company_id BIGINT UNSIGNED NOT NULL, full_name VARCHAR(180) NOT NULL,
 email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
 contact_email VARCHAR(254), phone VARCHAR(40), role ENUM('admin','dispatcher','driver') NOT NULL,
 version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_users_company_id (company_id,id),
 CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE drivers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 user_id BIGINT UNSIGNED NULL, full_name VARCHAR(180) NOT NULL, phone VARCHAR(40),
 sim_number VARCHAR(100) UNIQUE, nik_ktp_encrypted VARBINARY(1024),
 safety_score DECIMAL(5,2) NOT NULL DEFAULT 100, status VARCHAR(32) NOT NULL DEFAULT 'available',
 trip_count INT UNSIGNED NOT NULL DEFAULT 0, braking_count INT UNSIGNED NOT NULL DEFAULT 0,
 speeding_count INT UNSIGNED NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1,
 creation_key VARCHAR(100), archived_at DATETIME(3), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_drivers_company_id (company_id,id), UNIQUE KEY uq_drivers_user (user_id),
 UNIQUE KEY uq_driver_creation (company_id,creation_key),
 CONSTRAINT fk_drivers_company FOREIGN KEY (company_id) REFERENCES companies(id),
 CONSTRAINT fk_drivers_user FOREIGN KEY (company_id,user_id) REFERENCES users(company_id,id),
 CONSTRAINT chk_driver_score CHECK (safety_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehicles (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 license_plate VARCHAR(20) NOT NULL UNIQUE, vin_number VARCHAR(100) UNIQUE,
 model VARCHAR(180) NOT NULL, vehicle_type ENUM('car','van','pickup','truck','motorcycle','bus') NOT NULL,
 fuel_type VARCHAR(32), status ENUM('moving','idle','service') NOT NULL DEFAULT 'idle',
 reference_driver_id BIGINT UNSIGNED, current_odometer_km DECIMAL(12,2) NOT NULL DEFAULT 0,
 fuel_level_pct DECIMAL(5,2), brake_health_pct DECIMAL(5,2), health_score DECIMAL(5,2),
 latitude DECIMAL(10,7), longitude DECIMAL(10,7), heading DECIMAL(5,2), speed_kmh DECIMAL(7,2), location_label VARCHAR(255),
 version INT UNSIGNED NOT NULL DEFAULT 1, creation_key VARCHAR(100), archived_at DATETIME(3),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_vehicles_company_id (company_id,id), UNIQUE KEY uq_vehicle_creation (company_id,creation_key),
 CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies(id),
 CONSTRAINT fk_vehicles_driver FOREIGN KEY (company_id,reference_driver_id) REFERENCES drivers(company_id,id),
 CONSTRAINT chk_vehicle_fuel CHECK (fuel_level_pct BETWEEN 0 AND 100),
 CONSTRAINT chk_vehicle_brake CHECK (brake_health_pct BETWEEN 0 AND 100),
 CONSTRAINT chk_vehicle_health CHECK (health_score BETWEEN 0 AND 100),
 CONSTRAINT chk_vehicle_odometer CHECK (current_odometer_km >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE devices (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL, imei_number VARCHAR(32) NOT NULL UNIQUE,
 protocol_type VARCHAR(50), sim_card_msisdn VARCHAR(30), last_heartbeat DATETIME(3),
 UNIQUE KEY uq_devices_company_id (company_id,id),
 CONSTRAINT fk_devices_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE geofences (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(180) NOT NULL, polygon_coordinates JSON NOT NULL, type VARCHAR(32) NOT NULL,
 CONSTRAINT fk_geofences_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trips (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL, driver_id BIGINT UNSIGNED NOT NULL,
 trip_code VARCHAR(80) NOT NULL UNIQUE, status ENUM('assigned','in_progress','completed','cancelled') NOT NULL,
 started_at DATETIME(3), completed_at DATETIME(3), distance_km DECIMAL(10,2) NOT NULL DEFAULT 0,
 duration_minutes INT UNSIGNED NOT NULL DEFAULT 0, route_geometry JSON, route_source VARCHAR(32),
 idempotency_key VARCHAR(100) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 active_vehicle_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status IN ('assigned','in_progress') THEN vehicle_id ELSE NULL END) STORED,
 active_driver_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status IN ('assigned','in_progress') THEN driver_id ELSE NULL END) STORED,
 UNIQUE KEY uq_trips_company_id (company_id,id), UNIQUE KEY uq_trip_idempotency (company_id,idempotency_key),
 UNIQUE KEY uq_active_vehicle (company_id,active_vehicle_id), UNIQUE KEY uq_active_driver (company_id,active_driver_id),
 KEY ix_trip_match (company_id,vehicle_id,started_at,completed_at),
 CONSTRAINT fk_trips_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id),
 CONSTRAINT fk_trips_driver FOREIGN KEY (company_id,driver_id) REFERENCES drivers(company_id,id),
 CONSTRAINT chk_trip_times CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trip_waypoints (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 trip_id BIGINT UNSIGNED NOT NULL, sequence_number INT UNSIGNED NOT NULL,
 stop_type ENUM('pickup','dropoff') NOT NULL, destination_name VARCHAR(180) NOT NULL,
 address VARCHAR(255) NOT NULL, latitude DECIMAL(10,7) NOT NULL, longitude DECIMAL(10,7) NOT NULL,
 status ENUM('pending','arrived','delivered','failed_attempt') NOT NULL DEFAULT 'pending', failure_reason VARCHAR(500),
 UNIQUE KEY uq_waypoint_company_id (company_id,id), UNIQUE KEY uq_trip_sequence (company_id,trip_id,sequence_number),
 CONSTRAINT fk_waypoints_trip FOREIGN KEY (company_id,trip_id) REFERENCES trips(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE epod_records (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 waypoint_id BIGINT UNSIGNED NOT NULL, recipient_name VARCHAR(180) NOT NULL,
 photo_url TEXT NOT NULL, signature_url TEXT NOT NULL, submitted_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_epod_waypoint (company_id,waypoint_id),
 CONSTRAINT fk_epod_waypoint FOREIGN KEY (company_id,waypoint_id) REFERENCES trip_waypoints(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE telemetry_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL, device_id BIGINT UNSIGNED, latitude DECIMAL(10,7) NOT NULL,
 longitude DECIMAL(10,7) NOT NULL, speed_kmh DECIMAL(7,2), fuel_level_pct DECIMAL(5,2),
 battery_soc_pct DECIMAL(5,2), ignition_status BOOLEAN, source VARCHAR(32) NOT NULL DEFAULT 'simulation',
 recorded_at DATETIME(3) NOT NULL, KEY ix_telemetry_vehicle_time (company_id,vehicle_id,recorded_at),
 CONSTRAINT fk_telemetry_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id),
 CONSTRAINT fk_telemetry_device FOREIGN KEY (company_id,device_id) REFERENCES devices(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE maintenance_records (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL, maintenance_type VARCHAR(50) NOT NULL, description VARCHAR(500),
 trigger_odometer_km DECIMAL(12,2), status VARCHAR(32) NOT NULL, scheduled_at DATETIME(3),
 CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehicle_health_snapshots (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL, recorded_at DATETIME(3) NOT NULL, source VARCHAR(32) NOT NULL,
 note VARCHAR(500), idempotency_key VARCHAR(100), status VARCHAR(32), health_score DECIMAL(5,2),
 brake_health_pct DECIMAL(5,2), fuel_level_pct DECIMAL(5,2), odometer_km DECIMAL(12,2), speed_kmh DECIMAL(7,2),
 UNIQUE KEY uq_health_key (company_id,idempotency_key), KEY ix_health_history (company_id,vehicle_id,recorded_at),
 CONSTRAINT fk_health_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE driver_safety_snapshots (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 driver_id BIGINT UNSIGNED NOT NULL, recorded_at DATETIME(3) NOT NULL, source VARCHAR(32) NOT NULL,
 note VARCHAR(500), idempotency_key VARCHAR(100), safety_score DECIMAL(5,2), braking_count INT UNSIGNED,
 speeding_count INT UNSIGNED, trip_count INT UNSIGNED,
 UNIQUE KEY uq_safety_key (company_id,idempotency_key), KEY ix_safety_history (company_id,driver_id,recorded_at),
 CONSTRAINT fk_safety_driver FOREIGN KEY (company_id,driver_id) REFERENCES drivers(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rto_contracts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED NOT NULL, driver_id BIGINT UNSIGNED NOT NULL,
 target_price DECIMAL(15,2) NOT NULL, opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
 daily_rental_rate DECIMAL(15,2), tenor_months INT UNSIGNED NOT NULL, elapsed_months INT UNSIGNED NOT NULL DEFAULT 0,
 status VARCHAR(32) NOT NULL DEFAULT 'active', start_date DATETIME(3),
 UNIQUE KEY uq_contract_company_id (company_id,id),
 CONSTRAINT fk_contract_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id),
 CONSTRAINT fk_contract_driver FOREIGN KEY (company_id,driver_id) REFERENCES drivers(company_id,id),
 CONSTRAINT chk_contract_amount CHECK (target_price > 0 AND opening_balance >= 0 AND opening_balance <= target_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rto_transactions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 contract_id BIGINT UNSIGNED NOT NULL, trip_id BIGINT UNSIGNED NOT NULL, amount_deducted DECIMAL(15,2) NOT NULL,
 transaction_type VARCHAR(32) NOT NULL DEFAULT 'trip', status VARCHAR(32) NOT NULL DEFAULT 'posted',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_rto_trip (company_id,trip_id),
 CONSTRAINT fk_rto_contract FOREIGN KEY (company_id,contract_id) REFERENCES rto_contracts(company_id,id),
 CONSTRAINT fk_rto_trip FOREIGN KEY (company_id,trip_id) REFERENCES trips(company_id,id),
 CONSTRAINT chk_rto_amount CHECK (amount_deducted > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE etle_violations (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 vehicle_id BIGINT UNSIGNED, driver_id BIGINT UNSIGNED, ticket_number VARCHAR(100) NOT NULL,
 vehicle_plate VARCHAR(20) NOT NULL, camera_location_name VARCHAR(255), penalty_amount DECIMAL(15,2),
 payment_status VARCHAR(32), incident_time DATETIME(3) NOT NULL,
 review_status ENUM('unmatched','candidate_match','needs_review','confirmed','disputed') NOT NULL,
 source ENUM('simulasi','operator') NOT NULL DEFAULT 'operator', created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_etle_company_id (company_id,id), UNIQUE KEY uq_etle_reference (company_id,ticket_number),
 KEY ix_etle_plate_time (company_id,vehicle_plate,incident_time),
 CONSTRAINT fk_etle_company FOREIGN KEY (company_id) REFERENCES companies(id),
 CONSTRAINT fk_etle_vehicle FOREIGN KEY (company_id,vehicle_id) REFERENCES vehicles(company_id,id),
 CONSTRAINT fk_etle_driver FOREIGN KEY (company_id,driver_id) REFERENCES drivers(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE etle_trip_candidates (
 company_id BIGINT UNSIGNED NOT NULL, etle_id BIGINT UNSIGNED NOT NULL, trip_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY (company_id,etle_id,trip_id),
 CONSTRAINT fk_candidate_etle FOREIGN KEY (company_id,etle_id) REFERENCES etle_violations(company_id,id),
 CONSTRAINT fk_candidate_trip FOREIGN KEY (company_id,trip_id) REFERENCES trips(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sos_alerts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 driver_id BIGINT UNSIGNED NOT NULL, trip_id BIGINT UNSIGNED, latitude DECIMAL(10,7), longitude DECIMAL(10,7),
 status ENUM('unread','acknowledged','resolved') NOT NULL DEFAULT 'unread', idempotency_key VARCHAR(100) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE KEY uq_sos_key (company_id,driver_id,idempotency_key),
 CONSTRAINT fk_sos_driver FOREIGN KEY (company_id,driver_id) REFERENCES drivers(company_id,id),
 CONSTRAINT fk_sos_trip FOREIGN KEY (company_id,trip_id) REFERENCES trips(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, company_id BIGINT UNSIGNED NOT NULL,
 recipient_id BIGINT UNSIGNED, title VARCHAR(180) NOT NULL, description VARCHAR(500) NOT NULL,
 kind VARCHAR(32) NOT NULL, target_url VARCHAR(255), status ENUM('unread','read','acknowledged','resolved') NOT NULL DEFAULT 'unread',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), KEY ix_notifications_inbox (company_id,recipient_id,status,created_at),
 CONSTRAINT fk_notifications_company FOREIGN KEY (company_id) REFERENCES companies(id),
 CONSTRAINT fk_notifications_user FOREIGN KEY (company_id,recipient_id) REFERENCES users(company_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
