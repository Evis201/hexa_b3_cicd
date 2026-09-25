const express = require('express');
const store = require('../data/students');
const { validateStudent } = require('../validation/student');

const router = express.Router();

function parseId(raw) {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

const SORTABLE_KEYS = ['id', 'firstName', 'lastName', 'email', 'grade', 'field'];

function parsePositiveInt(raw) {
  return /^[1-9]\d*$/.test(raw) ? Number(raw) : null;
}

function compareBy(key) {
  return (a, b) => {
    if (typeof a[key] === 'number') return a[key] - b[key];
    return a[key].localeCompare(b[key], 'fr', { sensitivity: 'base' });
  };
}

router.get('/', (req, res) => {
  const { sort, order = 'asc', page, limit } = req.query;
  let students = [...store.getAll()];

  if (sort !== undefined) {
    if (!SORTABLE_KEYS.includes(sort)) {
      return res.status(400).json({ error: `sort doit être l'une des valeurs : ${SORTABLE_KEYS.join(', ')}` });
    }
    if (order !== 'asc' && order !== 'desc') {
      return res.status(400).json({ error: 'order doit valoir "asc" ou "desc"' });
    }
    students.sort(compareBy(sort));
    if (order === 'desc') students.reverse();
  }

  res.set('X-Total-Count', String(students.length));

  if (page !== undefined || limit !== undefined) {
    const pageNum = page === undefined ? 1 : parsePositiveInt(page);
    const limitNum = limit === undefined ? 10 : parsePositiveInt(limit);
    if (pageNum === null || limitNum === null) {
      return res.status(400).json({ error: 'page et limit doivent être des entiers positifs' });
    }
    const start = (pageNum - 1) * limitNum;
    students = students.slice(start, start + limitNum);
  }

  return res.status(200).json(students);
});

router.get('/stats', (req, res) => {
  const students = store.getAll();
  const total = students.length;

  const studentsByField = Object.fromEntries(store.ALLOWED_FIELDS.map((f) => [f, 0]));
  for (const s of students) {
    studentsByField[s.field] += 1;
  }

  const sum = students.reduce((acc, s) => acc + s.grade, 0);
  const averageGrade = total === 0 ? 0 : Math.round((sum / total) * 100) / 100;

  const bestStudent = students.reduce(
    (best, s) => (best === null || s.grade > best.grade ? s : best),
    null,
  );

  res.status(200).json({ totalStudents: total, averageGrade, studentsByField, bestStudent });
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (typeof q !== 'string' || q.trim() === '') {
    return res.status(400).json({ error: 'Le paramètre "q" est obligatoire' });
  }
  const term = q.trim().toLowerCase();
  const results = store.getAll().filter(
    (s) => s.firstName.toLowerCase().includes(term) || s.lastName.toLowerCase().includes(term),
  );
  return res.status(200).json(results);
});

router.get('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  const student = store.findById(id);
  if (!student) {
    return res.status(404).json({ error: 'Étudiant introuvable' });
  }
  return res.status(200).json(student);
});

router.post('/', (req, res) => {
  const { errors, value } = validateStudent(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Données invalides', details: errors });
  }
  if (store.findByEmail(value.email)) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }
  const student = store.create(value);
  return res.status(201).json(student);
});

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  if (!store.findById(id)) {
    return res.status(404).json({ error: 'Étudiant introuvable' });
  }
  const { errors, value } = validateStudent(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Données invalides', details: errors });
  }
  const owner = store.findByEmail(value.email);
  if (owner && owner.id !== id) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }
  const student = store.update(id, value);
  return res.status(200).json(student);
});

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  const student = store.remove(id);
  if (!student) {
    return res.status(404).json({ error: 'Étudiant introuvable' });
  }
  return res.status(200).json({ message: `Étudiant ${id} supprimé`, student });
});

module.exports = router;
