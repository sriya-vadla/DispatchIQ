const fs = require('fs');
const content = fs.readFileSync('src/App.css', 'utf8');

// Let's count occurrences of some major CSS selectors
const selectors = [
  'body.light-theme',
  '.theme-toggle-btn',
  '.global-search-wrapper',
  '.journey-timeline',
  '.integration-card',
  '.forecast-kpi-grid',
  '.view-all-btn',
  'highlightPulseRed'
];

selectors.forEach(sel => {
  const regex = new RegExp(sel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  console.log(`${sel}: ${matches ? matches.length : 0} occurrences`);
});
