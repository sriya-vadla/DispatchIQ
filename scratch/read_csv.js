const fs = require('fs');
const Papa = require('papaparse');

const csvPath = 'public/data/AI_Dispatch_Sales_Dataset.csv';
try {
  const content = fs.readFileSync(csvPath, 'utf8');
  Papa.parse(content, {
    header: true,
    complete: (results) => {
      console.log('Total Rows:', results.data.length);
      if (results.data.length > 0) {
        console.log('Headers:', Object.keys(results.data[0]));
        console.log('First Row:', results.data[0]);
      }
    }
  });
} catch (err) {
  console.error('Error reading csv:', err);
}
