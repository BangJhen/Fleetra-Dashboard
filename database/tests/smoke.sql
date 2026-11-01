-- Run only in an empty disposable schema after 001_initial_mysql.sql.
DELIMITER //
CREATE PROCEDURE verify_fleetra_constraints()
BEGIN
  DECLARE duplicate_rejected BOOLEAN DEFAULT FALSE;
  DECLARE tenant_rejected BOOLEAN DEFAULT FALSE;
  DECLARE invalid_score_rejected BOOLEAN DEFAULT FALSE;
  INSERT INTO companies(id,slug,name) VALUES (1,'test-one','Test one'),(2,'test-two','Test two');
  INSERT INTO drivers(id,company_id,full_name) VALUES (1,1,'Driver one'),(2,1,'Driver two'),(3,2,'Driver three');
  INSERT INTO vehicles(id,company_id,license_plate,model,vehicle_type) VALUES
    (1,1,'D 1000 TEST','Van','van'),(2,1,'D 1001 TEST','Van','van'),(3,2,'D 1002 TEST','Van','van');
  INSERT INTO trips(company_id,vehicle_id,driver_id,trip_code,status,idempotency_key)
    VALUES (1,1,1,'TEST-001','assigned','test-001');
  BEGIN
    DECLARE CONTINUE HANDLER FOR 1062 SET duplicate_rejected = TRUE;
    INSERT INTO trips(company_id,vehicle_id,driver_id,trip_code,status,idempotency_key)
      VALUES (1,1,2,'TEST-002','assigned','test-002');
  END;
  BEGIN
    DECLARE CONTINUE HANDLER FOR 1452 SET tenant_rejected = TRUE;
    INSERT INTO trips(company_id,vehicle_id,driver_id,trip_code,status,idempotency_key)
      VALUES (1,2,3,'TEST-003','assigned','test-003');
  END;
  BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET invalid_score_rejected = TRUE;
    INSERT INTO drivers(company_id,full_name,safety_score) VALUES (1,'Invalid',101);
  END;
  IF NOT duplicate_rejected OR NOT tenant_rejected OR NOT invalid_score_rejected THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fleetra constraint smoke test failed';
  END IF;
END//
DELIMITER ;
CALL verify_fleetra_constraints();
DROP PROCEDURE verify_fleetra_constraints;
