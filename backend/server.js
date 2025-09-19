const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['https://maxenocmn.github.io', 
'http://192.168.1.4:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.post('/api/v1/analytics', (req, res) => {
  console.log('Evento recibido:', req.body);
  res.json({ success: true, message: 'Evento registrado' });
});

app.get('/api/v1/analytics', (req, res) => {
  res.json({ message: 'API activa' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto 
${PORT}`));
