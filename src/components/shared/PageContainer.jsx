import React from "react";

const PageContainer = ({ children, className }) => {
  return (
    <div className={`px-3 sm:px-4 md:px-6 py-4 md:py-6 ${className || ""}`}>
      {children}
    </div>
  );
};

export default PageContainer;
