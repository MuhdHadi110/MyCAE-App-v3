SELECT 
  rp.id,
  rp.title,
  rp.research_code,
  rp.lead_researcher_id,
  u.name as lead_researcher_name
FROM research_projects rp
LEFT JOIN users u ON rp.lead_researcher_id = u.id
WHERE rp.research_code = 'R26001';
