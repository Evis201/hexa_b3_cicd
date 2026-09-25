const ALLOWED_FIELDS = ['informatique', 'mathématiques', 'physique', 'chimie'];

const initialStudents = [
  { id: 1, firstName: 'Ahmed', lastName: 'Benali', email: 'ahmed.benali@example.com', grade: 15.5, field: 'informatique' },
  { id: 2, firstName: 'Sarah', lastName: 'Martin', email: 'sarah.martin@example.com', grade: 18, field: 'mathématiques' },
  { id: 3, firstName: 'Lucas', lastName: 'Dubois', email: 'lucas.dubois@example.com', grade: 9.75, field: 'physique' },
  { id: 4, firstName: 'Fatima', lastName: 'Ahmedi', email: 'fatima.ahmedi@example.com', grade: 12, field: 'chimie' },
  { id: 5, firstName: 'Emma', lastName: 'Leroy', email: 'emma.leroy@example.com', grade: 16.25, field: 'informatique' },
];

let students = [];
let nextId = 1;

function reset() {
  students = initialStudents.map((s) => ({ ...s }));
  nextId = students.length + 1;
}

function getAll() {
  return students;
}

function findById(id) {
  return students.find((s) => s.id === id);
}

function findByEmail(email) {
  const target = email.toLowerCase();
  return students.find((s) => s.email.toLowerCase() === target);
}

function create(data) {
  const student = { id: nextId++, ...data };
  students.push(student);
  return student;
}

function update(id, data) {
  const student = findById(id);
  if (!student) return null;
  Object.assign(student, data, { id });
  return student;
}

function remove(id) {
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;
  return students.splice(index, 1)[0];
}

reset();

module.exports = {
  ALLOWED_FIELDS,
  reset,
  getAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
};
