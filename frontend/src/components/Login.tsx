import React, { useState } from "react";
import RequestOTP from "./RequestOTP";
import VerifyOTP from "./VerifyOTP";
import styles from "./Login.module.css";
import lang from "../lang/lang.json";

const Login: React.FC = () => {
  const [screen, setScreen] = useState<1 | 2>(1);
  const [username, setUserName] = useState("");

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        {screen === 1 && (
          <>
            <h2>{lang.loginPageTitle || "Login Page"}</h2>
            <RequestOTP setScreen={setScreen} setUserName={setUserName} />
          </>
        )}
        {screen === 2 && (
          <>
            <h2>{lang.enterOtp || 'Enter OTP'}</h2>
            <VerifyOTP username={username} />
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
