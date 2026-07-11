const fs = require('fs');

function fixImports(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace:
    // import React;
    // import { Edit, Plus } from "lucide-react";, { useState } from "react";
    // With:
    // import React, { useState } from "react";
    // import { Edit, Plus } from "lucide-react";
    
    content = content.replace(/import React;\nimport \{ (.*?) \} from "lucide-react";(, \{.*?\} from ".*?";)/g, 'import React$2\nimport { $1 } from "lucide-react";');
    
    // Also if it was 'import React;' and no comma:
    content = content.replace(/import React;\nimport \{ (.*?) \} from "lucide-react"; from "react";/g, 'import React from "react";\nimport { $1 } from "lucide-react";');
    
    // Handle case without comma:
    content = content.replace(/import React;\nimport \{ (.*?) \} from "lucide-react";/g, 'import React from "react";\nimport { $1 } from "lucide-react";');

    fs.writeFileSync(file, content);
}

['src/components/TicketManagement.jsx', 'src/components/KPI cards.jsx', 'src/components/ExecutiveActions.jsx', 'src/components/CRMActionCenter.jsx'].forEach(fixImports);
console.log('Fixed imports.');
