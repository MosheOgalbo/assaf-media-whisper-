import React, { FC } from "react";
import lang from "../lang/lang.json";

type Props = {
    setScreen: (screen: 1 | 2) => void;
    setUserName: (username: string) => void;
};

export const RequestOTP: FC<Props> = ({ setScreen, setUserName }) => {

    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        if (form.name_check && form.name_check.value) {
            console.warn("Failed Honeypot check");
            return;
        }
        try {
            const response = await fetch("/otp/create.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: form.username.value,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log("OTP request result:", data);
            if (data.status === 200) {
                setUserName(form.username.value);
                setScreen(2);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("OTP request failed:", error);
            alert("Something went wrong. Please try again later.");
        }
    };

    return (
        <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ display: "none" }}>
                <input
                    type="text"
                    id="name_check"
                    name="name_check"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>
            <div>
                <label htmlFor="username">{lang.username}</label>
                <input type="text" id="username" name="username" required />
            </div>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <button type="submit">{lang.requestOtpButton}</button>
        </form>
    );
};


export default RequestOTP;