const fs = require('fs');
let content = fs.readFileSync('src/components/NavigationSidebar.tsx', 'utf8');

const target = `            {/* 2. Engagement Workspace */}
            <button
              title={isCollapsed ? "Engagement Workspace" : undefined}
              onClick={() => onTabChange('engagement_workspace')}
              className={\`w-full flex items-center \${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all \${
                activeTab === 'engagement_workspace'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }\`}
            >
              <div className={\`flex items-center gap-3 min-w-0 \${isCollapsed ? "justify-center" : ""}\`}>
                <Layers className={\`h-4 w-4 shrink-0 \${activeTab === 'engagement_workspace' ? 'text-white' : 'text-slate-400'}\`} />
                {!isCollapsed && <span className="truncate">Engagement Workspace</span>}
              </div>
            </button>`;

const replacement = `            {/* 2. Engagement Workspace / Executive Dashboard */}
            <button
              title={isCollapsed ? (isDistributor ? "Executive Dashboard" : "Engagement Workspace") : undefined}
              onClick={() => onTabChange('engagement_workspace')}
              className={\`w-full flex items-center \${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-lg text-xs font-medium transition-all \${
                activeTab === 'engagement_workspace'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }\`}
            >
              <div className={\`flex items-center gap-3 min-w-0 \${isCollapsed ? "justify-center" : ""}\`}>
                {isDistributor ? (
                  <LayoutDashboard className={\`h-4 w-4 shrink-0 \${activeTab === 'engagement_workspace' ? 'text-white' : 'text-slate-400'}\`} />
                ) : (
                  <Layers className={\`h-4 w-4 shrink-0 \${activeTab === 'engagement_workspace' ? 'text-white' : 'text-slate-400'}\`} />
                )}
                {!isCollapsed && <span className="truncate">{isDistributor ? "Executive Dashboard" : "Engagement Workspace"}</span>}
              </div>
            </button>`;

if (content.includes("Engagement Workspace")) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/NavigationSidebar.tsx', content);
    console.log("Updated NavigationSidebar.tsx");
} else {
    console.log("Could not find target content");
}
