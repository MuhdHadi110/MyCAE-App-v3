-- Check if invoice exists in database
SELECT
    id,
    invoice_number,
    project_code,
    status,
    company_id,
    created_at
FROM invoices
WHERE id = '8620f7b3-c88b-4698-b25c-f5b5cfd6e306';

-- If nothing returned, check recent invoices
SELECT
    id,
    invoice_number,
    project_code,
    status,
    company_id,
    created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any invoices with partial ID match
SELECT
    id,
    invoice_number,
    project_code,
    status
FROM invoices
WHERE id LIKE '%8620f7b3%';
