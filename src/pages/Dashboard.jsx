import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";

import RevenueChart from "../components/RevenueChart";
import AnalyticsView from "../components/AnalyticsView";
import CRMActionCenter from "../components/CRMActionCenter";
import ExecutiveActions from "../components/ExecutiveActions";
import TicketManagement from "../components/TicketManagement";
import DataImportView from "../components/DataImportView";
import CustomerRetentionCenter from "../components/CustomerRetentionCenter";
import WorkflowAutomation from "../components/WorkflowAutomation";
import EnterpriseCommandCenter from "../components/EnterpriseCommandCenter";
import { isActionableDelay, getDelayDays, isActive, getIssueCategory, getEscalationLevel, subtractDays, calculateCustomerHealth, parseCSVDate, refDate } from "../utils/delayHelpers";

export default function Dashboard({ onLogout }) {
  // Retrieve logged-in user profile from localStorage dynamically
  const loggedInUser = (() => {
    try {
      const u = localStorage.getItem("user");
      const parsed = u ? JSON.parse(u) : { name: "Amit Mishra", email: "amit@dispatchiq.com", role: "Admin" };
      if (parsed && parsed.name === "CEO") {
        parsed.name = "Alex Johnson";
      }
      if (parsed && (parsed.role === "Manager" || parsed.name === "Sriya Vadla" && parsed.role === "Manager")) {
        parsed.name = "Ananya Sharma";
      }
      return parsed;
    } catch {
      return { name: "Amit Mishra", email: "amit@dispatchiq.com", role: "Admin" };
    }
  })();

  const getDisplayRole = (role) => {
    const mapping = {
      "Admin": "Operations Director",
      "Manager": "Customer Success Manager",
      "Agent": "Support Agent",
      "Business Analyst": "Business Analyst",
      "CEO": "Chief Executive Officer"
    };
    return mapping[role] || role;
  };

  const hasAccess = (tab) => {
    const role = loggedInUser?.role;
    if (role === "CEO") return true;
    if (role === "Admin" || role === "Operations Director") {
      return ["dashboard", "logistics", "crm", "retention", "customerExperience", "outreachDesk", "automation", "import", "admin"].includes(tab);
    }
    if (role === "Manager" || role === "Customer Success Manager" || role === "Operations Lead") {
      return ["retention", "customerExperience", "logistics"].includes(tab);
    }
    if (role === "Agent" || role === "Support Agent" || role === "Operations Executive") {
      return ["ticketManagement", "outreachDesk"].includes(tab);
    }
    if (role === "Business Analyst") {
      return ["dashboard", "logistics", "customerExperience"].includes(tab);
    }
    return false;
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState("Acme Logistics Corp (ORG-1029)");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: "ai", text: "Hi! I am DispatchIQ Copilot. How can I help you today?" }
  ]);

  useEffect(() => {
    if (!isCopilotOpen) {
      setCopilotMessages([{ sender: "ai", text: "Hi! I am DispatchIQ Copilot. How can I help you today?" }]);
      setCopilotInput("");
    }
  }, [isCopilotOpen]);
  const handleCopilotSend = (e) => {
    e?.preventDefault();
    if (!copilotInput.trim()) return;
    
    const userMessage = copilotInput;
    setCopilotMessages(prev => [...prev, { sender: "user", text: userMessage }]);
    setCopilotInput("");
    
    // Simulate AI response based on Natural Language Queries
    setTimeout(() => {
      let aiResponseText = "You have 14 orders at risk. I have drafted emails and retention coupons for the 5 VIPs affected. Shall I send them via Omnichannel workflows?";
      
      const query = userMessage.toLowerCase();
      
      const pages = {
        "dashboard": ["dashboard", "executive", "home", "main"],
        "crm": ["crm", "operations", "outreach", "drafts", "email"],
        "retention": ["retention", "vip", "churn", "health"],
        "logistics": ["logistics", "analytics", "shipping", "courier", "delivery"],
        "customerExperience": ["experience", "csat", "nps", "complaint", "feedback"],
        "import": ["import", "upload", "csv", "data"],
        "automation": ["automation", "workflow", "rules", "trigger", "that page", "there"],
        "admin": ["admin", "settings", "configuration"]
      };

      let isNavigation = false;
      let targetTab = null;
      let targetTabName = "";

      if (query.includes("redirect") || query.includes("page") || query.includes("navigate") || query.includes("go to") || query.includes("take me") || query.includes("show") || query.includes("open")) {
        for (const [tabKey, keywords] of Object.entries(pages)) {
          if (keywords.some(k => query.includes(k))) {
             targetTab = tabKey;
             targetTabName = tabKey.charAt(0).toUpperCase() + tabKey.slice(1);
             if (tabKey === "dashboard") targetTabName = "Executive Dashboard";
             if (tabKey === "crm") targetTabName = "CRM Operations";
             if (tabKey === "customerExperience") targetTabName = "Customer Experience";
             if (tabKey === "import") targetTabName = "Data Import";
             if (tabKey === "automation") targetTabName = "Workflow Automation";
             isNavigation = true;
             break;
          }
        }
      }

      const queryLower = query.toLowerCase();

      const getCourierStats = () => {
        const stats = {};
        orders.forEach(o => {
          if (!o.Courier) return;
          const c = o.Courier.trim();
          if (!stats[c]) {
            stats[c] = { total: 0, delayed: 0, totalDelayDays: 0 };
          }
          stats[c].total++;
          if (isActionableDelay(o)) {
            stats[c].delayed++;
            stats[c].totalDelayDays += getDelayDays(o);
          }
        });

        return Object.keys(stats).map(c => {
          const s = stats[c];
          const delayRate = s.total > 0 ? ((s.delayed / s.total) * 100) : 0;
          const avgDelay = s.delayed > 0 ? (s.totalDelayDays / s.delayed) : 0;
          const slaCompliance = 100 - delayRate;
          return {
            name: c,
            total: s.total,
            delayed: s.delayed,
            delayRate: delayRate,
            avgDelay: avgDelay,
            slaCompliance: slaCompliance
          };
        }).sort((a, b) => b.slaCompliance - a.slaCompliance);
      };

      if (isNavigation && targetTab) {
        aiResponseText = `Absolutely. Navigating you to the ${targetTabName} page now.`;
        setActiveTab(targetTab);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (
        queryLower.includes("compare") ||
        queryLower.includes("vs") ||
        queryLower.includes("versus") ||
        queryLower.includes("better") ||
        (queryLower.includes("bluedart") && queryLower.includes("delhivery"))
      ) {
        const stats = getCourierStats();
        const bd = stats.find(s => s.name.toLowerCase().includes("bluedart"));
        const dv = stats.find(s => s.name.toLowerCase().includes("delhivery"));
        
        if (bd && dv) {
          const better = bd.slaCompliance > dv.slaCompliance ? bd : dv;
          const worse = bd.slaCompliance > dv.slaCompliance ? dv : bd;
          
          aiResponseText = `### Courier Performance Comparison

🚚 **${better.name}**

Delay Rate: ${better.delayRate.toFixed(1)}%
Avg Delay: ${better.avgDelay.toFixed(1)} days
SLA Compliance: ${better.slaCompliance.toFixed(1)}%
Delayed Orders: ${better.delayed} / ${better.total}

🚚 **${worse.name}**

Delay Rate: ${worse.delayRate.toFixed(1)}%
Avg Delay: ${worse.avgDelay.toFixed(1)} days
SLA Compliance: ${worse.slaCompliance.toFixed(1)}%
Delayed Orders: ${worse.delayed} / ${worse.total}

### Analysis
${better.name} is currently outperforming ${worse.name} with a higher SLA compliance rate (${better.slaCompliance.toFixed(1)}% vs ${worse.slaCompliance.toFixed(1)}%) and a lower active delay rate. Additionally, ${worse.name} shipments suffer from a longer average delay duration of ${worse.avgDelay.toFixed(1)} days.

### Recommendation
**${better.name}** is recommended because it has the lowest delay rate (${better.delayRate.toFixed(1)}%), high SLA compliance (${better.slaCompliance.toFixed(1)}%), and the fewest delayed shipments among active courier partners.

***
**Recommendation confidence:** High  
*Analysis based on the last 30 days of operational telemetry.*`;
        } else {
          let text = `### Courier Performance Summary\n\n`;
          stats.forEach(s => {
            text += `🚚 **${s.name}**\n\nDelay Rate: ${s.delayRate.toFixed(1)}%\nAvg Delay: ${s.avgDelay.toFixed(1)} days\nDelayed Orders: ${s.delayed} / ${s.total}\n\n`;
          });
          const best = stats[0];
          text += `### Recommendation\n**${best.name}** is recommended because it has the lowest delay rate (${best.delayRate.toFixed(1)}%), high SLA compliance (${best.slaCompliance.toFixed(1)}%), and the fewest delayed shipments among active courier partners.\n\n***\n**Recommendation confidence:** High  
*Analysis based on the last 30 days of operational telemetry.*`;
          aiResponseText = text;
        }
      } else if (queryLower.includes("sla compliance") || queryLower.includes("compliance")) {
        const stats = getCourierStats();
        let text = `### Courier SLA Compliance Ranking\n\n`;
        stats.forEach(s => {
          text += `🚚 **${s.name}**\n\nSLA Compliance: ${s.slaCompliance.toFixed(1)}%\nDelay Rate: ${s.delayRate.toFixed(1)}%\nAvg Delay: ${s.avgDelay.toFixed(1)} days\nDelayed Orders: ${s.delayed} / ${s.total}\n\n`;
        });
        const best = stats[0];
        text += `### Recommendation\n**${best.name}** is recommended because it has the highest SLA compliance rate (${best.slaCompliance.toFixed(1)}%), lowest delay rate (${best.delayRate.toFixed(1)}%), and the fewest delayed shipments among active courier partners.\n\n***\n**Recommendation confidence:** High  
*Analysis based on the last 30 days of operational telemetry.*`;
        aiResponseText = text;
      } else if (queryLower.includes("premium") || queryLower.includes("best courier") || queryLower.includes("recommend the best")) {
        const stats = getCourierStats();
        const best = stats[0];
        aiResponseText = `### Premium Shipping Recommendation

🚚 **${best.name}**

SLA Compliance: ${best.slaCompliance.toFixed(1)}%
Delay Rate: ${best.delayRate.toFixed(1)}%
Avg Delay: ${best.avgDelay.toFixed(1)} days
Delayed Orders: ${best.delayed} / ${best.total}

### Analysis
${best.name} demonstrates the highest reliability in the current dataset with a ${best.slaCompliance.toFixed(1)}% SLA compliance rate and the shortest average delay duration (${best.avgDelay.toFixed(1)} days).

### Recommendation
**${best.name}** is recommended because it has the lowest delay rate (${best.delayRate.toFixed(1)}%), high SLA compliance (${best.slaCompliance.toFixed(1)}%), and the fewest delayed shipments among active courier partners. It is highly suited for high-value or time-sensitive shipments.

***
**Recommendation confidence:** High  
*Analysis based on the last 30 days of operational telemetry.*`;
      } else if (queryLower.includes("causing most") || queryLower.includes("most delay") || queryLower.includes("worst courier")) {
        const stats = [...getCourierStats()].sort((a, b) => b.delayRate - a.delayRate);
        const worst = stats[0];
        const best = stats[stats.length - 1];
        
        let text = `### Operational Delay Analysis\n\n`;
        stats.forEach(s => {
          text += `🚚 **${s.name}**\n\nDelay Rate: ${s.delayRate.toFixed(1)}%\nAvg Delay: ${s.avgDelay.toFixed(1)} days\nDelayed Orders: ${s.delayed} / ${s.total}\n\n`;
        });
        
        text += `### Analysis
**${worst.name}** is causing the most operational friction. It holds the highest active delay rate (${worst.delayRate.toFixed(1)}%) and the largest volume of delayed shipments (${worst.delayed}), followed by Delhivery. ${worst.name} shipments also experience the longest average resolution times (${worst.avgDelay.toFixed(1)} days).

### Recommendation
Consider throttling **${worst.name}** volumes and diverting high-risk shipments to **${best.name}** or other active courier partners until routing congestion resolves.

***
**Recommendation confidence:** High  
*Analysis based on the last 30 days of operational telemetry.*`;
        aiResponseText = text;
      } else if (queryLower.includes("why") && (queryLower.includes("bluedart") || queryLower.includes("underperforming") || queryLower.includes("underperform"))) {
        const stats = getCourierStats();
        const bd = stats.find(s => s.name.toLowerCase().includes("bluedart"));
        
        aiResponseText = `### BlueDart Performance Root Cause Analysis

### Metrics Snapshot
* **SLA Compliance:** ${bd ? bd.slaCompliance.toFixed(1) : "92.9"}%
* **Active Delay Rate:** ${bd ? bd.delayRate.toFixed(1) : "7.1"}%
* **Average Delay Duration:** ${bd ? bd.avgDelay.toFixed(1) : "8.7"} days
* **Active Delays:** ${bd ? bd.delayed : "6"} shipments

### Analysis
BlueDart's performance has degraded due to severe routing congestion in the North Zone, causing a 62% spike in active transit delays. This routing block has increased BlueDart's delay rate to ${bd ? bd.delayRate.toFixed(1) : "7.1"}% with an average delay age of ${bd ? bd.avgDelay.toFixed(1) : "8.7"} days, placing ₹5.34L of recognized revenue at risk.

### Recommendation
We recommend immediately diverting 15% of North Zone dispatch volumes from BlueDart to **DTDC** or **Delhivery** to bypass the congestion points.

***
**Recommendation confidence:** High  
*Analysis based on current regional and courier telemetry.*`;
      } else if (
        queryLower.includes("courier") ||
        queryLower.includes("delivery service") ||
        queryLower.includes("carrier") ||
        queryLower.includes("bluedart") ||
        queryLower.includes("delhivery") ||
        queryLower.includes("dtdc") ||
        queryLower.includes("ecom express")
      ) {
        const stats = getCourierStats();
        let text = `### Courier Performance Summary\n\n`;
        stats.forEach(s => {
          text += `🚚 **${s.name}**\n\nDelay Rate: ${s.delayRate.toFixed(1)}%\nAvg Delay: ${s.avgDelay.toFixed(1)} days\nDelayed Orders: ${s.delayed} / ${s.total}\n\n`;
        });
        const best = stats[0];
        text += `### Recommendation\n**${best.name}** is recommended because it has the lowest delay rate (${best.delayRate.toFixed(1)}%), high SLA compliance (${best.slaCompliance.toFixed(1)}%), and the fewest delayed shipments among active courier partners.\n\n***\n**Recommendation confidence:** High  
*Analysis based on the last 30 days of operational telemetry.*`;
        aiResponseText = text;
      } else if (
        queryLower.includes("sales executive") ||
        queryLower.includes("salesperson") ||
        queryLower.includes("agent") ||
        queryLower.includes("executive") ||
        queryLower.includes("who sold the most")
      ) {
        const execStats = {};
        orders.forEach(o => {
          if (!o.SalesExecutive) return;
          const e = o.SalesExecutive.trim();
          const val = parseFloat(o.OrderValue) || 0;
          if (!execStats[e]) {
            execStats[e] = { totalOrders: 0, totalRevenue: 0 };
          }
          execStats[e].totalOrders++;
          execStats[e].totalRevenue += val;
        });

        const sortedExecs = Object.keys(execStats).map(e => ({
          name: e,
          orders: execStats[e].totalOrders,
          revenue: execStats[e].totalRevenue
        })).sort((a, b) => b.revenue - a.revenue);

        let responseText = "Here are our sales executives ranked by total revenue generated:\n\n";
        sortedExecs.forEach((exec, idx) => {
          responseText += `${idx + 1}. **${exec.name}:** ₹${(exec.revenue / 100000).toFixed(2)}L revenue (${exec.orders} orders)\n`;
        });
        aiResponseText = responseText;
      } else if (queryLower.includes("region") || queryLower.includes("zone")) {
        const regionStats = {};
        orders.forEach(o => {
          if (!o.Region) return;
          const r = o.Region.trim();
          const val = parseFloat(o.OrderValue) || 0;
          if (!regionStats[r]) {
            regionStats[r] = { total: 0, revenue: 0, delayed: 0 };
          }
          regionStats[r].total++;
          regionStats[r].revenue += val;
          if (isActionableDelay(o)) {
            regionStats[r].delayed++;
          }
        });

        const sortedRegions = Object.keys(regionStats).map(r => ({
          name: r,
          total: regionStats[r].total,
          revenue: regionStats[r].revenue,
          delayed: regionStats[r].delayed,
          delayRate: ((regionStats[r].delayed / regionStats[r].total) * 100).toFixed(1)
        })).sort((a, b) => b.revenue - a.revenue);

        let responseText = "Here is the performance snapshot by operational region:\n\n";
        sortedRegions.forEach(r => {
          responseText += `- **${r.name} Zone:** ₹${(r.revenue / 100000).toFixed(2)}L revenue, delay rate of ${r.delayRate}% (${r.delayed} active delays)\n`;
        });
        aiResponseText = responseText;
      } else if (queryLower.includes("product") || queryLower.includes("item") || queryLower.includes("selling")) {
        const productStats = {};
        orders.forEach(o => {
          if (!o.Product) return;
          const p = o.Product.trim();
          const qty = parseInt(o.Quantity, 10) || 0;
          const val = parseFloat(o.OrderValue) || 0;
          if (!productStats[p]) {
            productStats[p] = { qty: 0, revenue: 0 };
          }
          productStats[p].qty += qty;
          productStats[p].revenue += val;
        });

        const sortedProducts = Object.keys(productStats).map(p => ({
          name: p,
          qty: productStats[p].qty,
          revenue: productStats[p].revenue
        })).sort((a, b) => b.revenue - a.revenue);

        let responseText = "Here are our top-selling products by revenue:\n\n";
        sortedProducts.slice(0, 5).forEach((p, idx) => {
          responseText += `${idx + 1}. **${p.name}:** ₹${(p.revenue / 100000).toFixed(2)}L revenue (${p.qty} units sold)\n`;
        });
        aiResponseText = responseText;
      } else if (queryLower.includes("how many") || queryLower.includes("total") || queryLower.includes("count")) {
        if (queryLower.includes("delay") || queryLower.includes("delayed")) {
          const months = {
            jan: 0, janurary: 0, feb: 1, february: 1, mar: 2, march: 2,
            apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
            aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
            nov: 10, november: 10, dec: 11, december: 11
          };
          const regex1 = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[- ]?(\d{1,2})(?:st|nd|rd|th)?/i;
          const regex2 = /(\d{1,2})(?:st|nd|rd|th)?[- ]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i;
          
          let targetDate = null;
          let match = query.match(regex1);
          if (match) {
            const m = months[match[1].toLowerCase()];
            const d = parseInt(match[2], 10);
            targetDate = new Date(2026, m, d);
          } else {
            match = query.match(regex2);
            if (match) {
              const d = parseInt(match[1], 10);
              const m = months[match[2].toLowerCase()];
              targetDate = new Date(2026, m, d);
            }
          }

          if (targetDate) {
            const isDelayedAt = (order, date) => {
              if (!order.ExpectedDeliveryDate) return false;
              const expected = parseCSVDate(order.ExpectedDeliveryDate);
              const ordered = parseCSVDate(order.OrderedDate);
              if (!expected || !ordered) return false;
              if (ordered > date) return false;
              if (expected >= date) return false;
              const statusLower = order.Status?.trim().toLowerCase();
              const active = statusLower === "pending" || statusLower === "scheduled" || statusLower === "in transit";
              if (active) {
                const diffTime = date - expected;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 20;
              }
              return false;
            };

            const isActionableDelayAt = (order, date) => {
              if (!isDelayedAt(order, date)) return false;
              const expected = parseCSVDate(order.ExpectedDeliveryDate);
              const diffDays = Math.ceil((date - expected) / (1000 * 60 * 60 * 24));
              return diffDays <= 14;
            };

            const count = orders.filter(o => isActionableDelayAt(o, targetDate)).length;
            const options = { month: 'long', day: 'numeric', year: 'numeric' };
            const dateStr = targetDate.toLocaleDateString('en-US', options);
            aiResponseText = `On ${dateStr}, there were ${count} active shipments breaching delivery SLA.`;
          } else {
            const delayCount = orders.filter(isActionableDelay).length;
            aiResponseText = `We currently have ${delayCount} active shipments breaching delivery SLA.`;
          }
        } else if (queryLower.includes("order")) {
          aiResponseText = `We currently have ${orders.length} total orders recorded in the system.`;
        } else if (queryLower.includes("ticket")) {
          aiResponseText = `There are currently ${tickets.length} support tickets logged in the CRM.`;
        } else {
          aiResponseText = `I have access to ${orders.length} orders and ${tickets.length} tickets. Let me know what specific metric you need!`;
        }
      } else if (queryLower.includes("revenue risk") || queryLower.includes("increase") || queryLower.includes("why")) {
        aiResponseText = "Revenue risk increased by 8% this week primarily due to a 62% spike in BlueDart delays in the North Zone due to routing congestion. I recommend shifting 15% of your volume to DTDC.";
      } else if (/\b(hi|hello|hey|greetings)\b/i.test(queryLower)) {
        aiResponseText = "Hello Amit! I am actively monitoring your operations. Is there a specific metric or risk you'd like me to analyze?";
      } else {
        aiResponseText = "I can help you analyze delivery performance, courier SLA stats, sales executive ranking, operational regions, or specific order and ticket metrics. What would you like to check?";
      }

      setCopilotMessages(prev => [...prev, { 
        sender: "ai", 
        text: aiResponseText 
      }]);
    }, 1200);
  };

  const [activeTab, setActiveTab] = useState(() => {
    const role = loggedInUser?.role;
    if (role === "CEO") return "enterprise_command_center";
    if (role === "Admin" || role === "Operations Director") return "dashboard";
    if (role === "Manager" || role === "Customer Success Manager" || role === "Operations Lead") return "retention";
    if (role === "Agent" || role === "Support Agent" || role === "Operations Executive") return "ticketManagement";
    if (role === "Business Analyst") return "dashboard";
    return "dashboard";
  });
  const [dashboardSubTab, setDashboardSubTab] = useState("all");
  const [logisticsSubTab, setLogisticsSubTab] = useState("all");
  const [productsSubTab, setProductsSubTab] = useState("all");

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  const [crmSearch, setCrmSearch] = useState("");
  const [crmSelectedExec, setCrmSelectedExec] = useState("");
  const [crmSelectedCourier, setCrmSelectedCourier] = useState("");
  const [crmSeverityFilter, setCrmSeverityFilter] = useState("all");
  const [crmValueFilter, setCrmValueFilter] = useState("all");
  const [crmDelayCategory, setCrmDelayCategory] = useState("actionable");
  const [crmSubTab, setCrmSubTab] = useState("outreach");
  const [crmRatingFilter, setCrmRatingFilter] = useState("all");
  const [crmRiskFilter, setCrmRiskFilter] = useState("all");
  const [crmSortBy, setCrmSortBy] = useState("risk-desc");

  // Highlight states for proactive action card navigation
  const [retentionSearch, setRetentionSearch] = useState("");
  const [logisticsHighlightCourier, setLogisticsHighlightCourier] = useState("");
  const [logisticsHighlightRegion, setLogisticsHighlightRegion] = useState("");
  const [automationHighlightRuleId, setAutomationHighlightRuleId] = useState(null);
  const [automationHighlightTarget, setAutomationHighlightTarget] = useState("");

  useEffect(() => {
    if (activeTab !== "retention") {
      setRetentionSearch("");
    }
    if (activeTab !== "logistics") {
      setLogisticsHighlightCourier("");
      setLogisticsHighlightRegion("");
    }
    if (activeTab !== "automation") {
      setAutomationHighlightRuleId(null);
      setAutomationHighlightTarget("");
    }
  }, [activeTab]);
  
  // Courier Escalation states
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [courierEscalationMessage, setCourierEscalationMessage] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showAllBreaches, setShowAllBreaches] = useState(false);


  // CRM Logs State with LocalStorage persistence
  const [crmLogs, setCrmLogs] = useState(() => {
    const saved = localStorage.getItem("crm_outreach_logs");
    return saved ? JSON.parse(saved) : {};
  });

  // CRM Ticket Management State with LocalStorage persistence
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem("crm_tickets");
    return saved ? JSON.parse(saved) : [];
  });

  // Customer Health Score Boosts state with LocalStorage persistence
  const [healthBoosts, setHealthBoosts] = useState(() => {
    const saved = localStorage.getItem("crm_health_boosts");
    return saved ? JSON.parse(saved) : {};
  });

  const handleIncreaseHealth = (customerName, points) => {
    const newBoosts = {
      ...healthBoosts,
      [customerName]: (healthBoosts[customerName] || 0) + points
    };
    setHealthBoosts(newBoosts);
    localStorage.setItem("crm_health_boosts", JSON.stringify(newBoosts));
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem("crm_read_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  // Theme State
  const theme = "dark";

  const [expandedPredictionId, setExpandedPredictionId] = useState(null);

  useEffect(() => {
    document.body.classList.remove("light-theme");
    localStorage.setItem("dashboard_theme", "dark");
  }, []);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);

  const globalSearchResults = useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return { orders: [], customers: [], tickets: [] };
    const q = globalSearch.toLowerCase();
    const matchedOrders = orders.filter(o =>
      (o.OrderID || "").toLowerCase().includes(q) ||
      (o.Customer || "").toLowerCase().includes(q)
    ).slice(0, 5);
    const customerNames = Array.from(new Set(orders.map(o => o.Customer).filter(Boolean)));
    const matchedCustomers = customerNames.filter(c => c.toLowerCase().includes(q)).slice(0, 5);
    const matchedTickets = tickets.filter(t =>
      (t.id || "").toLowerCase().includes(q) ||
      (t.customer || "").toLowerCase().includes(q) ||
      (t.orderId || "").toLowerCase().includes(q)
    ).slice(0, 5);
    return { orders: matchedOrders, customers: matchedCustomers, tickets: matchedTickets };
  }, [globalSearch, orders, tickets]);

  const flattenedSearchResults = useMemo(() => {
    const list = [];
    globalSearchResults.orders.forEach(o => list.push({ type: 'order', item: o }));
    globalSearchResults.customers.forEach(c => list.push({ type: 'customer', item: c }));
    globalSearchResults.tickets.forEach(t => list.push({ type: 'ticket', item: t }));
    return list;
  }, [globalSearchResults]);

  const totalSearchResults = flattenedSearchResults.length;

  useEffect(() => {
    setSearchSelectedIndex(-1);
  }, [globalSearch]);

  const handleGlobalSearchKeyDown = (e) => {
    if (!showSearchResults || totalSearchResults === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev + 1) % totalSearchResults);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev - 1 + totalSearchResults) % totalSearchResults);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchSelectedIndex >= 0 && searchSelectedIndex < totalSearchResults) {
        const selected = flattenedSearchResults[searchSelectedIndex];
        if (selected.type === "order") {
          setActiveTab("crm"); setCrmSubTab("delays"); setCrmSearch(selected.item.OrderID);
        } else if (selected.type === "customer") {
          setActiveTab("retention");
        } else if (selected.type === "ticket") {
          setActiveTab("crm");
        }
        setShowSearchResults(false);
        setGlobalSearch("");
      }
    }
  };

  const notifications = useMemo(() => {
    const list = [];
    
    // 1. SLA Breach notifications
    const delayed = orders.filter(isActionableDelay);
    delayed.slice(0, 3).forEach(o => {
      list.push({
        id: `sla-${o.OrderID}`,
        type: "danger",
        emoji: "🔴",
        text: `Order ${o.OrderID} breached SLA.`,
        detail: `Expected: ${o.ExpectedDeliveryDate || o.ExpectedDelivery || "N/A"} (${o.Courier})`
      });
    });

    // 2. Churn Risk notifications
    const uniqueCustomers = Array.from(new Set(orders.map(o => o.Customer).filter(Boolean)));
    const critical = uniqueCustomers.filter(name => {
      const health = calculateCustomerHealth(name, orders, tickets, healthBoosts[name] || 0);
      return health < 60;
    });
    critical.slice(0, 2).forEach(name => {
      list.push({
        id: `churn-${name}`,
        type: "warning",
        emoji: "🟠",
        text: `Customer ${name} moved to Critical Churn Risk.`,
        detail: `Customer Health Score is below 60.`
      });
    });

    // 3. Resolved Ticket notifications
    const resolved = tickets.filter(t => t.status === "Resolved");
    resolved.slice(0, 2).forEach(t => {
      list.push({
        id: `ticket-${t.id}`,
        type: "success",
        emoji: "🟢",
        text: `Ticket ${t.id} resolved.`,
        detail: `Status changed to Resolved by Agent.`
      });
    });
    
    if (list.length === 0) {
      list.push({
        id: "default-1",
        type: "info",
        emoji: "🟢",
        text: "System telemetry synchronized.",
        detail: "All active trackers online."
      });
    }

    return list;
  }, [orders, tickets, healthBoosts]);

  const unreadNotifications = notifications.filter(n => !readNotifications.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(allIds);
    localStorage.setItem("crm_read_notifications", JSON.stringify(allIds));
  };

  const handleExportExcel = () => {
    if (orders.length === 0) return;
    const headers = [
      "OrderID", "Customer", "Product", "Category", "Quantity", 
      "OrderedDate", "DispatchDate", "ExpectedDeliveryDate", "Status", 
      "OrderValue", "CostPrice", "Profit", "Priority", "Region", 
      "Courier", "PaymentMode", "SalesExecutive", "ReturnFlag", 
      "SLA Breach Probability %", "Customer Health Score", "Churn Risk Group"
    ];
    const csvRows = [headers.join(",")];
    orders.forEach(o => {
      const health = calculateCustomerHealth(o.Customer, orders, tickets, healthBoosts[o.Customer] || 0);
      const churnRiskGroup = health < 60 ? "High Risk" : "Healthy";
      const row = [
        o.OrderID || "",
        `"${(o.Customer || "").replace(/"/g, '""')}"`,
        `"${(o.Product || "").replace(/"/g, '""')}"`,
        `"${(o.Category || "").replace(/"/g, '""')}"`,
        o.Quantity || "",
        o.OrderedDate || "",
        o.DispatchDate || "",
        o.ExpectedDeliveryDate || o.ExpectedDelivery || "",
        o.Status || "",
        o.OrderValue || 0,
        o.CostPrice || "",
        o.Profit || "",
        o.Priority || "",
        o.Region || "",
        o.Courier || "",
        o.PaymentMode || "",
        `"${(o.SalesExecutive || "").replace(/"/g, '""')}"`,
        o.ReturnFlag || "",
        o.SlaBreachProbability || 0,
        health,
        churnRiskGroup
      ];
      csvRows.push(row.join(","));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dispatch_orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTickets = () => {
    if (tickets.length === 0) return;
    const headers = [
      "TicketID", "OrderID", "Customer", "Subject", "Status", 
      "Severity", "AgeDays", "ResolutionTimeHours", "Owner", 
      "EscalationLevel", "CustomerLTV", "BusinessImpactScore", "RiskLevel"
    ];
    const csvRows = [headers.join(",")];
    tickets.forEach(t => {
      const riskLevel = t.severity === "Critical" || t.severity === "High" ? "High Risk" : "Standard";
      const row = [
        t.id || "",
        t.orderId || "",
        `"${(t.customer || "").replace(/"/g, '""')}"`,
        `"${(t.subject || "").replace(/"/g, '""')}"`,
        t.status || "",
        t.severity || "",
        `"${(t.age || "").replace(/"/g, '""')}"`,
        `"${(t.resolutionTime || "").replace(/"/g, '""')}"`,
        `"${(t.owner || "").replace(/"/g, '""')}"`,
        `"${(t.escalation || "").replace(/"/g, '""')}"`,
        t.customerLtv || "",
        t.businessImpactScore || "",
        riskLevel
      ];
      csvRows.push(row.join(","));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crm_tickets_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const savedOrders = localStorage.getItem("crm_orders_imported");
    if (savedOrders) {
      const generateSlaProbability = (o) => {
        if (o.Status === "Delivered") return 0;
        const expected = new Date(o.ExpectedDeliveryDate);
        const today = new Date("2026-06-04");
        if (expected < today) return Math.floor(Math.random() * 15) + 85; // 85-100% if already delayed
        
        let risk = 10;
        if (o.Courier === "BlueDart") risk += 25;
        if (o.Region === "North Zone") risk += 15;
        const daysLeft = (expected - today) / (1000 * 60 * 60 * 24);
        if (daysLeft < 2) risk += 30;
        else if (daysLeft < 4) risk += 15;
        
        risk += Math.floor(Math.random() * 10);
        return Math.min(99, risk);
      };

      const parsedOrders = JSON.parse(savedOrders).map(o => ({
        ...o,
        SlaBreachProbability: o.SlaBreachProbability || generateSlaProbability(o)
      }));
      setOrders(parsedOrders);
      setLoading(false);
      
       const savedTickets = localStorage.getItem("crm_tickets");
      const parsedTickets = savedTickets ? JSON.parse(savedTickets) : [];
      const needsMigration = parsedTickets.length > 0 && (!parsedTickets[0].hasOwnProperty("escalation") || !parsedTickets[0].hasOwnProperty("age") || parsedTickets.every(t => t.lastUpdated === "31-May-2026") || parsedTickets.every(t => t.issue === "Delivery SLA Breached"));
      if (parsedTickets.length < 50 || needsMigration) {
        const initialTickets = initializeTickets(parsedOrders);
        setTickets(initialTickets);
        localStorage.setItem("crm_tickets", JSON.stringify(initialTickets));
      } else {
        setTickets(parsedTickets);
      }
      return;
    }

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
            .filter(row => row.OrderID)
            .map(row => {
              let risk = 10;
              const expected = new Date(row.ExpectedDeliveryDate);
              const today = new Date("2026-06-04");
              if (row.Status === "Delivered") risk = 0;
              else if (expected < today) risk = Math.floor(Math.random() * 15) + 85;
              else {
                if (row.Courier === "BlueDart") risk += 25;
                if (row.Region === "North Zone") risk += 15;
                const daysLeft = (expected - today) / (1000 * 60 * 60 * 24);
                if (daysLeft < 2) risk += 30;
                else if (daysLeft < 4) risk += 15;
                risk += Math.floor(Math.random() * 10);
              }
              return { ...row, SlaBreachProbability: Math.min(99, risk) };
            });
          setOrders(cleanData);
          setLoading(false);

          // Seed and auto-generate tickets
          const savedTickets = localStorage.getItem("crm_tickets");
          const parsedTickets = savedTickets ? JSON.parse(savedTickets) : [];
          const needsMigration = parsedTickets.length > 0 && (!parsedTickets[0].hasOwnProperty("escalation") || !parsedTickets[0].hasOwnProperty("age") || parsedTickets.every(t => t.lastUpdated === "31-May-2026") || parsedTickets.every(t => t.issue === "Delivery SLA Breached"));
          if (parsedTickets.length < 50 || needsMigration) {
            const initialTickets = initializeTickets(cleanData);
            setTickets(initialTickets);
            localStorage.setItem("crm_tickets", JSON.stringify(initialTickets));
          } else {
            setTickets(parsedTickets);
          }
        }
      }
    );
  }, []);

  const handleAddLog = (orderId, type, text, author, customerResponse) => {
    const newLogs = { ...crmLogs };
    if (!newLogs[orderId]) newLogs[orderId] = [];

    const now = new Date();
    const formattedTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + now.toLocaleDateString();

    newLogs[orderId].unshift({
      type,
      text,
      author,
      timestamp: formattedTimestamp,
      customerResponse: customerResponse || "No Reply"
    });

    setCrmLogs(newLogs);
    localStorage.setItem("crm_outreach_logs", JSON.stringify(newLogs));
  };

  const handleUpdateTicket = (updatedTicket) => {
    const updatedTickets = tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
    setTickets(updatedTickets);
    localStorage.setItem("crm_tickets", JSON.stringify(updatedTickets));
  };

  const handleImportComplete = ({ mode, newOrders, newTickets }) => {
    if (mode === "replace") {
      setOrders(newOrders);
      setTickets(newTickets);
      localStorage.setItem("crm_orders_imported", JSON.stringify(newOrders));
      localStorage.setItem("crm_tickets", JSON.stringify(newTickets));
    } else {
      const mergedMap = new Map();
      orders.forEach(o => mergedMap.set(o.OrderID, o));
      newOrders.forEach(o => mergedMap.set(o.OrderID, o));
      const mergedOrders = Array.from(mergedMap.values());
      
      setOrders(mergedOrders);
      setTickets(newTickets);
      localStorage.setItem("crm_orders_imported", JSON.stringify(mergedOrders));
      localStorage.setItem("crm_tickets", JSON.stringify(newTickets));
    }
  };

  const handleDispatchCourierEscalation = (subject, email, message) => {
    setToastMessage("Official SLA warning ticket dispatched to BlueDart Partnerships.");
    setTimeout(() => {
      setToastMessage("");
    }, 4500);

    const blueDartOrders = orders.filter(o => o.Courier?.trim() === "BlueDart" && isActionableDelay(o));
    const newLogs = { ...crmLogs };

    const now = new Date();
    const formattedTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + now.toLocaleDateString();

    blueDartOrders.forEach(order => {
      if (!newLogs[order.OrderID]) newLogs[order.OrderID] = [];
      newLogs[order.OrderID].unshift({
        type: "Logistics Escalation",
        text: `Courier Escalation Sent to BlueDart (${email}). Subject: ${subject}. Message: ${message}`,
        author: "Operations Director",
        timestamp: formattedTimestamp,
        customerResponse: "No Reply"
      });
    });

    setCrmLogs(newLogs);
    localStorage.setItem("crm_outreach_logs", JSON.stringify(newLogs));
    setShowCourierModal(false);
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
      setActiveTab("crm");
      setCrmSubTab("outreach");
    } else if (id === "escalate-delhivery") {
      setCrmSelectedCourier("Delhivery");
      setCrmDelayCategory("actionable");
      setActiveTab("crm");
      setCrmSubTab("outreach");
    } else if (id === "issue-coupon") {
      setCrmValueFilter("high");
      setCrmDelayCategory("actionable");
      setActiveTab("crm");
      setCrmSubTab("outreach");
    } else {
      setActiveTab("crm");
      setCrmSubTab("outreach");
    }

    // Scroll to CRM Action Center
    setTimeout(() => {
      const element = document.getElementById("crm-action-center");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleDashboardSubTabClick = (subTab, elementId) => {
    setActiveTab("dashboard");
    setDashboardSubTab(subTab);
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // ML Forecast Metrics (7-day lookahead simulation) - must be before early return
  const mlForecast = useMemo(() => {
    const activeCount = orders.filter(o => isActive(o)).length;
    const delayedCount = orders.filter(isActionableDelay).length;
    const avgDelayRate = activeCount > 0 ? delayedCount / activeCount : 0.18;
    const predictedBreaches = Math.round(activeCount * avgDelayRate * 1.15);
    const delayedRev = orders.filter(isActionableDelay).reduce((sum, o) => sum + (parseFloat(o.OrderValue) || 0), 0);
    const predictedRevenue = Math.round(delayedRev * 1.22);
    const allCustomers = Array.from(new Set(orders.map(o => o.Customer).filter(Boolean)));
    const currentChurn = allCustomers.filter(name => calculateCustomerHealth(name, orders, tickets, healthBoosts[name] || 0) < 60).length;
    const predictedChurn = Math.round(currentChurn * 1.18);
    const formatL = (v) => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${(v/1000).toFixed(0)}K`;
    return { predictedBreaches, predictedRevenue, predictedChurn, formattedRevenue: formatL(predictedRevenue), confidence: 78 };
  }, [orders, tickets, healthBoosts]);

  // Ecommerce Integration Config - must be before early return
  const [integrationSyncing, setIntegrationSyncing] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState(() => {
    try {
      const saved = localStorage.getItem("integration_status");
      return saved ? JSON.parse(saved) : {
        shopify: { connected: true, mode: "demo", lastSync: "18-Jun-2026 09:14 AM", orders: 847 },
        woocommerce: { connected: false, mode: "disconnected", lastSync: null, orders: 0 },
        shiprocket: { connected: true, mode: "demo", lastSync: "18-Jun-2026 08:55 AM", orders: 847 }
      };
    } catch { return {}; }
  });

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
  const worstCourier = Object.entries(courierDelays).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const topDelayCarrier = worstCourier;

  const worstCourierWeeklyChange = (() => {
    const worstCourierOrders = orders.filter(o => o.Courier?.trim() === worstCourier && isActionableDelay(o));
    const olderDelays = worstCourierOrders.filter(o => getDelayDays(o) > 5).length;
    const newerDelays = worstCourierOrders.filter(o => getDelayDays(o) <= 5).length;
    if (olderDelays > 0) {
      const ratio = Math.round((newerDelays / (olderDelays + newerDelays)) * 100);
      return ratio > 0 ? ratio : 11;
    }
    return 11;
  })();

  const recentDelayedVal = orders
    .filter(o => isActionableDelay(o) && getDelayDays(o) <= 2)
    .reduce((sum, o) => sum + (Number(o.OrderValue) || 0), 0);
  const formattedRevenueExposure = recentDelayedVal >= 100000 
    ? `₹${(recentDelayedVal / 100000).toFixed(1)}L` 
    : "₹1.2L";



  // 3. Region at Risk (Region with highest total order value of active delayed orders)
  const regionActiveDelayVal = {};
  orders.forEach(o => {
    if (isActive(o) && getDelayDays(o) > 0 && o.Region) {
      regionActiveDelayVal[o.Region] = (regionActiveDelayVal[o.Region] || 0) + (Number(o.OrderValue) || 0);
    }
  });
  const regionAtRisk = Object.keys(regionActiveDelayVal).length > 0
    ? Object.keys(regionActiveDelayVal).sort((a, b) => regionActiveDelayVal[b] - regionActiveDelayVal[a])[0]
    : "South";



  const formatRevenueLakhs = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${(val / 1000).toFixed(1)}K`;
  };

  // Calculate dynamic stats for the AI Root Cause Analysis Card
  const activeTicketsCount = tickets.filter(t => ["Open", "In Progress", "Escalated", "Assigned"].includes(t.status)).length;
  const totalActiveDelays = orders.filter(isActionableDelay).length;
  const worstCourierDelays = orders.filter(o => o.Courier?.trim() === worstCourier && isActionableDelay(o)).length;
  const worstCourierPercentage = totalActiveDelays > 0 ? Math.round((worstCourierDelays / totalActiveDelays) * 100) : 42;
  const affectedRegionText = regionAtRisk ? `${regionAtRisk} Zone` : "South Zone";
  const predictedRevenueImpact = delayedRevenue > 0 ? `₹${(delayedRevenue / 100000).toFixed(1)}L` : "₹18.4L";

  // Reallocation recommendation: find the best courier with least delays
  const courierSuccess = {};
  orders.forEach(o => {
    if (o.Courier) {
      courierSuccess[o.Courier] = 0;
    }
  });
  delayedOrders.forEach(o => {
    if (o.Courier) {
      courierSuccess[o.Courier] = (courierSuccess[o.Courier] || 0) + 1;
    }
  });
  const bestCourier = Object.entries(courierSuccess).sort((a, b) => a[1] - b[1])[0]?.[0] || "Delhivery";
  const getChildLinkStyle = (isActive) => ({
    background: "transparent",
    border: "none",
    color: isActive ? "#3b82f6" : "var(--text-secondary)",
    padding: "5px 8px",
    fontSize: "0.8rem",
    fontWeight: isActive ? "600" : "500",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "6px",
    width: "100%",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingLeft: isActive ? "12px" : "8px",
    borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent"
  });

  // Dynamic metrics for Morning Executive Briefing
  const briefingRevenueAtRisk = orders.filter(isActionableDelay).reduce((sum, o) => sum + Number(o.OrderValue || 0), 0);
  const formattedBriefingRev = briefingRevenueAtRisk >= 100000 
    ? `₹${(briefingRevenueAtRisk / 100000).toFixed(2)}L` 
    : `₹${briefingRevenueAtRisk.toLocaleString()}`;

  const recoveryPipelineValue = tickets
    .filter(t => ["Open", "In Progress", "Escalated", "Assigned"].includes(t.status))
    .reduce((sum, t) => {
      const order = orders.find(o => o.OrderID === t.orderId);
      return sum + (order ? (parseFloat(order.OrderValue) || 0) : 0);
    }, 0);

  // Find unique customer health scores to detect accounts needing contact
  const uniqueCustomersList = Array.from(new Set(orders.map(o => o.Customer).filter(Boolean)));
  const criticalHealthCustomers = uniqueCustomersList.filter(name => {
    const health = calculateCustomerHealth(name, orders, tickets, healthBoosts[name] || 0);
    return health < 60;
  });

  const worstCourierName = worstCourier;

  const worstCourierStats = (() => {
    if (!worstCourierName || worstCourierName === "None" || worstCourierName === "N/A") {
      return { sla: 93.0, delayRate: 7.0, revenueImpact: 560000 };
    }
    const map = {};
    orders.forEach(o => {
      const courier = o.Courier?.trim() || "Unassigned";
      if (!map[courier]) map[courier] = { total: 0, delayed: 0, revenueImpact: 0 };
      map[courier].total += 1;
      if (isActionableDelay(o)) {
        map[courier].delayed += 1;
        map[courier].revenueImpact += Number(o.OrderValue || 0);
      }
    });
    const stats = map[worstCourierName] || { total: 0, delayed: 0, revenueImpact: 0 };
    const delayRate = stats.total > 0 ? (stats.delayed / stats.total) * 100 : 7.0;
    const sla = 100 - delayRate;
    return {
      sla: stats.total > 0 ? sla : 93.0,
      delayRate: stats.total > 0 ? delayRate : 7.0,
      revenueImpact: stats.total > 0 ? stats.revenueImpact : 560000
    };
  })();

  const handleProactiveAction = (pred) => {
    setToastMessage(`Proactive Action Executed: ${pred.actionText} initiated for order ${pred.orderId}.`);
    setTimeout(() => {
      setToastMessage("");
    }, 4500);
  };

  const proactiveBreachPredictions = (() => {
    const activeOrders = orders.filter(o => isActive(o) && o.ExpectedDeliveryDate);
    const predictions = activeOrders.map(o => {
      const expectedDate = parseCSVDate(o.ExpectedDeliveryDate);
      if (!expectedDate) return null;
      
      const timeDiff = expectedDate - refDate;
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      let baseProb = 50;
      if (o.Courier === "BlueDart") baseProb += 25;
      else if (o.Courier === "Delhivery") baseProb += 15;
      else baseProb += 5;
      
      const urgencyFactor = daysRemaining <= 0 ? 20 : daysRemaining === 1 ? 10 : 5;
      const prob = Math.min(96, Math.max(45, baseProb + urgencyFactor));
      
      let riskFactor = "Standard Transit Routing";
      let action = "Monitor Status";
      
      let rationale = "";
      if (o.Courier === "BlueDart") {
        riskFactor = "Delhi Hub Sorting Congestion";
        action = "Re-route via Air";
        rationale = `ML Model identified routing bottleneck at the Delhi Sorting Hub. Historical data shows ${o.Courier} shipments traversing this hub have experienced an average delay of 28.4 hours in the North Zone this week. Combined with high volume, breach risk is high.`;
      } else if (o.Courier === "Delhivery") {
        riskFactor = "Last-mile Delivery Congestion";
        action = "Pre-empt Notify";
        rationale = `Predictive telemetry reports last-mile courier carrier shortage in the target delivery sector. Historical SLA compliance for ${o.Courier} under these dispatch conditions drops to 64%.`;
      } else if (o.Courier === "DTDC") {
        riskFactor = "Inter-state Transit Delay";
        action = "Request Speedup";
        rationale = `Transit speed checks detect an anomaly on the inter-state highway transit. Estimated time of arrival (ETA) recalculation puts expected delivery past the SLA window by 36 hours.`;
      } else {
        riskFactor = "Customs Hub Clearance Hold";
        action = "Alert Operations";
        rationale = `Customs Hub clearance hold triggered based on international invoice metadata matching historical check patterns. AI model flags standard documentation audit delays.`;
      }
      
      const modelConfidence = Math.min(99.4, (prob * 0.98 + 4.5)).toFixed(1);

      return {
        order: o,
        orderId: o.OrderID,
        customer: o.Customer,
        courier: o.Courier,
        expectedDate: o.ExpectedDeliveryDate,
        probability: prob,
        riskFactor: riskFactor,
        actionText: action,
        value: Number(o.OrderValue || 0),
        modelConfidence: modelConfidence,
        rationale: rationale,
        valueAtRisk: Number(o.OrderValue || 0)
      };
    }).filter(Boolean);
    
    return predictions.sort((a, b) => b.probability - a.probability);
  })();

  const handleSyncIntegration = (platform) => {
    setIntegrationSyncing(platform);
    setTimeout(() => {
      const updated = {
        ...integrationStatus,
        [platform]: {
          ...integrationStatus[platform],
          lastSync: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          orders: orders.length
        }
      };
      setIntegrationStatus(updated);
      localStorage.setItem("integration_status", JSON.stringify(updated));
      setIntegrationSyncing(null);
      setToastMessage(`✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)} sync completed — ${orders.length} records updated.`);
      setTimeout(() => setToastMessage(""), 4000);
    }, 2200);
  };

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
            <span>DispatchIQ</span>
          </div>
          <span className="sidebar-tagline">Mitigation & Operations</span>
          
          <nav className="sidebar-menu" style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)", marginTop: "48px" }}>
            
            {/* Command Center (CEO Only) */}
            {loggedInUser?.role === "CEO" && (
              <button
                className={`sidebar-sub-link ${activeTab === "enterprise_command_center" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("enterprise_command_center");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">🏢 Enterprise Command Center</span>
              </button>
            )}

            {/* Executive Dashboard Section */}
            {hasAccess("dashboard") && (
              <button
                className={`sidebar-sub-link ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("dashboard");
                  setDashboardSubTab("all");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">📊 Executive Dashboard</span>
              </button>
            )}

            {/* Ticket Management (Support Agent) */}
            {hasAccess("ticketManagement") && (
              <button
                className={`sidebar-sub-link ${activeTab === "ticketManagement" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("ticketManagement");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">🎫 Ticket Management</span>
              </button>
            )}

            {/* Outreach Desk (Support Agent) */}
            {hasAccess("outreachDesk") && (
              <button
                className={`sidebar-sub-link ${activeTab === "outreachDesk" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("outreachDesk");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">📞 Outreach Desk</span>
              </button>
            )}

            {/* CRM Operations */}
            {hasAccess("crm") && (
              <button
                className={`sidebar-sub-link ${activeTab === "crm" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("crm");
                  setCrmSubTab("all");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", justifyContent: "space-between", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">🎯 CRM Operations</span>
                <span className="sidebar-badge" style={{ backgroundColor: "#ef4444", color: "#fff", fontWeight: "700" }}>{predictedRevenueImpact}</span>
              </button>
            )}

            {/* Customer Experience Analytics Section */}
            {hasAccess("customerExperience") && (
              <button
                className={`sidebar-sub-link ${activeTab === "customerExperience" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("customerExperience");
                  setProductsSubTab("all");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">💬 Customer Experience</span>
              </button>
            )}

            {/* Customer Retention Center */}
            {hasAccess("retention") && (
              <button
                className={`sidebar-sub-link ${activeTab === "retention" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("retention");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text">🏆 Retention Center</span>
              </button>
            )}

            {/* Logistics Analytics */}
            {hasAccess("logistics") && (
              <button
                className={`sidebar-sub-link ${activeTab === "logistics" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("logistics");
                  setLogisticsSubTab("all");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                }}
              >
                <span className="sidebar-link-text" style={{ whiteSpace: "nowrap" }}>
                  🚚 Logistics Analytics
                  {(loggedInUser?.role === "Manager" || loggedInUser?.role === "Customer Success Manager" || loggedInUser?.role === "Operations Lead" || loggedInUser?.role === "Business Analyst") && " 🔒 Read Only"}
                </span>
              </button>
            )}

            {/* System Settings Section (Admin Only) */}
            {(loggedInUser?.role === "Admin" || loggedInUser?.role === "Operations Director") && (
              <>
                <button
                  className={`sidebar-sub-link ${activeTab === "import" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("import");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                  }}
                >
                  <span className="sidebar-link-text">📂 Data Import</span>
                </button>

                <button
                  className={`sidebar-sub-link ${activeTab === "automation" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("automation");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                  }}
                >
                  <span className="sidebar-link-text">⚡ Workflow Automation</span>
                </button>

                <button
                  className={`sidebar-sub-link ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("admin");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", width: "100%", textAlign: "left"
                  }}
                >
                  <span className="sidebar-link-text">🛡️ Administration</span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sidebar-avatar">{getInitials(loggedInUser.name)}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{loggedInUser.name}</span>
                <span className="sidebar-user-role">{getDisplayRole(loggedInUser.role)}</span>
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
          padding: activeTab === "dashboard" ? "15px 10px" : "30px 15px"
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
                {activeTab === "dashboard" && "Executive Dashboard"}
                {activeTab === "crm" && "CRM Operations"}
                {activeTab === "logistics" && "Logistics Analytics"}
                {activeTab === "customerExperience" && "Customer Experience Analytics"}
                {activeTab === "import" && "Data Import & Pipeline Operations"}
                {activeTab === "automation" && "Workflow Automation"}
                {activeTab === "admin" && "Administration"}
                {activeTab === "retention" && "Retention Center"}
                {activeTab === "enterprise_command_center" && "Enterprise Command Center"}
                {activeTab === "ticketManagement" && "Ticket Management"}
                {activeTab === "outreachDesk" && "Outreach Desk"}
              </h1>
              <p style={{ margin: "5px 0 0 0" }}>
                {activeTab === "dashboard" && "High-level KPI summaries, revenue analytics, AI summaries, and priority monitoring"}
                {activeTab === "crm" && "Centralized customer outreach, delay records, churn risk mitigation, and SLA actions"}
                {activeTab === "logistics" && "Courier performance metrics, regional delay distribution, and daily dispatch progress trends"}
                {activeTab === "customerExperience" && "Real-time NPS tracking, customer complaint categorization, refunds issued, and delay-CSAT relationship trends"}
                {activeTab === "import" && "Upload custom CSV or Excel files, validate schema columns, trigger SLA breach auto-scanning, and update active telemetry"}
                {activeTab === "automation" && "Build event-triggered webhooks, custom notification dispatches, and priority routing configurations"}
                {activeTab === "admin" && "Manage user roles, configure API keys, monitor background queues, and review system audit history"}
                {activeTab === "retention" && "Identify high-risk customer accounts, view churn probabilities, and issue mitigation items"}
                {activeTab === "enterprise_command_center" && "CEO Strategic Console: Real-time company KPIs, operational risk alerts, and resource telemetry"}
                {activeTab === "ticketManagement" && "Manage customer support requests, assign cases, and monitor SLA compliance"}
                {activeTab === "outreachDesk" && "Outreach desk for customer communication, tracking apology logs, and resolving issues"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "15px", alignItems: "center", position: "relative" }}>

              {/* Global Search */}
              <div className="global-search-wrapper no-print">
                <span className="global-search-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input
                  type="text"
                  className="global-search-input"
                  placeholder="Search Orders / Customers / Couriers..."
                  value={globalSearch}
                  onChange={(e) => { setGlobalSearch(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={handleGlobalSearchKeyDown}
                />
                {showSearchResults && globalSearch.length >= 2 && (
                  <>
                    <div onClick={() => { setShowSearchResults(false); setGlobalSearch(""); }} style={{ position: "fixed", inset: 0, zIndex: 1999 }} />
                    <div className="global-search-results" style={{ zIndex: 2000 }}>
                      {totalSearchResults === 0 ? (
                        <div className="search-no-results">No results found for "{globalSearch}"</div>
                      ) : (
                        <>
                          {globalSearchResults.orders.length > 0 && (
                            <>
                              <div className="search-result-group-label">📦 Orders</div>
                              {globalSearchResults.orders.map(o => {
                                const idx = flattenedSearchResults.findIndex(x => x.type === 'order' && x.item.OrderID === o.OrderID);
                                const isSelected = idx === searchSelectedIndex;
                                return (
                                  <div key={o.OrderID} className="search-result-item" style={isSelected ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}} onClick={() => { setActiveTab("crm"); setCrmSubTab("delays"); setCrmSearch(o.OrderID); setShowSearchResults(false); setGlobalSearch(""); }}>
                                    <span className="search-result-item-id">{o.OrderID}</span>
                                    <span className="search-result-item-label">{o.Customer}</span>
                                    <span className="search-result-item-meta">{o.Courier} · {o.Status}</span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                          {globalSearchResults.customers.length > 0 && (
                            <>
                              <div className="search-result-group-label">👤 Customers</div>
                              {globalSearchResults.customers.map(name => {
                                const idx = flattenedSearchResults.findIndex(x => x.type === 'customer' && x.item === name);
                                const isSelected = idx === searchSelectedIndex;
                                return (
                                  <div key={name} className="search-result-item" style={isSelected ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}} onClick={() => { setActiveTab("retention"); setShowSearchResults(false); setGlobalSearch(""); }}>
                                    <span className="search-result-item-id">Customer</span>
                                    <span className="search-result-item-label">{name}</span>
                                    <span className="search-result-item-meta">Open Retention Center →</span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                          {globalSearchResults.tickets.length > 0 && (
                            <>
                              <div className="search-result-group-label">🎫 Tickets</div>
                              {globalSearchResults.tickets.map(t => {
                                const idx = flattenedSearchResults.findIndex(x => x.type === 'ticket' && x.item.id === t.id);
                                const isSelected = idx === searchSelectedIndex;
                                return (
                                  <div key={t.id} className="search-result-item" style={isSelected ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}} onClick={() => { setActiveTab("crm"); setShowSearchResults(false); setGlobalSearch(""); }}>
                                    <span className="search-result-item-id">{t.id}</span>
                                    <span className="search-result-item-label">{t.customer || t.orderId}</span>
                                    <span className="search-result-item-meta">{t.status} · {t.priority}</span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Notification Center */}
              <div style={{ position: "relative" }}>
                <button
                  id="btn-notifications"
                  onClick={() => {
                    setShowNotificationsDropdown(!showNotificationsDropdown);
                    setShowExportDropdown(false);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  🔔 Alerts
                  {unreadCount > 0 && (
                    <span 
                      style={{ 
                        background: "#ef4444", 
                        color: "var(--text-primary)", 
                        fontSize: "0.7rem", 
                        padding: "1px 6px", 
                        borderRadius: "50%", 
                        fontWeight: "700" 
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <>
                    <div 
                      className="no-print"
                      onClick={() => setShowNotificationsDropdown(false)}
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1050,
                        background: "transparent",
                        cursor: "default"
                      }}
                    />
                    <div 
                      className="dropdown-menu"
                      style={{
                        position: "absolute",
                        top: "45px",
                        right: "0",
                        width: "320px",
                        backgroundColor: "#0f172a",
                        border: "1px solid var(--border-color)",
                        borderRadius: "14px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                        zIndex: 1100,
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        animation: "fadeIn 0.2s ease-out"
                      }}
                    >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "8px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>Recent Alerts</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c084fc",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: "600",
                            padding: 0
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
                      {notifications.map((n) => {
                        const isRead = readNotifications.includes(n.id);
                        return (
                          <div 
                            key={n.id}
                            style={{
                              padding: "8px 10px",
                              backgroundColor: isRead ? "transparent" : "rgba(255, 255, 255, 0.02)",
                              borderLeft: isRead ? "3px solid transparent" : `3px solid ${n.type === "danger" ? "#ef4444" : n.type === "warning" ? "#fbbf24" : "#10b981"}`,
                              borderRadius: "4px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              opacity: isRead ? 0.6 : 1
                            }}
                          >
                            <div style={{ fontSize: "0.78rem", color: "#e2e8f0", fontWeight: "600" }}>
                              {n.emoji} {n.text}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                              {n.detail}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  </>
                )}
              </div>

              {/* Report Export Center */}
              <div style={{ position: "relative" }}>
                <button
                  id="btn-export"
                  onClick={() => {
                    setShowExportDropdown(!showExportDropdown);
                    setShowNotificationsDropdown(false);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  📥 Export
                </button>

                {showExportDropdown && (
                  <>
                    <div 
                      className="no-print"
                      onClick={() => setShowExportDropdown(false)}
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1050,
                        background: "transparent",
                        cursor: "default"
                      }}
                    />
                    <div 
                      className="export-dropdown-menu"
                      style={{
                        position: "absolute",
                        top: "45px",
                        right: "0",
                        width: "200px",
                        backgroundColor: "#0f172a",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                        zIndex: 1100,
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        animation: "fadeIn 0.2s ease-out"
                      }}
                    >
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowExportDropdown(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e2e8f0",
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        width: "100%",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      📄 Export PDF Report
                    </button>
                    <button
                      onClick={() => {
                        handleExportExcel();
                        setShowExportDropdown(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e2e8f0",
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        width: "100%",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      📊 Export Excel Data
                    </button>
                    <button
                      onClick={() => {
                        handleExportTickets();
                        setShowExportDropdown(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e2e8f0",
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        borderRadius: "6px",
                        width: "100%",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      🎫 Export Ticket Summary
                    </button>
                  </div>
                  </>
                )}
              </div>

              <span className="badge badge-purple" style={{ padding: "8px 12px", borderRadius: "8px", display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
                June 4, 2026
              </span>
            </div>
          </div>

          {/* VIEW SWITCHER CONDITIONAL RENDERING */}
          {activeTab === "enterprise_command_center" && loggedInUser?.role === "CEO" && (
            <EnterpriseCommandCenter 
              orders={orders} 
              tickets={tickets} 
              healthBoosts={healthBoosts}
              worstCourier={worstCourier}
              bestCourier={bestCourier}
              setActiveTab={setActiveTab}
              setCrmSubTab={setCrmSubTab}
              setCrmDelayCategory={setCrmDelayCategory}
              setCrmSearch={setCrmSearch}
              setRetentionSearch={setRetentionSearch}
              setLogisticsHighlightCourier={setLogisticsHighlightCourier}
              setLogisticsHighlightRegion={setLogisticsHighlightRegion}
            />
          )}

          {activeTab === "dashboard" && hasAccess("dashboard") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-out" }}>
              
              {/* Today's Operational Snapshot */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.03)", padding: "12px 20px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📊</span> Today's Operational Snapshot
                </div>
                <div style={{ display: "flex", gap: "24px", fontSize: "0.8rem" }}>
                  <div 
                    onClick={() => {
                      setActiveTab("logistics");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ display: "flex", gap: "6px", cursor: "pointer" }}
                    title="Click to view Logistics Analytics"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Orders Processed:</span>
                    <strong style={{ color: "var(--text-primary)" }}>{orders.length}</strong>
                  </div>
                  <div 
                    onClick={() => {
                      setActiveTab("crm");
                      setCrmSubTab("delays");
                      setCrmDelayCategory("actionable");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ display: "flex", gap: "6px", cursor: "pointer" }}
                    title="Click to view Active Delays in CRM"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Delayed Orders:</span>
                    <strong style={{ color: "#f87171" }}>{orders.filter(isActionableDelay).length}</strong>
                  </div>
                  <div 
                    onClick={() => {
                      setActiveTab("crm");
                      setTimeout(() => {
                        const el = document.getElementById("btn-export");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 150);
                    }}
                    style={{ display: "flex", gap: "6px", cursor: "pointer" }}
                    title="Click to view Open Support Tickets"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Open Tickets:</span>
                    <strong style={{ color: "#fbbf24" }}>{tickets.filter(t => t.status !== "Resolved").length}</strong>
                  </div>
                  <div 
                    onClick={() => {
                      setActiveTab("retention");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ display: "flex", gap: "6px", cursor: "pointer" }}
                    title="Click to view Retention Center cases"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Retention Cases:</span>
                    <strong style={{ color: "#c084fc" }}>{criticalHealthCustomers.length}</strong>
                  </div>
                  <div 
                    onClick={() => {
                      setActiveTab("automation");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ display: "flex", gap: "6px", cursor: "pointer" }}
                    title="Click to view Automation rules"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Active Workflows:</span>
                    <strong style={{ color: "#3b82f6" }}>4</strong>
                  </div>
                </div>
              </div>

              {/* Executive Operational KPIs Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                
                {/* High Risk Predictions Card */}
                <div 
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmSubTab("delays");
                    setCrmDelayCategory("predictive");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(139, 92, 246, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.15)";
                  }}
                  style={{ 
                    background: "rgba(139, 92, 246, 0.05)", 
                    padding: "20px", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(139, 92, 246, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c084fc", boxShadow: "0 0 8px #c084fc" }}></span>
                    High Risk Predictions
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.75rem", color: "#c084fc", border: "none", padding: 0, fontWeight: "800" }}>
                    {orders.filter(o => !isActionableDelay(o) && o.Status !== "Delivered" && (o.SlaBreachProbability || 0) > 70).length} Orders
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "6px", marginBottom: "8px" }}>
                    &gt; 70% probability of missing SLA
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ 8.4% WoW</span>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ 12.1% MoM</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#60a5fa", display: "block", marginTop: "12px", fontWeight: "600" }}>
                    View Predicted Breaches →
                  </span>
                </div>

                {/* Revenue at Risk Card */}
                <div 
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmSubTab("delays");
                    setCrmDelayCategory("actionable");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.15)";
                  }}
                  style={{ 
                    background: "rgba(239, 68, 68, 0.05)", 
                    padding: "20px", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "8px" }}>
                    Revenue At Risk
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.75rem", color: "#f87171", border: "none", padding: 0, fontWeight: "800" }}>
                    {formattedBriefingRev}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "6px", marginBottom: "8px" }}>
                    Across {orders.filter(isActionableDelay).length} active delays
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ 5.2% WoW</span>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ 9.8% MoM</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#60a5fa", display: "block", marginTop: "12px", fontWeight: "600" }}>
                    View Affected Orders →
                  </span>
                </div>

                {/* Active SLA Breaches Card */}
                <div 
                  onClick={() => {
                    setActiveTab("crm");
                    setCrmSubTab("delays");
                    setCrmDelayCategory("actionable");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.15)";
                  }}
                  style={{ 
                    background: "rgba(239, 68, 68, 0.05)", 
                    padding: "20px", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "8px" }}>
                    Active Delays
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.75rem", color: "#f87171", border: "none", padding: 0, fontWeight: "800" }}>
                    {orders.filter(isActionableDelay).length}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "6px", marginBottom: "8px" }}>
                    Breaching transit windows
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>↓ 2.1% WoW</span>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ 3.4% MoM</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#60a5fa", display: "block", marginTop: "12px", fontWeight: "600" }}>
                    Open CRM Tickets →
                  </span>
                </div>

                {/* Average Delay Days Card */}
                <div 
                  onClick={() => {
                    setActiveTab("logistics");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(245, 158, 11, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.15)";
                  }}
                  style={{ 
                    background: "rgba(245, 158, 11, 0.05)", 
                    padding: "20px", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(245, 158, 11, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "8px" }}>
                    Average Delay Days
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.75rem", color: "#fbbf24", border: "none", padding: 0, fontWeight: "800" }}>
                    {orders.filter(isActionableDelay).length > 0 ? (orders.filter(isActionableDelay).reduce((sum, o) => sum + getDelayDays(o), 0) / orders.filter(isActionableDelay).length).toFixed(1) : 0}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "6px", marginBottom: "8px" }}>
                    Days past SLA
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>↓ 0.5d WoW</span>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>↓ 1.2d MoM</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#60a5fa", display: "block", marginTop: "12px", fontWeight: "600" }}>
                    View Delay Details →
                  </span>
                </div>

                {/* Cost Per Delay Card */}
                <div 
                  onClick={() => {
                    setActiveTab("logistics");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.15)";
                  }}
                  style={{ 
                    background: "rgba(59, 130, 246, 0.05)", 
                    padding: "20px", 
                    borderRadius: "18px", 
                    border: "1px solid rgba(59, 130, 246, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", display: "block", marginBottom: "8px" }}>
                    Cost Per Delay
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.75rem", color: "#60a5fa", border: "none", padding: 0, fontWeight: "800" }}>
                    {orders.filter(isActionableDelay).length > 0 ? `₹${Math.round((briefingRevenueAtRisk * 0.12) / orders.filter(isActionableDelay).length).toLocaleString()}` : "₹0"}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginTop: "6px", marginBottom: "8px" }}>
                    Estimated compensation impact
                  </span>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ ₹120 WoW</span>
                    <span className="badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>↑ ₹450 MoM</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#60a5fa", display: "block", marginTop: "12px", fontWeight: "600" }}>
                    Optimize Routing →
                  </span>
                </div>
              </div>

              {/* AI Executive Recommendations Panel */}
              <div 
                className="panel" 
                style={{ 
                  padding: "20px", 
                  borderRadius: "18px", 
                  background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                  boxShadow: "0 10px 30px rgba(139, 92, 246, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  animation: "fadeIn 0.35s ease-out"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🤖</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", border: "none", padding: 0, color: "#c084fc" }}>
                        AI Executive Recommendations
                      </h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "2px 0 0 0" }}>
                        Actionable logistics overrides and risk mitigations generated in real-time.
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: "0.68rem", fontWeight: "bold" }}>
                    Live Advisory Active
                  </span>
                </div>

                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
                  gap: "15px",
                  marginTop: "5px" 
                }}>
                  <div style={{ 
                    padding: "14px", 
                    background: "rgba(239, 68, 68, 0.03)", 
                    border: "1px solid rgba(239, 68, 68, 0.15)", 
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px"
                  }}>
                    <span style={{ fontSize: "1.2rem", marginTop: "-2px" }}>📈</span>
                    <div>
                      <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.85rem", display: "block" }}>
                        Revenue exposure increasing
                      </span>
                      <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.8rem", lineHeight: "1.4" }}>
                        Unmitigated delays are threatening up to <strong style={{ color: "#fca5a5" }}>{formattedRevenueExposure}</strong> in recognized revenue this period.
                      </p>
                    </div>
                  </div>

                  <div style={{ 
                    padding: "14px", 
                    background: "rgba(245, 158, 11, 0.03)", 
                    border: "1px solid rgba(245, 158, 11, 0.15)", 
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px"
                  }}>
                    <span style={{ fontSize: "1.2rem", marginTop: "-2px" }}>⚠️</span>
                    <div>
                      <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.85rem", display: "block" }}>
                        Churn risk rising
                      </span>
                      <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.8rem", lineHeight: "1.4" }}>
                        We predict an <strong style={{ color: "#fbd38d" }}>18% increase</strong> in churn for high-value accounts due to repeated delivery friction.
                      </p>
                    </div>
                  </div>

                  <div style={{ 
                    padding: "14px", 
                    background: "rgba(59, 130, 246, 0.03)", 
                    border: "1px solid rgba(59, 130, 246, 0.15)", 
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px"
                  }}>
                    <span style={{ fontSize: "1.2rem", marginTop: "-2px" }}>📉</span>
                    <div>
                      <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.85rem", display: "block" }}>
                        SLA forecast deterioration
                      </span>
                      <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.8rem", lineHeight: "1.4" }}>
                        Logistics network shows a downward trend. <strong style={{ color: "#93c5fd" }}>Executive actions required</strong> to stabilize carrier allocations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Chart and Action Panel Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
                {/* Trend Chart */}
                <div className="panel" style={{ padding: "20px", borderRadius: "18px", border: "1px solid var(--border-color)" }}>
                  <RevenueChart orders={orders} />
                </div>

                {/* Action Panel */}
                <div 
                  className="panel" 
                  style={{ 
                    padding: "20px", 
                    borderRadius: "18px", 
                    border: "1px solid var(--border-color)", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "15px", 
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.2rem" }}>⚡</span>
                      <h2 style={{ margin: 0, fontSize: "1.1rem", border: "none", padding: 0, color: "#ffffff", fontWeight: "600" }}>
                        Top 5 Actions Required Today
                      </h2>
                    </div>
                    <span className="badge badge-amber" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>Actions Due</span>
                  </div>
                  <p style={{ color: "#e2e8f0", margin: 0, fontSize: "0.8rem", lineHeight: "1.4" }}>
                    Prioritized operational interventions generated by AI to mitigate revenue risk.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "5px" }}>
                    
                    <div className="action-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.12)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                      setActiveTab("retention");
                      setRetentionSearch("Priya Reddy");
                      setTimeout(() => {
                        const el = document.getElementById("retention-churn-panel");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}>
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", color: "#f87171", fontWeight: "700" }}>Contact Priya Reddy</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.3" }}>High churn risk - requires immediate retention call</p>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>📞</span>
                    </div>

                    <div className="action-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(245, 158, 11, 0.04)", border: "1px solid rgba(245, 158, 11, 0.12)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                      setActiveTab("crm");
                      setCrmSubTab("outreach");
                      setCrmSearch("ORD1024");
                      setTimeout(() => {
                        const el = document.getElementById("crm-action-center");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}>
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", color: "#fbbf24", fontWeight: "700" }}>Escalate ORD1024</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.3" }}>Critical SLA breach with VIP account</p>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>🚨</span>
                    </div>

                    <div className="action-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(59, 130, 246, 0.04)", border: "1px solid rgba(59, 130, 246, 0.12)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                      setActiveTab("logistics");
                      setLogisticsHighlightCourier("BlueDart");
                      setTimeout(() => {
                        const el = document.getElementById("courier-performance-metrics");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}>
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", color: "#60a5fa", fontWeight: "700" }}>Shift volume from BlueDart</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.3" }}>Courier responsible for 41% of recent delays</p>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>🚚</span>
                    </div>

                    <div className="action-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.12)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                      setActiveTab("automation");
                      setAutomationHighlightRuleId(3);
                      setAutomationHighlightTarget("ORD1011");
                      setTimeout(() => {
                        const el = document.getElementById("workflow-automation-rules");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}>
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", color: "#34d399", fontWeight: "700" }}>Approve ₹500 compensation</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.3" }}>Pending workflow approval for ORD1011</p>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>✅</span>
                    </div>

                    <div className="action-card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(139, 92, 246, 0.04)", border: "1px solid rgba(139, 92, 246, 0.12)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                      setActiveTab("logistics");
                      setLogisticsHighlightRegion("North");
                      setTimeout(() => {
                        const el = document.getElementById("regional-delay-density");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 100);
                    }}>
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.85rem", color: "#c084fc", fontWeight: "700" }}>Review North Zone delays</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.3" }}>Spike in transit exceptions reported (₹2.1L Risk)</p>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>🌍</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Proactive SLA Breach Predictions Widget / Critical Alerts */}
              <div 
                className="panel" 
                style={{ 
                  padding: "20px", 
                  borderRadius: "18px",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  background: "linear-gradient(135deg, #12102e 0%, #0f172a 100%)",
                  boxShadow: "0 10px 30px rgba(245, 158, 11, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.8rem" }}>🔮</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", border: "none", padding: 0, color: "var(--text-primary)" }}>
                        Delay Prediction Engine
                      </h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "2px 0 0 0" }}>
                        Predicts SLA breaches before they happen using real-time ML courier routing data. {showAllBreaches || proactiveBreachPredictions.length <= 10 ? `Showing ${proactiveBreachPredictions.length} SLA Risks` : `Showing Top 10 Critical Risks`}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: "0.68rem", fontWeight: "bold" }}>
                    Predictive Analytics Model Active
                  </span>
                </div>

                <div className="table-wrapper" style={{ margin: 0, overflowX: "auto" }}>
                  <table className="crm-table" style={{ fontSize: "0.82rem", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "8px" }}>Order ID</th>
                        <th style={{ padding: "8px" }}>Customer</th>
                        <th style={{ padding: "8px" }}>Courier</th>
                        <th style={{ padding: "8px" }}>Expected Delivery</th>
                        <th style={{ padding: "8px", textAlign: "right" }}>Value</th>
                        <th style={{ padding: "8px", textAlign: "center" }}>Breach Probability</th>
                        <th style={{ padding: "8px" }}>Identified Risk Factor</th>
                        <th style={{ padding: "8px", textAlign: "center" }}>Proactive Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proactiveBreachPredictions.length > 0 ? (
                        (showAllBreaches ? proactiveBreachPredictions : proactiveBreachPredictions.slice(0, 10)).map((pred) => {
                          let probColor = "#ef4444"; // Red for high
                          let probBg = "rgba(239, 68, 68, 0.1)";
                          if (pred.probability < 75) {
                            probColor = "#fbbf24"; // Yellow
                            probBg = "rgba(251, 191, 36, 0.1)";
                          } else if (pred.probability < 60) {
                            probColor = "#3b82f6"; // Blue
                            probBg = "rgba(59, 130, 246, 0.1)";
                          }

                           const isExpanded = expandedPredictionId === pred.orderId;
                           return (
                             <React.Fragment key={pred.orderId}>
                               <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                 <td style={{ padding: "10px 8px", fontWeight: "700", color: "var(--accent-blue)" }}>{pred.orderId}</td>
                                 <td style={{ padding: "10px 8px" }}>{pred.customer}</td>
                                 <td style={{ padding: "10px 8px" }}>{pred.courier}</td>
                                 <td style={{ padding: "10px 8px" }}>{pred.expectedDate}</td>
                                 <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: "600" }}>₹{pred.value.toLocaleString()}</td>
                                 <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                   <span className="badge" style={{ color: probColor, background: probBg, border: `1px solid ${probColor}33`, fontWeight: "800", fontSize: "0.78rem" }}>
                                     ⚡ {pred.probability}% Risk
                                   </span>
                                 </td>
                                 <td 
                                   onClick={() => setExpandedPredictionId(isExpanded ? null : pred.orderId)}
                                   style={{ 
                                     padding: "10px 8px", 
                                     color: "#cbd5e1", 
                                     cursor: "pointer",
                                     userSelect: "none"
                                   }}
                                   title="Click to view AI risk explanation"
                                 >
                                   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                     <div style={{ display: "flex", alignItems: "center" }}>
                                       <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: probColor, marginRight: "8px", verticalAlign: "middle" }}></span>
                                       <span style={{ borderBottom: "1px dashed rgba(255,255,255,0.3)" }}>{pred.riskFactor}</span>
                                     </div>
                                     <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                       {isExpanded ? "▲ Collapse" : "▼ Explain"}
                                     </span>
                                   </div>
                                 </td>
                                 <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                   <span
                                     style={{ 
                                       padding: "4px 8px", 
                                       fontSize: "0.72rem", 
                                       backgroundColor: "rgba(255, 255, 255, 0.05)", 
                                       color: "var(--text-secondary)", 
                                       borderRadius: "4px",
                                       fontWeight: "500",
                                       display: "inline-block"
                                     }}
                                   >
                                     {pred.actionText}
                                   </span>
                                 </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan="8" style={{ padding: "12px 16px", backgroundColor: "rgba(139, 92, 246, 0.02)" }}>
                                      <div style={{ 
                                        padding: "16px 20px", 
                                        borderRadius: "12px", 
                                        background: "linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)", 
                                        border: "1px solid rgba(139, 92, 246, 0.25)", 
                                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3)",
                                        backdropFilter: "blur(12px)", 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: "10px" 
                                      }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(255, 255, 255, 0.1)", paddingBottom: "8px" }}>
                                          <span style={{ color: "#c4b5fd", fontWeight: "800", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span>🧠</span> AI Prediction Rationale & Risk Analysis
                                          </span>
                                          <div style={{ display: "flex", gap: "18px", fontSize: "0.78rem" }}>
                                            <div>
                                              <span style={{ color: "var(--text-secondary)" }}>Model Confidence: </span>
                                              <strong style={{ color: "#34d399" }}>{pred.modelConfidence}%</strong>
                                            </div>
                                            <div>
                                              <span style={{ color: "var(--text-secondary)" }}>Value at Risk: </span>
                                              <strong style={{ color: "#ef4444" }}>₹{pred.valueAtRisk.toLocaleString()}</strong>
                                            </div>
                                          </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#cbd5e1", lineHeight: "1.5" }}>
                                          {pred.rationale}
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                         })
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>
                            No active SLA breach risks predicted.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {proactiveBreachPredictions.length > 10 && (
                  <button className="view-all-btn" onClick={() => setShowAllBreaches(p => !p)}>
                    {showAllBreaches ? <><span>▲</span> Show Top 10 Only</> : <><span>▼</span> View All {proactiveBreachPredictions.length} Risk Predictions</>}
                  </button>
                )}
              </div>

              {/* ============ ML FORECAST METRICS PANEL ============ */}
              <div className="panel" style={{ padding: "22px", borderRadius: "18px", border: "1px solid rgba(139, 92, 246, 0.25)", background: "linear-gradient(135deg, #0e0a2e 0%, #0f172a 100%)", boxShadow: "0 10px 30px rgba(139, 92, 246, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.8rem" }}>🧠</span>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", border: "none", padding: 0, color: "var(--text-primary)" }}>ML Forecast — Next 7 Days</h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "2px 0 0 0" }}>Predictive model trained on delay patterns, courier SLA history, and regional routing data</p>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: "0.68rem", fontWeight: "bold" }}>Model Confidence: {mlForecast.confidence}%</span>
                </div>
                <div className="forecast-kpi-grid">
                  <div 
                    className="forecast-kpi-card"
                    onClick={() => {
                      setActiveTab("crm");
                      setCrmSubTab("delays");
                      setCrmDelayCategory("predictive");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ cursor: "pointer" }}
                    title="Click to view Predictive SLA Risks in CRM"
                  >
                    <div className="forecast-kpi-label">🚨 Predicted SLA Breaches</div>
                    <div className="forecast-kpi-value" style={{ color: "#f87171" }}>{mlForecast.predictedBreaches}</div>
                    <div className="forecast-kpi-trend" style={{ color: "#fca5a5" }}>
                      <span>↑</span> +{Math.round(mlForecast.predictedBreaches * 0.15)} vs this week
                    </div>
                  </div>
                  <div 
                    className="forecast-kpi-card"
                    onClick={() => {
                      setActiveTab("crm");
                      setCrmSubTab("delays");
                      setCrmDelayCategory("actionable");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ cursor: "pointer" }}
                    title="Click to view Revenue at Risk in CRM"
                  >
                    <div className="forecast-kpi-label">💰 Predicted Revenue At Risk</div>
                    <div className="forecast-kpi-value" style={{ color: "#fbbf24" }}>{mlForecast.formattedRevenue}</div>
                    <div className="forecast-kpi-trend" style={{ color: "#fcd34d" }}>
                      <span>↑</span> 22% above current exposure
                    </div>
                  </div>
                  <div 
                    className="forecast-kpi-card"
                    onClick={() => {
                      setActiveTab("retention");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ cursor: "pointer" }}
                    title="Click to view Churn Risk in Retention Center"
                  >
                    <div className="forecast-kpi-label">👥 Predicted Churn Risk</div>
                    <div className="forecast-kpi-value" style={{ color: "#c084fc" }}>{mlForecast.predictedChurn}</div>
                    <div className="forecast-kpi-trend" style={{ color: "#d8b4fe" }}>
                      <span>↑</span> +{mlForecast.predictedChurn - Math.round(mlForecast.predictedChurn / 1.18)} accounts vs current
                    </div>
                  </div>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem", margin: "14px 0 0 0", fontStyle: "italic", textAlign: "right" }}>
                  ⚠️ Forecasts are simulated projections based on dataset trend analysis. Actual results may vary.
                </p>
              </div>

            </div>
          )}

          {/* INTEGRATIONS HUB MODAL */}
          {showIntegrationsModal && (
            <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowIntegrationsModal(false)}>
              <div className="modal-content" style={{ maxWidth: "580px", background: "var(--bg-secondary)" }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🔌</span> Ecommerce Integration Hub
                  </h3>
                  <button className="modal-close" onClick={() => setShowIntegrationsModal(false)}>&times;</button>
                </div>
                <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: 0 }}>
                    Connect your ecommerce platforms to sync live orders, shipments, and customer data into the Dispatch Command Center.
                  </p>
                  {[
                    { key: "shopify", name: "Shopify", emoji: "🛒", desc: "Orders, customers, fulfilments", color: "#96BF48" },
                    { key: "woocommerce", name: "WooCommerce", emoji: "🚧", desc: "Orders, shipping, status updates", color: "#9B59B6" },
                    { key: "shiprocket", name: "Shiprocket", emoji: "🚀", desc: "Courier allocation, tracking, SLA", color: "#3B82F6" }
                  ].map(plat => {
                    const cfg = integrationStatus[plat.key] || {};
                    const isSyncing = integrationSyncing === plat.key;
                    const statusClass = cfg.mode === "demo" ? "demo" : cfg.connected ? "connected" : "disconnected";
                    const statusLabel = cfg.mode === "demo" ? "Demo Mode" : cfg.connected ? "Connected" : "Not Connected";
                    return (
                      <div key={plat.key} className="integration-card">
                        <div className="integration-logo" style={{ background: `${plat.color}18`, border: `1px solid ${plat.color}33` }}>
                          <span>{plat.emoji}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                            <span style={{ fontWeight: "700", fontSize: "0.92rem" }}>{plat.name}</span>
                            <div className={`integration-status-dot ${statusClass}`} />
                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: "600" }}>{statusLabel}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{plat.desc}</div>
                          {cfg.lastSync && <div style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "2px" }}>Last synced: {cfg.lastSync} • {cfg.orders} records</div>}
                        </div>
                        <button
                          className="btn btn-small btn-secondary"
                          disabled={isSyncing}
                          onClick={() => handleSyncIntegration(plat.key)}
                          style={{ padding: "6px 12px", fontSize: "0.75rem", opacity: isSyncing ? 0.7 : 1 }}
                        >
                          {isSyncing ? "⟳ Syncing..." : cfg.mode === "demo" ? "🔄 Sync Now" : "+ Connect"}
                        </button>
                      </div>
                    );
                  })}
                  <div style={{ background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "12px", padding: "12px 16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    💡 <strong style={{ color: "var(--text-primary)" }}>Demo Mode Active:</strong> All data sourced from uploaded CSV dataset. Connect a live API key to replace with real-time ecommerce data.
                  </div>
                </div>
                <div className="modal-footer" style={{ background: "var(--bg-tertiary)", borderTop: "1px solid var(--border-color)" }}>
                  <button className="btn btn-secondary" onClick={() => setShowIntegrationsModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* CRM Operations Tab Content */}
          {activeTab === "crm" && hasAccess("crm") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px", animation: "fadeIn 0.3s ease-out" }}>
              {/* AI Recommendations & Top Insight Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-out" }}>
                
                {/* 3-Card Grid */}
                <div className="copilot-actions-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: 0 }}>
                  
                  {/* AI Root Cause Analysis Card */}
                  <div 
                    className="panel" 
                    style={{ 
                      marginBottom: 0, 
                      height: "100%", 
                      boxSizing: "border-box", 
                      display: "flex", 
                      flexDirection: "column", 
                      justifyContent: "space-between", 
                      padding: "18px", 
                      borderRadius: "18px",
                      border: "1px solid rgba(139, 92, 246, 0.25)",
                      background: "linear-gradient(135deg, #120f2e 0%, #0f172a 100%)",
                      boxShadow: "0 10px 30px rgba(139, 92, 246, 0.08)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h2 style={{ margin: 0, fontSize: "1.02rem", border: "none", padding: 0, display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #ffffff 0%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          🔍 Operational Risk Insights
                        </h2>
                        <span className="badge badge-purple" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                          {activeTicketsCount} Active
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", lineHeight: "1.4" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "#fca5a5", fontWeight: "700", fontSize: "0.92rem" }}>
                              {worstCourierPercentage}% Courier Delay Rate
                            </span>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: "500" }}>
                              ({worstCourierDelays} {worstCourier} delayed / {totalActiveDelays} total active delays)
                            </span>
                          </div>
                          <span style={{ color: "#fbbf24", fontWeight: "700", fontSize: "1.02rem" }}>
                            {predictedRevenueImpact} Risk
                          </span>
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "0.8rem", borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: "8px" }}>
                          <span>{affectedRegionText} Affected</span>
                          <span style={{ color: "#f87171" }}>{worstCourier} Highest Risk</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      marginTop: "12px", 
                      padding: "8px 10px", 
                      background: "rgba(139, 92, 246, 0.06)", 
                      border: "1px dashed rgba(139, 92, 246, 0.2)", 
                      borderRadius: "8px",
                      fontSize: "0.78rem"
                    }}>
                      <span style={{ color: "#e2e8f0" }}>
                        <strong>Recommended:</strong> Shift loads to <strong style={{ color: "#3b82f6" }}>{bestCourier}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Courier Performance Scorecard Widget */}
                  {(() => {
                    const courierPerfMap = {};
                    orders.forEach(o => {
                      const courier = o.Courier?.trim() || "Unassigned";
                      if (!courierPerfMap[courier]) {
                        courierPerfMap[courier] = { name: courier, total: 0, delayed: 0, revenueImpact: 0 };
                      }
                      courierPerfMap[courier].total += 1;
                      if (isActionableDelay(o)) {
                        courierPerfMap[courier].delayed += 1;
                        courierPerfMap[courier].revenueImpact += Number(o.OrderValue || 0);
                      }
                    });
                    const courierPerfData = Object.values(courierPerfMap).map(c => ({
                      ...c,
                      sla: c.total > 0 ? Math.round(((c.total - c.delayed) / c.total) * 100) : 100,
                      delayRate: c.total > 0 ? Math.round((c.delayed / c.total) * 100) : 0
                    })).sort((a, b) => b.revenueImpact - a.revenueImpact);

                    return (
                      <div 
                        className="panel" 
                        style={{ 
                          marginBottom: 0, 
                          height: "100%", 
                          boxSizing: "border-box", 
                          display: "flex", 
                          flexDirection: "column", 
                          justifyContent: "space-between", 
                          padding: "20px", 
                          borderRadius: "18px",
                          border: "1px solid var(--border-color)",
                          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h2 style={{ margin: 0, fontSize: "1.1rem", border: "none", padding: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                              <span>🚚</span> Courier Performance Scorecard
                            </h2>
                            <span className="badge badge-purple" style={{ fontSize: "0.65rem", textTransform: "uppercase" }}>Procurement Risk</span>
                          </div>
                          
                          <div className="table-wrapper" style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)" }}>
                                  <th style={{ padding: "6px 4px" }}>Courier</th>
                                  <th style={{ padding: "6px 4px", textAlign: "center" }}>SLA %</th>
                                  <th style={{ padding: "6px 4px", textAlign: "center" }}>Delay %</th>
                                  <th style={{ padding: "6px 4px", textAlign: "right" }}>Rev. Impact</th>
                                  <th style={{ padding: "6px 4px", textAlign: "center" }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {courierPerfData.map(c => {
                                  const formatLakhs = (val) => {
                                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                                    return `₹${val.toLocaleString()}`;
                                  };

                                  let slaColor = "var(--accent-green)";
                                  if (c.sla < 80) slaColor = "var(--accent-red)";
                                  else if (c.sla < 90) slaColor = "var(--accent-amber)";

                                  return (
                                    <tr key={c.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <td style={{ padding: "8px 4px", fontWeight: "700", color: "#e2e8f0" }}>{c.name}</td>
                                      <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "700", color: slaColor }}>{c.sla}%</td>
                                      <td style={{ padding: "8px 4px", textAlign: "center" }}>{c.delayRate}%</td>
                                      <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: "600", color: c.revenueImpact > 0 ? "#fca5a5" : "inherit" }}>
                                        {formatLakhs(c.revenueImpact)}
                                      </td>
                                      <td style={{ padding: "8px 4px", textAlign: "center" }}>
                                        <button 
                                          className="btn btn-small"
                                          onClick={() => {
                                            setCourierEscalationMessage(`To ${c.name} Cargo Partnerships,\n\nOur system has detected ${c.delayed} active delayed shipments that have breached our contract SLA limits. This warning requires your immediate intervention. Please provide transit updates for these shipments within 24 hours to prevent official contract review.\n\nWarm regards,\nOperations Director`);
                                            setShowCourierModal(true);
                                          }}
                                          style={{ padding: "2px 6px", fontSize: "0.7rem", backgroundColor: c.delayed > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.05)", color: c.delayed > 0 ? "#ef4444" : "var(--text-secondary)", border: c.delayed > 0 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--border-color)", cursor: "pointer", borderRadius: "4px" }}
                                        >
                                          Escalate
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Executive Actions */}
                  <ExecutiveActions onActionTrigger={handleActionTrigger} loggedInUser={loggedInUser} />
                </div>

                {/* Collapsible Recommendations Section */}
                <div style={{ 
                  background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  borderRadius: "12px",
                  padding: "14px 20px",
                  boxShadow: "0 10px 30px rgba(139, 92, 246, 0.03)",
                  transition: "all 0.3s ease"
                }}>
                  <div 
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.2rem" }}>🤖</span>
                      <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#a78bfa", fontWeight: "600", border: "none", padding: 0 }}>
                        AI Operations Recommendations
                      </h3>
                    </div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "4px" }}>
                      {showRecommendations ? "▲ Collapse" : "▼ Expand"}
                    </span>
                  </div>
                  
                  {showRecommendations && (
                    <div style={{ marginTop: "15px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "15px", animation: "fadeIn 0.25s ease-out" }}>
                      <ul className="ai-copilot-tips" style={{ margin: 0, paddingLeft: "20px" }}>
                        <li style={{ marginBottom: "10px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                          <strong>Carrier Performance Drop:</strong> <strong style={{ color: "#fca5a5" }}>{worstCourier}</strong> delays increased by <strong style={{ color: "#fca5a5" }}>{worstCourierWeeklyChange}%</strong> compared to last week.
                        </li>
                        <li style={{ marginBottom: "10px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                          <strong>Financial Risk Exposure:</strong> Revenue exposure increased by <strong style={{ color: "#fbd38d" }}>{formattedRevenueExposure}</strong> (total delayed revenue at risk: <strong>₹{delayedRevenue.toLocaleString()}</strong>).
                        </li>
                        <li style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                          <strong>Routing Optimization:</strong> Recommend shifting <strong style={{ color: "#93c5fd" }}>{regionAtRisk} region</strong> orders to <strong style={{ color: "#93c5fd" }}>{bestCourier}</strong>.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

              </div>

              {/* Spacing & Table Container */}
              <div style={{ marginTop: "24px" }}>
                <TicketManagement
                  tickets={tickets}
                  onUpdateTicket={handleUpdateTicket}
                />
              </div>

              {/* Customer Outreach Action Center */}
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
                activeTab={crmSubTab}
                ratingFilter={crmRatingFilter}
                setRatingFilter={setCrmRatingFilter}
                riskFilter={crmRiskFilter}
                setRiskFilter={setCrmRiskFilter}
                sortBy={crmSortBy}
                setSortBy={setCrmSortBy}
              />

              {/* Communication log history */}
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, border: "none", padding: 0 }}>📜 Enterprise Audit Trail</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "5px 0 15px 0" }}>
                    Complete history of actions, automated workflows, and multi-channel communications.
                  </p>
                </div>
                
                <div className="table-wrapper">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Agent / Role</th>
                        <th>Action / Event</th>
                        <th>Details / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const logsArray = [];
                        Object.entries(crmLogs).forEach(([orderId, logs]) => {
                          if (Array.isArray(logs)) {
                            logs.forEach(l => {
                              logsArray.push({ orderId, ...l });
                            });
                          }
                        });

                        if (logsArray.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" style={{ textAlign: "center", padding: "45px", color: "var(--text-secondary)" }}>
                                No outreach history logs recorded yet. Follow up on delayed orders to generate logs.
                              </td>
                            </tr>
                          );
                        }

                        return logsArray.map((log, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{log.orderId}</td>
                            <td style={{ whiteSpace: "nowrap" }}>{log.timestamp || log.date}</td>
                            <td>
                              <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>
                                {log.author || "Operations Agent"}
                              </span>
                            </td>
                            <td style={{ fontWeight: "600" }}>{log.type || log.action}</td>
                            <td style={{ color: "#cbd5e1" }}>{log.text || log.note}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Customer Retention Center Tab Content */}
          {activeTab === "retention" && hasAccess("retention") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "20px" }}>
              <CustomerRetentionCenter
                orders={orders}
                tickets={tickets}
                onAddLog={handleAddLog}
                healthBoosts={healthBoosts}
                onAddHealthBoost={handleIncreaseHealth}
                searchQuery={retentionSearch}
                setSearchQuery={setRetentionSearch}
              />
            </div>
          )}

          {/* Workflow Automation Tab Content */}
          {activeTab === "automation" && hasAccess("retention") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "20px" }}>
              <WorkflowAutomation
                orders={orders}
                tickets={tickets}
                onAddLog={handleAddLog}
                highlightRuleId={automationHighlightRuleId}
                highlightTarget={automationHighlightTarget}
              />
            </div>
          )}

          {/* Logistics Analytics Tab Content */}
          {activeTab === "logistics" && hasAccess("logistics") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "20px" }}>
              <AnalyticsView 
                orders={orders} 
                tickets={tickets} 
                activeTab="logistics" 
                subTab="all" 
                highlightCourier={logisticsHighlightCourier}
                highlightRegion={logisticsHighlightRegion}
              />
            </div>
          )}

          {/* Customer Experience Tab Content */}
          {activeTab === "customerExperience" && hasAccess("customerExperience") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "20px" }}>
              <AnalyticsView orders={orders} tickets={tickets} activeTab="customerExperience" subTab="all" />
            </div>
          )}

          {/* Administration Tab Content */}
          {activeTab === "admin" && hasAccess("admin") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Admin Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                <div className="panel" style={{ padding: "20px", textAlign: "center", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#60a5fa" }}>18</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "8px" }}>Active Users</div>
                </div>
                <div className="panel" style={{ padding: "20px", textAlign: "center", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#c084fc" }}>5</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "8px" }}>Roles Defined</div>
                </div>
                <div className="panel" style={{ padding: "20px", textAlign: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#34d399" }}>12</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "8px" }}>Automation Rules</div>
                </div>
                <div className="panel" style={{ padding: "20px", textAlign: "center", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#fbbf24" }}>247</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", marginTop: "8px" }}>Audit Events Today</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* System Health Card */}
                <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "24px", borderRadius: "18px", border: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem" }}>
                    <span>🫀</span> System Health Status
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Database:</span>
                      <span className="badge badge-green">Healthy</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Workflows:</span>
                      <span className="badge badge-blue">Running</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>CRM Engine:</span>
                      <span className="badge badge-green">Active</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Data Pipeline:</span>
                      <span className="badge badge-green">Active</span>
                    </div>
                  </div>
                </div>

                {/* Recent Admin Activity */}
                <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "24px", borderRadius: "18px", border: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem" }}>
                    <span>📝</span> Recent Admin Activity
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px", borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: "15px", marginLeft: "10px" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-22px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#a78bfa" }}></div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>08:15 PM</div>
                      <div style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>Priya created workflow rule</div>
                    </div>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-22px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#60a5fa" }}></div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>07:40 PM</div>
                      <div style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>Ravi imported dataset</div>
                    </div>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-22px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#f87171" }}></div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>06:22 PM</div>
                      <div style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>Admin updated permissions</div>
                    </div>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-22px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "#34d399" }}></div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>05:11 PM</div>
                      <div style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>Customer outreach automation executed</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Data Import Tab Content */}
          {activeTab === "import" && hasAccess("import") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "20px" }}>
              <DataImportView 
                currentOrdersCount={orders.length}
                tickets={tickets}
                onImportComplete={handleImportComplete}
              />
            </div>
          )}



          {/* Outreach Desk Tab Content */}
          {activeTab === "outreachDesk" && hasAccess("outreachDesk") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "25px" }}>
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
                ratingFilter={crmRatingFilter}
                setRatingFilter={setCrmRatingFilter}
                riskFilter={crmRiskFilter}
                setRiskFilter={setCrmRiskFilter}
                sortBy={crmSortBy}
                setSortBy={setCrmSortBy}
              />

              {/* Communication log history */}
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, border: "none", padding: 0 }}>📝 Customer Contact & Outreach History</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "5px 0 15px 0" }}>
                    Chronological audit log of all communications, apology emails sent, phone calls, and customer mitigation actions.
                  </p>
                </div>
                
                <div className="table-wrapper">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Agent / Role</th>
                        <th>Action / Event</th>
                        <th>Details / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const logsArray = [];
                        Object.entries(crmLogs).forEach(([orderId, logs]) => {
                          if (Array.isArray(logs)) {
                            logs.forEach(l => {
                              logsArray.push({ orderId, ...l });
                            });
                          }
                        });

                        if (logsArray.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" style={{ textAlign: "center", padding: "45px", color: "var(--text-secondary)" }}>
                                No communications recorded today. Select a customer above to log outreach events.
                              </td>
                            </tr>
                          );
                        }

                        return logsArray.map((log, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                            <td style={{ fontWeight: "700", color: "var(--accent-blue)" }}>{log.orderId}</td>
                            <td style={{ color: "var(--text-secondary)" }}>{log.date}</td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>{log.user || "System"}</span>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{log.role}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: "600" }}>{log.type || log.action}</td>
                            <td style={{ color: "#cbd5e1" }}>{log.text || log.note}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Management Tab Content (Support Agent) */}
          {activeTab === "ticketManagement" && hasAccess("ticketManagement") && (
            <div style={{ animation: "fadeIn 0.3s ease-out", display: "flex", flexDirection: "column", gap: "20px" }}>
              <TicketManagement
                tickets={tickets}
                onUpdateTicket={handleUpdateTicket}
              />
            </div>
          )}

        </div>
      </main>

      {/* Courier Escalation Modal */}
      {showCourierModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: "600px", background: "var(--bg-secondary)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
              <h3 style={{ display: "flex", gap: "10px", alignItems: "center", margin: 0, color: "#fca5a5" }}>
                <span>🚨</span>
                <span>Raise Courier Escalation - BlueDart</span>
              </h3>
              <button className="modal-close" onClick={() => setShowCourierModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const subject = e.target.subject.value;
              const email = e.target.email.value;
              const msg = e.target.message.value;
              handleDispatchCourierEscalation(subject, email, msg);
            }}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600" }}>Escalation Destination Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    defaultValue="partnerships@bluedart.com" 
                    required 
                    style={{ width: "100%", padding: "8px 12px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px" }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600" }}>Subject</label>
                  <input 
                    name="subject" 
                    type="text" 
                    defaultValue={`URGENT SLA BREACH: ${orders.filter(o => o.Courier?.trim() === "BlueDart" && isActionableDelay(o)).length || 7} Active Delays Warning`} 
                    required 
                    style={{ width: "100%", padding: "8px 12px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600" }}>Warning Escalation Message</label>
                  <textarea 
                    name="message" 
                    value={courierEscalationMessage}
                    onChange={(e) => setCourierEscalationMessage(e.target.value)}
                    required 
                    rows={8}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.85rem", resize: "vertical" }}
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ background: "var(--bg-tertiary)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px", padding: "15px 20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourierModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>Dispatch Official Warning</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "var(--text-primary)",
          padding: "16px 24px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.9rem",
          fontWeight: "600",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          animation: "slideIn 0.3s ease-out"
        }}>
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Monthly Executive Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "20px" }}>
          <div className="modal-content" style={{ backgroundColor: "#0f172a", border: "1px solid var(--border-color)", borderRadius: "18px", width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid var(--border-color)", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>📊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", border: "none", padding: 0 }}>Monthly Executive Performance Report</h3>
                  <p style={{ margin: "2px 0 0 0", color: "var(--text-secondary)", fontSize: "0.78rem" }}>Audit Period: June 1, 2026 - June 30, 2026</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.4rem" }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body (Printable Report Container) */}
            <div id="printable-executive-report" style={{ padding: "30px 40px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "25px", backgroundColor: "#0f172a", color: "#e2e8f0" }}>
              {/* Logo / Letterhead */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #334155", paddingBottom: "15px" }}>
                <div>
                  <h1 style={{ fontSize: "1.7rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>DISPATCHIQ</h1>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.1em" }}>Enterprise Operations Analytics</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: "600" }}>Report ID: DIQ-2026-M6</p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>Date Generated: June 17, 2026</p>
                </div>
              </div>

              {/* Executive Summary Section */}
              <div style={{ 
                padding: "20px 25px", 
                borderRadius: "12px", 
                backgroundColor: "rgba(245, 158, 11, 0.04)", 
                border: "1px solid rgba(245, 158, 11, 0.2)", 
                marginBottom: "5px" 
              }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", fontWeight: "800", color: "#fbbf24", border: "none", padding: 0 }}>
                  📋 Executive Summary
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Report Name:</span>
                      <strong style={{ color: "#e2e8f0" }}>Enterprise Operations Report</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Date:</span>
                      <strong style={{ color: "#e2e8f0" }}>01 July 2026</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Revenue at Risk:</span>
                      <strong style={{ color: "#ef4444" }}>₹{(delayedRevenue / 100000).toFixed(2)}L</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Critical Orders:</span>
                      <strong style={{ color: "#fca5a5" }}>{orders.filter(isActionableDelay).length}</strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Customers at Churn Risk:</span>
                      <strong style={{ color: "#c084fc" }}>{criticalHealthCustomers.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Top Courier Issue:</span>
                      <strong style={{ color: "#f87171" }}>{worstCourier}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Highest Risk Region:</span>
                      <strong style={{ color: "#fbbf24" }}>{regionAtRisk} Zone</strong>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "6px" }}>
                      <span style={{ color: "#a78bfa", fontWeight: "700", fontSize: "0.78rem" }}>⚡ AI Recommendation:</span>
                      <span style={{ color: "#e2e8f0", fontSize: "0.78rem", fontWeight: "500" }}>Shift 15% volume from {worstCourier} to {bestCourier}.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 1: Sales & Financial */}
              <div>
                <h4 style={{ textTransform: "uppercase", color: "#94a3b8", fontSize: "0.8rem", fontWeight: "800", margin: "0 0 10px 0", letterSpacing: "0.05em" }}>1. Sales & Profitability Analysis</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                  <div style={{ padding: "15px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Booked Sales</span>
                    <h3 style={{ margin: "5px 0 0 0", fontSize: "1.4rem", color: "#38bdf8", border: "none", padding: 0 }}>₹2.45Cr</h3>
                    <span style={{ fontSize: "0.7rem", color: "#4ade80" }}>↑ 12.4% MoM growth</span>
                  </div>
                  <div style={{ padding: "15px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Operating Expenses</span>
                    <h3 style={{ margin: "5px 0 0 0", fontSize: "1.4rem", color: "#94a3b8", border: "none", padding: 0 }}>₹1.97Cr</h3>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Includes logistics & procurement</span>
                  </div>
                  <div style={{ padding: "15px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Net Profit Margin</span>
                    <h3 style={{ margin: "5px 0 0 0", fontSize: "1.4rem", color: "#34d399", border: "none", padding: 0 }}>₹48.2L</h3>
                    <span style={{ fontSize: "0.7rem", color: "#34d399" }}>19.6% net margin yield</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: CSAT / Employee / Courier */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h4 style={{ textTransform: "uppercase", color: "#94a3b8", fontSize: "0.8rem", fontWeight: "800", margin: "0 0 10px 0", letterSpacing: "0.05em" }}>2. Customer Experience Metrics</h4>
                  <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}><td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>Average CSAT rating</td><td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700" }}>4.1 / 5.0</td></tr>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}><td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>Net Promoter Score (NPS)</td><td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700", color: "#34d399" }}>+48 (Strong)</td></tr>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}><td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>Mitigated Churn Accounts</td><td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700" }}>14 Accounts</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ textTransform: "uppercase", color: "#94a3b8", fontSize: "0.8rem", fontWeight: "800", margin: "0 0 10px 0", letterSpacing: "0.05em" }}>3. Support Team SLA Compliance</h4>
                  <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}><td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>Avg Resolution Timeline</td><td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700" }}>2.8 Days</td></tr>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}><td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>Resolved SLA Breaches</td><td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700", color: "#38bdf8" }}>{tickets.filter(t => t.status === "Resolved").length} Cases</td></tr>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}><td style={{ padding: "6px 0", color: "var(--text-secondary)" }}>Top Performer</td><td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700" }}>Ravi Kumar (96% SLA)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Courier Logistics */}
              <div>
                <h4 style={{ textTransform: "uppercase", color: "#94a3b8", fontSize: "0.8rem", fontWeight: "800", margin: "0 0 10px 0", letterSpacing: "0.05em" }}>4. Courier Performance Audit Scorecard</h4>
                <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #334155", textAlign: "left", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "8px 0" }}>Courier Partner</th>
                      <th style={{ padding: "8px 0" }}>Total Cargo</th>
                      <th style={{ padding: "8px 0", textAlign: "center" }}>SLA Compliance %</th>
                      <th style={{ padding: "8px 0", textAlign: "center" }}>Delay Rate %</th>
                      <th style={{ padding: "8px 0", textAlign: "right" }}>Delayed Revenue Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px 0", fontWeight: "700" }}>BlueDart</td>
                      <td style={{ padding: "8px 0" }}>142 Shipments</td>
                      <td style={{ padding: "8px 0", textAlign: "center", color: "#34d399", fontWeight: "700" }}>94.1%</td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>5.9%</td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>₹1.8L</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px 0", fontWeight: "700" }}>Delhivery</td>
                      <td style={{ padding: "8px 0" }}>118 Shipments</td>
                      <td style={{ padding: "8px 0", textAlign: "center", color: "#fbbf24", fontWeight: "700" }}>82.2%</td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>17.8%</td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>₹2.4L</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px 0", fontWeight: "700" }}>DTDC</td>
                      <td style={{ padding: "8px 0" }}>95 Shipments</td>
                      <td style={{ padding: "8px 0", textAlign: "center", color: "#34d399", fontWeight: "700" }}>90.5%</td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>9.5%</td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>₹1.1L</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", borderTop: "1px dashed #334155", paddingTop: "20px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>PREPARED BY</span>
                  <strong style={{ fontSize: "0.85rem", display: "block", marginTop: "4px" }}>Amit Mishra</strong>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Operations Director, DispatchIQ</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>APPROVED BY</span>
                  <div style={{ width: "120px", height: "30px", borderBottom: "1px solid #94a3b8", display: "inline-block", marginBottom: "4px" }}></div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block" }}>Managing Founder / Board of Directors</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "15px 25px", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowReportModal(false)}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid var(--border-color)", cursor: "pointer", background: "none", color: "var(--text-primary)" }}
              >
                Close Preview
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => window.print()}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: "#3b82f6", color: "#fff", fontWeight: "700" }}
              >
                🖨️ Print to PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING AI COPILOT */}
      <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        {isCopilotOpen && (
          <div style={{ width: "340px", height: "420px", background: "linear-gradient(135deg, #1e1b4b 0%, #171727 100%)", borderRadius: "16px", border: "1px solid rgba(139, 92, 246, 0.4)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", overflow: "hidden", marginBottom: "15px", animation: "slideUp 0.3s ease-out" }}>
            <div style={{ padding: "15px", background: "rgba(139, 92, 246, 0.15)", borderBottom: "1px solid rgba(139, 92, 246, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>✨</span>
                <div>
                  <h4 style={{ margin: 0, color: "#e2e8f0", fontSize: "0.95rem" }}>DispatchIQ Copilot</h4>
                  <span style={{ fontSize: "0.7rem", color: "#a78bfa" }}>Enterprise AI Agent</span>
                </div>
              </div>
              <button onClick={() => setIsCopilotOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
            </div>
            
            <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {copilotMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", maxWidth: "85%", background: msg.sender === "user" ? "#3b82f6" : "rgba(255,255,255,0.05)", padding: "10px 14px", borderRadius: "12px", borderBottomRightRadius: msg.sender === "user" ? "2px" : "12px", borderBottomLeftRadius: msg.sender === "ai" ? "2px" : "12px", color: "#fff", fontSize: "0.85rem", lineHeight: "1.4", border: msg.sender === "ai" ? "1px solid rgba(255,255,255,0.1)" : "none", whiteSpace: "pre-wrap" }}>
                  {renderCopilotMessageText(msg.text)}
                  {msg.sender === "ai" && i > 0 && (
                    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                      <button className="btn btn-primary btn-small" style={{ fontSize: "0.7rem", padding: "4px 8px" }} onClick={() => alert("Simulated: Workflows triggered.")}>Send Now</button>
                      <button className="btn btn-secondary btn-small" style={{ fontSize: "0.7rem", padding: "4px 8px" }} onClick={() => { setActiveTab("crm"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Review Drafts</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCopilotSend} style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px", background: "rgba(0,0,0,0.2)" }}>
              <input 
                type="text" 
                placeholder="Ask Copilot..." 
                value={copilotInput}
                onChange={e => setCopilotInput(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "0.85rem", outline: "none" }}
              />
              <button type="submit" style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          style={{ width: "60px", height: "60px", borderRadius: "30px", background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", border: "none", color: "#fff", fontSize: "1.8rem", cursor: "pointer", boxShadow: "0 10px 25px rgba(139, 92, 246, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        >
          ✨
        </button>
      </div>

    </div>
  );
}

// Helper to initialize tickets with demo seeds and auto-generated actionable items
function initializeTickets(ordersList) {
  const initial = [];

  let open = 0, inProg = 0, res = 0, esc = 0;
  let ticketIndex = 1;

  ordersList.forEach(order => {
    const isAct = isActive(order);
    const delay = getDelayDays(order);
    const val = Number(order.OrderValue || 0);

    let status = null;
    let notes = [];
    
    // Parse order number dynamically to avoid index hash collisions
    const orderNum = parseInt((order.OrderID || "").replace(/\D/g, ""), 10) || ticketIndex;

    // Pool of realistic lastUpdatedDates
    const datePool = ["04-Jun-2026", "03-Jun-2026", "02-Jun-2026", "31-May-2026", "29-May-2026"];
    const lastUpdatedDate = datePool[orderNum % datePool.length];

    let age = "1 Day";
    let createdDate = "04-Jun-2026";
    let resolutionTime = null;

    if (!isAct && delay > 0 && res < 108) {
      status = "Resolved";
      const resTimes = ["8 Hours", "1 Day", "2 Days", "3 Days", "4 Days", "5 Days"];
      const resIndex = orderNum % resTimes.length;
      resolutionTime = resTimes[resIndex];
      age = resolutionTime;

      let daysToSub = 2;
      if (resolutionTime === "8 Hours") daysToSub = 0;
      else daysToSub = parseInt(resolutionTime) || 2;

      createdDate = subtractDays(lastUpdatedDate, daysToSub + 1);

      notes = [
        { date: subtractDays(lastUpdatedDate, daysToSub + 1).substring(0, 6), text: "System detected delay. Ticket auto-generated." },
        { date: lastUpdatedDate.substring(0, 6), text: "Shipment delivered. Ticket marked as Resolved." }
      ];
      res++;
    } else if (isAct) {
      // Unresolved aging
      let ageDays = delay > 0 ? delay : (orderNum % 15) + 1;
      age = `${ageDays} Day${ageDays !== 1 ? "s" : ""}`;
      createdDate = subtractDays(lastUpdatedDate, ageDays);

      if (esc < 4 && delay > 5) {
        status = "Escalated";
        notes = [
          { date: subtractDays(lastUpdatedDate, ageDays).substring(0, 6), text: "System detected SLA breach. Ticket auto-generated." },
          { date: subtractDays(lastUpdatedDate, Math.max(0, ageDays - 2)).substring(0, 6), text: "Escalated to carrier partner." }
        ];
        esc++;
      } else if (inProg < 12 && delay > 2) {
        status = "In Progress";
        notes = [
          { date: subtractDays(lastUpdatedDate, ageDays).substring(0, 6), text: "System detected SLA breach. Ticket auto-generated." },
          { date: lastUpdatedDate.substring(0, 6), text: "Investigation started. Assigned to owner." }
        ];
        inProg++;
      } else if (open < 24) {
        status = "Open";
        notes = [
          { date: lastUpdatedDate.substring(0, 6), text: "System detected SLA breach. Ticket auto-generated." }
        ];
        open++;
      }
    }

    if (status) {
      const tktId = `TKT${String(ticketIndex).padStart(3, '0')}`;
      ticketIndex++;

      const isVIP = val > 100000;
      const prevComplaints = orderNum % 3;

      const delayPts = Math.min(30, delay * 3);
      const valuePts = Math.min(45, Math.floor(val / 2000));
      const vipPts = isVIP ? 15 : 5;
      const complaintsPts = Math.min(10, prevComplaints * 5);
      const aiScore = delayPts + valuePts + vipPts + complaintsPts;

      let priority = "Low";
      if (aiScore >= 85) priority = "Critical";
      else if (aiScore >= 65) priority = "High";
      else if (aiScore >= 40) priority = "Medium";

      const owners = ["Ravi", "Priya", "Rahul", "Anjali", "Suresh", "Karthik"];
      const owner = owners[orderNum % owners.length];

      initial.push({
        id: tktId,
        orderId: order.OrderID,
        customer: order.Customer || "Unknown Customer",
        issue: getIssueCategory(order.OrderID, delay),
        priority,
        owner,
        status,
        created: createdDate,
        lastUpdated: lastUpdatedDate,
        aiScore,
        age,
        resolutionTime,
        escalation: getEscalationLevel(order.OrderID, delay, val, isVIP),
        breakdown: {
          delayDays: delay,
          value: val,
          isVIP,
          prevComplaints
        },
        notes
      });
    }
  });

  return initial;
}

// Helper to render markdown-like structures inside the Copilot chat bubble
function renderCopilotMessageText(text) {
  if (!text) return "";
  
  return text.split('\n').map((line, idx) => {
    let content = line;
    
    // Check for bold text: **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    const renderedLine = parts.length > 0 ? parts : content;

    // Check for headers
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} style={{ margin: "14px 0 6px 0", color: "#e2e8f0", fontSize: "0.95rem", fontWeight: "700", border: "none", padding: 0 }}>
          {line.substring(4)}
        </h4>
      );
    }
    
    // Check for horizontal rule
    if (line.trim() === '***') {
      return <hr key={idx} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.15)", margin: "12px 0" }} />;
    }
    
    return (
      <div key={idx} style={{ minHeight: line.trim() === "" ? "6px" : "auto", margin: "2px 0" }}>
        {renderedLine}
      </div>
    );
  });
}