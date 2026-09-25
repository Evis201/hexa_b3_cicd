const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
const { total } = JSON.parse(fs.readFileSync(file, 'utf8'));

const rows = ['statements', 'branches', 'functions', 'lines'].map((metric) => {
  const { covered, total: count, pct } = total[metric];
  return `| ${metric} | ${pct}% | ${covered}/${count} |`;
});

const title = process.argv[2] || 'Couverture de code';
process.stdout.write([`### ${title}`, '', '| Métrique | % | Couvert |', '|---|---|---|', ...rows, ''].join('\n'));
