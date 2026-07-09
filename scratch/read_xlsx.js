const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\Sriya\\Downloads\\DispatchIQ_Test_Dataset_600_Orders.xlsx';
try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  console.log('Sheet Name:', sheetName);
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  console.log('Total Rows:', jsonData.length);
  if (jsonData.length > 0) {
    console.log('Headers (Keys of first row):', Object.keys(jsonData[0]));
    console.log('First Row details:');
    console.log(JSON.stringify(jsonData[0], null, 2));
    console.log('Second Row details:');
    console.log(JSON.stringify(jsonData[1], null, 2));
  } else {
    console.log('No rows found in the sheet.');
  }
} catch (err) {
  console.error('Error reading file:', err);
}
