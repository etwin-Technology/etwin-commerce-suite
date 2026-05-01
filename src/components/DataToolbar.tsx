import { Search, X, Filter as FilterIcon, Download, Upload } from "lucide-react";
import * as React from "react";

export interface FilterChipOption {
  value: string;
  label: string;
}

interface DataToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  /** A list of single-select chip filter groups (status, plan, etc.) */
  chips?: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: FilterChipOption[];
  }[];
  /** Optional date-range filter */
  dateRange?: {
    from: string; // YYYY-MM-DD
    to: string;
    onChange: (from: string, to: string) => void;
  };
  /** Total / filtered count display */
  count?: { filtered: number; total: number };
  /** Slot for action buttons on the right */
  actions?: React.ReactNode;
  onExport?: () => void;
  onImport?: () => void;
  exportLabel?: string;
  importLabel?: string;
}

export function DataToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  chips = [],
  dateRange,
  count,
  actions,
  onExport,
  onImport,
  exportLabel = "Exporter",
  importLabel = "Importer",
}: DataToolbarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full ps-9 pe-9 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Date range */}
        {dateRange && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background border border-input rounded-lg px-2 py-1.5">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => dateRange.onChange(e.target.value, dateRange.to)}
              className="bg-transparent text-xs focus:outline-none num"
            />
            <span>→</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => dateRange.onChange(dateRange.from, e.target.value)}
              className="bg-transparent text-xs focus:outline-none num"
            />
            {(dateRange.from || dateRange.to) && (
              <button
                type="button"
                onClick={() => dateRange.onChange("", "")}
                className="ms-1 p-0.5 rounded text-muted-foreground hover:text-foreground"
                aria-label="Clear dates"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="ms-auto flex items-center gap-2">
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium hover:bg-accent"
            >
              <Upload className="size-3.5" />
              {importLabel}
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium hover:bg-accent"
            >
              <Download className="size-3.5" />
              {exportLabel}
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Chip filter groups */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {chips.map((group) => (
            <div key={group.label} className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                <FilterIcon className="size-3" />
                {group.label}
              </span>
              {group.options.map((opt) => {
                const active = group.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => group.onChange(active ? "" : opt.value)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {count && (
        <p className="text-[11px] text-muted-foreground">
          {count.filtered} / {count.total}
        </p>
      )}
    </div>
  );
}
