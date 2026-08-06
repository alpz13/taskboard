module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/lib/placeholder-data.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
__turbopack_context__.s([
    "customers",
    ()=>customers,
    "invoices",
    ()=>invoices,
    "mockTasks",
    ()=>mockTasks,
    "revenue",
    ()=>revenue,
    "users",
    ()=>users
]);
const users = [
    {
        id: '410544b2-4001-4271-9855-fec4b6a6442a',
        name: 'User',
        email: 'user@nextmail.com',
        password: '123456'
    }
];
const customers = [
    {
        id: 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa',
        name: 'Evil Rabbit',
        email: 'evil@rabbit.com',
        image_url: '/customers/evil-rabbit.png'
    },
    {
        id: '3958dc9e-712f-4377-85e9-fec4b6a6442a',
        name: 'Delba de Oliveira',
        email: 'delba@oliveira.com',
        image_url: '/customers/delba-de-oliveira.png'
    },
    {
        id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
        name: 'Lee Robinson',
        email: 'lee@robinson.com',
        image_url: '/customers/lee-robinson.png'
    },
    {
        id: '76d65c26-f784-44a2-ac19-586678f7c2f2',
        name: 'Michael Novotny',
        email: 'michael@novotny.com',
        image_url: '/customers/michael-novotny.png'
    },
    {
        id: 'CC27C14A-0ACF-4F4A-A6C9-D45682C144B9',
        name: 'Amy Burns',
        email: 'amy@burns.com',
        image_url: '/customers/amy-burns.png'
    },
    {
        id: '13D07535-C59E-4157-A011-F8D2EF4E0CBB',
        name: 'Balazs Orban',
        email: 'balazs@orban.com',
        image_url: '/customers/balazs-orban.png'
    }
];
const invoices = [
    {
        customer_id: customers[0].id,
        amount: 15795,
        status: 'pending',
        date: '2022-12-06'
    },
    {
        customer_id: customers[1].id,
        amount: 20348,
        status: 'pending',
        date: '2022-11-14'
    },
    {
        customer_id: customers[4].id,
        amount: 3040,
        status: 'paid',
        date: '2022-10-29'
    },
    {
        customer_id: customers[3].id,
        amount: 44800,
        status: 'paid',
        date: '2023-09-10'
    },
    {
        customer_id: customers[5].id,
        amount: 34577,
        status: 'pending',
        date: '2023-08-05'
    },
    {
        customer_id: customers[2].id,
        amount: 54246,
        status: 'pending',
        date: '2023-07-16'
    },
    {
        customer_id: customers[0].id,
        amount: 666,
        status: 'pending',
        date: '2023-06-27'
    },
    {
        customer_id: customers[3].id,
        amount: 32545,
        status: 'paid',
        date: '2023-06-09'
    },
    {
        customer_id: customers[4].id,
        amount: 1250,
        status: 'paid',
        date: '2023-06-17'
    },
    {
        customer_id: customers[5].id,
        amount: 8546,
        status: 'paid',
        date: '2023-06-07'
    },
    {
        customer_id: customers[1].id,
        amount: 500,
        status: 'paid',
        date: '2023-08-19'
    },
    {
        customer_id: customers[5].id,
        amount: 8945,
        status: 'paid',
        date: '2023-06-03'
    },
    {
        customer_id: customers[2].id,
        amount: 1000,
        status: 'paid',
        date: '2022-06-05'
    }
];
const revenue = [
    {
        month: 'Jan',
        revenue: 2000
    },
    {
        month: 'Feb',
        revenue: 1800
    },
    {
        month: 'Mar',
        revenue: 2200
    },
    {
        month: 'Apr',
        revenue: 2500
    },
    {
        month: 'May',
        revenue: 2300
    },
    {
        month: 'Jun',
        revenue: 3200
    },
    {
        month: 'Jul',
        revenue: 3500
    },
    {
        month: 'Aug',
        revenue: 3700
    },
    {
        month: 'Sep',
        revenue: 2500
    },
    {
        month: 'Oct',
        revenue: 2800
    },
    {
        month: 'Nov',
        revenue: 3000
    },
    {
        month: 'Dec',
        revenue: 4800
    }
];
;
const mockTasks = [
    {
        id: '1',
        title: 'Implement authentication',
        description: 'Add JWT-based auth',
        status: 'todo',
        priority: 'high',
        assignee: 'John Doe',
        tags: [
            'backend',
            'security'
        ],
        createdAt: '2024-11-20T10:00:00Z'
    },
    {
        id: '2',
        title: 'Design new landing page',
        description: 'Create mockups for homepage redesign',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'Jane Smith',
        tags: [
            'design',
            'frontend'
        ],
        createdAt: '2024-11-19T14:30:00Z'
    },
    {
        id: '3',
        title: 'Fix payment gateway bug',
        description: 'Users unable to complete checkout',
        status: 'todo',
        priority: 'high',
        assignee: 'John Doe',
        tags: [
            'backend',
            'urgent'
        ],
        createdAt: '2024-11-21T09:15:00Z'
    },
    {
        id: '4',
        title: 'Write API documentation',
        description: 'Document all REST endpoints for the public API',
        status: 'todo',
        priority: 'low',
        assignee: 'Amy Burns',
        tags: [
            'docs'
        ],
        createdAt: '2024-11-18T08:20:00Z'
    },
    {
        id: '5',
        title: 'Set up CI/CD pipeline',
        description: 'Automate build, test, and deploy steps with GitHub Actions',
        status: 'in-progress',
        priority: 'high',
        assignee: 'Michael Novotny',
        tags: [
            'devops',
            'backend'
        ],
        createdAt: '2024-11-15T11:05:00Z'
    },
    {
        id: '6',
        title: 'Refactor invoice table component',
        description: 'Extract shared table logic into reusable hooks',
        status: 'todo',
        priority: 'medium',
        assignee: 'Jane Smith',
        tags: [
            'frontend',
            'refactor'
        ],
        createdAt: '2024-11-22T13:40:00Z'
    },
    {
        id: '7',
        title: 'Add dark mode support',
        description: 'Implement theme toggle across the dashboard',
        status: 'todo',
        priority: 'low',
        assignee: 'Balazs Orban',
        tags: [
            'frontend',
            'design'
        ],
        createdAt: '2024-11-17T16:00:00Z'
    },
    {
        id: '8',
        title: 'Optimize database queries',
        description: 'Add indexes to speed up invoice lookups',
        status: 'in-progress',
        priority: 'high',
        assignee: 'John Doe',
        tags: [
            'backend',
            'performance'
        ],
        createdAt: '2024-11-14T09:30:00Z'
    },
    {
        id: '9',
        title: 'Create onboarding flow',
        description: 'Guide new users through initial dashboard setup',
        status: 'todo',
        priority: 'medium',
        assignee: 'Delba de Oliveira',
        tags: [
            'frontend',
            'ux'
        ],
        createdAt: '2024-11-23T10:10:00Z'
    },
    {
        id: '10',
        title: 'Migrate to App Router',
        description: 'Move remaining pages from the pages directory to app/',
        status: 'done',
        priority: 'high',
        assignee: 'Lee Robinson',
        tags: [
            'frontend',
            'migration'
        ],
        createdAt: '2024-11-01T09:00:00Z'
    },
    {
        id: '11',
        title: 'Add unit tests for utils',
        description: 'Cover formatCurrency and formatDateToLocal with tests',
        status: 'done',
        priority: 'medium',
        assignee: 'Jane Smith',
        tags: [
            'testing'
        ],
        createdAt: '2024-11-05T12:00:00Z'
    },
    {
        id: '12',
        title: 'Investigate slow revenue chart render',
        description: 'Profile the revenue chart and reduce re-renders',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'Michael Novotny',
        tags: [
            'performance',
            'frontend'
        ],
        createdAt: '2024-11-16T15:45:00Z'
    },
    {
        id: '13',
        title: 'Set up error monitoring',
        description: 'Integrate Sentry for production error tracking',
        status: 'todo',
        priority: 'medium',
        assignee: 'Amy Burns',
        tags: [
            'devops'
        ],
        createdAt: '2024-11-24T08:00:00Z'
    },
    {
        id: '14',
        title: 'Improve accessibility of forms',
        description: 'Add proper labels and aria attributes to all form inputs',
        status: 'todo',
        priority: 'high',
        assignee: 'Balazs Orban',
        tags: [
            'frontend',
            'a11y'
        ],
        createdAt: '2024-11-25T09:25:00Z'
    },
    {
        id: '15',
        title: 'Add customer search',
        description: 'Allow searching customers by name or email',
        status: 'done',
        priority: 'medium',
        assignee: 'Delba de Oliveira',
        tags: [
            'frontend',
            'search'
        ],
        createdAt: '2024-10-28T14:00:00Z'
    },
    {
        id: '16',
        title: 'Rotate database credentials',
        description: 'Update production secrets and rotate access keys',
        status: 'done',
        priority: 'high',
        assignee: 'John Doe',
        tags: [
            'security',
            'backend'
        ],
        createdAt: '2024-10-30T10:30:00Z'
    },
    {
        id: '17',
        title: 'Design empty states',
        description: 'Add illustrations and copy for empty invoice/customer lists',
        status: 'todo',
        priority: 'low',
        assignee: 'Jane Smith',
        tags: [
            'design'
        ],
        createdAt: '2024-11-26T11:15:00Z'
    },
    {
        id: '18',
        title: 'Paginate customers table',
        description: 'Add server-side pagination to the customers page',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'Lee Robinson',
        tags: [
            'backend',
            'frontend'
        ],
        createdAt: '2024-11-13T13:10:00Z'
    },
    {
        id: '19',
        title: 'Audit bundle size',
        description: 'Identify and remove unused dependencies',
        status: 'todo',
        priority: 'low',
        assignee: 'Michael Novotny',
        tags: [
            'performance'
        ],
        createdAt: '2024-11-27T08:45:00Z'
    },
    {
        id: '20',
        title: 'Add invoice status filter',
        description: 'Let users filter invoices by paid/pending status',
        status: 'done',
        priority: 'medium',
        assignee: 'Amy Burns',
        tags: [
            'frontend'
        ],
        createdAt: '2024-10-25T09:00:00Z'
    },
    {
        id: '21',
        title: 'Write E2E smoke tests',
        description: 'Cover login, invoice creation, and customer search flows',
        status: 'todo',
        priority: 'medium',
        assignee: 'Balazs Orban',
        tags: [
            'testing'
        ],
        createdAt: '2024-11-28T10:00:00Z'
    },
    {
        id: '22',
        title: 'Fix mobile nav overflow',
        description: 'Sidebar links wrap incorrectly on small screens',
        status: 'in-progress',
        priority: 'high',
        assignee: 'Delba de Oliveira',
        tags: [
            'frontend',
            'bug'
        ],
        createdAt: '2024-11-12T17:20:00Z'
    },
    {
        id: '23',
        title: 'Add rate limiting to API',
        description: 'Prevent abuse on public-facing endpoints',
        status: 'todo',
        priority: 'high',
        assignee: 'John Doe',
        tags: [
            'backend',
            'security'
        ],
        createdAt: '2024-11-29T09:50:00Z'
    },
    {
        id: '24',
        title: 'Update dependency versions',
        description: 'Bump Next.js, React, and Tailwind to latest stable',
        status: 'done',
        priority: 'low',
        assignee: 'Lee Robinson',
        tags: [
            'maintenance'
        ],
        createdAt: '2024-10-20T07:30:00Z'
    },
    {
        id: '25',
        title: 'Create shared Modal component',
        description: 'Build a reusable, accessible modal for forms and dialogs',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'Jane Smith',
        tags: [
            'frontend'
        ],
        createdAt: '2024-11-11T12:30:00Z'
    },
    {
        id: '26',
        title: 'Add keyboard shortcuts',
        description: 'Support quick navigation with keyboard-only input',
        status: 'todo',
        priority: 'low',
        assignee: 'Michael Novotny',
        tags: [
            'frontend',
            'a11y'
        ],
        createdAt: '2024-11-30T10:40:00Z'
    },
    {
        id: '27',
        title: 'Set up staging environment',
        description: 'Mirror production infra for pre-release testing',
        status: 'todo',
        priority: 'medium',
        assignee: 'Amy Burns',
        tags: [
            'devops'
        ],
        createdAt: '2024-12-01T08:15:00Z'
    },
    {
        id: '28',
        title: 'Review Q4 analytics dashboard',
        description: 'Validate revenue chart numbers against source data',
        status: 'done',
        priority: 'medium',
        assignee: 'Balazs Orban',
        tags: [
            'data'
        ],
        createdAt: '2024-10-15T09:00:00Z'
    }
];
;
}),
"[project]/app/ui/taskboard/task-board.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "TaskBoard",
    ()=>TaskBoard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_@babel+core@7.29.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const TaskBoard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call TaskBoard() from the server but TaskBoard is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/ui/taskboard/task-board.tsx <module evaluation>", "TaskBoard");
}),
"[project]/app/ui/taskboard/task-board.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "TaskBoard",
    ()=>TaskBoard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_@babel+core@7.29.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const TaskBoard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call TaskBoard() from the server but TaskBoard is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/app/ui/taskboard/task-board.tsx", "TaskBoard");
}),
"[project]/app/ui/taskboard/task-board.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$ui$2f$taskboard$2f$task$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/app/ui/taskboard/task-board.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$ui$2f$taskboard$2f$task$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/app/ui/taskboard/task-board.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$ui$2f$taskboard$2f$task$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/app/taskboard/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_@babel+core@7.29.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$placeholder$2d$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/placeholder-data.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$ui$2f$taskboard$2f$task$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/ui/taskboard/task-board.tsx [app-rsc] (ecmascript)");
;
;
;
function Page() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-gray-100 p-4 transition-colors dark:bg-gray-950 md:p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$ui$2f$taskboard$2f$task$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TaskBoard"], {
            initialTasks: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$placeholder$2d$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mockTasks"]
        }, void 0, false, {
            fileName: "[project]/app/taskboard/page.tsx",
            lineNumber: 7,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/taskboard/page.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/taskboard/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/taskboard/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__866fe575._.js.map