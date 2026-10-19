fetch('http://localhost:5000/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ employeeCode: 'ADMIN_LIVORA', password: 'sai_mat_khau_ne' }),
})
  .then(r => r.json().then(data => ({ status: r.status, data })))
  .then(d => console.log('Login test wrong password result:', JSON.stringify(d, null, 2)))
  .catch(e => console.error('Error:', e.message));
