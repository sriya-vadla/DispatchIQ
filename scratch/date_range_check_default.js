const fs = require('fs');
const Papa = require('papaparse');
const { parseCSVDate } = require('../src/utils/delayHelpers');

const csvPath = 'public/data/AI_Dispatch_Sales_Dataset.csv';
try {
  const content = fs.readFileSync(csvPath, 'utf8');
  Papa.parse(content, {
    header: true,
    complete: (results) => {
      let minOrdered = null;
      let maxOrdered = null;
      let minExpected = null;
      let maxExpected = null;

      results.data.forEach(row => {
        const ordered = parseCSVDate(row.OrderedDate);
        const expected = parseCSVDate(row.ExpectedDeliveryDate);

        if (ordered && !isNaN(ordered.getTime())) {
          if (!minOrdered || ordered < minOrdered) minOrdered = ordered;
          if (!maxOrdered || ordered > maxOrdered) maxOrdered = ordered;
        }

        if (expected && !isNaN(expected.getTime())) {
          if (!minExpected || expected < minExpected) minExpected = expected;
          if (!maxExpected || expected > maxExpected) maxExpected = expected;
        }
      });

      console.log('Ordered Date Range:', minOrdered ? minOrdered.toDateString() : 'N/A', 'to', maxOrdered ? maxOrdered.toDateString() : 'N/A');
      console.log('Expected Date Range:', minExpected ? minExpected.toDateString() : 'N/A', 'to', maxExpected ? maxExpected.toDateString() : 'N/A');
    }
  });
} catch (err) {
  console.error('Error:', err);
}
