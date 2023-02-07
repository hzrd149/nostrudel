import { Button, ButtonGroup, ButtonProps, IconButton } from "@chakra-ui/react";
import { useMemo } from "react";
import { usePaginatedList } from "../hooks/use-paginated-list";
import { ArrowLeftSIcon, ArrowRightSIcon } from "./icons";

const range = (start: number, end: number) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

export type PaginationControlsProps = ReturnType<typeof usePaginatedList> & {
  buttonSize?: ButtonProps["size"];
  siblingCount?: number;
};

export const PaginationControls = ({
  pageCount,
  currentPage,
  setPage,
  next,
  previous,
  buttonSize,
  siblingCount = 1,
}: PaginationControlsProps) => {
  const renderPageButton = (pageNumber: number) => (
    <Button
      key={pageNumber}
      variant={pageNumber - 1 === currentPage ? "solid" : "link"}
      title={`page ${pageNumber}`}
      size={buttonSize}
      onClick={() => setPage(pageNumber - 1)}
    >
      {pageNumber}
    </Button>
  );

  // copied from https://www.freecodecamp.org/news/build-a-custom-pagination-component-in-react/
  const renderPageButtons = () => {
    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..pageCount]
    */
    if (totalPageNumbers >= pageCount) {
      return range(1, pageCount).map(renderPageButton);
    }

    /*
    	Calculate left and right sibling index and make sure they are within range 1 and pageCount
    */
    const leftSiblingIndex = Math.max(currentPage + 1 - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + 1 + siblingCount, pageCount);

    /*
      We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the page limits i.e 1 and pageCount. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < pageCount - 2
    */
    const shouldShowLeftDots = leftSiblingIndex > 3;
    const shouldShowRightDots = rightSiblingIndex < pageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = pageCount;

    /*
    	Case 2: No left dots to show, but rights dots to be shown
    */
    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);

      return [
        ...leftRange.map(renderPageButton),
        <Button key="left-dots" size={buttonSize} variant="link">
          ...
        </Button>,
        renderPageButton(lastPageIndex),
      ];
    }

    /*
    	Case 3: No right dots to show, but left dots to be shown
    */
    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(pageCount - rightItemCount + 1, pageCount);
      return [
        renderPageButton(firstPageIndex),
        <Button key="right-dots" size={buttonSize} variant="link">
          ...
        </Button>,
        ...rightRange.map(renderPageButton),
      ];
    }

    /*
    	Case 4: Both left and right dots to be shown
    */
    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [
        renderPageButton(firstPageIndex),
        <Button key="left-dots" size={buttonSize} variant="link">
          ...
        </Button>,
        ...middleRange.map(renderPageButton),
        <Button key="right-dots" size={buttonSize} variant="link">
          ...
        </Button>,
        renderPageButton(lastPageIndex),
      ];
    }
  };

  return (
    <ButtonGroup>
      <IconButton
        icon={<ArrowLeftSIcon />}
        aria-label="previous"
        title="previous"
        size={buttonSize}
        onClick={previous}
        isDisabled={currentPage === 0}
      />
      {renderPageButtons()}
      <IconButton
        icon={<ArrowRightSIcon />}
        aria-label="next"
        title="next"
        size={buttonSize}
        onClick={next}
        isDisabled={currentPage === pageCount - 1}
      />
    </ButtonGroup>
  );
};
