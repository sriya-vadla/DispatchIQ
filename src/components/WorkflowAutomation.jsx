import React, { useState, useEffect } from "react";
import { isActionableDelay } from "../utils/delayHelpers";

export default function WorkflowAutomation({ 
  orders = [], 
  tickets = [], 
  onAddLog,
  highlightRuleId = null,
  highlightTarget = ""
}) {
  const [showAllLogs, setShowAllLogs] = useState(false);
  // Existing default rules
  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem("crm_workflow_rules");
    return saved ? JSON.parse(saved) : [
      { id: 1, trigger: "Delay > 5 Days", action: "Create Support Ticket", active: true, category: "CRM" },
      { id: 2, trigger: "Delay > 7 Days", action: "Trigger Customer Outreach Alert", active: true, category: "Logistics" },
      { id: 3, trigger: "CSAT < 2.0", action: "Flag for Executive Compensation Review", active: true, category: "Retention" },
      { id: 4, trigger: "Order Value > ₹50,000 & Delay > 3 Days", action: "Escalate to VIP Support", active: true, category: "Customer Experience" }
    ];
  });

  const [automationLogs, setAutomationLogs] = useState(() => {
    const saved = localStorage.getItem("crm_automation_logs");
    let parsed = saved ? JSON.parse(saved) : [
      { id: 1, timestamp: "2026-06-17 10:24 AM", rule: "Delay > 5 Days", target: "Order #ORD-9844 (Priya Reddy)", result: "Customer Outreach Sent", channel: "Email" },
      { id: 2, timestamp: "2026-06-17 09:15 AM", rule: "CSAT < 2.0", target: "Order #ORD-9102 (Amit Kumar)", result: "Courier Escalation Sent", channel: "WhatsApp" },
      { id: 3, timestamp: "2026-06-16 04:30 PM", rule: "Order Value > ₹50k & Delay > 3 Days", target: "Order #ORD-1294 (Neha Gupta)", result: "VIP Escalation Alert", channel: "SMS" }
    ];
    if (!parsed.some(log => log.target.includes("ORD1011"))) {
      parsed = [
        { id: 99, timestamp: "2026-06-24 11:30 AM", rule: "CSAT < 2.0", target: "Order #ORD1011 (Vikram Singh)", result: "Pending approval: ₹500 credit", channel: "Internal" },
        ...parsed
      ];
    }
    return parsed;
  });

  const [newTrigger, setNewTrigger] = useState("Delay > 5 Days");
  const [newAction, setNewAction] = useState("Create Support Ticket");
  const [newCategory, setNewCategory] = useState("CRM");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("crm_workflow_rules", JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem("crm_automation_logs", JSON.stringify(automationLogs));
  }, [automationLogs]);

  const handleToggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    const newRule = {
      id: Date.now(),
      trigger: newTrigger,
      action: newAction,
      active: true,
      category: newCategory
    };
    setRules([...rules, newRule]);
    
    setToastMessage(`Workflow rule added successfully!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeleteRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleRunSimulation = () => {
    const matches = [];
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    // Simulate finding matching cases
    const delayExceeds5 = orders.filter(isActionableDelay);

    if (rules.find(r => r.trigger === "Delay > 5 Days" && r.active) && delayExceeds5.length > 0) {
      const targetOrder = delayExceeds5[Math.floor(Math.random() * delayExceeds5.length)];
      matches.push({
        rule: "Delay > 5 Days",
        target: `Order #${targetOrder.OrderID} (${targetOrder.Customer || "VIP Client"})`,
        result: "SLA breach ticket auto-created"
      });
    }

    // CSAT < 2 simulation
    const lowCSAT = orders.filter(o => {
      const rating = Number(o.CustomerRating || o.CSAT || 5);
      return rating > 0 && rating <= 2;
    });
    if (rules.find(r => r.trigger === "CSAT < 2.0" && r.active) && lowCSAT.length > 0) {
      const targetOrder = lowCSAT[Math.floor(Math.random() * lowCSAT.length)];
      matches.push({
        rule: "CSAT < 2.0",
        target: `Order #${targetOrder.OrderID} (${targetOrder.Customer || "Client"})`,
        result: "Compensation review flag enabled"
      });
    }

    if (matches.length > 0) {
      const newLogs = matches.map((m, idx) => ({
        id: Date.now() + idx,
        timestamp: nowStr,
        rule: m.rule,
        target: m.target,
        result: m.result,
        channel: m.channel || "Internal"
      }));

      setAutomationLogs([...newLogs, ...automationLogs]);
      setToastMessage(`Scanned ${orders.length} orders. Triggered ${matches.length} automations!`);
    } else {
      setToastMessage(`Scanned ${orders.length} orders. All workflows are in compliance.`);
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {showToast && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          backgroundColor: "#10b981",
          color: "var(--text-primary)",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
          fontWeight: "700",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease-out"
        }}>
          ✅ {toastMessage}
        </div>
      )}

      {/* Automation Statistics Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
        <div className="panel" style={{ padding: "16px", textAlign: "center", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "12px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#60a5fa" }}>12</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "4px" }}>Active Rules</div>
        </div>
        <div className="panel" style={{ padding: "16px", textAlign: "center", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "12px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#c084fc" }}>48</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "4px" }}>Triggered Today</div>
        </div>
        <div className="panel" style={{ padding: "16px", textAlign: "center", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)", borderRadius: "12px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#fbbf24" }}>16</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "4px" }}>Tickets Created</div>
        </div>
        <div className="panel" style={{ padding: "16px", textAlign: "center", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "12px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f87171" }}>8</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "4px" }}>Outreach Events</div>
        </div>
        <div className="panel" style={{ padding: "16px", textAlign: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "12px" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#34d399" }}>98%</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "4px" }}>Success Rate</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
        
        {/* Active Rules List */}
        <div id="workflow-automation-rules" className="panel" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ margin: 0, border: "none", padding: 0 }}>🤖 Active Automation Workflows</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Define conditional actions to execute automatically when specific operational event parameters are met.
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleRunSimulation}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#8b5cf6", border: "none", color: "var(--text-primary)", cursor: "pointer", fontWeight: "700", padding: "10px 16px", borderRadius: "8px" }}
            >
              ⚡ Run Workflows Now
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            {rules.map(rule => (
              <div 
                key={rule.id}
                className={rule.id === highlightRuleId ? "highlight-pulse-green" : ""}
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "16px", 
                  borderRadius: "12px", 
                  border: "1px solid var(--border-color)",
                  background: rule.active ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, var(--bg-tertiary) 100%)" : "rgba(30, 41, 59, 0.1)",
                  opacity: rule.active ? 1 : 0.6
                }}
              >
                <div>
                  <div style={{ marginBottom: "10px" }}>
                    <span className="badge" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      {rule.category || "General"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="badge" style={{ backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>IF</span>
                    <strong style={{ color: "#e2e8f0" }}>{rule.trigger}</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <span className="badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>THEN</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{rule.action}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <label className="switch" style={{ position: "relative", display: "inline-block", width: "40px", height: "20px" }}>
                    <input 
                      type="checkbox" 
                      checked={rule.active} 
                      onChange={() => handleToggleRule(rule.id)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: rule.active ? "#8b5cf6" : "#475569",
                      transition: "0.4s", borderRadius: "20px"
                    }}>
                      <span style={{
                        position: "absolute", content: '""', height: "14px", width: "14px", left: rule.active ? "22px" : "3px", bottom: "3px",
                        backgroundColor: "white", transition: "0.4s", borderRadius: "50%"
                      }} />
                    </span>
                  </label>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.1rem" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rule Builder Form */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <h2>➕ Create Custom Workflow Rule</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
            Configure condition logic triggers and associate target resolution responses.
          </p>

          <form onSubmit={handleAddRule} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.85rem" }}>Trigger Condition (IF)</label>
              <select 
                value={newTrigger} 
                onChange={(e) => setNewTrigger(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              >
                <option value="Delay > 3 Days">Delay exceeds 3 Days</option>
                <option value="Delay > 5 Days">Delay exceeds 5 Days</option>
                <option value="Delay > 7 Days">Delay exceeds 7 Days</option>
                <option value="CSAT < 2.0">CSAT Score falls below 2.0</option>
                <option value="CSAT < 3.0">CSAT Score falls below 3.0</option>
                <option value="Order Value > ₹50,000">Order Value exceeds ₹50,000</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.85rem" }}>Resolution Action (THEN)</label>
              <select 
                value={newAction} 
                onChange={(e) => setNewAction(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              >
                <option value="Create Support Ticket">Auto-create Support Ticket</option>
                <option value="Trigger Customer Outreach Alert">Trigger Retention Outreach Notification</option>
                <option value="Flag for Executive Compensation Review">Flag for Compensation Refund Review</option>
                <option value="Escalate to VIP Support">Assign to VIP Priority Support</option>
                <option value="Blacklist Carrier Route">Flag Courier Route SLA Breach</option>
                <option value="Customer Outreach (Email)">Customer Outreach (Email)</option>
                <option value="Customer Outreach (SMS)">Customer Outreach (SMS)</option>
                <option value="Courier Escalation (WhatsApp)">Courier Escalation (WhatsApp)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.85rem" }}>Workflow Category</label>
              <select 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              >
                <option value="CRM">CRM</option>
                <option value="Retention">Retention</option>
                <option value="Logistics">Logistics</option>
                <option value="Customer Experience">Customer Experience</option>
              </select>
            </div>

            <button type="submit" className="btn btn-login-submit" style={{ marginTop: "10px", padding: "12px", width: "100%" }}>
              Save Automation Rule
            </button>
          </form>
        </div>
      </div>

      {/* Triggered Logs History */}
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <h2>📝 Recent Automations Triggered</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
          Telemetry log detailing instances where automated rules triggered system corrections.
        </p>

        <div className="table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Rule Triggered</th>
                <th>Target Shipment</th>
                <th>Executed Action Result</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(showAllLogs ? automationLogs : automationLogs.slice(0, 10)).map(log => {
                const isHighlighted = highlightTarget && log.target.toLowerCase().includes(highlightTarget.toLowerCase());
                const highlightClass = isHighlighted ? "highlight-pulse-green" : "";
                return (
                  <tr key={log.id} className={highlightClass}>
                  <td style={{ color: "var(--text-secondary)" }}>{log.timestamp}</td>
                  <td><strong style={{ color: "#a78bfa" }}>{log.rule}</strong></td>
                  <td style={{ fontWeight: "700", color: "#f1f5f9" }}>{log.target}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {log.result}
                      {log.channel === "Email" && <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>Email</span>}
                      {log.channel === "WhatsApp" && <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>WhatsApp</span>}
                      {log.channel === "SMS" && <span className="badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>SMS</span>}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-green">Success</span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {automationLogs.length > 10 && (
          <button className="view-all-btn" onClick={() => setShowAllLogs(p => !p)}>
            {showAllLogs ? (
              <><span>▲</span> Show Top 10 Only</>
            ) : (
              <><span>▼</span> View All {automationLogs.length} Triggered Automations</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
