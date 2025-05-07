import React from "react";

const InputField = ({ label, type, name, value, onChange, error, className }) => (
  <div className={className}>
    <label className="form-label fw-bold">{label}</label>
    <input
      type={type}
      name={name}
      className="form-control"
      value={value}
      onChange={onChange}
      required
    />
    {error && (
      <div className="text-danger mt-1">
        {Array.isArray(error) ? (
          error.map((err, index) => <p key={index} className="mb-0">{err}</p>)
        ) : (
          <p className="mb-0">{error}</p>
        )}
      </div>
    )}
  </div>
);

export default InputField;
