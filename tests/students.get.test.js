const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/students');

beforeEach(() => {
  store.reset();
});

describe('GET /students', () => {
  test('renvoie 200 et un tableau', async () => {
    const res = await request(app).get('/students');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('renvoie tous les étudiants initiaux', async () => {
    const res = await request(app).get('/students');

    expect(res.body).toHaveLength(5);
    expect(res.body.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
    expect(res.body[0]).toEqual({
      id: 1,
      firstName: 'Ahmed',
      lastName: 'Benali',
      email: 'ahmed.benali@example.com',
      grade: 15.5,
      field: 'informatique',
    });
  });
});

describe('GET /students/:id', () => {
  test('renvoie 200 et l\'étudiant correspondant à un id valide', async () => {
    const res = await request(app).get('/students/2');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(2);
    expect(res.body.firstName).toBe('Sarah');
    expect(res.body.email).toBe('sarah.martin@example.com');
  });

  test('renvoie 404 pour un id inexistant', async () => {
    const res = await request(app).get('/students/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('renvoie 400 pour un id non numérique', async () => {
    const res = await request(app).get('/students/abc');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('renvoie 400 pour un id décimal ou négatif', async () => {
    const decimal = await request(app).get('/students/1.5');
    const negative = await request(app).get('/students/-1');

    expect(decimal.status).toBe(400);
    expect(negative.status).toBe(400);
  });
});
