import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with intelligent truncation
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-white border-2 border-black p-3 sm:p-3.5 text-xs text-black font-neo neo-shadow">
      
      {/* Items Count & Selector */}
      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-3 flex-wrap">
        <p className="text-[11px] sm:text-xs text-black font-bold">
          SHOWING <strong className="font-mono font-black bg-[#ccff00] px-1.5 py-0.5 border border-black">{startItem}–{endItem}</strong> OF{' '}
          <strong className="font-black text-black">{totalItems}</strong> STORIES
        </p>

        <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l-2 border-black">
          <span className="text-black text-[11px] sm:text-xs font-bold">PER PAGE:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            aria-label="Items per page"
            className="bg-white border-2 border-black px-2 py-1 text-black font-mono text-xs cursor-pointer font-black neo-shadow-sm focus:outline-none"
          >
            <option value={14}>14</option>
            <option value={28}>28</option>
            <option value={42}>42</option>
            <option value={56}>56</option>
            <option value={70}>70</option>
            <option value={140}>140</option>
            <option value={300}>300</option>
          </select>
        </div>
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center w-full sm:w-auto">
        
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 bg-white text-black hover:bg-[#ffe600] disabled:opacity-30 transition-all border-2 border-black cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          title="First Page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 bg-white text-black hover:bg-[#ffe600] disabled:opacity-30 transition-all border-2 border-black cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          title="Previous Page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Compact Mobile Page Indicator */}
        <div className="sm:hidden px-2.5 py-1 bg-black text-[#ccff00] font-mono font-black text-xs border border-black">
          {currentPage} / {totalPages}
        </div>

        {/* Number Buttons on Tablet/Desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={idx} className="px-1 text-black font-black select-none font-mono">
                  ...
                </span>
              );
            }
            const pageNum = p as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={idx}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[30px] h-7 px-2 font-mono font-black text-xs transition-all border-2 border-black cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#ccff00] text-black neo-shadow-sm font-black'
                    : 'bg-white text-black hover:bg-[#00f0ff]'
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 bg-white text-black hover:bg-[#ffe600] disabled:opacity-30 transition-all border-2 border-black cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          title="Next Page"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 bg-white text-black hover:bg-[#ffe600] disabled:opacity-30 transition-all border-2 border-black cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          title="Last Page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

      </div>

    </div>
  );
};
