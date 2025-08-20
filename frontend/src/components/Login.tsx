import React, { useState, useEffect, useRef } from 'react';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  console.log('Login component rendered'); // בדיקה שהקומפוננטה נטענת
  const [step, setStep] = useState<'username' | 'otp'>('username');

  // debug לבדוק את השינוי ב-step
  useEffect(() => {
    console.log('Step changed to:', step);
  }, [step]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Honeypot field (hidden from users but visible to bots)
  const [honeypot, setHoneypot] = useState('');

  // OTP input refs for better UX
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot
    if (honeypot) {
      setError('Invalid request');
      return;
    }

    if (!username.trim()) {
      setError('אנא הכנס שם משתמש');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting OTP request...');

      // שלח בקשה כ-JSON לנתיב הנכון
      const response = await fetch('http://localhost:8080/otp/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server response:', data);

      // בדיקה מפורשת של success
      if (data && (data.success === true || data.otp_sent === true)) {
        console.log('Success confirmed, switching to OTP step immediately');

        // בדוק אם יש debug OTP (למצב פיתוח)
        if (data.debug && data.debug.otp) {
          setSuccess(`קוד OTP: ${data.debug.otp}`);
        } else {
          setSuccess('קוד OTP נשלח בהצלחה!');
        }

        // מעבר מיידי לשלב ה-OTP
        setStep('otp');
        setCountdown(1); // 30 second cooldown
        setTimeout(() => setSuccess(''), 500); // נקה הודעה אחרי 5 שניות
      } else {
        console.log('Success not confirmed:', data);
        alert('Success NOT confirmed: ' + JSON.stringify(data));
        setError(data?.message || 'שליחת OTP נכשלה');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      setError('אנא הכנס קוד בן 6 ספרות');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // שלח בקשה כ-JSON לנתיב האימות
      const response = await fetch('http://localhost:8080/otp/verify.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // אימות מוצלח - הפנה לצ'אט
       // onLoginSuccess(data.token, username.trim());

        // חלופה - הפניה ישירה לצ'אט
         window.location.href = 'http://localhost:8080/index.php';
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/otp/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // בדוק אם יש debug OTP (למצב פיתוח)
        if (data.debug && data.debug.otp) {
          setSuccess(`קוד חדש: ${data.debug.otp}`);
        } else {
          setSuccess('קוד חדש נשלח!');
        }
        setCountdown(30);
        setTimeout(() => setSuccess(''), 1000);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = otp.split('');
    newOtp[index] = value;
    const newOtpString = newOtp.join('');
    setOtp(newOtpString);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData);
      otpRefs[5].current?.focus();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ברוכים הבאים לאפליקציית הצ'אט</h1>
          <p>התחברות מאובטחת עם אימות OTP</p>
        </div>

        {step === 'username' ? (
          <form onSubmit={handleUsernameSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">שם משתמש</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הכנס שם משתמש"
                required
                disabled={loading}
              />
            </div>

            {/* Honeypot field - hidden from users */}
            <div className="honeypot-field" style={{ display: 'none' }}>
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'שולח...' : 'שלח סיסמה חד פעמית'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="login-form">
            <div className="otp-instructions">
              <p>הכנס את הקוד בן 6 הספרות:</p>
            </div>

            <div className="otp-input-container">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  maxLength={1}
                  value={otp[index] || ''}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="otp-input"
                  disabled={loading}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'מאמת...' : 'אמת קוד'}
            </button>

            <div className="resend-section">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || loading}
                className="btn-link"
              >
                {countdown > 0
                  ? `שלח שוב בעוד ${countdown} שניות`
                  : 'שלח קוד שוב'
                }
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('username')}
              className="btn-link back-btn"
            >
              ← חזור לשם משתמש
            </button>
          </form>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </div>
  );
};

export default Login;
