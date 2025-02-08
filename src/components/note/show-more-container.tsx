import styled from "@emotion/styled";
import { useEffect, useRef } from "react";
import { debounce } from "../../helpers/function";

const StyledOverflowContainer = styled.div`
  overflow: hidden;
  max-height: 80vh;
  position: relative;

  &.overflow:after {
    content: "Show More";
    color: var(--chakra-colors-chakra-body-text);
    position: absolute;
    bottom: 0;
    right: 0;
    left: 0;
    height: 10rem;
    background: linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, var(--chakra-colors-chakra-body-bg) 100%);
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
    pointer-events: none;
    padding-bottom: 1em;
  }
`;

export default function ShowMoreContainer({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = debounce(() => {
      if (!ref.current) return;

      const innerHeight = Array.from(ref.current.children).reduce(
        (total, el) => total + el.getBoundingClientRect().height,
        0,
      );
      const height = ref.current.getBoundingClientRect().height;

      // add or remove the "overflow" class
      if (innerHeight > height && !ref.current.classList.contains("overflow")) ref.current.classList.add("overflow");
      else if (ref.current.classList.contains("overflow")) ref.current.classList.remove("overflow");
    }, 1000 / 60);

    update();

    if (ref.current) {
      const element = ref.current;

      // catch load events that bubble up
      element.addEventListener("load", update);
      return () => element.removeEventListener("load", update);
    }
  }, []);

  return (
    <StyledOverflowContainer ref={ref} {...props}>
      {children}
    </StyledOverflowContainer>
  );
}
