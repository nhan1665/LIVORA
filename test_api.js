fetch('http://localhost:5000/api/inspirations')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(e => console.error('Error:', e.message));
