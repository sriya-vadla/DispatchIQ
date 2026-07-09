import React, { useState } from "react";
import { getEscalationLevel, getDaysAgoText, getSLATimer } from "../utils/delayHelpers";

export default function TicketManagement({ tickets = [], onUpdateTicket, preFilterEscalated = false }) {
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showAllTickets, setShowAllTickets] = useState(false);
  
  // State for editing within drawer
  const [newNoteText, setNewNoteText] = useState("");
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);

  // Find currently selected ticket
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Filters and search
  const filteredTickets = tickets.filter(ticket => {
    if (preFilterEscalated) {
      const isEscalatedOrCritical = ticket.status === "Escalated" || ticket.priority === "Critical";
      if (!isEscalatedOrCritical) return false;
    }

    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.customer && ticket.customer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ticket.issue && ticket.issue.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getFormattedDate = () => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${String(now.getFullYear()).substring(2)}`;
  };

  // Handle drawer save (status, owner, or note changes)
  const handleUpdateField = (field, value) => {
    if (!selectedTicket) return;
    const updated = {
      ...selectedTicket,
      [field]: value,
      lastUpdated: getFormattedDate()
    };
    onUpdateTicket(updated);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedTicket) return;

    const dateStr = getFormattedDate();
    const shortDate = dateStr.substring(0, 6); // e.g. "10-Jun"

    const newNote = {
      date: shortDate,
      text: newNoteText.trim()
    };

    const updated = {
      ...selectedTicket,
      notes: [...(selectedTicket.notes || []), newNote],
      lastUpdated: dateStr
    };

    // If status changed or escalated note was added, we can update status
    if (newNoteText.toLowerCase().includes("escalated")) {
      updated.status = "Escalated";
    } else if (newNoteText.toLowerCase().includes("resolved")) {
      updated.status = "Resolved";
    } else if (newNoteText.toLowerCase().includes("closed")) {
      updated.status = "Closed";
    }

    onUpdateTicket(updated);
    setNewNoteText("");
  };

  // Helper for status badge colors
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open": return "badge-blue"; // Blue
      case "Assigned": return "badge-purple"; // Indigo/Purple
      case "In Progress": return "badge-amber"; // Yellow
      case "Escalated": return "badge-red"; // Red
      case "Resolved": return "badge-green"; // Green
      case "Closed": return "badge-secondary"; // Grey
      default: return "badge-secondary";
    }
  };

  // Helper for priority badge colors
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Critical": return "badge-red";
      case "High": return "badge-amber";
      case "Medium": return "badge-blue";
      case "Low": return "badge-green";
      default: return "badge-secondary";
    }
  };

  // Helper for escalation badge colors
  const getEscalationBadgeClass = (level) => {
    switch (level) {
      case "Executive Intervention":
      case "Legal Review":
        return "badge-red";
      case "Courier Contract Review":
      case "Finance Approval":
        return "badge-purple";
      case "Regional Manager Review":
      case "Operations Escalation":
        return "badge-amber";
      case "Customer Retention":
        return "badge-blue";
      case "Level 1 Support":
      default:
        return "badge-green";
    }
  };


  const activeTickets = tickets.filter(t => ["Open", "In Progress", "Escalated", "Assigned"].includes(t.status));
  const affectedCustomers = new Set(activeTickets.map(t => t.customer).filter(Boolean)).size;
  const revenueAtRisk = activeTickets.reduce((sum, t) => sum + (Number(t.breakdown?.value || 0)), 0);

  const formatLakhs = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h2 style={{ margin: 0, border: "none", padding: 0, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
            🎫 Ticket Management System
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
            Monitor and resolve automated SLA breaches, courier delays, and custom outreach tickets.
          </p>
        </div>
        
        {/* Quick count badges */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <span className="badge badge-blue">Open: {tickets.filter(t => t.status === "Open").length}</span>
          <span className="badge badge-amber">In Progress: {tickets.filter(t => t.status === "In Progress").length}</span>
          <span className="badge badge-red">Escalated: {tickets.filter(t => t.status === "Escalated").length}</span>
          <span className="badge badge-green">Resolved: {tickets.filter(t => t.status === "Resolved").length}</span>
          <span className="badge badge-purple" style={{ border: "1px solid rgba(167, 139, 250, 0.4)", background: "rgba(167, 139, 250, 0.1)", color: "#c084fc", fontWeight: "700" }}>
            Avg Resolution: {(() => {
              const resolved = tickets.filter(t => t.status === "Resolved" && t.age);
              if (resolved.length > 0) {
                let totalDays = 0;
                resolved.forEach(t => {
                  if (t.age.includes("Hour")) {
                    const hours = parseFloat(t.age) || 8;
                    totalDays += hours / 24;
                  } else {
                    const days = parseFloat(t.age) || 2;
                    totalDays += days;
                  }
                });
                return `${(totalDays / resolved.length).toFixed(1)} Days`;
              }
              return "2.8 Days";
            })()}
          </span>
        </div>
      </div>

      {/* Financial Focus Banner */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "15px", 
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--bg-tertiary) 100%)", 
        padding: "16px 20px", 
        borderRadius: "12px", 
        border: "1px solid rgba(239, 68, 68, 0.2)",
        marginBottom: "5px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "2rem" }}>💰</span>
          <div>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Revenue At Risk</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.45rem", fontWeight: "800", color: "#f87171", border: "none", padding: 0 }}>
              {formatLakhs(revenueAtRisk)}
            </h3>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid rgba(255, 255, 255, 0.08)", paddingLeft: "20px" }}>
          <span style={{ fontSize: "2rem" }}>👥</span>
          <div>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Affected Customers</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.45rem", fontWeight: "800", color: "#fca5a5", border: "none", padding: 0 }}>
              {affectedCustomers} Customers
            </h3>
          </div>
        </div>
      </div>

      {/* Filters and search bar */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "12px", 
        alignItems: "center", 
        background: "rgba(30, 41, 59, 0.2)", 
        padding: "12px 18px", 
        borderRadius: "10px", 
        border: "1px solid var(--border-color)" 
      }}>
        <div style={{ flex: "1 1 200px" }}>
          <input
            type="text"
            placeholder="Search Ticket, Order, Customer, Issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem" }}
          />
        </div>
        
        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: "0.85rem" }}
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: "0.85rem" }}
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
          Showing <strong>{Math.min(showAllTickets ? filteredTickets.length : 10, filteredTickets.length)}</strong> of <strong>{filteredTickets.length}</strong> tickets
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="table-wrapper">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Created</th>
              <th>Last Updated</th>
              <th>Order ID</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Age</th>
              <th>Owner</th>
              <th>Escalation</th>
              <th>SLA Status</th>
              <th>Business Impact</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              (showAllTickets ? filteredTickets : filteredTickets.slice(0, 10)).map((ticket) => {
                const escLevel = ticket.escalation || getEscalationLevel(ticket.orderId, ticket.breakdown?.delayDays || 0, ticket.breakdown?.value || 0, ticket.breakdown?.isVIP);
                const sla = getSLATimer(ticket);
                let slaBadgeClass = "badge-blue";
                if (sla.status === "met") slaBadgeClass = "badge-green";
                else if (sla.status === "breached") slaBadgeClass = "badge-red";
                else if (sla.status === "warning") slaBadgeClass = "badge-amber";

                // Business Impact Score Badge style
                let riskColor = "#10b981"; // Low
                let riskBg = "rgba(16, 185, 129, 0.1)";
                let riskLabel = "Low";
                const riskScore = ticket.aiScore || 45;
                if (riskScore >= 85) {
                  riskColor = "#ef4444"; // Critical
                  riskBg = "rgba(239, 68, 68, 0.1)";
                  riskLabel = "Critical";
                } else if (riskScore >= 65) {
                  riskColor = "#f59e0b"; // High
                  riskBg = "rgba(245, 158, 11, 0.1)";
                  riskLabel = "High";
                } else if (riskScore >= 40) {
                  riskColor = "#3b82f6"; // Medium
                  riskBg = "rgba(59, 130, 246, 0.1)";
                  riskLabel = "Medium";
                }

                return (
                  <tr key={ticket.id}>
                    <td style={{ fontWeight: "bold", color: "#3b82f6" }}>{ticket.id}</td>
                    <td>{ticket.created}</td>
                    <td>{ticket.lastUpdated || ticket.created}</td>
                    <td>{ticket.orderId}</td>
                    <td>{ticket.issue}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{ticket.age || "1 Day"}</td>
                    <td>{ticket.owner}</td>
                    <td>
                      <span className={`badge ${getEscalationBadgeClass(escLevel)}`}>
                        {escLevel}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${slaBadgeClass}`}>
                        {sla.text}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ color: riskColor, background: riskBg, border: `1px solid ${riskColor}33`, fontWeight: "800" }}>
                        {riskLabel}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => {
                          setSelectedTicketId(ticket.id);
                          setShowAIBreakdown(false);
                        }}
                        style={{ padding: "5px 12px", display: "inline-flex", gap: "4px" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="13" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                  No tickets found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredTickets.length > 10 && (
        <button className="view-all-btn" onClick={() => setShowAllTickets(p => !p)}>
          {showAllTickets ? (
            <><span>▲</span> Show Top 10 Only</>
          ) : (
            <><span>▼</span> View All {filteredTickets.length} Tickets</>
          )}
        </button>
      )}

      {/* SIDE DRAWER FOR TICKET MANAGEMENT */}
      {selectedTicket && (
        <div className="drawer-backdrop" onClick={() => setSelectedTicketId(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="drawer-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
                    Ticket {selectedTicket.id}
                  </h3>
                  <span className={`badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "4px 0 0 0" }}>
                  Associated Order: <strong style={{ color: "var(--text-primary)" }}>{selectedTicket.orderId}</strong>
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedTicketId(null)}>&times;</button>
            </div>

            {/* Body */}
            <div className="drawer-body">
              
              {/* Customer Details Summary */}
              <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "bold" }}>Customer</span>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.9rem", fontWeight: "600" }}>{selectedTicket.customer || "N/A"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "bold" }}>Created Date</span>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.9rem", fontWeight: "600" }}>{selectedTicket.created || "N/A"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "bold" }}>Last Updated</span>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.9rem", fontWeight: "600" }}>{selectedTicket.lastUpdated || selectedTicket.created || "N/A"}</p>
                </div>
                <div style={{ gridColumn: "span 3" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: "bold" }}>Issue Description</span>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.9rem", fontWeight: "600", color: "#e2e8f0" }}>{selectedTicket.issue}</p>
                </div>
              </div>

              {/* SLA Resolution Status Alert */}
              {(() => {
                const sla = getSLATimer(selectedTicket);
                const daysAgo = getDaysAgoText(selectedTicket.created);
                const escLevel = selectedTicket.escalation || getEscalationLevel(selectedTicket.orderId, selectedTicket.breakdown?.delayDays || 0, selectedTicket.breakdown?.value || 0, selectedTicket.breakdown?.isVIP);
                
                let cardBg = "rgba(59, 130, 246, 0.08)";
                let cardBorder = "1px solid rgba(59, 130, 246, 0.2)";
                let cardColor = "var(--accent-blue)";
                if (sla.status === "breached") {
                  cardBg = "rgba(239, 68, 68, 0.08)";
                  cardBorder = "1px solid rgba(239, 68, 68, 0.25)";
                  cardColor = "var(--accent-red)";
                } else if (sla.status === "warning") {
                  cardBg = "rgba(245, 158, 11, 0.08)";
                  cardBorder = "1px solid rgba(245, 158, 11, 0.25)";
                  cardColor = "var(--accent-amber)";
                } else if (sla.status === "met") {
                  cardBg = "rgba(16, 185, 129, 0.08)";
                  cardBorder = "1px solid rgba(16, 185, 129, 0.2)";
                  cardColor = "var(--accent-green)";
                }

                return (
                  <div style={{ margin: "15px 0" }}>
                    <div style={{ background: cardBg, border: cardBorder, borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" }}>SLA Resolution Timer</div>
                        <div style={{ fontSize: "1.05rem", fontWeight: "800", color: cardColor, marginTop: "4px" }}>
                          {sla.text}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Opened: {daysAgo}</span>
                        <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f1f5f9", marginTop: "4px" }}>
                          Escalation: <span className={`badge ${getEscalationBadgeClass(escLevel)}`} style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{escLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CUSTOMER LIFETIME VALUE AND BUSINESS IMPACT */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                
                {/* CUSTOMER LIFETIME VALUE */}
                <div className="ai-risk-card" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div className="ai-risk-header" style={{ marginBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.1rem" }}>💎</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "bold", color: "var(--text-primary)" }}>Customer Lifetime Value</h4>
                        </div>
                      </div>
                      {selectedTicket.breakdown?.isVIP && (
                        <span className="badge badge-purple" style={{ padding: "4px 8px", fontSize: "0.7rem", fontWeight: "bold", border: "1px solid #c084fc33" }}>VIP Priority</span>
                      )}
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-green)", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                      ₹2,40,000
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    <div style={{ flex: 1, background: "var(--bg-tertiary)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", fontWeight: "bold" }}>Total Orders</div>
                      <strong style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}>48</strong>
                    </div>
                    <div style={{ flex: 1, background: "var(--bg-tertiary)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", fontWeight: "bold" }}>Customer Since</div>
                      <strong style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}>2023</strong>
                    </div>
                  </div>
                </div>

                {/* BUSINESS IMPACT SCORE BREAKDOWN */}
                <div className="ai-risk-card" style={{ margin: 0 }}>
                <div className="ai-risk-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.1rem" }}>⭐</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "bold", color: "var(--text-primary)" }}>Business Impact Score</h4>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: "1.3" }}>
                        Weighted score based on Revenue value, Customer importance, Delay severity, and Escalation risk.
                        <br/>
                        <span style={{ fontSize: "0.68rem", color: "var(--accent-purple)", fontWeight: "600" }}>
                          Formula: Delay Days (up to 30) + Value (up to 45) + VIP (15) + Complaints (10)
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="ai-risk-score-badge" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", height: "auto" }}>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: "normal" }}>Level</span>
                    <strong style={{ fontSize: "1.05rem" }}>{selectedTicket.priority}</strong>
                    <span style={{ fontSize: "0.7rem", color: "#a78bfa", marginTop: "2px" }}>{selectedTicket.aiScore}/100</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                    Impact Level: <strong className={`badge ${getPriorityBadgeClass(selectedTicket.priority)}`} style={{ textTransform: "uppercase", fontSize: "0.7rem", marginLeft: "6px" }}>{selectedTicket.priority}</strong>
                  </span>
                  <button 
                    onClick={() => setShowAIBreakdown(!showAIBreakdown)}
                    className="btn btn-small btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "0.72rem", display: "inline-flex", gap: "3px" }}
                  >
                    {showAIBreakdown ? "Hide Breakdown ▲" : "Show Breakdown ▼"}
                  </button>
                </div>

                {/* Mathematical breakdown */}
                {showAIBreakdown && (
                  <div className="ai-breakdown-details">
                    <div className="ai-breakdown-row">
                      <span>Delay Severity ({selectedTicket.breakdown?.delayDays || 0} days):</span>
                      <strong style={{ color: "#cbd5e1" }}>+{Math.min(30, (selectedTicket.breakdown?.delayDays || 0) * 3)} pts</strong>
                    </div>
                    <div className="ai-breakdown-row">
                      <span>Revenue Value (₹{(selectedTicket.breakdown?.value || 0).toLocaleString()}):</span>
                      <strong style={{ color: "#cbd5e1" }}>+{Math.min(45, Math.floor((selectedTicket.breakdown?.value || 0) / 2000))} pts</strong>
                    </div>
                    <div className="ai-breakdown-row">
                      <span>Customer Importance ({selectedTicket.breakdown?.isVIP ? "VIP" : "Regular"}):</span>
                      <strong style={{ color: "#cbd5e1" }}>+{selectedTicket.breakdown?.isVIP ? 15 : 5} pts</strong>
                    </div>
                    <div className="ai-breakdown-row">
                      <span>Escalation Risk ({selectedTicket.breakdown?.prevComplaints || 0} complaints):</span>
                      <strong style={{ color: "#cbd5e1" }}>+{Math.min(10, (selectedTicket.breakdown?.prevComplaints || 0) * 5)} pts</strong>
                    </div>
                    <div className="ai-breakdown-row" style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "8px", marginTop: "4px", fontWeight: "bold", color: "#c084fc" }}>
                      <span>Total Business Impact:</span>
                      <span>{selectedTicket.aiScore} / 100</span>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Assignment & Status Controls */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px" }}>Assigned Owner</label>
                  <select
                    value={selectedTicket.owner}
                    onChange={(e) => handleUpdateField("owner", e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }}
                  >
                    <option value="Operations Team">Operations Team</option>
                    <option value="Ravi">Ravi</option>
                    <option value="Priya">Priya</option>
                    <option value="Rahul">Rahul</option>
                    <option value="Anjali">Anjali</option>
                    <option value="Suresh">Suresh</option>
                    <option value="Karthik">Karthik</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px" }}>Ticket Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateField("status", e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }}
                  >
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Communications Notes History Timeline */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.85rem", fontWeight: "bold", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>
                  📋 Resolution Activity Log
                </h4>
                
                {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                  <div className="timeline">
                    {selectedTicket.notes.map((note, idx) => {
                      // Custom classes based on note keywords
                      let itemClass = "";
                      if (note.text.toLowerCase().includes("escalated")) itemClass = "escalated";
                      else if (note.text.toLowerCase().includes("resolved") || note.text.toLowerCase().includes("coupon")) itemClass = "resolved";
                      else if (note.text.toLowerCase().includes("closed")) itemClass = "closed";

                      return (
                        <div key={idx} className={`timeline-item ${itemClass}`}>
                          <div className="timeline-meta">{note.date}</div>
                          <div className="timeline-content">{note.text}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic", margin: "5px 0" }}>
                    No notes recorded yet for this ticket.
                  </p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold", textTransform: "uppercase" }}>
                  Add Action Entry / Note
                </label>
                <textarea
                  placeholder="Record call summary, email updates, coupons sent, or escalation logs... (Type 'escalated', 'resolved', or 'closed' to auto-update ticket status)"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ fontSize: "0.85rem", padding: "10px", minHeight: "70px", backgroundColor: "var(--bg-primary)" }}
                  required
                />
                <button type="submit" className="btn btn-small" style={{ alignSelf: "flex-end", padding: "8px 16px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Entry
                </button>
              </form>

            </div>

            {/* Footer */}
            <div className="drawer-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedTicketId(null)}
                style={{ padding: "8px 16px" }}
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
