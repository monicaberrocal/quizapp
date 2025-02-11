import React from "react";

const LoadingSpinner = () => (
  <div className="d-flex justify-content-center mt-3">
    {loading ? <LoadingSpinner /> : <Contenido />}
  </div>
);

export default LoadingSpinner;
