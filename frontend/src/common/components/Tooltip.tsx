import type { ReactNode } from "react";

import "./Tooltip.scss";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom";
};

const Tooltip = ({ content, children, position = "top" }: TooltipProps) => {
  return (
    <span className={`tooltip ${position}`}>
      {children}
      <span className="content">{content}</span>
    </span>
  );
};

export default Tooltip;
