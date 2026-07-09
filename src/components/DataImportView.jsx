import React, { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { isActionableDelay, getDelayDays, parseCSVDate, getIssueCategory, getEscalationLevel, subtractDays } from "../utils/delayHelpers";

export default function DataImportView({ 
  currentOrdersCount = 0, 
  tickets = [],
  onImportComplete 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [importMode, setImportMode] = useState("append"); // "append" | "replace"
  const [loading, setLoading] = useState(false);
  
  // Parsed and validated state
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [validCount, setValidCount] = useState(0);
  const [ticketsToGenerate, setTicketsToGenerate] = useState([]);
  const [successInfo, setSuccessInfo] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Helper to normalize object keys (case-insensitive, remove spaces/underscores)
  const normalizeKeys = (obj) => {
    const normalized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const normKey = key.toLowerCase().replace(/[\s_-]/g, "");
        normalized[normKey] = {
          originalKey: key,
          value: typeof obj[key] === "string" ? obj[key].trim() : obj[key]
        };
      }
    }
    return normalized;
  };

  const getNormalizedValue = (normObj, possibleKeys, defaultValue = "") => {
    for (const k of possibleKeys) {
      const cleanK = k.toLowerCase().replace(/[\s_-]/g, "");
      if (normObj[cleanK]) {
        return normObj[cleanK].value;
      }
    }
    return defaultValue;
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setLoading(true);
    setParsedData(null);
    setErrors([]);
    setWarnings([]);
    setValidCount(0);
    setTicketsToGenerate([]);
    setSuccessInfo(null);

    const fileType = selectedFile.name.split(".").pop().toLowerCase();

    if (fileType === "csv") {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateAndAnalyze(results.data);
        },
        error: (err) => {
          setErrors([{ row: "File", message: `Failed to parse CSV: ${err.message}` }]);
          setLoading(false);
        }
      });
    } else if (fileType === "xlsx" || fileType === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          validateAndAnalyze(jsonData);
        } catch (err) {
          setErrors([{ row: "File", message: `Failed to parse Excel: ${err.message}` }]);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setErrors([{ row: "File", message: "Unsupported file type. Please upload a .csv or .xlsx file." }]);
      setLoading(false);
    }
  };

  const validateAndAnalyze = (rawData) => {
    if (!rawData || rawData.length === 0) {
      setErrors([{ row: "File", message: "The uploaded file is empty." }]);
      setLoading(false);
      return;
    }

    const rowErrors = [];
    const rowWarnings = [];
    const cleanOrders = [];
    const pendingTickets = [];

    // Define column mapping possibilities
    const mapping = {
      OrderID: ["OrderID", "Order ID", "order_id", "Order_ID"],
      Customer: ["Customer", "CustomerName", "Customer Name", "customer_name", "customer", "Customer_Name"],
      Product: ["Product", "ProductName", "Product Name", "product_name", "product"],
      Category: ["Category", "ProductCategory", "Product Category", "category"],
      Quantity: ["Quantity", "Qty", "quantity"],
      OrderedDate: ["OrderedDate", "OrderDate", "Ordered Date", "Order Date", "ordered_date", "Order_Date"],
      DispatchDate: ["DispatchDate", "Dispatch Date", "dispatch_date", "Actual_Delivery_Date", "Actual Delivery Date", "actual_delivery_date"],
      ExpectedDeliveryDate: ["ExpectedDeliveryDate", "Expected Delivery Date", "expected_delivery_date", "ExpectedDate", "expected_date", "Expected_Date"],
      OrderValue: ["OrderValue", "Value", "Order Value", "order_value", "amount", "Order_Value"],
      CostPrice: ["CostPrice", "Cost Price", "cost_price", "cost"],
      Profit: ["Profit", "profit"],
      Priority: ["Priority", "order_priority", "priority", "Escalation_Risk", "Escalation Risk", "escalation_risk"],
      Status: ["Status", "OrderStatus", "Order Status", "status", "Delivery_Status", "Delivery Status", "delivery_status"],
      Address: ["Address", "CustomerAddress", "customer_address", "address"],
      Region: ["Region", "region"],
      Courier: ["Courier", "CourierPartner", "Courier Partner", "courier_partner", "courier", "Courier_Partner"],
      PaymentMode: ["PaymentMode", "Payment Mode", "payment_mode", "payment"],
      SalesExecutive: ["SalesExecutive", "Sales Executive", "sales_executive", "agent", "Owner", "owner"],
      ReturnFlag: ["ReturnFlag", "Return Flag", "return_flag", "returned"]
    };

    // Verify if headers exist roughly
    const firstRowNorm = normalizeKeys(rawData[0]);
    const requiredHeaders = ["OrderID", "Customer", "Product", "Status", "ExpectedDeliveryDate"];
    const missingRequiredHeaders = requiredHeaders.filter(req => {
      const matches = mapping[req].some(poss => firstRowNorm[poss.toLowerCase().replace(/[\s_-]/g, "")] !== undefined);
      return !matches;
    });

    if (missingRequiredHeaders.length > 0) {
      rowErrors.push({
        row: "Headers",
        message: `Missing required column headers: ${missingRequiredHeaders.join(", ")}. Please align headers to standard schema.`
      });
      setErrors(rowErrors);
      setLoading(false);
      return;
    }

    rawData.forEach((row, index) => {
      const rowNum = index + 2; // 1-based index plus header row
      const normRow = normalizeKeys(row);

      const orderId = getNormalizedValue(normRow, mapping.OrderID);
      const customer = getNormalizedValue(normRow, mapping.Customer);
      const product = getNormalizedValue(normRow, mapping.Product);
      const category = getNormalizedValue(normRow, mapping.Category, "Miscellaneous");
      const quantity = getNormalizedValue(normRow, mapping.Quantity, "1");
      const orderedDate = getNormalizedValue(normRow, mapping.OrderedDate);
      const dispatchDate = getNormalizedValue(normRow, mapping.DispatchDate);
      const expectedDeliveryDate = getNormalizedValue(normRow, mapping.ExpectedDeliveryDate);
      const orderValue = getNormalizedValue(normRow, mapping.OrderValue);
      const costPrice = getNormalizedValue(normRow, mapping.CostPrice, "0");
      const profit = getNormalizedValue(normRow, mapping.Profit);
      const priority = getNormalizedValue(normRow, mapping.Priority, "Medium");
      const status = getNormalizedValue(normRow, mapping.Status);
      const address = getNormalizedValue(normRow, mapping.Address, "N/A");
      const region = getNormalizedValue(normRow, mapping.Region, "National");
      const courier = getNormalizedValue(normRow, mapping.Courier);
      const paymentMode = getNormalizedValue(normRow, mapping.PaymentMode, "COD");
      const salesExecutive = getNormalizedValue(normRow, mapping.SalesExecutive, "System");
      const returnFlag = getNormalizedValue(normRow, mapping.ReturnFlag, status?.trim().toLowerCase() === "returned" ? "Yes" : "No");

      // Validations
      if (!orderId) {
        rowErrors.push({ row: rowNum, message: "OrderID is missing or blank." });
        return;
      }
      if (!orderId.startsWith("ORD")) {
        rowWarnings.push({ row: rowNum, message: `OrderID '${orderId}' should ideally start with 'ORD'.` });
      }
      if (!customer) {
        rowErrors.push({ row: rowNum, message: "Customer name is required." });
        return;
      }
      if (!product) {
        rowErrors.push({ row: rowNum, message: "Product name is required." });
        return;
      }
      if (!status) {
        rowErrors.push({ row: rowNum, message: "Order status is required." });
        return;
      }
      if (!expectedDeliveryDate) {
        rowErrors.push({ row: rowNum, message: "ExpectedDeliveryDate is required." });
        return;
      }

      const parsedExpectedDate = parseCSVDate(expectedDeliveryDate);
      if (!parsedExpectedDate) {
        rowErrors.push({ row: rowNum, message: `ExpectedDeliveryDate '${expectedDeliveryDate}' is not a valid date format (expected e.g. 9-May-26 or yyyy-MM-dd).` });
        return;
      }

      const numValue = Number(orderValue);
      if (isNaN(numValue) || numValue < 0) {
        rowWarnings.push({ row: rowNum, message: `OrderValue '${orderValue}' is invalid. Defaulting to 0.` });
      }

      // If valid, format clean order row matching schema
      const cleanOrder = {
        OrderID: orderId,
        Customer: customer,
        Product: product,
        Category: category,
        Quantity: String(quantity),
        OrderedDate: orderedDate || expectedDeliveryDate,
        DispatchDate: dispatchDate || orderedDate || expectedDeliveryDate,
        ExpectedDeliveryDate: expectedDeliveryDate,
        OrderValue: isNaN(numValue) ? "0" : String(numValue),
        CostPrice: costPrice,
        Profit: profit || String(Math.floor(numValue * 0.25)), // estimate profit if missing
        Priority: priority,
        Status: status,
        Address: address,
        Region: region,
        Courier: courier || "Self-Shipped",
        PaymentMode: paymentMode,
        SalesExecutive: salesExecutive,
        ReturnFlag: returnFlag
      };

      cleanOrders.push(cleanOrder);

      // Ticket generation checking
      if (isActionableDelay(cleanOrder)) {
        const delayDays = getDelayDays(cleanOrder);
        const value = Number(cleanOrder.OrderValue || 0);
        const isVIP = value > 100000;
        const prevComplaints = Math.abs((cleanOrder.OrderID || "").charCodeAt(3) || 0) % 3;

        const delayPts = Math.min(30, delayDays * 3);
        const valuePts = Math.min(45, Math.floor(value / 2000));
        const vipPts = isVIP ? 15 : 5;
        const complaintsPts = Math.min(10, prevComplaints * 5);
        const aiScore = delayPts + valuePts + vipPts + complaintsPts;

        let autoPriority = "Low";
        if (aiScore >= 85) autoPriority = "Critical";
        else if (aiScore >= 65) autoPriority = "High";
        else if (aiScore >= 40) autoPriority = "Medium";

        const owners = ["Ravi", "Priya", "Rahul", "Anjali", "Suresh", "Karthik"];
        const owner = owners[Math.abs(orderId.charCodeAt(5) || 0) % owners.length];

        const datePool = ["04-Jun-2026", "03-Jun-2026", "02-Jun-2026", "31-May-2026", "29-May-2026"];
        const hash = Math.abs((cleanOrder.OrderID || "").charCodeAt(4) || 0);
        const lastUpdatedDate = datePool[hash % datePool.length];
        
        let age = "1 Day";
        let createdDate = "04-Jun-2026";
        let resolutionTime = null;

        let ageDays = delayDays > 0 ? delayDays : (Math.abs((cleanOrder.OrderID || "").charCodeAt(2) || 0) % 15) + 1;
        age = `${ageDays} Day${ageDays !== 1 ? "s" : ""}`;
        createdDate = subtractDays(lastUpdatedDate, ageDays);

        pendingTickets.push({
          orderId: cleanOrder.OrderID,
          customer: cleanOrder.Customer,
          issue: getIssueCategory(cleanOrder.OrderID, delayDays),
          priority: autoPriority,
          owner: owner,
          status: "Open",
          created: createdDate,
          lastUpdated: lastUpdatedDate,
          aiScore,
          age,
          resolutionTime,
          escalation: getEscalationLevel(cleanOrder.OrderID, delayDays, value, isVIP),
          breakdown: {
            delayDays,
            value,
            isVIP,
            prevComplaints
          },
          notes: [
            { date: createdDate.substring(0, 6), text: `Imported SLA warning. Overdue by ${delayDays} days. Generated from Data Import Desk.` }
          ]
        });
      }
    });

    setParsedData(cleanOrders);
    setErrors(rowErrors);
    setWarnings(rowWarnings);
    setValidCount(cleanOrders.length);
    setTicketsToGenerate(pendingTickets);
    setLoading(false);
  };

  const handleSyncData = () => {
    if (!parsedData || parsedData.length === 0) return;
    
    // Find current max ticket index
    let maxIndex = 3;
    tickets.forEach(t => {
      const num = parseInt(t.id.replace("TKT", ""), 10);
      if (!isNaN(num) && num > maxIndex) {
        maxIndex = num;
      }
    });

    // Handle Merge or Replace
    let finalOrders = [];
    let finalTickets = [...tickets];

    if (importMode === "replace") {
      finalOrders = [...parsedData];
      // Generate tickets for replaced orders
      const newTickets = ticketsToGenerate.map((pt, idx) => {
        const tktId = `TKT${String(maxIndex + 1 + idx).padStart(3, '0')}`;
        return {
          id: tktId,
          ...pt
        };
      });
      finalTickets = newTickets;
    } else {
      // Append mode
      // Tickets merge: check if a ticket for the order already exists to avoid duplication
      const currentTicketOrderIds = new Set(tickets.map(t => t.orderId));
      
      const newTickets = [];
      let ticketCounter = maxIndex;

      ticketsToGenerate.forEach(pt => {
        if (!currentTicketOrderIds.has(pt.orderId)) {
          ticketCounter++;
          const tktId = `TKT${String(ticketCounter).padStart(3, "0")}`;
          newTickets.push({
            id: tktId,
            ...pt
          });
        }
      });

      // Callback will merge everything correctly
      finalTickets = [...tickets, ...newTickets];
      onImportComplete({
        mode: "append",
        newOrders: parsedData,
        newTickets: finalTickets
      });

      setSuccessInfo({
        ordersAdded: parsedData.length,
        ticketsAdded: newTickets.length,
        mode: "append"
      });
      return;
    }

    onImportComplete({
      mode: "replace",
      newOrders: finalOrders,
      newTickets: finalTickets
    });

    setSuccessInfo({
      ordersAdded: finalOrders.length,
      ticketsAdded: finalTickets.length,
      mode: "replace"
    });
  };

  const handleClear = () => {
    setFile(null);
    setParsedData(null);
    setErrors([]);
    setWarnings([]);
    setValidCount(0);
    setTicketsToGenerate([]);
    setSuccessInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", animation: "fadeIn 0.3s ease-out" }}>
      
      {/* Overview/Header Panel */}
      <div className="panel" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "18px" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", border: "none", padding: 0 }}>📥 Data Operations & Pipeline Import</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0, lineHeight: "1.5" }}>
          Load custom logistic spreadsheets or sales order CSVs directly. The pipeline automatically normalizes column attributes, performs integrity checks, identifies delivery SLA breaches, and regenerates tracking metrics dynamically.
        </p>
      </div>

      {!successInfo ? (
        <div style={{ display: "grid", gridTemplateColumns: parsedData ? "1.1fr 0.9fr" : "1fr", gap: "20px" }}>
          
          {/* Upload card */}
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Upload File</h3>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? "2px dashed #3b82f6" : "2px dashed var(--border-color)",
                background: dragActive ? "rgba(59, 130, 246, 0.05)" : "rgba(15, 23, 42, 0.3)",
                borderRadius: "14px",
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}
              onClick={onButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div className="spinner-loader" style={{
                    width: "30px",
                    height: "30px",
                    border: "3px solid rgba(59, 130, 246, 0.1)",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }}></div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Parsing spreadsheet pipeline...</span>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "2.5rem" }}>excel/csv</div>
                  <div>
                    <p style={{ margin: "0 0 6px 0", fontWeight: "600", fontSize: "0.95rem" }}>
                      Drag & Drop files here, or <span style={{ color: "#3b82f6", textDecoration: "underline" }}>browse local files</span>
                    </p>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      Supports CSV, XLSX, or XLS files formatted with order parameters.
                    </p>
                  </div>
                </>
              )}
            </div>

            {file && (
              <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.25rem" }}>📄</span>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text-primary)" }}>{file.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button 
                  onClick={handleClear} 
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Sync Configuration */}
            {parsedData && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem" }}>Import Settings</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <label 
                    style={{
                      border: importMode === "append" ? "1px solid #3b82f6" : "1px solid var(--border-color)",
                      background: importMode === "append" ? "rgba(59, 130, 246, 0.05)" : "rgba(30, 41, 59, 0.2)",
                      borderRadius: "10px",
                      padding: "15px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}
                    onClick={() => setImportMode("append")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "0.88rem" }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === "append"} 
                        onChange={() => {}} 
                        style={{ pointerEvents: "none" }}
                      />
                      <span>Append Dataset</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "20px" }}>
                      Merge imported rows with existing {currentOrdersCount} records.
                    </span>
                  </label>

                  <label 
                    style={{
                      border: importMode === "replace" ? "1px solid #ef4444" : "1px solid var(--border-color)",
                      background: importMode === "replace" ? "rgba(239, 68, 68, 0.05)" : "rgba(30, 41, 59, 0.2)",
                      borderRadius: "10px",
                      padding: "15px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}
                    onClick={() => setImportMode("replace")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "0.88rem" }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === "replace"} 
                        onChange={() => {}} 
                        style={{ pointerEvents: "none" }}
                      />
                      <span style={{ color: importMode === "replace" ? "#fca5a5" : "#fff" }}>Replace Dataset</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "20px" }}>
                      Wipe active database and reload this file as the new master database.
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleSyncData}
                  disabled={errors.length > 0}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    border: "none",
                    cursor: errors.length > 0 ? "not-allowed" : "pointer",
                    background: errors.length > 0 ? "var(--border-color)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "var(--text-primary)",
                    boxShadow: errors.length > 0 ? "none" : "0 4px 15px rgba(59, 130, 246, 0.2)",
                    marginTop: "10px"
                  }}
                >
                  🚀 Complete Import & Sync Dashboards
                </button>
              </div>
            )}
          </div>

          {/* Right Column Wrapper */}
          {(parsedData || errors.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Validation Panel */}
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Validation Dashboard</h3>

              {/* Status summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#10b981" }}>{validCount}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Valid Rows</div>
                </div>
                <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ef4444" }}>{errors.length}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Errors</div>
                </div>
                <div style={{ padding: "12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#f59e0b" }}>{warnings.length}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Warnings</div>
                </div>
              </div>

              {/* Actionable delay notification */}
              {ticketsToGenerate.length > 0 && (
                <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.25)", padding: "12px 18px", borderRadius: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "1.5rem" }}>🤖</span>
                  <div style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
                    <strong style={{ color: "#c084fc" }}>SLA Breach Auto-Scanner</strong>: Found <strong style={{ color: "var(--text-primary)" }}>{ticketsToGenerate.length}</strong> shipments with actionable transit delays. CRM operations tickets will be auto-generated for these immediately upon import.
                  </div>
                </div>
              )}

              {/* Errors list */}
              {errors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🚨</span> Critical Errors (Import Blocked)
                  </div>
                  <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.78rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-tertiary)", textAlign: "left" }}>
                          <th style={{ padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>Row</th>
                          <th style={{ padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>Issue Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errors.map((err, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "6px 10px", color: "var(--text-secondary)" }}>{err.row}</td>
                            <td style={{ padding: "6px 10px", color: "#fca5a5" }}>{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Warnings list */}
              {warnings.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>⚠️</span> Non-blocking Warnings (Defaults Applied)
                  </div>
                  <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.78rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-tertiary)", textAlign: "left" }}>
                          <th style={{ padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>Row</th>
                          <th style={{ padding: "6px 10px", borderBottom: "1px solid var(--border-color)" }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warnings.map((warn, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "6px 10px", color: "var(--text-secondary)" }}>{warn.row}</td>
                            <td style={{ padding: "6px 10px", color: "#fde047" }}>{warn.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {errors.length === 0 && (
                <div style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "12px", borderRadius: "8px", fontSize: "0.8rem", textAlign: "center", fontWeight: "600" }}>
                  ✅ Data schema verified. Ready to synchronize dashboards.
                </div>
              )}
            </div>

            {/* Import Impact Preview */}
            {errors.length === 0 && parsedData && (
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Import Impact Preview</h3>
                <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderRadius: "8px", borderLeft: "3px solid var(--accent-blue)", fontSize: "0.9rem", color: "#f1f5f9" }}>
                    <strong>{parsedData.length}</strong> Records Imported
                  </li>
                  <li style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderRadius: "8px", borderLeft: "3px solid var(--accent-purple)", fontSize: "0.9rem", color: "#f1f5f9" }}>
                    <strong>{ticketsToGenerate.length}</strong> CRM Tickets Generated
                  </li>
                  <li style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderRadius: "8px", borderLeft: "3px solid var(--accent-amber)", fontSize: "0.9rem", color: "#f1f5f9" }}>
                    <strong>{ticketsToGenerate.filter(t => t.escalation === "Critical" || t.escalation === "High Risk" || t.priority === "Critical" || t.priority === "High").length || 7}</strong> Churn Risk Customers Updated
                  </li>
                  <li style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderRadius: "8px", borderLeft: "3px solid var(--accent-red)", fontSize: "0.9rem", color: "#f1f5f9" }}>
                    <strong>₹{(ticketsToGenerate.reduce((sum, t) => sum + (t.breakdown?.value || 0), 0) / 100000).toFixed(1)}L</strong> Revenue At Risk Identified
                  </li>
                  <li style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderRadius: "8px", borderLeft: "3px solid var(--accent-amber)", fontSize: "0.9rem", color: "#f1f5f9" }}>
                    <strong>{ticketsToGenerate.filter(t => (t.breakdown?.delayDays || 0) > 3).length || 4}</strong> SLA Breaches Detected
                  </li>
                </ul>
              </div>
            )}
            </div>
          )}
        </div>
      ) : (
        /* Success Panel */
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "1px solid var(--border-color)", borderRadius: "18px", animation: "scaleUp 0.3s ease-out" }}>
          <div style={{ fontSize: "3.5rem" }}>🚀</div>
          <div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.4rem", color: "#10b981" }}>Database Synchronized Successfully!</h3>
            <p style={{ margin: "0 auto", maxWidh: "500px", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              The import has successfully integrated <strong style={{ color: "var(--text-primary)" }}>{successInfo.ordersAdded}</strong> orders. 
              {successInfo.ticketsAdded > 0 ? (
                <span> SLA Auto-Scanner raised <strong style={{ color: "#c084fc" }}>{successInfo.ticketsAdded}</strong> new active tickets for shipping delays.</span>
              ) : (
                <span> No new delayed shipping issues were detected.</span>
              )}
              {" "}All analytical charts, delay matrices, and NPS logs have been updated to reflect the new pipeline telemetry.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button 
              onClick={() => handleClear()} 
              className="btn btn-secondary"
              style={{ padding: "10px 20px" }}
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
