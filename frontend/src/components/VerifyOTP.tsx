import React, { useState } from "react";
import lang from "../lang/lang.json";

type Props = {
  username: string;
};

const VerifyOTP: React.FC<Props> = ({ username }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const redirectUrl = "http://localhost:8080";

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/otp/verify.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otp,
          username: username,
        }),
      });
      const data = await response.json();
      if (data.status === 200) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      setError(lang.otpError || "Failed to verify OTP");
      console.error("OTP request failed:", error);
    }
  };

  return (
    <form onSubmit={handleOtpSubmit} autoComplete="off">
      <div>
        <label htmlFor="otp">
          {lang.otpLAbel || 'Enter OTP'}
        </label>
        <input
          type="text"
          id="otp"
          name="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          placeholder={lang.otpPlaceholder || 'OTP'}
        />
      </div>
      <div className="error">
        {error && <p>{error}</p>}
      </div>
      <button type="submit">
        {lang.otpLoginButton || 'Login'}
      </button>
    </form>
  );
};

export default VerifyOTP;
