import React, { useState, useEffect } from "react";
import lang from "../lang/lang.json";

type Props = { username: string };
const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || "";

const VerifyOTP: React.FC<Props> = ({ username }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!otp || otp.trim().length === 0) {
      setError(lang.otpRequired || 'OTP is required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_BASE}/otp/verify.php`, {
        method: "POST",
        credentials: "include", // important to receive cookie HttpOnly
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp })
      });
      const data = await response.json();
      if (response.ok && data.token) {
        try { localStorage.setItem("assaf_token", data.token); } catch(e) {}
        // redirect to main SPA route (you can change to '/app' if you implement chat in React)
        window.location.href = process.env.REACT_APP_AFTER_LOGIN || '/';
      } else {
        setError(data.message || 'Invalid OTP or server error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleOtpSubmit} autoComplete="off">
      <div>
        <label htmlFor="otp">{lang.otpLabel || 'One-Time Password'}</label>
        <input id="otp" name="otp" value={otp} onChange={e => setOtp(e.target.value)} required placeholder={lang.otpPlaceholder || 'OTP'} autoComplete="off" />
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={loading}>{loading ? (lang.verifying || 'Verifying...') : (lang.otpLoginButton || 'Login')}</button>
      </div>
      <div className="error" style={{ marginTop: 8 }}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </form>
  );
};

export default VerifyOTP;
