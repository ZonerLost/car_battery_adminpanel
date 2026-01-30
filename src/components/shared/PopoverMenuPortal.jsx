/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const PopoverMenuPortal = ({
  open,
  anchorEl,
  onClose,
  children,
  align = "right",
  offsetY = 8,
}) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

  useLayoutEffect(() => {
    if (!open || !anchorEl || !menuRef.current) return;

    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = menuRef.current.offsetWidth;

    let left = align === "right" ? rect.right - menuWidth : rect.left;
    const top = rect.bottom + offsetY;

    const maxLeft = window.innerWidth - menuWidth - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    setPosition({ top, left, ready: true });
  }, [open, anchorEl, align, offsetY]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      if (anchorEl?.contains(event.target)) return;
      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const handleViewportChange = () => {
      onClose?.();
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [open, anchorEl, onClose]);

  if (!open || !anchorEl) return null;

  const portalContent = (
    <div
      ref={menuRef}
      className="fixed z-60"
      style={{
        top: position.top,
        left: position.left,
        visibility: position.ready ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );

  return ReactDOM.createPortal(portalContent, document.body);
};

export default PopoverMenuPortal;
