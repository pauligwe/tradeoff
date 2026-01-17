"use client";

interface TabNavProps {
  activeTab: "hedge" | "analytics";
  onTabChange: (tab: "hedge" | "analytics") => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
      <button
        onClick={() => onTabChange("hedge")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          activeTab === "hedge"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Hedge Advisor
      </button>
      <button
        onClick={() => onTabChange("analytics")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          activeTab === "analytics"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Analytics
      </button>
    </div>
  );
}
