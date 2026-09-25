const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/students');

const validStudent = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@example.com',
  grade: 14,
  field: 'chimie',
};

beforeEach(() => {
  store.reset();
});

describe('POST /students', () => {
  test('renvoie 201 et l\'étudiant créé avec un id', async () => {
    const res = await request(app).post('/students').send(validStudent);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 6, ...validStudent });

    const list = await request(app).get('/students');
    expect(list.body).toHaveLength(6);
  });

  test('renvoie 400 si un champ obligatoire est manquant', async () => {
    const withoutEmail = { ...validStudent };
    delete withoutEmail.email;
    const res = await request(app).post('/students').send(withoutEmail);

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('Le champ "email" est obligatoire');
  });

  test('renvoie 400 si la note est hors de [0, 20]', async () => {
    const tooHigh = await request(app).post('/students').send({ ...validStudent, grade: 25 });
    const negative = await request(app).post('/students').send({ ...validStudent, grade: -1 });

    expect(tooHigh.status).toBe(400);
    expect(negative.status).toBe(400);
  });

  test('renvoie 409 si l\'email existe déjà (insensible à la casse)', async () => {
    const res = await request(app)
      .post('/students')
      .send({ ...validStudent, email: 'AHMED.BENALI@example.com' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('renvoie 400 si le prénom fait moins de 2 caractères', async () => {
    const res = await request(app).post('/students').send({ ...validStudent, firstName: 'J' });

    expect(res.status).toBe(400);
  });

  test('renvoie 400 si l\'email est mal formé', async () => {
    const res = await request(app).post('/students').send({ ...validStudent, email: 'pas-un-email' });

    expect(res.status).toBe(400);
  });

  test('renvoie 400 si la filière n\'est pas autorisée', async () => {
    const res = await request(app).post('/students').send({ ...validStudent, field: 'biologie' });

    expect(res.status).toBe(400);
  });

  test('accepte les notes limites 0 et 20', async () => {
    const zero = await request(app)
      .post('/students')
      .send({ ...validStudent, email: 'zero@example.com', grade: 0 });
    const twenty = await request(app)
      .post('/students')
      .send({ ...validStudent, email: 'vingt@example.com', grade: 20 });

    expect(zero.status).toBe(201);
    expect(twenty.status).toBe(201);
  });
});

describe('PUT /students/:id', () => {
  test('renvoie 200 et l\'étudiant modifié', async () => {
    const res = await request(app)
      .put('/students/1')
      .send({ ...validStudent, email: 'ahmed.benali@example.com', grade: 19 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, firstName: 'Jean', grade: 19 });

    const check = await request(app).get('/students/1');
    expect(check.body.grade).toBe(19);
  });

  test('renvoie 404 pour un id inexistant', async () => {
    const res = await request(app).put('/students/999').send(validStudent);

    expect(res.status).toBe(404);
  });

  test('renvoie 400 si les données sont invalides', async () => {
    const res = await request(app).put('/students/1').send({ ...validStudent, grade: 'abc' });

    expect(res.status).toBe(400);
  });

  test('renvoie 409 si l\'email appartient à un autre étudiant', async () => {
    const res = await request(app)
      .put('/students/1')
      .send({ ...validStudent, email: 'sarah.martin@example.com' });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /students/:id', () => {
  test('renvoie 200 et supprime l\'étudiant', async () => {
    const res = await request(app).delete('/students/1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    const check = await request(app).get('/students/1');
    expect(check.status).toBe(404);
  });

  test('renvoie 404 pour un id inexistant', async () => {
    const res = await request(app).delete('/students/999');

    expect(res.status).toBe(404);
  });
});

describe('GET /students/stats', () => {
  test('renvoie totalStudents, averageGrade, studentsByField et bestStudent', async () => {
    const res = await request(app).get('/students/stats');

    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(5);
    expect(res.body.averageGrade).toBe(14.3);
    expect(res.body.studentsByField).toEqual({
      informatique: 2,
      mathématiques: 1,
      physique: 1,
      chimie: 1,
    });
    expect(res.body.bestStudent).toMatchObject({ id: 2, grade: 18 });
  });

  test('gère une liste vide sans erreur', async () => {
    for (const id of [1, 2, 3, 4, 5]) {
      await request(app).delete(`/students/${id}`);
    }
    const res = await request(app).get('/students/stats');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ totalStudents: 0, averageGrade: 0, bestStudent: null });
  });
});

describe('GET /students/search', () => {
  test('renvoie les étudiants dont le nom ou prénom contient le terme', async () => {
    const res = await request(app).get('/students/search?q=AHMED');

    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.id)).toEqual([1, 4]);
  });

  test('renvoie 400 si q est absent ou vide', async () => {
    const missing = await request(app).get('/students/search');
    const empty = await request(app).get('/students/search?q=');

    expect(missing.status).toBe(400);
    expect(empty.status).toBe(400);
  });
});
