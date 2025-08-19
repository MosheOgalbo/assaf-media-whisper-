import React, { FC } from "react";
import lang from "../lang/lang.json";

type Props = {
    setScreen: (screen: 1 | 2) => void;
    setUserName: (username: string) => void;
};

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || "";

export const RequestOTP: FC<Props> = ({ setScreen, setUserName }) => {
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        const form = event.target as HTMLFormElement;
        if ((form as any).name_check && (form as any).name_check.value) {
            setError("Bot detected");
            return;
        }
        const username = (form.querySelector('#username') as HTMLInputElement).value.trim();
        if (!username) {
            setError(lang.usernameRequired || "Username is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_BASE}/otp/create.php`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (res.ok && data.status === 200) {
                setUserName(username);
                setScreen(2);

                // If backend returned dev_otp (DEBUG mode), print to console (dev only)
                if (data.dev_otp) {
                    console.info("[DEV] OTP for", username, ":", data.dev_otp);
                    // optional: notify user in UI (dev-only)
                    // alert(`DEV OTP: ${data.dev_otp}`);
                }
            } else {
                setError(data.message || "Error requesting OTP");
            }
        } catch (err: any) {
            setError(err.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} autoComplete="off">
            <input type="text" name="name_check" style={{display:'none'}} tabIndex={-1} autoComplete="off" />
            <div>
                <label htmlFor="username">{lang.username}</label>
                <input type="text" id="username" name="username" required autoComplete="off" />
            </div>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <button type="submit" disabled={loading}>{loading ? (lang.sending || 'Sending...') : (lang.requestOtpButton || 'Request OTP')}</button>
        </form>
    );
};

export default RequestOTP;
