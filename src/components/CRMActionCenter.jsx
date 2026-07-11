import React, { useState } from "react";
import { MessageSquare, Mail } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { 
  isDelayed, 
  isActionableDelay, 
  isStaleShipment, 
  getDelayDays 
} from "../utils/delayHelpers";

// Escalation Risk based purely on delay days
const getEscalationRisk = (order) => {
  const delayDays = getDelayDays(order);
  if (delayDays > 10) return "Critical";
  if (delayDays > 7) return "High";
  if (delayDays > 3) return "Medium";
  return "Low";
};

export default function CRMActionCenter({ 
  orders = [], 
  crmLogs = {}, 
  onAddLog,
  search: propsSearch,
  setSearch: propsSetSearch,
  selectedExec: propsSelectedExec,
  setSelectedExec: propsSetSelectedExec,
  selectedCourier: propsSelectedCourier,
  setSelectedCourier: propsSetSelectedCourier,
  severityFilter: propsSeverityFilter,
  setSeverityFilter: propsSetSeverityFilter,
  valueFilter: propsValueFilter,
  setValueFilter: propsSetValueFilter,
  delayCategory: propsDelayCategory,
  setDelayCategory: propsSetDelayCategory,
  activeTab = "outreach", // "outreach" | "delays" | "churn"
  ratingFilter: propsRatingFilter,
  setRatingFilter: propsSetRatingFilter,
  riskFilter: propsRiskFilter,
  setRiskFilter: propsSetRiskFilter,
  sortBy: propsSortBy,
  setSortBy: propsSetSortBy
}) {
  // Local state fallbacks if props are not passed
  const [localSearch, setLocalSearch] = useState("");
  const [localSelectedExec, setLocalSelectedExec] = useState("");
  const [localSelectedCourier, setLocalSelectedCourier] = useState("");
  const [localSeverityFilter, setLocalSeverityFilter] = useState("all");
  const [localValueFilter, setLocalValueFilter] = useState("all");
  const [localDelayCategory, setLocalDelayCategory] = useState("actionable");
  const [localRatingFilter, setLocalRatingFilter] = useState("all");
  const [localRiskFilter, setLocalRiskFilter] = useState("all");
  const [localSortBy, setLocalSortBy] = useState("risk-desc");

  // Local outreach filter for the "Customer Outreach" sub-tab (All, Requires Outreach, Followed Up)
  const [outreachStatusTab, setOutreachStatusTab] = useState("all"); // "all" | "requires" | "followed"

  // Churn Risk sub-tab: Currently selected order for suggestion details
  const [selectedRiskOrderId, setSelectedRiskOrderId] = useState("");

  const search = propsSearch !== undefined ? propsSearch : localSearch;
  const setSearch = propsSetSearch !== undefined ? propsSetSearch : setLocalSearch;

  const selectedExec = propsSelectedExec !== undefined ? propsSelectedExec : localSelectedExec;
  const setSelectedExec = propsSetSelectedExec !== undefined ? propsSetSelectedExec : setLocalSelectedExec;

  const selectedCourier = propsSelectedCourier !== undefined ? propsSelectedCourier : localSelectedCourier;
  const setSelectedCourier = propsSetSelectedCourier !== undefined ? propsSetSelectedCourier : setLocalSelectedCourier;

  const severityFilter = propsSeverityFilter !== undefined ? propsSeverityFilter : localSeverityFilter;
  const setSeverityFilter = propsSetSeverityFilter !== undefined ? propsSetSeverityFilter : setLocalSeverityFilter;

  const valueFilter = propsValueFilter !== undefined ? propsValueFilter : localValueFilter;
  const setValueFilter = propsSetValueFilter !== undefined ? propsSetValueFilter : setLocalValueFilter;

  const delayCategory = propsDelayCategory !== undefined ? propsDelayCategory : localDelayCategory;
  const setDelayCategory = propsSetDelayCategory !== undefined ? propsSetDelayCategory : setLocalDelayCategory;

  const ratingFilter = propsRatingFilter !== undefined ? propsRatingFilter : localRatingFilter;
  const setRatingFilter = propsSetRatingFilter !== undefined ? propsSetRatingFilter : setLocalRatingFilter;

  const riskFilter = propsRiskFilter !== undefined ? propsRiskFilter : localRiskFilter;
  const setRiskFilter = propsSetRiskFilter !== undefined ? propsSetRiskFilter : setLocalRiskFilter;

  const sortBy = propsSortBy !== undefined ? propsSortBy : localSortBy;
  const setSortBy = propsSetSortBy !== undefined ? propsSetSortBy : setLocalSortBy;

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [actionType, setActionType] = useState("Customer Outreach");
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("Email");
  const [customerResponse, setCustomerResponse] = useState("No Reply");
  const [showAllOutreach, setShowAllOutreach] = useState(false);
  const [showAllDelays, setShowAllDelays] = useState(false);

  const getLatestCustomerResponse = (orderId) => {
    const logs = crmLogs[orderId] || [];
    const logWithResponse = logs.find(l => l.customerResponse);
    return logWithResponse ? logWithResponse.customerResponse : "Pending Response";
  };

  const getResponseBadgeClass = (response) => {
    switch (response) {
      case "Accepted Coupon": return "badge-green";
      case "Wants Callback": return "badge-blue";
      case "Requested Refund": return "badge-amber";
      case "Escalated Complaint": return "badge-red";
      case "No Reply": return "badge-secondary";
      default: return "badge-secondary";
    }
  };


  // Extract unique Sales Executives and Couriers for filters
  const salesExecutives = Array.from(new Set(orders.map(o => o.SalesExecutive?.trim()).filter(Boolean)));
  const couriers = Array.from(new Set(orders.map(o => o.Courier?.trim()).filter(Boolean)));

  // Filter base orders based on delay category
  const getBaseOrders = () => {
    if (search && search.trim() !== "") {
      const cleanSearch = search.trim().toLowerCase();
      const hasSpecificOrder = orders.some(o => o.OrderID?.toLowerCase() === cleanSearch);
      if (hasSpecificOrder) {
        return orders;
      }
    }

    if (activeTab === "delays") {
      if (delayCategory === "actionable") return orders.filter(isActionableDelay);
      if (delayCategory === "stale") return orders.filter(isStaleShipment);
      if (delayCategory === "predictive") return orders.filter(o => !isDelayed(o) && o.Status !== "Delivered" && (o.SlaBreachProbability || 0) > 70);
      return orders.filter(isDelayed);
    }
    // Churn and Outreach focus primarily on active actionable delays
    return orders.filter(isActionableDelay);
  };

  const baseOrders = getBaseOrders();

  // Apply filters
  const filteredOrders = baseOrders.filter(order => {
    if (search && order.OrderID?.toLowerCase() === search.trim().toLowerCase()) {
      return true;
    }

    const delayDays = getDelayDays(order);
    const orderValue = Number(order.OrderValue || 0);
    const logs = crmLogs[order.OrderID] || [];
    const risk = getEscalationRisk(order);

    const matchesSearch = 
      order.OrderID?.toLowerCase().includes(search.toLowerCase()) ||
      order.Customer?.toLowerCase().includes(search.toLowerCase());

    const matchesExec = selectedExec === "" || order.SalesExecutive === selectedExec;
    const matchesCourier = selectedCourier === "" || order.Courier === selectedCourier;

    const matchesSeverity = 
      severityFilter === "all" ||
      (severityFilter === "critical" && delayDays > 5) ||
      (severityFilter === "warning" && delayDays <= 5);

    const matchesValue =
      valueFilter === "all" ||
      (valueFilter === "high" && orderValue > 50000) ||
      (valueFilter === "regular" && orderValue <= 50000);

    const matchesRisk =
      riskFilter === "all" ||
      riskFilter.toLowerCase() === risk.toLowerCase();

    // Specific filters based on active tab view
    if (activeTab === "outreach") {
      const hasLogs = logs.length > 0;
      if (outreachStatusTab === "requires" && hasLogs) return false;
      if (outreachStatusTab === "followed" && !hasLogs) return false;
      if (outreachStatusTab === "critical" && risk !== "Critical") return false;
    }

    return matchesSearch && matchesExec && matchesCourier && matchesSeverity && matchesValue && matchesRisk;
  });

  const getRiskWeight = (risk) => {
    switch (risk) {
      case "Critical": return 4;
      case "High": return 3;
      case "Medium": return 2;
      case "Low": return 1;
      default: return 0;
    }
  };

  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "risk-desc") {
      return getRiskWeight(getEscalationRisk(b)) - getRiskWeight(getEscalationRisk(a));
    }
    if (sortBy === "delay-desc") {
      return getDelayDays(b) - getDelayDays(a);
    }
    if (sortBy === "value-desc") {
      return (Number(b.OrderValue || 0)) - (Number(a.OrderValue || 0));
    }
    return 0;
  });

  const handleOpenOutreach = (order) => {
    setSelectedOrder(order);
    setNoteText("");
    setActionType("Customer Outreach");
    setShowEmailTemplate(false);
    setSelectedChannel("Email");
    setCustomerResponse("No Reply");
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddLog(selectedOrder.OrderID, actionType, noteText, "Account Manager", customerResponse);
    setNoteText("");
  };

  const triggerOutreach = (text) => {
    onAddLog(selectedOrder.OrderID, `[${selectedChannel}] Outreach Sent`, text, "Sales Operations (AI)", "No Reply");
    setShowEmailTemplate(false);
  };


  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  const getOutreachTemplateText = () => {
    if (!selectedOrder) return "";
    
    if (selectedChannel === "WhatsApp") {
      return `Hi ${selectedOrder.Customer}, DispatchIQ here! 🚚 We noticed a slight delay with your order #${selectedOrder.OrderID} (${selectedOrder.Product}). Our team is actively working with ${selectedOrder.Courier} to expedite it. Apologies for the inconvenience! Let us know if you have questions.`;
    }
    
    if (selectedChannel === "SMS") {
      return `DispatchIQ Update: Order #${selectedOrder.OrderID} is delayed. We are coordinating with ${selectedOrder.Courier} to speed up delivery. Sorry for the wait!`;
    }

    return `Subject: SLA Delay Apology - Order #${selectedOrder.OrderID}

Dear ${selectedOrder.Customer},

We sincerely apologize for the delay in delivering your package containing ${selectedOrder.Product}. We understand this is frustrating and are working with our courier ${selectedOrder.Courier} to expedite the transit.

We value your business and would like to extend our sincerest apologies.

Warm regards,
Customer Operations Manager`;
  };

  const renderEscalationRisk = (order) => {
    const risk = getEscalationRisk(order);
    const emoji = risk === "Critical" ? "🔴" : risk === "High" ? "🟠" : risk === "Medium" ? "🟡" : "🟢";
    const color = risk === "Critical" ? "var(--accent-red)" : risk === "High" ? "var(--accent-amber)" : risk === "Medium" ? "#eab308" : "var(--accent-green)";
    return (
      <span style={{ fontSize: "0.82rem", fontWeight: "600", color }}>
        {emoji} {risk}
      </span>
    );
  };

  const renderRiskBadge = (risk) => {
    let badgeClass = "badge-blue";
    if (risk === "Critical") badgeClass = "badge-red";
    else if (risk === "High") badgeClass = "badge-amber";
    else if (risk === "Medium") badgeClass = "badge-purple";
    return (
      <span className={`badge ${badgeClass}`} style={{ fontWeight: "700", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em", padding: "4px 8px" }}>
        {risk}
      </span>
    );
  };

  const getSmartSuggestion = (order) => {
    if (!order) return null;
    const risk = getEscalationRisk(order);

    if (risk === "Critical") {
      return {
        title: "⚠️ CRITICAL ESCALATION ALERT",
        text: "Required Actions:\n• Call customer immediately\n• Escalate courier\n• Issue retention coupon",
        bg: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        color: "var(--accent-red)",
        badge: "Escalate Immediately"
      };
    } else if (risk === "High") {
      return {
        title: "⚡ HIGH RISK WARNING",
        text: "Required Actions:\n• Call customer\n• Assign executive",
        bg: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        color: "var(--accent-amber)",
        badge: "Priority Outreach"
      };
    } else if (risk === "Medium") {
      return {
        title: "ℹ️ MODERATE RISK",
        text: "Required Actions:\n• Send update email\n• Monitor tracking",
        bg: "rgba(139, 92, 246, 0.08)",
        border: "1px solid rgba(139, 92, 246, 0.25)",
        color: "var(--accent-purple)",
        badge: "Routine Follow-up"
      };
    } else {
      return {
        title: "✅ LOW RISK",
        text: "Required Actions:\n• No action required",
        bg: "rgba(16, 185, 129, 0.05)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        color: "var(--accent-green)",
        badge: "Standard Monitor"
      };
    }
  };

  // Determine current suggestion order for Churn Risk tab
  const currentRiskOrder = sortedFilteredOrders.find(o => o.OrderID === selectedRiskOrderId) || sortedFilteredOrders[0];

  return (
    <div id="crm-action-center" className="panel" style={{ marginTop: "0px", padding: "20px" }}>
      
      {/* ==========================================
          CUSTOMER OUTREACH TAB
          ========================================== */}
      {activeTab === "outreach" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", animation: "fadeIn 0.3s ease-out" }}>
          <div>
            <h2 style={{ margin: 0, border: "none", padding: 0 }}>📞 Customer Outreach Logs</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "5px 0 15px 0" }}>
              Audit logged follow-ups, standard apologizing procedures, and log customer communication notes.
            </p>
          </div>

          {/* Sub-Filters / Sub-Tabs inside Outreach */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: "rgba(30,41,59,0.2)", padding: "10px 15px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button 
                className={`btn btn-small ${outreachStatusTab === "all" ? "" : "btn-secondary"}`}
                onClick={() => setOutreachStatusTab("all")}
                style={{ padding: "5px 10px", fontSize: "0.8rem" }}
              >
                All Actionable ({baseOrders.length})
              </button>
              <button 
                className={`btn btn-small ${outreachStatusTab === "requires" ? "" : "btn-secondary"}`}
                onClick={() => setOutreachStatusTab("requires")}
                style={{ padding: "5px 10px", fontSize: "0.8rem" }}
              >
                Requires Outreach ({baseOrders.filter(o => !(crmLogs[o.OrderID]?.length > 0)).length})
              </button>
              <button 
                className={`btn btn-small ${outreachStatusTab === "followed" ? "" : "btn-secondary"}`}
                onClick={() => setOutreachStatusTab("followed")}
                style={{ padding: "5px 10px", fontSize: "0.8rem" }}
              >
                Followed Up ({baseOrders.filter(o => crmLogs[o.OrderID]?.length > 0).length})
              </button>
              <button 
                className={`btn btn-small ${outreachStatusTab === "critical" ? "" : "btn-secondary"}`}
                onClick={() => setOutreachStatusTab("critical")}
                style={{ padding: "5px 10px", fontSize: "0.8rem" }}
              >
                Critical Risk ({baseOrders.filter(o => getEscalationRisk(o) === "Critical").length})
              </button>
            </div>

            {/* Inline Quick Search */}
            <input 
              type="text"
              placeholder="Quick search Customer or Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "5px 10px", fontSize: "0.8rem", width: "220px", margin: 0, borderRadius: "6px" }}
            />
          </div>

          {/* Filter dropdowns */}
          <div className="form-group" style={{ gap: "10px", marginBottom: "10px", marginTop: "5px" }}>
            <select value={selectedExec} onChange={(e) => setSelectedExec(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="">All Sales Executives</option>
              {salesExecutives.map(exec => (
                <option key={exec} value={exec}>{exec}</option>
              ))}
            </select>

            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem", border: "1px solid var(--accent-purple)" }}>
              <option value="risk-desc">Sort By: Escalation Risk</option>
              <option value="delay-desc">Sort By: Delay Severity</option>
              <option value="value-desc">Sort By: Order Value (Highest)</option>
            </select>
          </div>

          {/* Table */}
          {sortedFilteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No outreach records match the filters.</p>
            </div>
          ) : (
            <>
            <div className="table-wrapper">
              <table style={{ width: "100%", fontSize: "0.92rem" }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Escalation Risk</th>
                    <th>Product</th>
                    <th>Expected Date</th>
                    <th>Delay SLA</th>
                    <th style={{ textAlign: "right" }}>Value</th>
                    <th>Response</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllOutreach ? sortedFilteredOrders : sortedFilteredOrders.slice(0, 10)).map(order => {
                    const delay = getDelayDays(order);
                    const val = Number(order.OrderValue || 0);
                    const logs = crmLogs[order.OrderID] || [];
                    const latestResponse = getLatestCustomerResponse(order.OrderID);

                    const isHighlighted = search && (
                      order.OrderID.toLowerCase() === search.toLowerCase() ||
                      order.Customer.toLowerCase() === search.toLowerCase()
                    );
                    const highlightClass = isHighlighted ? "highlight-pulse-amber" : "";

                    return (
                      <tr key={order.OrderID} className={highlightClass}>
                        <td style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{order.OrderID}</td>
                        <td style={{ fontWeight: "600" }}>{order.Customer}</td>
                        <td>{renderEscalationRisk(order)}</td>
                        <td>{order.Product}</td>
                        <td>{order.ExpectedDeliveryDate}</td>
                        <td>
                          <span className={`badge ${delay > 5 ? "badge-red" : "badge-amber"}`}>
                            {delay} Days Late
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>₹{val.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${getResponseBadgeClass(latestResponse)}`} style={{ fontSize: "0.72rem" }}>
                            {latestResponse}
                          </span>
                        </td>
                        <td>
                          {logs.length > 0 ? (
                            <span className="badge badge-green" style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                              ✓ {logs.length} Logged
                            </span>
                          ) : (
                            <span className="badge badge-blue" style={{ opacity: 0.6 }}>Requires Action</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-small"
                            onClick={() => handleOpenOutreach(order)}
                            style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sortedFilteredOrders.length > 10 && (
              <button className="view-all-btn" onClick={() => setShowAllOutreach(p => !p)}>
                {showAllOutreach ? <><span>▲</span> Show Top 10 Only</> : <><span>▼</span> View All {sortedFilteredOrders.length} Records</>}
              </button>
            )}
            </>
          )}
        </div>
      )}

      {/* ==========================================
          DELAY RECORDS TAB
          ========================================== */}
      {activeTab === "delays" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", animation: "fadeIn 0.3s ease-out" }}>
          <div>
            <h2 style={{ margin: 0, border: "none", padding: 0 }}>📦 Transit Delay Audit Records</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "5px 0 15px 0" }}>
              Comprehensive log auditing transit times, expected dates, and active SLA breaches.
            </p>
          </div>

          {/* Filters */}
          <div className="form-group" style={{ gap: "10px", marginBottom: "10px" }}>
            <input 
              type="text"
              placeholder="Search Order ID or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: "1 1 200px", padding: "6px 10px", fontSize: "0.82rem", margin: 0 }}
            />

            <select value={delayCategory} onChange={(e) => setDelayCategory(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="actionable">Active Actionable Delays (≤ 14 days)</option>
              <option value="stale">Stale Delayed Shipments (&gt; 14 days)</option>
              <option value="predictive">High Risk Predictions (Not Delayed)</option>
              <option value="all">All Delayed Shipments</option>
            </select>

            <select value={selectedCourier} onChange={(e) => setSelectedCourier(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="">All Couriers</option>
              {couriers.map(cour => (
                <option key={cour} value={cour}>{cour}</option>
              ))}
            </select>

            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="all">All Delay Severities</option>
              <option value="critical">Critical (&gt; 5 days)</option>
              <option value="warning">Warning (1-5 days)</option>
            </select>

            <select value={valueFilter} onChange={(e) => setValueFilter(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="all">All Order Values</option>
              <option value="high">High Value (&gt; ₹50,000)</option>
              <option value="regular">Regular (≤ ₹50,000)</option>
            </select>
          </div>

          {/* Table */}
          {sortedFilteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No delay records match the filters.</p>
            </div>
          ) : (
            <>
            <div className="table-wrapper">
              <table style={{ width: "100%", fontSize: "0.92rem" }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Courier</th>
                    <th>Expected Date</th>
                    <th>Risk Forecast</th>
                    <th style={{ textAlign: "right" }}>Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllDelays ? sortedFilteredOrders : sortedFilteredOrders.slice(0, 10)).map(order => {
                    const delay = getDelayDays(order);
                    const val = Number(order.OrderValue || 0);

                    const isHighlighted = search && (
                      order.OrderID.toLowerCase() === search.toLowerCase() ||
                      order.Customer.toLowerCase() === search.toLowerCase()
                    );
                    const highlightClass = isHighlighted ? "highlight-pulse-amber" : "";

                    return (
                      <tr key={order.OrderID} className={highlightClass}>
                        <td style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{order.OrderID}</td>
                        <td style={{ fontWeight: "600" }}>{order.Customer}</td>
                        <td>{order.Courier}</td>
                        <td>{order.ExpectedDeliveryDate}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span className={`badge ${delay > 5 ? "badge-red" : delay > 0 ? "badge-amber" : "badge-secondary"}`} style={{ alignSelf: "flex-start" }}>
                              {delay > 0 ? `${delay} Days Late` : "On Schedule"}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                              <span style={{ 
                                display: "inline-block", 
                                width: "6px", height: "6px", 
                                borderRadius: "50%", 
                                backgroundColor: order.SlaBreachProbability > 80 ? "#ef4444" : order.SlaBreachProbability > 50 ? "#f59e0b" : "#3b82f6" 
                              }}></span>
                              {order.SlaBreachProbability || 0}% Breach Risk
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>₹{val.toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${order.Status?.toLowerCase() === "delivered" ? "green" : order.Status?.toLowerCase() === "in transit" ? "blue" : "purple"}`}>
                            {order.Status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-small"
                            onClick={() => handleOpenOutreach(order)}
                            style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                          >
                            Logs
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sortedFilteredOrders.length > 10 && (
              <button className="view-all-btn" onClick={() => setShowAllDelays(p => !p)}>
                {showAllDelays ? <><span>▲</span> Show Top 10 Only</> : <><span>▼</span> View All {sortedFilteredOrders.length} Delay Records</>}
              </button>
            )}
            </>
          )}
        </div>
      )}

      {/* ==========================================
          CHURN RISK TAB
          ========================================== */}
      {activeTab === "churn" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", animation: "fadeIn 0.3s ease-out" }}>
          <div>
            <h2 style={{ margin: 0, border: "none", padding: 0 }}>⚠️ Escalation Risk & Retention Desk</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "5px 0 15px 0" }}>
              Audit accounts at risk of churning due to poor customer ratings or extreme transit SLA breaches.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="form-group" style={{ gap: "10px", marginBottom: "10px" }}>
            <input 
              type="text"
              placeholder="Search Customer or Order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: "1 1 200px", padding: "6px 10px", fontSize: "0.82rem", margin: 0 }}
            />

            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="all">All Escalation Risks</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>

            <select value={valueFilter} onChange={(e) => setValueFilter(e.target.value)} style={{ padding: "6px 10px", fontSize: "0.82rem" }}>
              <option value="all">All Values</option>
              <option value="high">High Value (&gt; ₹50,000)</option>
              <option value="regular">Regular (≤ ₹50,000)</option>
            </select>
          </div>

          {/* Split Pane: Risk List on Left, Suggestions on Right */}
          {sortedFilteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", backgroundColor: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No churn risk records match the filters.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px", alignItems: "start" }}>
              
              {/* Left Column: Risk Table */}
              <div className="table-wrapper">
                <table style={{ width: "100%", fontSize: "0.9rem" }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Risk Level</th>
                      <th>Delay</th>
                      <th style={{ textAlign: "right" }}>Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                   {(showAllOutreach ? sortedFilteredOrders : sortedFilteredOrders.slice(0, 10)).map(order => {
                      const delay = getDelayDays(order);
                      const val = Number(order.OrderValue || 0);
                      const risk = getEscalationRisk(order);
                      const isSelected = currentRiskOrder && currentRiskOrder.OrderID === order.OrderID;

                      return (
                        <tr 
                          key={order.OrderID} 
                          onClick={() => setSelectedRiskOrderId(order.OrderID)}
                          style={{ 
                            cursor: "pointer", 
                            backgroundColor: isSelected ? "rgba(139, 92, 246, 0.08)" : "transparent"
                          }}
                        >
                          <td style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{order.OrderID}</td>
                          <td style={{ fontWeight: "600" }}>{order.Customer}</td>

                          <td>{renderRiskBadge(risk)}</td>
                          <td style={{ color: "var(--accent-red)" }}>{delay}d</td>
                          <td style={{ textAlign: "right" }}>₹{val.toLocaleString()}</td>
                          <td>
                            <button 
                              className="btn btn-small btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRiskOrderId(order.OrderID);
                              }}
                              style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Right Column: AI Smart Suggestions Detail Panel */}
              {currentRiskOrder ? (
                <div style={{ 
                  background: "var(--bg-secondary)", 
                  border: "1px solid var(--border-color)", 
                  borderRadius: "14px", 
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
                      AI Retention Analysis
                    </span>
                    <span className="badge badge-purple" style={{ padding: "4px 8px", fontSize: "0.7rem" }}>
                      Order #{currentRiskOrder.OrderID}
                    </span>
                  </div>

                  <div style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Customer Name:</span>
                      <span style={{ fontWeight: "600" }}>{currentRiskOrder.Customer}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Escalation Risk:</span>
                      <span>{renderEscalationRisk(currentRiskOrder)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>SLA Delay Duration:</span>
                      <span style={{ color: "var(--accent-red)", fontWeight: "600" }}>{getDelayDays(currentRiskOrder)} Days Late</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Order value:</span>
                      <span style={{ fontWeight: "600" }}>₹{Number(currentRiskOrder.OrderValue).toLocaleString()}</span>
                    </div>
                  </div>

                  {(() => {
                    const sugg = getSmartSuggestion(currentRiskOrder);
                    return (
                      <div style={{ 
                        background: sugg.bg, 
                        border: sugg.border, 
                        borderRadius: "12px", 
                        padding: "16px",
                        color: "var(--text-primary)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: sugg.color }}>{sugg.title}</span>
                          <span className="badge" style={{ background: sugg.color, color: "#fff", fontSize: "0.62rem", padding: "2px 6px", textTransform: "uppercase", fontWeight: "700" }}>
                            {sugg.badge}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: "1.4", color: "var(--text-secondary)" }}>
                          {sugg.text}
                        </p>
                      </div>
                    );
                  })()}

                  <button 
                    className="btn btn-small"
                    onClick={() => handleOpenOutreach(currentRiskOrder)}
                    style={{ alignSelf: "flex-end", display: "inline-flex", gap: "6px", alignItems: "center", padding: "6px 12px", fontSize: "0.82rem" }}
                  >
                    <MessageSquare size={12} strokeWidth={2.5} />
                    Open Outreach Desk
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>
                  Select an order to view suggestion details.
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ==========================================
          OUTREACH LOGS MODAL (PRESERVED)
          ========================================== */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "880px", background: "var(--bg-secondary)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
              <h3 style={{ display: "flex", gap: "10px", alignItems: "center", margin: 0 }}>
                <span className="badge badge-blue" style={{ padding: "6px 10px" }}>{selectedOrder.OrderID}</span>
                <span>Customer Outreach Desk</span>
              </h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>

            <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "25px", padding: "24px" }}>
              
              {/* Left Column: Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "20px", borderRadius: "14px", textAlign: "center" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)", color: "white", fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                    {getInitials(selectedOrder.Customer)}
                  </div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>{selectedOrder.Customer}</h4>
                  <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                    {renderEscalationRisk(selectedOrder)}
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    {renderRiskBadge(getEscalationRisk(selectedOrder))}
                  </div>
                </div>

                <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", padding: "18px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
                  <h5 style={{ margin: "0 0 5px 0", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Order Details</h5>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>SKU Item:</span>
                    <span style={{ fontWeight: "600" }}>{selectedOrder.Product} (x{selectedOrder.Quantity})</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Order Value:</span>
                    <span style={{ fontWeight: "600" }}>₹{Number(selectedOrder.OrderValue).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Sales Executive:</span>
                    <span style={{ fontWeight: "600" }}>{selectedOrder.SalesExecutive}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Courier:</span>
                    <span>{selectedOrder.Courier}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Expected Date:</span>
                    <span>{selectedOrder.ExpectedDeliveryDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Delay:</span>
                    <span style={{ color: "var(--accent-red)", fontWeight: "600" }}>{getDelayDays(selectedOrder)} Days</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Address:</span>
                    <span style={{ textAlign: "right" }}>{selectedOrder.Address} ({selectedOrder.Region})</span>
                  </div>
                </div>

                {/* Compensation Tracking */}
                <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", padding: "18px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
                  <h5 style={{ margin: "0 0 5px 0", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Compensation Tracking</h5>
                  <table style={{ width: "100%", fontSize: "0.85rem", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ paddingBottom: "8px", color: "var(--text-secondary)", fontWeight: "600" }}>Compensation Type</th>
                        <th style={{ paddingBottom: "8px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ paddingTop: "8px", paddingBottom: "8px" }}>Refund</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "var(--accent-red)" }}>₹500</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ paddingTop: "8px", paddingBottom: "8px" }}>Coupon</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "var(--accent-amber)" }}>₹1000</td>
                      </tr>
                      <tr>
                        <td style={{ paddingTop: "8px" }}>Free Shipping</td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "var(--accent-green)" }}>Yes</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: "8px", padding: "12px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Total Recovery Cost</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Recovery Cost This Month</span>
                    </div>
                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--accent-red)" }}>₹1.8L</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Logs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {(() => {
                  const sugg = getSmartSuggestion(selectedOrder);
                  return (
                    <div style={{ background: sugg.bg, border: sugg.border, borderRadius: "14px", padding: "16px", color: "var(--text-primary)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: sugg.color }}>{sugg.title}</span>
                        <span className="badge" style={{ background: sugg.color, color: "#fff", fontSize: "0.65rem", padding: "3px 8px", textTransform: "uppercase", fontWeight: "700" }}>{sugg.badge}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: "1.4", color: "var(--text-secondary)" }}>{sugg.text}</p>
                    </div>
                  );
                })()}

                {showEmailTemplate && (
                  <div style={{ background: "rgba(59,130,246,0.02)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--accent-blue)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Mail size={16} strokeWidth={2.5} />
                        Omnichannel Customer Outreach
                      </h4>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {["Email", "SMS", "WhatsApp"].map(channel => (
                          <button 
                            key={channel}
                            onClick={() => setSelectedChannel(channel)}
                            style={{ 
                              padding: "4px 10px", 
                              fontSize: "0.7rem", 
                              borderRadius: "20px", 
                              border: selectedChannel === channel ? "1px solid var(--accent-blue)" : "1px solid var(--border-color)",
                              background: selectedChannel === channel ? "rgba(59, 130, 246, 0.15)" : "transparent",
                              color: selectedChannel === channel ? "var(--text-primary)" : "var(--text-secondary)",
                              cursor: "pointer",
                              fontWeight: selectedChannel === channel ? "700" : "500"
                            }}
                          >
                            {channel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.78rem", background: "var(--bg-primary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontFamily: "inherit", lineHeight: "1.4" }}>
                      {getOutreachTemplateText()}
                    </pre>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button className="btn btn-small" onClick={() => triggerOutreach(getOutreachTemplateText())}>Send via {selectedChannel}</button>
                      <button className="btn btn-secondary btn-small" onClick={() => setShowEmailTemplate(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* ========== INTERACTIVE AUDIT TRAIL ========== */}
                {(() => {
                  const delay = getDelayDays(selectedOrder);
                  const status = (selectedOrder.Status || "").toLowerCase();
                  const hasLogs = (crmLogs[selectedOrder.OrderID] || []).length > 0;
                  const hasCompensation = (crmLogs[selectedOrder.OrderID] || []).some(l => l.type === "Refund/Discount Issued");
                  const isDelivered = status === "delivered";
                  const riskProbability = selectedOrder.SlaBreachProbability || 0;

                  const steps = [
                    { label: "Transit Exception Detected", detail: riskProbability > 70 ? `High SLA Breach Probability (${riskProbability}%)` : "Package missed transit checkpoint", state: "completed", action: "View Ping" },
                    { label: delay > 0 ? "Order Delayed" : "Risk Monitored", detail: delay > 0 ? `${delay} days past SLA` : "Within SLA", state: delay > 0 ? "danger-step" : "completed", action: "View Carrier" },
                    { label: "Workflow Triggered", detail: "Automated retention & logistics escalation rule applied", state: delay > 0 || riskProbability > 70 ? "completed" : "pending", action: "View Rule" },
                    { label: "Ticket Created", detail: delay > 0 || riskProbability > 70 ? "Assigned to CRM Queue" : "Pending Breach", state: delay > 0 || riskProbability > 70 ? "completed" : "pending", action: "View Ticket" },
                    { label: hasLogs ? "Customer Contacted" : "Awaiting Outreach", detail: hasLogs ? "Retention interaction logged" : "Requires executive action", state: hasLogs ? "completed" : "active-step", action: hasLogs ? "Read Transcript" : "Draft Email" },
                    { label: isDelivered ? "Issue Resolved ✓" : "Resolution Pending", detail: isDelivered ? "Closed & Delivered" : "Awaiting final delivery scan", state: isDelivered ? "completed" : "pending", action: isDelivered ? "View CSAT" : "Expedite" }
                  ];

                  return (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px 20px" }}>
                      <h4 style={{ margin: "0 0 14px 0", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.1rem" }}>🔍</span>
                          Interactive Audit Trail
                        </div>
                        <span className="badge badge-blue" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>Enterprise Compliance</span>
                      </h4>
                      <p style={{ margin: "0 0 15px 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>Traceable operational history for issue resolution and SLA accountability.</p>
                      <div className="journey-timeline">
                        {steps.map((step, idx) => (
                          <div key={idx} className={`journey-step ${step.state}`} style={{ position: "relative" }}>
                            <div className="journey-step-label">{step.label}</div>
                            <div className="journey-step-detail">{step.detail}</div>
                            {step.action && step.state !== "pending" && (
                              <button 
                                className="btn btn-secondary btn-small" 
                                style={{ marginTop: "8px", padding: "3px 8px", fontSize: "0.65rem", borderRadius: "4px" }}
                                onClick={(e) => { e.stopPropagation(); alert(`Audit Log Action Triggered: ${step.action}`); }}
                              >
                                {step.action}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>📜 Contact Logs</h4>
                  {(crmLogs[selectedOrder.OrderID] || []).length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "10px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      No prior outreach notes logged for this delay.
                    </div>
                  ) : (
                    <div className="crm-logs-list" style={{ maxHeight: "200px" }}>
                      {(crmLogs[selectedOrder.OrderID] || []).map((log, index) => (
                        <div className="crm-log-item" key={index} style={{ borderLeft: "3px solid var(--accent-blue)", borderRadius: "0 10px 10px 0" }}>
                          <div className="crm-log-header">
                            <span style={{ color: "var(--accent-blue)", fontWeight: "600" }}>{log.type}</span>
                            <span>{log.timestamp}</span>
                          </div>
                          <div className="crm-log-body" style={{ marginTop: "5px" }}>{log.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddNoteSubmit} style={{ borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>✏️ Log Phone Call or Internal Note</h4>
                  <div style={{ display: "flex", gap: "15px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1", minWidth: "200px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>Action Type</span>
                      <select 
                        value={actionType} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionType(val);
                          if (val === "Omnichannel Outreach") setShowEmailTemplate(true);
                          else setShowEmailTemplate(false);
                        }}
                        style={{ width: "100%", boxSizing: "border-box" }}
                      >
                        <option value="Customer Outreach">📞 Customer Phone Call</option>
                        <option value="Logistics Escalation">🚨 Logistics Escalation</option>
                        <option value="Omnichannel Outreach">✉️ Message / Email Outreach</option>
                        <option value="Refund/Discount Issued">💸 Compensation Logged</option>
                        <option value="Other">📝 Internal Notes</option>
                      </select>
                    </div>
                    <div style={{ flex: "1", minWidth: "200px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>Customer Response</span>
                      <select 
                        value={customerResponse} 
                        onChange={(e) => setCustomerResponse(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box" }}
                      >
                        <option value="No Reply">⏳ No Reply</option>
                        <option value="Accepted Coupon">✅ Accepted Coupon</option>
                        <option value="Requested Refund">💸 Requested Refund</option>
                        <option value="Wants Callback">📞 Wants Callback</option>
                        <option value="Escalated Complaint">🚨 Escalated Complaint</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    placeholder="Enter phone call log details..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-small" style={{ marginTop: "8px" }}>Log Communication Note</button>
                </form>
              </div>

            </div>

            <div className="modal-footer" style={{ background: "var(--bg-tertiary)", borderTop: "1px solid var(--border-color)" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close Outreach Desk</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ROOT CAUSE DISTRIBUTION
          ========================================== */}
      <div style={{ marginTop: "30px", background: "var(--bg-secondary)", borderRadius: "14px", border: "1px solid var(--border-color)", padding: "24px", animation: "fadeIn 0.3s ease-out" }}>
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            📊 Root Cause Distribution
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
            Identify the primary reasons why customers are complaining.
          </p>
        </div>
        
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Courier Delay", value: 40 },
                  { name: "Lost Shipment", value: 25 },
                  { name: "Wrong Product", value: 15 },
                  { name: "Return Pickup Delay", value: 10 },
                  { name: "Address Issues", value: 10 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {[
                  { name: "Courier Delay", color: "var(--accent-red)" },
                  { name: "Lost Shipment", color: "var(--accent-amber)" },
                  { name: "Wrong Product", color: "var(--accent-purple)" },
                  { name: "Return Pickup Delay", color: "var(--accent-blue)" },
                  { name: "Address Issues", color: "#64748b" },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-primary)", fontWeight: "600" }}
                formatter={(value) => [`${value}%`, "Distribution"]}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "0.85rem", paddingTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
