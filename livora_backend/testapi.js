fetch('http://localhost:5000/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ employeeCode: 'NV2709', password: 'livora@2026' }),
})
  .then(r => r.json())
  .then(d => console.log('Login result:', JSON.stringify(d, null, 2)))
  .catch(e => console.error('Error:', e.message));

