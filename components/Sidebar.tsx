"use client";

import Image from "next/image";

export type PageType = "intro" | "portfolio" | "hedges" | "risks" | "news" | "greeks";

interface SidebarProps {
  activePage: PageType;
  onNavigate: (page: PageType) => void;
}

const TABS: { id: PageType; label: string }[] = [
  { id: "intro", label: "Intro" },
  { id: "portfolio", label: "Portfolio" },
  { id: "hedges", label: "Hedges" },
  { id: "risks", label: "Risks" },
  { id: "news", label: "News" },
  { id: "greeks", label: "Greeks" },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[200px] bg-[#161b22] border-r border-[#2d3139] z-50">
      <div className="p-6 border-b border-[#2d3139]">
        <div className="flex items-center gap-3">
          <Image 
            src="/icon.svg" 
            alt="TradeOff Logo" 
            width={32} 
            height={32}
            className="shrink-0"
          />
          <h1 className="text-xl font-semibold">TradeOff</h1>
        </div>
      </div>
      
      <nav className="p-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full text-left px-4 py-3 text-base font-medium transition-colors mb-1 ${
              activePage === tab.id
                ? "text-white border border-[#3fb950] bg-transparent"
                : "text-[#858687] border border-transparent hover:text-white hover:border-[#2d3139]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
