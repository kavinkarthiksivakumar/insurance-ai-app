-- ============================================================
--  MYSQL SETUP SCRIPT — Insurance Claims App
--  Run this ONCE in MySQL Workbench or MySQL CLI before
--  starting the Spring Boot backend.
-- ============================================================

-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS insurance_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Step 2: Use it
USE insurance_db;

-- Step 3: (Spring Boot will auto-create all tables via hibernate ddl-auto=update)
-- Tables created automatically:
--   users, claims, claim_types, claim_documents,
--   fraud_results, evidence_validation_results,
--   document_requirements

-- Step 4: Verify
SHOW TABLES;
SELECT 'MySQL database ready for Insurance Claims App!' AS status;
