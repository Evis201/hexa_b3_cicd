const { ALLOWED_FIELDS } = require('../data/students');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED = ['firstName', 'lastName', 'email', 'grade', 'field'];

function isMissing(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function validateStudent(body) {
  const errors = [];
  const data = body && typeof body === 'object' ? body : {};

  for (const key of REQUIRED) {
    if (isMissing(data[key])) {
      errors.push(`Le champ "${key}" est obligatoire`);
    }
  }
  if (errors.length > 0) {
    return { errors };
  }

  const { firstName, lastName, email, grade, field } = data;

  if (typeof firstName !== 'string' || firstName.trim().length < 2) {
    errors.push('firstName doit contenir au moins 2 caractères');
  }
  if (typeof lastName !== 'string' || lastName.trim().length < 2) {
    errors.push('lastName doit contenir au moins 2 caractères');
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('email doit être une adresse valide');
  }
  if (typeof grade !== 'number' || !Number.isFinite(grade) || grade < 0 || grade > 20) {
    errors.push('grade doit être un nombre entre 0 et 20');
  }
  if (!ALLOWED_FIELDS.includes(field)) {
    errors.push(`field doit être l'une des valeurs : ${ALLOWED_FIELDS.join(', ')}`);
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors,
    value: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      grade,
      field,
    },
  };
}

module.exports = { validateStudent };
