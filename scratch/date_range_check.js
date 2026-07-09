const XLSX = require('xlsx');
const { parseCSVDate } = require('../src/utils/delayHelpers');

const filePath = 'C:\\Users\\Sriya\\Downloads\\DispatchIQ_Test_Dataset_600_Orders.xlsx';
try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  let minOrdered = null;
  let maxOrdered = null;
  let minExpected = null;
  let maxExpected = null;

  jsonData.forEach(row => {
    const ordered = parseCSVDate(row.Order_Date);
    const expected = parseCSVDate(row.Expected_Date);

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

} catch (err) {
  console.error('Error:', err);
}
