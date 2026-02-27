-- Safe new user insertion — uses INSERT IGNORE to skip if email already exists
-- Password: customer123  (BCrypt hash below)
INSERT IGNORE INTO users (name, email, password, role, phone_number, policy_number, aadhar_number)
VALUES (
    'New Customer',
    'newuser@example.com',
    '$2a$10$e0MJF3Zq4i9xK4a8LPqWduQFU5NQOm4L3a2NxIkJ5i0VQiXBJU0Ga',
    'CUSTOMER',
    '9876543211',
    'POL-20260001',
    NULL
);

-- Verify
SELECT id, name, email, role, policy_number FROM users;
