const fs = require('fs');

function replaceSvgs() {
    // TicketManagement
    let tm = fs.readFileSync('src/components/TicketManagement.jsx', 'utf8');
    if(!tm.includes('import { Edit, Plus }')) {
        tm = tm.replace('import React', 'import React;\nimport { Edit, Plus } from "lucide-react";');
    }
    tm = tm.replace(/<svg.*?<path d="M12 20h9"\/><path d="M16\.5 3\.5.*?<\/svg>/g, '<Edit size={12} strokeWidth={2.5} />');
    tm = tm.replace(/<svg.*?<line x1="12".*?<\/svg>/g, '<Plus size={12} strokeWidth={2} />');
    fs.writeFileSync('src/components/TicketManagement.jsx', tm);

    // KPI cards
    let kpi = fs.readFileSync('src/components/KPI cards.jsx', 'utf8');
    if(!kpi.includes('import { Activity, AlertTriangle, CheckCircle }')) {
        kpi = kpi.replace('import React', 'import React;\nimport { Activity, AlertTriangle, CheckCircle } from "lucide-react";');
    }
    kpi = kpi.replace(/<svg.*?stroke="var\(--accent-green\)".*?<\/svg>/gs, '<Activity size={20} color="var(--accent-green)" strokeWidth={2.5} />');
    kpi = kpi.replace(/<svg.*?stroke="var\(--accent-red\)".*?<\/svg>/gs, '<AlertTriangle size={20} color="var(--accent-red)" strokeWidth={2.5} />');
    kpi = kpi.replace(/<svg.*?stroke="var\(--accent-amber\)".*?<\/svg>/gs, '<CheckCircle size={20} color="var(--accent-amber)" strokeWidth={2.5} />');
    kpi = kpi.replace(/<svg.*?stroke="var\(--accent-purple\)".*?<\/svg>/gs, '<CheckCircle size={20} color="var(--accent-purple)" strokeWidth={2.5} />');
    fs.writeFileSync('src/components/KPI cards.jsx', kpi);

    // CRMActionCenter
    let crm = fs.readFileSync('src/components/CRMActionCenter.jsx', 'utf8');
    if(!crm.includes('import { MessageSquare, Mail }')) {
        crm = crm.replace('import React', 'import React;\nimport { MessageSquare, Mail } from "lucide-react";');
    }
    crm = crm.replace(/<svg.*?<path d="M21 15.*?<\/svg>/gs, '<MessageSquare size={12} strokeWidth={2.5} />');
    crm = crm.replace(/<svg.*?<path d="M4 4h16.*?<\/svg>/gs, '<Mail size={16} strokeWidth={2.5} />');
    fs.writeFileSync('src/components/CRMActionCenter.jsx', crm);

    // ExecutiveActions
    let exec = fs.readFileSync('src/components/ExecutiveActions.jsx', 'utf8');
    if(!exec.includes('import { PhoneCall, AlertTriangle, UserPlus, Mail, CheckCircle, Check, ChevronLeft, Users }')) {
        exec = exec.replace('import React', 'import React;\nimport { PhoneCall, AlertTriangle, UserPlus, Mail, CheckCircle, Check, ChevronLeft, Users } from "lucide-react";');
    }
    // Match 0: PhoneCall
    exec = exec.replace(/<svg.*?<path d="M22 16\.92v3.*?<\/svg>/gs, '<PhoneCall size={18} strokeWidth={2.5} />');
    // Match 1: AlertTriangle
    exec = exec.replace(/<svg.*?<path d="M10\.29 3\.86L1\.82 18.*?<\/svg>/gs, '<AlertTriangle size={18} strokeWidth={2.5} />');
    // Match 2: UserPlus
    exec = exec.replace(/<svg.*?<path d="M16 21v-2a4 4 0 0 0-4-4H6.*?<\/svg>/gs, '<UserPlus size={18} strokeWidth={2.5} />');
    // Match 3: Mail
    exec = exec.replace(/<svg.*?<path d="M21 12V7H3v10h10.*?<\/svg>/gs, '<Mail size={18} strokeWidth={2.5} />');
    // Match 4: CheckCircle2 (amber)
    exec = exec.replace(/<svg.*?stroke="#f59e0b".*?<\/svg>/gs, '<CheckCircle size={20} color="#f59e0b" strokeWidth={2.5} />');
    // Match 5: Check (black)
    exec = exec.replace(/<svg.*?stroke="#000000".*?<\/svg>/gs, '<Check size={12} color="#000000" strokeWidth={4} />');
    // Match 6: ChevronLeft
    exec = exec.replace(/<svg.*?<polyline points="9 18 15 12 9 6"\/>.*?<\/svg>/gs, '<ChevronLeft size={14} strokeWidth={2.5} />');
    // Match 7: Users
    exec = exec.replace(/<svg.*?stroke="var\(--accent-purple\)".*?<\/svg>/gs, '<Users size={18} color="var(--accent-purple)" strokeWidth={2.5} />');
    // Match 8: Check
    exec = exec.replace(/<svg.*?strokeWidth="3".*?<\/svg>/gs, '<Check size={14} strokeWidth={3} />');

    fs.writeFileSync('src/components/ExecutiveActions.jsx', exec);

    console.log('Replaced successfully.');
}
replaceSvgs();
