# Annuaire d'étudiants — API REST

[![CI](https://github.com/Evis201/hexa_b3_dpp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Evis201/hexa_b3_dpp/actions/workflows/ci.yml)

API REST de gestion d'un annuaire d'étudiants, réalisée pour le TP « API REST + Pipeline CI/CD ».
Les données sont stockées en mémoire et réinitialisées à chaque redémarrage.

| Rôle        | Outil                        |
|-------------|------------------------------|
| Framework   | Node.js + Express 5          |
| Tests       | Jest + Supertest             |
| Linter      | ESLint (flat config)         |
| CI          | GitHub Actions (Node 22, 24) |

## Démarrage

```bash
npm install
npm start            # http://localhost:3000 (variable PORT pour changer)
npm run dev          # redémarrage automatique à chaque modification
```

## Scripts

| Commande                | Description                                   |
|-------------------------|-----------------------------------------------|
| `npm start`             | Démarre le serveur                            |
| `npm test`              | Lance les tests                               |
| `npm run test:coverage` | Lance les tests avec rapport de couverture    |
| `npm run lint`          | Analyse le code avec ESLint                   |
| `npm run lint:fix`      | Corrige automatiquement ce qui peut l'être    |

## Structure

```
.
├── .github/workflows/ci.yml   Pipeline CI (lint + tests, matrix Node 22/24)
├── src/
│   ├── app.js                 Configuration Express (exportée pour les tests)
│   ├── server.js              Démarrage du serveur
│   ├── data/students.js       Données en mémoire + reset()
│   ├── routes/students.js     Endpoints /students
│   └── validation/student.js  Règles de validation
├── tests/                     Tests Jest + Supertest
├── scripts/                   Utilitaires CI (résumé de couverture)
├── eslint.config.js
└── jest.config.js
```

## Modèle « Étudiant »

| Propriété   | Type    | Contraintes                                                      |
|-------------|---------|------------------------------------------------------------------|
| `id`        | entier  | Auto-généré, unique                                              |
| `firstName` | string  | Obligatoire, 2 caractères minimum                                |
| `lastName`  | string  | Obligatoire, 2 caractères minimum                                |
| `email`     | string  | Obligatoire, format valide, unique (insensible à la casse)       |
| `grade`     | nombre  | Obligatoire, entre 0 et 20                                       |
| `field`     | string  | `informatique`, `mathématiques`, `physique` ou `chimie`          |

## Endpoints

Toutes les réponses sont au format JSON. Les erreurs ont la forme `{ "error": "..." }`,
avec un tableau `details` supplémentaire pour les erreurs de validation.

| Méthode  | Route                    | Succès | Erreurs            |
|----------|--------------------------|--------|--------------------|
| `GET`    | `/students`              | 200    | 400 (paramètres)   |
| `GET`    | `/students/:id`          | 200    | 400, 404           |
| `POST`   | `/students`              | 201    | 400, 409           |
| `PUT`    | `/students/:id`          | 200    | 400, 404, 409      |
| `DELETE` | `/students/:id`          | 200    | 400, 404           |
| `GET`    | `/students/stats`        | 200    | —                  |
| `GET`    | `/students/search?q=...` | 200    | 400                |

### `GET /students`

Liste des étudiants. Paramètres optionnels :

- `sort` : `id`, `firstName`, `lastName`, `email`, `grade` ou `field`
- `order` : `asc` (défaut) ou `desc`
- `page` / `limit` : pagination (défauts `1` / `10`) ; le total est renvoyé dans l'en-tête `X-Total-Count`

```bash
curl "http://localhost:3000/students?sort=grade&order=desc&page=1&limit=2"
```

```json
[
  { "id": 2, "firstName": "Sarah", "lastName": "Martin", "email": "sarah.martin@example.com", "grade": 18, "field": "mathématiques" },
  { "id": 5, "firstName": "Emma", "lastName": "Leroy", "email": "emma.leroy@example.com", "grade": 16.25, "field": "informatique" }
]
```

### `GET /students/:id`

```bash
curl http://localhost:3000/students/1
```

```json
{ "id": 1, "firstName": "Ahmed", "lastName": "Benali", "email": "ahmed.benali@example.com", "grade": 15.5, "field": "informatique" }
```

`404` si l'id n'existe pas, `400` si l'id n'est pas un entier positif (`/students/abc`).

### `POST /students`

```bash
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jean","lastName":"Dupont","email":"jean.dupont@example.com","grade":14,"field":"chimie"}'
```

```json
{ "id": 6, "firstName": "Jean", "lastName": "Dupont", "email": "jean.dupont@example.com", "grade": 14, "field": "chimie" }
```

Erreur de validation (`400`) :

```json
{ "error": "Données invalides", "details": ["grade doit être un nombre entre 0 et 20"] }
```

Email déjà utilisé (`409`) :

```json
{ "error": "Cet email est déjà utilisé" }
```

### `PUT /students/:id`

Remplace toutes les données de l'étudiant (mêmes règles que `POST`).

```bash
curl -X PUT http://localhost:3000/students/1 \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ahmed","lastName":"Benali","email":"ahmed.benali@example.com","grade":19,"field":"informatique"}'
```

`409` si l'email appartient à un autre étudiant ; conserver son propre email est autorisé.

### `DELETE /students/:id`

```bash
curl -X DELETE http://localhost:3000/students/1
```

```json
{ "message": "Étudiant 1 supprimé", "student": { "id": 1, "firstName": "Ahmed", "...": "..." } }
```

### `GET /students/stats`

```bash
curl http://localhost:3000/students/stats
```

```json
{
  "totalStudents": 5,
  "averageGrade": 14.3,
  "studentsByField": { "informatique": 2, "mathématiques": 1, "physique": 1, "chimie": 1 },
  "bestStudent": { "id": 2, "firstName": "Sarah", "lastName": "Martin", "email": "sarah.martin@example.com", "grade": 18, "field": "mathématiques" }
}
```

### `GET /students/search?q=...`

Recherche insensible à la casse dans le prénom et le nom.

```bash
curl "http://localhost:3000/students/search?q=ahmed"
```

```json
[
  { "id": 1, "firstName": "Ahmed", "lastName": "Benali", "...": "..." },
  { "id": 4, "firstName": "Fatima", "lastName": "Ahmedi", "...": "..." }
]
```

`400` si `q` est absent ou vide.

## Intégration continue

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se déclenche à chaque `push` et `pull_request` vers `main`,
sur Node.js 22.x et 24.x :

**Checkout → Setup Node → Install (`npm ci`) → Lint → Tests avec couverture → Résumé de couverture**

Le pipeline échoue si le linter remonte une erreur, si un test échoue ou si la couverture passe sous les seuils
définis dans `jest.config.js`.
