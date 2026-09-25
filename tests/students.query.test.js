const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/students');

beforeEach(() => {
  store.reset();
});

describe('GET /students — tri', () => {
  test('trie par note décroissante', async () => {
    const res = await request(app).get('/students?sort=grade&order=desc');

    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.grade)).toEqual([18, 16.25, 15.5, 12, 9.75]);
  });

  test('trie par nom croissant par défaut', async () => {
    const res = await request(app).get('/students?sort=lastName');

    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.lastName)).toEqual(['Ahmedi', 'Benali', 'Dubois', 'Leroy', 'Martin']);
  });

  test('renvoie 400 pour un champ de tri ou un ordre invalide', async () => {
    const badSort = await request(app).get('/students?sort=age');
    const badOrder = await request(app).get('/students?sort=grade&order=up');

    expect(badSort.status).toBe(400);
    expect(badOrder.status).toBe(400);
  });
});

describe('GET /students — pagination', () => {
  test('renvoie la page demandée et le total dans X-Total-Count', async () => {
    const res = await request(app).get('/students?page=2&limit=2');

    expect(res.status).toBe(200);
    expect(res.headers['x-total-count']).toBe('5');
    expect(res.body.map((s) => s.id)).toEqual([3, 4]);
  });

  test('renvoie un tableau vide au-delà de la dernière page', async () => {
    const res = await request(app).get('/students?page=10&limit=2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('combine tri et pagination', async () => {
    const res = await request(app).get('/students?sort=grade&order=desc&page=1&limit=3');

    expect(res.body.map((s) => s.id)).toEqual([2, 5, 1]);
  });

  test('renvoie 400 pour page ou limit invalide', async () => {
    const zero = await request(app).get('/students?page=0');
    const text = await request(app).get('/students?limit=abc');

    expect(zero.status).toBe(400);
    expect(text.status).toBe(400);
  });
});
