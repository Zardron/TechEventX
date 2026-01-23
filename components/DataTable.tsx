"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchable?: boolean;
    searchPlaceholder?: string;
    searchKeys?: (keyof T | string)[];
    filters?: {
        key: keyof T | string;
        label: string;
        options: { value: string; label: string }[];
    }[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchable = true,
    searchPlaceholder = "Search...",
    searchKeys,
    filters,
    loading = false,
    emptyMessage = "No data available",
    className,
    actions,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    // Get default search keys from column keys if not provided
    const defaultSearchKeys = useMemo(() => {
        if (searchKeys) return searchKeys;
        return columns
            .map((col) => col.key)
            .filter((key) => typeof key === "string") as (keyof T | string)[];
    }, [columns, searchKeys]);

    // Filter data based on search term and active filters
    const filteredData = useMemo(() => {
        let result = [...data];

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((row) => {
                return defaultSearchKeys.some((key) => {
                    const value = row[key];
                    if (!value) return false;
                    
                    // Handle date objects - format them for better searchability
                    if (typeof value === 'object' && value !== null && 'getTime' in value) {
                        const date = new Date(value as Date);
                        const dateStr = date.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        }).toLowerCase();
                        const isoStr = date.toISOString().toLowerCase();
                        return dateStr.includes(searchLower) || isoStr.includes(searchLower);
                    }
                    
                    return String(value || '')
                        .toLowerCase()
                        .includes(searchLower);
                });
            });
        }

        // Apply active filters
        Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue) {
                result = result.filter((row) => {
                    const value = row[filterKey];
                    // Handle null/undefined/empty values for organizerName filter
                    if (filterKey === 'organizerName') {
                        const rowValue = value?.toString() || '-';
                        return rowValue === filterValue;
                    }
                    return value?.toString() === filterValue;
                });
            }
        });

        return result;
    }, [data, searchTerm, activeFilters, defaultSearchKeys]);

    const handleFilterChange = (filterKey: string, value: string) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterKey]: value,
        }));
    };

    const clearFilter = (filterKey: string) => {
        setActiveFilters((prev) => {
            const newFilters = { ...prev };
            delete newFilters[filterKey];
            return newFilters;
        });
    };

    const clearAllFilters = () => {
        setSearchTerm("");
        setActiveFilters({});
    };

    const hasActiveFilters = searchTerm.trim() || Object.keys(activeFilters).length > 0;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Search and Filters */}
            {(searchable || filters) && (
                <div className="space-y-3">
                    {/* Search Bar */}
                    {searchable && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Filter Dropdowns */}
                    {filters && filters.length > 0 && (
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            {filters.map((filter) => (
                                <div key={filter.key as string} className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-foreground whitespace-nowrap">
                                        {filter.label}:
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={activeFilters[filter.key as string] || ""}
                                            onChange={(e) =>
                                                handleFilterChange(filter.key as string, e.target.value)
                                            }
                                            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-9 min-w-[120px] sm:min-w-[140px]"
                                            style={{
                                                colorScheme: 'dark',
                                            }}
                                        >
                                            <option value="" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                                                All
                                            </option>
                                            {filter.options.map((option) => (
                                                <option 
                                                    key={option.value} 
                                                    value={option.value}
                                                    style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg
                                                className="h-4 w-4 text-muted-foreground"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    {activeFilters[filter.key as string] && (
                                        <button
                                            onClick={() => clearFilter(filter.key as string)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            type="button"
                                            aria-label={`Clear ${filter.label} filter`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Clear All Filters */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-muted-foreground hover:text-foreground underline"
                            >
                                Clear all filters
                            </button>
                            <span className="text-sm text-muted-foreground">
                                ({filteredData.length} {filteredData.length === 1 ? "result" : "results"})
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column.key as string}>
                                    {column.header}
                                </TableHead>
                            ))}
                            {actions && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {columns.map((column) => (
                                            <TableCell key={column.key as string}>
                                                <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                                            </TableCell>
                                        ))}
                                        {actions && (
                                            <TableCell>
                                                <div className="h-8 bg-muted rounded animate-pulse w-20"></div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((row, index) => (
                                <TableRow key={index}>
                                    {columns.map((column) => (
                                        <TableCell key={column.key as string}>
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]?.toString() || "-"}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell>
                                            {actions(row)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </div>
            </div>
        </div>
    );
}

