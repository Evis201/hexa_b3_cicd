const express = require('express');
const studentsRouter = require('./routes/students');

const app = express();

app.use(express.json());

app.use('/students', studentsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  return res.status(500).json({ error: 'Erreur interne du serveur' });
});

module.exports = app;
