'use client';
import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationControlProps = {
  pageCount: number;
  currentPage: number;
  onPageChange: (selectedItem: { selected: number }) => void;
};

export function PaginationControl({ pageCount, currentPage, onPageChange }: PaginationControlProps) {
  return (
    <ReactPaginate
      breakLabel="..."
      nextLabel={
        <span className="flex items-center justify-center">
          <ChevronRight className="h-5 w-5" />
        </span>
      }
      onPageChange={onPageChange}
      pageRangeDisplayed={2}
      marginPagesDisplayed={1}
      pageCount={pageCount}
      forcePage={currentPage - 1}
      previousLabel={
        <span className="flex items-center justify-center">
          <ChevronLeft className="h-5 w-5" />
        </span>
      }
      renderOnZeroPageCount={null}
      containerClassName="flex items-center justify-center gap-1 md:gap-2 my-8"
      pageClassName="inline-flex"
      pageLinkClassName="flex items-center justify-center text-sm md:text-base font-medium h-9 w-9 md:h-10 md:w-10 rounded-md hover:bg-muted"
      previousClassName="inline-flex"
      previousLinkClassName="flex items-center justify-center text-sm h-9 w-9 md:h-10 md:w-10 rounded-md hover:bg-muted"
      nextClassName="inline-flex"
      nextLinkClassName="flex items-center justify-center text-sm h-9 w-9 md:h-10 md:w-10 rounded-md hover:bg-muted"
      breakClassName="inline-flex"
      breakLinkClassName="flex items-center justify-center h-9 w-9 md:h-10 md:w-10"
      activeClassName="!bg-primary !text-primary-foreground rounded-md"
    />
  );
}
