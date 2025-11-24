import React from "react";
import Button from "./Button";

const IconButton = ({ variant = "secondary", size = "md", children, ...rest }) => {
  return (
    <Button
      variant={variant}
      size={size}
      className="px-0! py-0! h-9 w-9 rounded-lg"
      {...rest}
    >
      <span className="flex items-center justify-center w-full h-full">
        {children}
      </span>
    </Button>
  );
};

export default IconButton;
