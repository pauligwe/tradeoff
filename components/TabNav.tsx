"use client";

export type TabType = "portfolio" | "hedges" | "risks" | "news" | "greeks";

interface TabNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon?: React.ReactNode }[] = [
  { 
    id: "portfolio", 
    label: "Portfolio",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "hedges", 
    label: "Hedges",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "risks", 
    label: "Risks",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "news", 
    label: "News",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "greeks", 
    label: "Greeks",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-[#1c2026] rounded-xl border border-[#2d3139]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? "bg-[#3fb950] text-white shadow-lg"
              : "text-[#858687] hover:text-white hover:bg-[#252932]"
          }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
