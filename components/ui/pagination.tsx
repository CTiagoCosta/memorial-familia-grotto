"use client"

import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  darkMode?: boolean
}

const Pagination = ({ currentPage, totalPages, onPageChange, darkMode }: PaginationProps) => {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }
    return pageNumbers
  }

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none",
          darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-700" : "border-gray-300",
        )}
      >
        Anterior
      </button>

      <div className="flex items-center space-x-2 mx-2">
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={cn(
              "inline-flex items-center justify-center h-8 w-8 rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
              darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-700" : "border-gray-300",
            )}
            aria-current={currentPage === page}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md border text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none",
          darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-700" : "border-gray-300",
        )}
      >
        Próximo
      </button>
    </div>
  )
}

export { Pagination }
