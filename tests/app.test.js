const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/students');

beforeEach(() => {
  store.reset();
});

describe('Gestion des erreurs globales', () => {
  test('renvoie 404 en JSON pour une route inconnue', async () => {
    const res = await request(app).get('/inconnue');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('error');
  });

  test('renvoie 400 pour un corps JSON mal formé', async () => {
    const res = await request(app)
      .post('/students')
      .set('Content-Type', 'application/json')
      .send('{"firstName": "Jean",');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('JSON invalide');
  });

  test('renvoie 400 pour une requête POST sans corps', async () => {
    const res = await request(app).post('/students');

    expect(res.status).toBe(400);
    expect(res.body.details).toHaveLength(5);
  });
});

describe('Identifiants invalides en écriture', () => {
  test('PUT renvoie 400 pour un id non numérique', async () => {
    const res = await request(app).put('/students/abc').send({});

    expect(res.status).toBe(400);
  });

  test('DELETE renvoie 400 pour un id non numérique', async () => {
    const res = await request(app).delete('/students/abc');

    expect(res.status).toBe(400);
  });
});

describe('Caractères spéciaux', () => {
  test('accepte les accents et tirets dans les noms', async () => {
    const res = await request(app).post('/students').send({
      firstName: 'Zoé',
      lastName: 'Lefèvre-Dupré',
      email: 'zoe.lefevre@example.com',
      grade: 17,
      field: 'mathématiques',
    });

    expect(res.status).toBe(201);
    expect(res.body.lastName).toBe('Lefèvre-Dupré');
  });

  test('la recherche fonctionne avec un terme accentué', async () => {
    await request(app).post('/students').send({
      firstName: 'Zoé',
      lastName: 'Lefèvre',
      email: 'zoe.lefevre@example.com',
      grade: 17,
      field: 'physique',
    });
    const res = await request(app).get(`/students/search?q=${encodeURIComponent('zoé')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
