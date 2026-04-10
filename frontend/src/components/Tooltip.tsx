import type { ReactNode } from "react";

import "./Tooltip.scss";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  displayTooltip?: boolean;
  position?: "top" | "bottom";
};

const Tooltip = ({
  content,
  children,
  displayTooltip = true,
  position = "top",
}: TooltipProps) => {
  return (
    <span className={`tooltip ${position}`}>
      {children}
      {displayTooltip && <span className="content">{content}</span>}
    </span>
  );
};

export default Tooltip;
