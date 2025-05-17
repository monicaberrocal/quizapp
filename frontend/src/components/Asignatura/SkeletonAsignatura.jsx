import React from "react";

const SkeletonAsignatura = () => {
  return (
    <div className="accordion-item border">
      <div className="accordion-header d-flex justify-content-between align-items-center p-3">
        {/* Nombre de asignatura simulado */}
        <div className="skeleton" style={{ height: "20px", width: "40%" }}></div>

        {/* Botones simulados alineados a la derecha */}
        <div className="d-flex align-items-center" style={{ gap: "22.50px" }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: "20px", height: "20px", borderRadius: "4px" }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonAsignatura;
