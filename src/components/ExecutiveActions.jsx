import React, { useState, useEffect } from "react";

export default function ExecutiveActions({ onActionTrigger, loggedInUser }) {
  // Load completed actions from localStorage
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem("crm_executive_actions_completed");
    return saved ? JSON.parse(saved) : {
      "call-amit": false,
      "escalate-delhivery": false,
      "assign-rahul": false,
      "issue-coupon": false
    };
  });

  // Modal for Rahul West Region assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("crm_executive_actions_completed", JSON.stringify(completed));
  }, [completed]);

  const toggleComplete = (id, e) => {
    e.stopPropagation(); // prevent triggering the action scroll/filters when checking off
    if (loggedInUser?.role === "Business Analyst") {
      setToastMessage("Read-only access: Business Analysts cannot modify action items.");
      setTimeout(() => {
        setToastMessage("");
      }, 3000);
      return;
    }
    setCompleted(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleActionClick = (id) => {
    if (loggedInUser?.role === "Business Analyst") {
      setToastMessage("Read-only access: Business Analysts cannot trigger executive actions.");
      setTimeout(() => {
        setToastMessage("");
      }, 3000);
      return;
    }
    if (id === "assign-rahul") {
      setShowAssignModal(true);
      return;
    }
    // Trigger scroll and filter changes in parent Dashboard
    if (onActionTrigger) {
      onActionTrigger(id);
    }
  };

  const handleConfirmAssignment = () => {
    setCompleted(prev => ({
      ...prev,
      "assign-rahul": true
    }));
    setShowAssignModal(false);
    
    // Show premium toast notification
    setToastMessage("Rahul has been successfully reassigned to West Region Operations.");
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const actionItems = [
    {
      id: "call-amit",
      title: "Call Amit Kumar",
      subtitle: "Revenue at Risk: ₹90,000",
      description: "ORD1270 & ORD1273 delayed. Spoke to cargo? Call client directly.",
      badge: "₹90k Risk",
      badgeClass: "badge-red",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      )
    },
    {
      id: "escalate-delhivery",
      title: "Escalate Delhivery SLA",
      subtitle: "7 Active Breaches",
      description: "Delhivery logistics cluster has 7 active delays. Route official warning ticket.",
      badge: "7 Breaches",
      badgeClass: "badge-amber",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      )
    },
    {
      id: "assign-rahul",
      title: "Assign Rahul to West Region",
      subtitle: "West Dispatcher Overload (34%)",
      description: "West region delay density is critical. Assign Rahul to west region dispatcher team.",
      badge: "Dispatch Load",
      badgeClass: "badge-purple",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      )
    },
    {
      id: "issue-coupon",
      title: "Issue Retention Coupon",
      subtitle: "Goodwill Compensation",
      description: "Protect customer relationship by pre-approving goodwill coupons for delayed orders.",
      badge: "SLA Protection",
      badgeClass: "badge-blue",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H3v10h10"/><path d="M18 22v-6"/><path d="M15 19h6"/><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M12 17h.01"/></svg>
      )
    }
  ];

  const totalActions = actionItems.length;
  const completedActions = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedActions / totalActions) * 100);

  return (
    <div className="panel" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "1px solid var(--border-color)", borderRadius: "18px", padding: "24px", position: "relative" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <h2 style={{ margin: 0, padding: 0, border: "none", fontSize: "1.15rem", background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Executive Actions Due Today
          </h2>
        </div>
        <span className="badge badge-amber" style={{ fontSize: "0.7rem" }}>Actions Required</span>
      </div>

      {/* Progress Tracker */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
          <span>Action Checklist Progress</span>
          <span style={{ fontWeight: "700", color: progressPercent === 100 ? "var(--accent-green)" : "var(--text-primary)" }}>{completedActions} of {totalActions} ({progressPercent}%)</span>
        </div>
        <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: progressPercent === 100 ? "var(--accent-green)" : "var(--accent-amber)", borderRadius: "3px", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
      </div>

      {/* Checklist List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {actionItems.map(item => {
          const isDone = completed[item.id];
          return (
            <div 
              key={item.id}
              onClick={() => handleActionClick(item.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                padding: "14px",
                borderRadius: "12px",
                backgroundColor: isDone ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                border: isDone ? "1px solid rgba(255,255,255,0.03)" : "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                opacity: isDone ? 0.6 : 1
              }}
              className="action-card-hover"
            >
              {/* Checkbox */}
              <div 
                onClick={(e) => toggleComplete(item.id, e)}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  border: isDone ? "2px solid var(--accent-green)" : "2px solid var(--text-secondary)",
                  backgroundColor: isDone ? "var(--accent-green)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "2px",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
              >
                {isDone && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "5px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.92rem", textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--text-secondary)" : "#e2e8f0", fontWeight: "600" }}>
                    {item.title}
                  </h4>
                  <span className={`badge ${item.badgeClass}`} style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{item.badge}</span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {item.description}
                </p>
              </div>

              {/* Action arrow */}
              <div style={{ color: "rgba(255,255,255,0.2)", alignSelf: "center", display: "flex", paddingLeft: "5px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Assignment */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Workload Balance Assignment
              </h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <p style={{ margin: "0 0 15px 0", fontSize: "0.92rem", lineHeight: "1.6" }}>
                You are assigning <strong>Rahul Sharma (Sales Executive)</strong> to the <strong>West Region dispatcher team</strong>.
              </p>
              <div style={{ backgroundColor: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "10px", padding: "12px", fontSize: "0.82rem", color: "#d8b4fe", marginBottom: "15px" }}>
                <strong>Density Insight:</strong> West region represents <strong>34%</strong> of all active actionable delays. Moving Rahul to dispatch logistics operations will rebalance workload levels by 15%.
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                This operation will log a record in operations planning and mark this action as completed.
              </p>
            </div>
            <div className="modal-footer" style={{ padding: "12px 20px" }}>
              <button className="btn btn-secondary btn-small" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn btn-small" style={{ backgroundColor: "var(--accent-purple)" }} onClick={handleConfirmAssignment}>Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          backgroundColor: "#1e1b4b",
          border: "1px solid var(--accent-purple)",
          color: "var(--text-primary)",
          padding: "16px 20px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(169, 85, 247, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-purple)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style={{ fontSize: "0.88rem", fontWeight: "600" }}>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
