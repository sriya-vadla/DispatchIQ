import React, { useState, useEffect } from "react";
import { PhoneCall, AlertTriangle, UserPlus, Mail, CheckCircle, Check, ChevronLeft, Users } from "lucide-react";

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
        <PhoneCall size={18} strokeWidth={2.5} />
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
        <AlertTriangle size={18} strokeWidth={2.5} />
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
        <UserPlus size={18} strokeWidth={2.5} />
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
        <Mail size={18} strokeWidth={2.5} />
      )
    }
  ];

  return (
    <div style={{ padding: "0 0 20px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {actionItems.map(action => (
          <div 
            key={action.id} 
            className="panel action-card-hover" 
            style={{ 
              padding: "16px 20px", 
              cursor: "pointer", 
              borderLeft: completed[action.id] ? "3px solid var(--accent-green)" : "3px solid transparent",
              opacity: completed[action.id] ? 0.6 : 1,
              transition: "all 0.2s"
            }}
            onClick={() => handleActionClick(action.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ color: "var(--text-secondary)" }}>
                  {action.icon}
                </div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: completed[action.id] ? "var(--text-secondary)" : "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  {action.title}
                  {completed[action.id] && <CheckCircle size={14} color="var(--accent-green)" strokeWidth={2.5} />}
                </h4>
              </div>
              <span className={`badge ${action.badgeClass}`}>{action.badge}</span>
            </div>
            
            <p style={{ margin: "0 0 6px 0", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>
              {action.subtitle}
            </p>
            <p style={{ margin: "0 0 12px 0", fontSize: "0.82rem", color: "#94a3b8", lineHeight: "1.5" }}>
              {action.description}
            </p>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                className="btn btn-secondary btn-small"
                onClick={(e) => toggleComplete(action.id, e)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  borderColor: completed[action.id] ? "var(--accent-green)" : "var(--border-color)",
                  color: completed[action.id] ? "var(--accent-green)" : "var(--text-secondary)"
                }}
              >
                {completed[action.id] ? (
                  <><Check size={14} strokeWidth={3} /> Completed</>
                ) : (
                  "Mark as Done"
                )}
              </button>
              
              <div style={{ color: "var(--accent-blue)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                Take Action <ChevronLeft size={14} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-purple)", margin: 0 }}>
                <Users size={18} strokeWidth={2.5} color="var(--accent-purple)" />
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
            <Check size={14} strokeWidth={3} />
          </div>
          <span style={{ fontSize: "0.88rem", fontWeight: "600" }}>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
