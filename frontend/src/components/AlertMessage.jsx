import React from "react";

const AlertMessage = ({ message, type = "info" }) => {
  if (!message) return null;

  return <p className={`alert alert-${type} text-center`}>{message}</p>;
};

export default AlertMessage;
