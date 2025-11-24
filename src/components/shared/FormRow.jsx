import React from "react";

const FormRow = ({ children, className }) => {
  return (
    <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${className || ""}`}>
      {children}
    </div>
  );
};

export default FormRow;
