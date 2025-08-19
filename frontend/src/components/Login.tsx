import React, { useState } from 'react';

export default function Login() {
  const [step, setStep] = useState('request'); // request | verify
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [hp, setHp] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const base = '/otp'; // וודא שהנתיב נכון ביחס לpublic

interface OtpResponse {
    success: boolean;
    message?: string;
    token?: string;
    expires_at?: string;
}

async function requestOtp(e: React.FormEvent<HTMLFormElement> | undefined) {
    e && e.preventDefault();
    setMsg(null);
    if (hp) { setMsg('Bot detected'); return; }
    if (!username) { setMsg('נא להזין שם משתמש'); return; }
    setLoading(true);
    try {
        const res = await fetch(`${base}/create.php`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({username})
        });
        const data: OtpResponse = await res.json();
        if (res.ok && data.success) {
            setStep('verify');
            setMsg('קוד נשלח (אם המשתמש קיים)');
        } else {
            setMsg(data.message || 'שגיאה בבקשה');
        }
    } catch (err) {
        setMsg('שגיאת רשת');
    } finally { setLoading(false); }
}

interface VerifyOtpResponse {
    success: boolean;
    message?: string;
    token?: string;
    expires_at?: string;
}

async function verifyOtp(e: React.FormEvent<HTMLFormElement> | undefined) {
    e && e.preventDefault();
    setMsg(null);
    if (!otp) { setMsg('נא להזין קוד'); return; }
    setLoading(true);
    try {
        const res = await fetch(`${base}/verify.php`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({username, otp})
        });
        const data: VerifyOtpResponse = await res.json();
        if (res.ok && data.success) {
            // שמירת token
            localStorage.setItem('auth_token', data.token as string);
            localStorage.setItem('auth_token_expires', data.expires_at as string);
            // redirect
            window.location.href = '/index.php';
        } else {
            setMsg(data.message || 'אימות נכשל');
        }
    } catch (err) {
        setMsg('שגיאת רשת');
    } finally { setLoading(false); }
}

  return (
    <div className="login-card">
      <h2>התחברות</h2>

      {step === 'request' && (
        <form onSubmit={requestOtp}>
          <label>שם משתמש</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
          <input aria-hidden="true" tabIndex={-1} style={{position:'absolute', left:'-10000px'}} value={hp} onChange={e=>setHp(e.target.value)} />
          <button disabled={loading}>שלח קוד</button>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={verifyOtp}>
          <label>קוד</label>
          <input value={otp} onChange={e=>setOtp(e.target.value)} />
          <div>
            <button disabled={loading}>אמת</button>
            <button type="button" onClick={()=>setStep('request')}>חזור</button>
          </div>
        </form>
      )}

      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}
