// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./assets.db');

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Criar tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    categoria TEXT,
    localizacao TEXT,
    status TEXT,
    dataAquisicao TEXT,
    valorAquisicao REAL,
    responsavel TEXT,
    observacoes TEXT
  )
`);

// Endpoints
app.get('/assets', (req, res) => {
  db.all("SELECT * FROM assets", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/assets', (req, res) => {
  const { nome, categoria, localizacao, status, dataAquisicao, valorAquisicao, responsavel, observacoes } = req.body;
  db.run(`
    INSERT INTO assets (nome, categoria, localizacao, status, dataAquisicao, valorAquisicao, responsavel, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, categoria, localizacao, status, dataAquisicao, valorAquisicao, responsavel, observacoes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/assets/:id', (req, res) => {
  const { id } = req.params;
  const { nome, categoria, localizacao, status, dataAquisicao, valorAquisicao, responsavel, observacoes } = req.body;

  db.run(`
    UPDATE assets SET 
      nome = ?, categoria = ?, localizacao = ?, status = ?, 
      dataAquisicao = ?, valorAquisicao = ?, responsavel = ?, observacoes = ?
    WHERE id = ?`,
    [nome, categoria, localizacao, status, dataAquisicao, valorAquisicao, responsavel, observacoes, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
