"use client";

import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface Column<T> {
  key: string;
  title: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPagination?: boolean;
  className?: string;
  onCountChange?: (count: number) => void;
  customSearchFilter?: (item: T, searchTerm: string) => boolean;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (column: string) => void;
  resizable?: boolean;
  colWidthsStorageKey?: string;
  onSearchChange?: (term: string) => void;
  searchValue?: string;
  serverPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = "Search...",
  showSearch = true,
  showPagination = true,
  className = "",
  onCountChange,
  customSearchFilter,
  sortColumn = null,
  sortDirection = null,
  onSort,
  resizable = false,
  colWidthsStorageKey,
  onSearchChange,
  searchValue,
  serverPagination,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultsPerPage, setResultsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  // Sync controlled searchValue from parent (e.g. when parent clears on no results)
  useEffect(() => {
    if (searchValue !== undefined) setSearchTerm(searchValue);
  }, [searchValue]);

  const parseColWidth = (w?: string) => w?.endsWith("px") ? parseInt(w) : 130
  const [colWidths, setColWidths] = useState<number[]>(() => {
    if (!resizable) return []
    if (colWidthsStorageKey && typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem(colWidthsStorageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length === columns.length) return parsed
        }
      } catch {}
    }
    return columns.map((col) => parseColWidth(col.width))
  })

  const resizingRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)

  const handleResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = { colIndex, startX: e.clientX, startWidth: colWidths[colIndex] }
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const { colIndex, startX, startWidth } = resizingRef.current
      const delta = ev.clientX - startX
      const newWidth = Math.max(50, startWidth + delta)
      setColWidths((prev) => {
        const next = [...prev]
        next[colIndex] = newWidth
        return next
      })
    }

    const onMouseUp = () => {
      resizingRef.current = null
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [colWidths])

  useEffect(() => {
    if (!resizable || !colWidthsStorageKey || typeof window === "undefined") return
    window.sessionStorage.setItem(colWidthsStorageKey, JSON.stringify(colWidths))
  }, [colWidths, resizable, colWidthsStorageKey])

  // Filter data based on search term — skip when server handles pagination/search
  const filteredData = serverPagination
    ? data
    : data.filter((item) => {
        if (!searchTerm) return true;
        if (customSearchFilter) return customSearchFilter(item, searchTerm);
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

  const activeTotalResults = serverPagination ? serverPagination.total : filteredData.length;
  const activeResultsPerPage = serverPagination ? String(serverPagination.limit) : resultsPerPage;
  const activeTotalPages = serverPagination ? serverPagination.totalPages : Math.ceil(activeTotalResults / Number.parseInt(activeResultsPerPage));
  const activeCurrentPage = serverPagination ? serverPagination.page : currentPage;

  // Calculate current page data
  const startIndex = (activeCurrentPage - 1) * Number.parseInt(activeResultsPerPage);
  const endIndex = startIndex + Number.parseInt(activeResultsPerPage);
  const currentPageData = serverPagination ? filteredData : filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search term, results per page, or sort changes
  React.useEffect(() => {
    if (!serverPagination) {
      setCurrentPage(1);
    }
  }, [searchTerm, resultsPerPage, sortColumn, sortDirection, serverPagination]);

  // Notify parent when filtered count changes
  React.useEffect(() => {
    if (onCountChange) {
      onCountChange(activeTotalResults);
    }
  }, [onCountChange, activeTotalResults]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (activeTotalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= activeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (activeCurrentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, activeCurrentPage - 1);
      const end = Math.min(activeTotalPages - 1, activeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== activeTotalPages) {
          pages.push(i);
        }
      }

      if (activeCurrentPage < activeTotalPages - 2) {
        pages.push("...");
      }

      // Always show last page if more than 1 page
      if (activeTotalPages > 1) {
        pages.push(activeTotalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (serverPagination) {
      if (page >= 1 && page <= activeTotalPages) {
        serverPagination.onPageChange(page);
      }
    } else {
      if (page >= 1 && page <= activeTotalPages) {
        setCurrentPage(page);
      }
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const limit = Number(e.target.value);
    if (serverPagination) {
      serverPagination.onLimitChange(limit);
    } else {
      setResultsPerPage(e.target.value);
    }
  };

  return (
    <div
      className={`w-full bg-surface-primary border border-borderColor-secondary rounded-lg ${className}`}
    >
      {/* Search and Results Per Page Controls */}
      {(showSearch || showPagination) && (
        <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b border-borderColor-secondary">
          {showSearch && (
            <div className="relative h-10 px-3 inline-flex items-center gap-2 border border-borderColor-secondary rounded-lg bg-surface-secondary">
              <Search className="w-4 h-4 text-textColor-muted" />
              <input
                type="text"
                className="w-[420px] focus:outline-none bg-transparent text-textColor-base placeholder-textColor-muted"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); onSearchChange?.(e.target.value) }}
              />
            </div>
          )}

          {showPagination && (
            <div className="flex items-center gap-x-2 text-sm font-medium text-textColor-muted">
              <span>Showing</span>
              <select
                className="p-1 pr-4 rounded-md outline-none appearance-none bg-surface-secondary border border-borderColor-secondary text-textColor-base"
                value={activeResultsPerPage}
                onChange={handleLimitChange}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
              </select>
              <span>of {activeTotalResults} Results</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto w-full">
        <table className={resizable ? "table-fixed w-full" : "table-auto w-full"}>
          {resizable && (
            <colgroup>
              {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
            </colgroup>
          )}
          <thead>
            <tr className="bg-surface-secondary">
              {columns.map((column, colIndex) => {
                const isSorted = column.sortable && sortColumn === column.key;
                const currentSortDirection = isSorted ? sortDirection : null;

                return (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-xs font-bold text-textColor-muted uppercase whitespace-nowrap tracking-wider",
                      resizable ? "relative overflow-hidden" : "",
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : "text-left",
                      column.sortable && onSort ? "cursor-pointer hover:bg-surface-tertiary transition-colors" : "",
                      column.headerClassName
                    )}
                    style={resizable ? undefined : { width: column.width }}
                    onClick={() => column.sortable && onSort && onSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <span className={isSorted ? "text-primary-600" : "text-textColor-muted"}>
                          {currentSortDirection === "desc" ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : currentSortDirection === "asc" ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12z" />
                              <path d="M15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                    {resizable && (
                      <div
                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-10 hover:bg-primary-400/40 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, colIndex)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-borderColor-secondary bg-surface-primary">
            {currentPageData.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-textColor-muted"
                  colSpan={columns.length}
                >
                  No results found
                </td>
              </tr>
            ) : (
              currentPageData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:shadow-lg dark:hover:shadow-black/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-2 text-sm text-textColor-base",
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                          ? "text-center"
                          : "text-left",
                        column.cellClassName ?? "truncate"
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : (row[column.key] === null || row[column.key] === undefined || row[column.key] === '' 
                            ? 'N/A' 
                            : row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && activeTotalPages > 1 && (
        <div className="px-4 py-3 border-t border-borderColor-secondary flex items-center justify-end">
          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(activeCurrentPage - 1)}
              disabled={activeCurrentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-textColor-muted" />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="px-3 py-2 text-textColor-muted">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page as number)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                      activeCurrentPage === page
                        ? "bg-primary-500 text-white"
                        : "text-textColor-muted hover:bg-primary-100"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(activeCurrentPage + 1)}
              disabled={activeCurrentPage === activeTotalPages}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-textColor-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
