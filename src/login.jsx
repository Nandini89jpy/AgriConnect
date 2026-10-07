import { supabase } from "./lib/supabaseClient";
import { useState } from "react";
import {
  Sprout,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import "./Login.css";

function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Demo OTP
  const DEMO_OTP = "123456";

  // Send Demo OTP
  async function handleSendOtp(event) {
    event.preventDefault();
    setError("");

    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setError("Please enter your mobile number.");
      return;
    }

    // Basic Indian mobile number validation
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    // Demo mode:
    // No real SMS is sent.
    // The OTP for the hackathon demo is always 123456.
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 600);
  }

  // Verify Demo OTP
  async function handleVerifyOtp(event) {
    event.preventDefault();
    setError("");

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError("Please enter the OTP.");
      return;
    }

    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (cleanOtp !== DEMO_OTP) {
      setError("Invalid OTP. Please use the demo OTP 123456.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Create a Supabase anonymous session.
       *
       * This keeps the user authenticated with Supabase so that
       * your existing RLS-protected database operations continue
       * to work during the hackathon demo.
       */
      const { data, error } =
        await supabase.auth.signInAnonymously({
          options: {
            data: {
              demo_phone: `+91${cleanPhone}`,
            },
          },
        });

      if (error) {
        console.error("Anonymous login error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError("Unable to log in. Please try again.");
        setLoading(false);
        return;
      }

      /*
       * Keep the same onLogin flow used by your existing App.
       * We pass the entered phone number because the anonymous
       * Supabase user does not have a real phone identity.
       */
      onLogin(`+91${cleanPhone}`);
    } catch (error) {
      console.error("Unexpected login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">

      {/* LEFT SIDE */}
      <div className="login-info">

        <a href="/" className="login-brand">
          <span className="login-brand-icon">
            <Sprout size={29} />
          </span>

          <span>
            AgriConnect<span className="brand-dot">.</span>
          </span>
        </a>

        <h1 className="login-title">
          <span className="login-title-line">
            Bridging Farmers
          </span>

          <span className="login-title-highlight">
            and Markets
          </span>
        </h1>

        <p>
          Join AgriConnect and be part of a smarter agricultural
          supply chain. Connect with buyers, access better prices
          and grow together.
        </p>

        <div className="login-benefits">

          <div className="login-benefit">
            <span className="login-benefit-icon">
              <Sprout size={23} />
            </span>

            <div>
              <strong>Direct Connections</strong>
              <p>Farmers · Retailers · Transporters</p>
            </div>
          </div>

          <div className="login-benefit">
            <span className="login-benefit-icon">
              <ShieldCheck size={23} />
            </span>

            <div>
              <strong>Fair &amp; Transparent</strong>
              <p>Better visibility into produce prices</p>
            </div>
          </div>

          <div className="login-benefit">
            <span className="login-benefit-icon">
              <Truck size={23} />
            </span>

            <div>
              <strong>Efficient Delivery</strong>
              <p>Shared logistics and lower costs</p>
            </div>
          </div>

        </div>
      </div>

      {/* LOGIN CARD */}
      <div className="login-card">

        <a href="/" className="login-brand">
          <span className="login-brand-icon">
            <Sprout size={27} />
          </span>

          <span>
            AgriConnect<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="login-heading">
          <h1>
            {otpSent ? "Verify your number" : "Welcome back!"}
          </h1>

          <p>
            {otpSent
              ? `Enter the demo OTP for +91 ${phone}`
              : "Log in securely using your mobile number."}
          </p>
        </div>

        {!otpSent ? (

          /* MOBILE NUMBER FORM */

          <form onSubmit={handleSendOtp}>

            <label htmlFor="phone">
              Mobile number
            </label>

            <div className="login-input-wrap">

              <Phone size={19} />

              <span className="phone-prefix">
                +91
              </span>

              <input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);

                  setPhone(value);
                }}
                maxLength={10}
                required
              />

            </div>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

          </form>

        ) : (

          /* OTP FORM */

          <form onSubmit={handleVerifyOtp}>

            <label htmlFor="otp">
              Enter OTP
            </label>

            <div className="login-input-wrap">

              <ShieldCheck size={19} />

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setOtp(value);
                }}
                maxLength={6}
                required
              />

            </div>

          
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Log In"}
            </button>

            <button
              type="button"
              className="change-number-btn"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
            >
              Change mobile number
            </button>

          </form>

        )}

      </div>

    </main>
  );
}

export default Login;