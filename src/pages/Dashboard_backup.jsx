import { useEffect, useState } from "react";
import Papa from "papaparse";

import AnalyticsView from "../components/AnalyticsView";
import CRMActionCenter from "../components/CRMActionCenter";
import ExecutiveActions from "../components/ExecutiveActions";
import { isActionableDelay } from "../utils/delayHelpers";

export default function Dashboard({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("crm"); // "crm" | "logistics" | "products"
  const [logisticsSubTab, setLogisticsSubTab] = useState("all");
  const [productsSubTab, setProductsSubTab] = useState("performance");

  // Retrieve logged-in user profile from localStorage dynamically
  const loggedInUser = (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : { name: "Amit Mishra", email: "amit@dispatch.com", role: "Operations Director" };
    } catch {
      return { name: "Amit Mishra", email: "amit@dispatch.com", role: "Operations Director" };
    }
  })();

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // CRM Search & Filter States
  const [crmSearch, setCrmSearch] = useState("");
  const [crmSelectedExec, setCrmSelectedExec] = useState("");
  const [crmSelectedCourier, setCrmSelectedCourier] = useState("");
  const [crmSeverityFilter, setCrmSeverityFilter] = useState("all");
  const [crmValueFilter, setCrmValueFilter] = useState("all");
  const [crmDelayCategory, setCrmDelayCategory] = useState("actionable");
  const [crmActiveTab, setCrmActiveTab] = useState("outreach");
  const [crmRatingFilter, setCrmRatingFilter] = useState("all");
  const [crmRiskFilter, setCrmRiskFilter] = useState("all");
  const [crmSortBy, setCrmSortBy] = useState("risk-desc");

  // CRM Logs State with LocalStorage persistence
  const [crmLogs, setCrmLogs] = useState(() => {
    const saved = localStorage.getItem("crm_outreach_logs");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    Papa.parse(
      "/data/AI_Dispatch_Sales_Dataset.csv",
      {
        download: true,
        header: true,
        complete: (results) => {
          const cleanData = results.data
            .map(row => {
              const cleanRow = {};
              for (const key in row) {
                if (Object.prototype.hasOwnProperty.call(row, key)) {
                  const cleanKey = key.replace(/^\uFEFF/, "").trim();
                  cleanRow[cleanKey] = typeof row[key] === "string" ? row[key].trim() : row[key];
                }
              }
              return cleanRow;
            })
            .filter(row => row.OrderID);
          setOrders(cleanData);
          setLoading(false);
        }
      }
    );
  }, []);

  const handleAddLog = (orderId, type, text, author) => {
    const newLogs = { ...crmLogs };
    if (!newLogs[orderId]) newLogs[orderId] = [];

    const now = new Date();
    const formattedTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + now.toLocaleDateString();

    newLogs[orderId].unshift({
      type,
      text,
      author,
      timestamp: formattedTimestamp
    });

    setCrmLogs(newLogs);
    localStorage.setItem("crm_outreach_logs", JSON.stringify(newLogs));
  };

  const handleActionTrigger = (id) => {
    // Reset filters
    setCrmSearch("");
    setCrmSelectedExec("");
    setCrmSelectedCourier("");
    setCrmSeverityFilter("all");
    setCrmValueFilter("all");
    setCrmDelayCategory("all");
    if (id === "call-amit") {
      setCrmSearch("Amit Kumar");
      setCrmDelayCategory("all");
      setCrmActiveTab("outreach");
    } else if (id === "escalate-delhivery") {
      setCrmSelectedCourier("Delhivery");
      setCrmDelayCategory("actionable");
      setCrmActiveTab("delays");
    } else if (id === "issue-coupon") {
      setCrmValueFilter("high");
      setCrmDelayCategory("actionable");
      setCrmActiveTab("outreach");
    } else {
      setCrmActiveTab("outreach");
    }

    // Scroll to CRM Action Center
    setTimeout(() => {
      const element = document.getElementById("crm-action-center");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#0f172a", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid rgba(255,255,255,0.1)", borderLeftColor: "var(--accent-blue)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 20px auto" }} />
          <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Loading CRM Workspace...</h2>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const delayedOrders = orders.filter(isActionableDelay);
  const delayedRevenue = delayedOrders.reduce((sum, o) => sum + (parseFloat(o.OrderValue) || 0), 0);

  // Calculate top delayed courier to show in the Copilot
  const courierDelays = {};
  delayedOrders.forEach(o => {
    courierDelays[o.Courier] = (courierDelays[o.Courier] || 0) + 1;
  });
  const worstCourier = Object.entries(courierDelays).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";


  const urgentOrders = orders.filter(
    o => o.Priority?.trim().toLowerCase() === "urgent" && o.Status?.trim().toLowerCase() !== "delivered"
  );
  const topPriorityOrders = [...urgentOrders].sort((a, b) => Number(b.OrderValue || 0) - Number(a.OrderValue || 0)).slice(0, 5);



  return (
    <div className="app-container">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="sidebar-nav">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#3b82f6" }}>
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Dispatch Dashboard</span>
          </div>
          <span className="sidebar-tagline">Mitigation & Operations</span>

          <nav className="sidebar-menu" style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
            {/* Executive Dashboard Section */}
            <div className="sidebar-section" style={{ marginTop: "10px" }}>
              <div className="sidebar-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                <span>Executive Dashboard</span>
              </div>
              <div className="sidebar-sub-links">
                <button
                  className={`sidebar-sub-link ${activeTab === "crm" && crmActiveTab === "outreach" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmActiveTab("outreach");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">📞 Customer Outreach</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "crm" && crmActiveTab === "delays" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmActiveTab("delays");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">⏱️ Delay Cases</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "crm" && crmActiveTab === "churn" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmActiveTab("churn");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">🛡️ Retention Actions</span>
                </button>
              </div>
            </div>

            {/* Logistics Analytics Section */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                <span>🚚 Logistics Analytics</span>
              </div>
              <div className="sidebar-sub-links">
                <button
                  className={`sidebar-sub-link ${activeTab === "logistics" && logisticsSubTab === "all" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("logistics");
                    setLogisticsSubTab("all");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">📋 Overview</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "logistics" && logisticsSubTab === "courier" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("logistics");
                    setLogisticsSubTab("courier");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">📦 Courier Performance</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "logistics" && logisticsSubTab === "regional" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("logistics");
                    setLogisticsSubTab("regional");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">🌍 Regional Delay Density</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "logistics" && logisticsSubTab === "status" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("logistics");
                    setLogisticsSubTab("status");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">📊 Status Distribution</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "logistics" && logisticsSubTab === "pipeline" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("logistics");
                    setLogisticsSubTab("pipeline");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">📈 Daily Pipeline</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "logistics" && logisticsSubTab === "trend" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("logistics");
                    setLogisticsSubTab("trend");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">📉 Revenue vs Delay</span>
                </button>
              </div>
            </div>

            {/* Products & Ratings Section */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span>⭐ Products & Ratings</span>
              </div>
              <div className="sidebar-sub-links">
                <button
                  className={`sidebar-sub-link ${activeTab === "products" && productsSubTab === "performance" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("products");
                    setProductsSubTab("performance");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">🏆 Product Performance</span>
                </button>
                <button
                  className={`sidebar-sub-link ${activeTab === "products" && productsSubTab === "ratings" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("products");
                    setProductsSubTab("ratings");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="sidebar-link-text">🌟 Customer Ratings</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sidebar-avatar">{getInitials(loggedInUser.name)}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{loggedInUser.name}</span>
                <span className="sidebar-user-role">{loggedInUser.role}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="btn-logout-sidebar"
              title="Logout from system"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--accent-red)";
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <main className="main-content-wrapper">
        <div className="dashboard-container" style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: activeTab === "dashboard" ? "15px" : "30px",
          padding: activeTab === "dashboard" ? "15px 20px" : "30px"
        }}>

          {/* HEADER SECTION */}
          <div className="dashboard-header" style={{ 
            marginBottom: 0,
            padding: activeTab === "dashboard" ? "12px 20px" : "25px 30px",
            borderRadius: activeTab === "dashboard" ? "15px" : "20px"
          }}>
            <div className="dashboard-header-title">
              <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#blue-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                  <defs>
                    <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                  </defs>
                  <rect width="20" height="14" x="2" y="3" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                {activeTab === "crm" && "Executive Dashboard"}
                {activeTab === "logistics" && "Logistics Analytics"}
                {activeTab === "products" && "Products & Ratings"}
              </h1>
              <p style={{ margin: "5px 0 0 0" }}>
                {activeTab === "crm" && "Centralized customer outreach, SLA breaches, and retention actions"}
                {activeTab === "logistics" && "Courier performance, regional delay density, daily pipelines, and revenue vs delay trends"}
                {activeTab === "products" && "Product performance metrics and customer satisfaction feedback"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <span className="badge badge-purple" style={{ padding: "8px 12px", borderRadius: "8px", display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
                June 4, 2026
              </span>
            </div>
          </div>

          {/* VIEW SWITCHER CONDITIONAL RENDERING */}
          {activeTab === "crm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-out" }}>
              
              {/* CRM Sub-Tabs Selector */}
              <div className="tab-container" style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "5px" }}>
                <button
                  className={`tab-btn ${crmActiveTab === "outreach" ? "active" : ""}`}
                  onClick={() => setCrmActiveTab("outreach")}
                  style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Customer Outreach
                </button>
                <button
                  className={`tab-btn ${crmActiveTab === "delays" ? "active" : ""}`}
                  onClick={() => setCrmActiveTab("delays")}
                  style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Delay Cases
                </button>
                <button
                  className={`tab-btn ${crmActiveTab === "churn" ? "active" : ""}`}
                  onClick={() => setCrmActiveTab("churn")}
                  style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Retention Actions
                </button>
              </div>

              {crmActiveTab === "outreach" && (
                <CRMActionCenter
                  orders={orders}
                  crmLogs={crmLogs}
                  onAddLog={handleAddLog}
                  search={crmSearch}
                  setSearch={setCrmSearch}
                  selectedExec={crmSelectedExec}
                  setSelectedExec={setCrmSelectedExec}
                  selectedCourier={crmSelectedCourier}
                  setSelectedCourier={setCrmSelectedCourier}
                  severityFilter={crmSeverityFilter}
                  setSeverityFilter={setCrmSeverityFilter}
                  valueFilter={crmValueFilter}
                  setValueFilter={setCrmValueFilter}
                  delayCategory={crmDelayCategory}
                  setDelayCategory={setCrmDelayCategory}
                  activeTab="outreach"
                  setActiveTab={setCrmActiveTab}
                  ratingFilter={crmRatingFilter}
                  setRatingFilter={setCrmRatingFilter}
                  riskFilter={crmRiskFilter}
                  setRiskFilter={setCrmRiskFilter}
                  sortBy={crmSortBy}
                  setSortBy={setCrmSortBy}
                />
              )}

              {crmActiveTab === "delays" && (
                <CRMActionCenter
                  orders={orders}
                  crmLogs={crmLogs}
                  onAddLog={handleAddLog}
                  search={crmSearch}
                  setSearch={setCrmSearch}
                  selectedExec={crmSelectedExec}
                  setSelectedExec={setCrmSelectedExec}
                  selectedCourier={crmSelectedCourier}
                  setSelectedCourier={setCrmSelectedCourier}
                  severityFilter={crmSeverityFilter}
                  setSeverityFilter={setCrmSeverityFilter}
                  valueFilter={crmValueFilter}
                  setValueFilter={setCrmValueFilter}
                  delayCategory={crmDelayCategory}
                  setDelayCategory={setCrmDelayCategory}
                  activeTab="delays"
                  setActiveTab={setCrmActiveTab}
                  ratingFilter={crmRatingFilter}
                  setRatingFilter={setCrmRatingFilter}
                  riskFilter={crmRiskFilter}
                  setRiskFilter={setCrmRiskFilter}
                  sortBy={crmSortBy}
                  setSortBy={setCrmSortBy}
                />
              )}

              {crmActiveTab === "churn" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "30px", animation: "fadeIn 0.3s ease-out" }}>
                  <CRMActionCenter
                    orders={orders}
                    crmLogs={crmLogs}
                    onAddLog={handleAddLog}
                    search={crmSearch}
                    setSearch={setCrmSearch}
                    selectedExec={crmSelectedExec}
                    setSelectedExec={setCrmSelectedExec}
                    selectedCourier={crmSelectedCourier}
                    setSelectedCourier={setCrmSelectedCourier}
                    severityFilter={crmSeverityFilter}
                    setSeverityFilter={setCrmSeverityFilter}
                    valueFilter={crmValueFilter}
                    setValueFilter={setCrmValueFilter}
                    delayCategory={crmDelayCategory}
                    setDelayCategory={setCrmDelayCategory}
                    activeTab="churn"
                    setActiveTab={setCrmActiveTab}
                    ratingFilter={crmRatingFilter}
                    setRatingFilter={setCrmRatingFilter}
                    riskFilter={crmRiskFilter}
                    setRiskFilter={setCrmRiskFilter}
                    sortBy={crmSortBy}
                    setSortBy={setCrmSortBy}
                  />

                  {/* COPILOT & ACTIONS ROW */}
                  <div className="copilot-actions-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "30px", marginBottom: 0 }}>
                    {/* AI DISPATCH & SLA MITIGATION COPILOT */}
                    <div className="ai-copilot-container" style={{ marginBottom: 0, height: "100%", boxSizing: "border-box", border: "1px solid rgba(139, 92, 246, 0.2)", background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)", boxShadow: "0 10px 30px rgba(139, 92, 246, 0.05)" }}>
                      <div className="ai-copilot-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                          <h2 style={{ margin: 0, fontSize: "1.15rem", background: "linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Dispatch & SLA Mitigation Copilot</h2>
                        </div>
                        <span className="ai-copilot-badge" style={{ background: "rgba(139,92,246,0.15)", color: "#cbd5e1", border: "1px solid rgba(139,92,246,0.3)" }}>AI Active Auditing</span>
                      </div>
                      <ul className="ai-copilot-tips">
                        <li>
                          <strong>SLA Warning Alert:</strong> There are currently <strong>{delayedOrders.length}</strong> customer shipments breaching standard courier delivery windows, risking <strong>₹{delayedRevenue.toLocaleString()}</strong> in booking revenue.
                        </li>
                        <li>
                          <strong>Courier Routing SLA Risk:</strong> Carrier partner <strong>{worstCourier}</strong> is responsible for the highest density of current delays. We advise prioritizing cargo partner overrides for high-value booking zones.
                        </li>
                        <li>
                          <strong>CRM Recommendation:</strong> Delayed orders exceed SLA by over 5 days. We recommend launching the outreach portal and issuing retention discount coupons to protect customer goodwill.
                        </li>
                      </ul>
                    </div>

                    {/* EXECUTIVE ACTIONS DUE TODAY */}
                    <ExecutiveActions onActionTrigger={handleActionTrigger} />
                  </div>

                  {/* High-Value Urgent Orders Table */}
                  <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <h2 style={{ margin: 0, border: "none", padding: 0 }}>🚨 High-Priority Urgent Orders</h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "5px 0 0 0" }}>
                        Critical shipments and high-value orders requiring immediate action.
                      </p>
                    </div>
                    <div className="table-wrapper">
                      <table className="crm-table" style={{ width: "100%", fontSize: "0.85rem" }}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Courier</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topPriorityOrders.length > 0 ? (
                            topPriorityOrders.map(o => (
                              <tr key={o.OrderID}>
                                <td style={{ fontWeight: "600", color: "var(--accent-blue)" }}>{o.OrderID}</td>
                                <td>{o.Customer}</td>
                                <td>{o.Courier}</td>
                                <td>
                                  <span className={`badge badge-${
                                    o.Status?.toLowerCase() === "in transit" ? "blue" : "purple"
                                  }`}>
                                    {o.Status}
                                  </span>
                                </td>
                                <td style={{ textAlign: "right", fontWeight: "600" }}>
                                  ₹{(Number(o.OrderValue) || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>
                                No active high-priority orders.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "logistics" && (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              <AnalyticsView orders={orders} activeTab="logistics" subTab={logisticsSubTab} />
            </div>
          )}

          {activeTab === "products" && (
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              <AnalyticsView orders={orders} activeTab="products" subTab={productsSubTab} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}