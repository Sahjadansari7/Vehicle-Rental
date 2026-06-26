import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({
  id = 'password',
  value,
  onChange,
  placeholder = 'Min 8 characters',
  minLength = 8,
  enforceMinLength = true,
  required = true,
  label = 'Password',
  hint,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...(enforceMinLength ? { minLength } : {})}
          required={required}
          className="password-input"
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <p className="password-hint">{hint}</p>}
    </div>
  );
};

export default PasswordInput;
