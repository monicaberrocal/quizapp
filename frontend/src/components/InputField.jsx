import React from "react";

const InputField = ({ label, type, name, value, onChange, error, className }) => (
  <div className={className}>
    <label className="form-label fw-bold">{label}</label>
    <input type={type} name={name} className="form-control" value={value} onChange={onChange} required />
    if (error):
        if (Array.isArray(error)):
            {error && (
                <div className="text-danger">
                    {error.map((err, index) => <p key={index}>{err}</p>)}
                </div>
            )}
        else:
            {error && <p className="text-danger">{error}</p>}
  </div>
);

export default InputField;
