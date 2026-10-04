import { supabase } from "./lib/supabaseClient";
import { useState } from "react";
import { Sprout, Mail, LockKeyhole, Eye, EyeOff ,Truck,Handshake,ShieldCheck} from "lucide-react";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

 async function handleSubmit(event) {
  event.preventDefault();
  setError("");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password,
  });

  if (error) {
    setError(error.message);
    return;
  }

  onLogin(data.user.email);
}
  return (
    <main className="login-page">
        
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
  <span className="login-title-line">Bridging Farmers</span>
  <span className="login-title-highlight">and Markets</span>
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
      <div className="login-card">
        <a href="/" className="login-brand">
          <span className="login-brand-icon">
            <Sprout size={27} />
          </span>
          <span>AgriConnect<span className="brand-dot">.</span></span>
        </a>

        <div className="login-heading">
          <h1>Welcome back!</h1>
          <p>Log in to connect with your agricultural community.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <div className="login-input-wrap">
            <Mail size={19} />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="login-input-wrap">
            <LockKeyhole size={19} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit">
            Log In
          </button>
        </form>

        <p className="login-demo">
          Demo email: demo@agriconnect.com<br />
          Demo password: Agri@123
        </p>
      </div>
    </main>
  );
}

export default Login;