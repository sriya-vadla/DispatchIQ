const XLSX = require('xlsx');
const { isActionableDelay, getDelayDays, isActive, isDelayed, refDate, parseCSVDate } = require('../src/utils/delayHelpers');

const filePath = 'C:\\Users\\Sriya\\Downloads\\DispatchIQ_Test_Dataset_600_Orders.xlsx';
try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  
  console.log('Reference Date:', refDate.toDateString());
  console.log('Total Rows:', jsonData.length);

  let activeCount = 0;
  let delayedCount = 0;
  let actionableDelayCount = 0;
  let statusCounts = {};

  const cleanOrders = jsonData.map((row) => {
    // Basic normalized mapping
    return {
      OrderID: row.Order_ID || "",
      Customer: row.Customer_Name || "",
      Product: row.Product || "",
      Category: row.Category || "",
      Quantity: "1",
      OrderedDate: row.Order_Date || "",
      DispatchDate: row.Actual_Delivery_Date || row.Order_Date || "",
      ExpectedDeliveryDate: row.Expected_Date || "",
      OrderValue: String(row.Order_Value || 0),
      Priority: row.Escalation_Risk || "Medium",
      Status: row.Delivery_Status || "",
      Courier: row.Courier_Partner || "Self-Shipped",
    };
  });

  cleanOrders.forEach((o, i) => {
    const status = o.Status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (isActive(o)) activeCount++;
    if (isDelayed(o)) delayedCount++;
    if (isActionableDelay(o)) actionableDelayCount++;
  });

  console.log('Status Counts:', statusCounts);
  console.log('Active orders:', activeCount);
  console.log('Delayed orders:', delayedCount);
  console.log('Actionable delay orders:', actionableDelayCount);

  // Let's inspect some of the active orders
  const activeOrders = cleanOrders.filter(isActive);
  console.log('\nSample Active Order dates:');
  activeOrders.slice(0, 5).forEach(o => {
    const expDate = parseCSVDate(o.ExpectedDeliveryDate);
    const diffTime = refDate - expDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(`OrderID: ${o.OrderID}, Expected: ${o.ExpectedDeliveryDate} (${expDate ? expDate.toDateString() : 'Invalid'}), Diff Days: ${diffDays}`);
  });

} catch (err) {
  console.error('Error:', err);
}
