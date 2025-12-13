-- Check if clients table has any data
SELECT COUNT(*) as total_clients,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_clients,
       SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_clients,
       SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_clients
FROM clients;

-- View all clients
SELECT id, name, email, status, created_at FROM clients ORDER BY created_at DESC;

-- If no clients exist, insert sample data:
-- INSERT INTO clients (id, name, email, contact_person, phone, industry, categories, status, active_projects, total_projects, created_at, updated_at)
-- VALUES
-- (UUID(), 'Acme Corporation', 'contact@acme.com', 'John Smith', '+1-555-0100', 'Technology', JSON_ARRAY('client', 'customer'), 'active', 5, 12, NOW(), NOW()),
-- (UUID(), 'Tech Solutions Inc', 'sales@techsolutions.com', 'Jane Doe', '+1-555-0101', 'Software', JSON_ARRAY('client', 'vendor'), 'active', 3, 8, NOW(), NOW()),
-- (UUID(), 'Global Services Ltd', 'info@globalservices.com', 'Mike Johnson', '+1-555-0102', 'Consulting', JSON_ARRAY('customer'), 'active', 2, 5, NOW(), NOW());
