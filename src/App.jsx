import { supabase } from "./lib/supabaseClient";
import Login from "./login";
import ProfessionSelection from "./professionselection";
import { useAgriData } from "./agriData";
import RetailerDashboard from "./RetailerDashboard";
import FarmerDashboard from "./FarmerDashboard";
import { useState, useEffect } from "react";
import {
  Sprout,
  ShoppingBasket,
  Truck,
  ArrowRight,
  MapPin,
  Leaf,
  Handshake,
  IndianRupee,
  Menu,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import "./App.css";

const features = [
  {
    icon: Handshake,
    title: "Smart Buyer Matching",
    text: "Connect available crops with retailers looking for the right quantity, price and quality.",
  },
  {
    icon: Clock,
    title: "Freshness First",
    text: "Prioritize time-sensitive produce so farmers can find buyers before freshness declines.",
  },
  {
    icon: IndianRupee,
    title: "Transparent Earnings",
    text: "Estimate your earnings after transportation costs before accepting an offer.",
  },
  {
    icon: Truck,
    title: "Shared Transportation",
    text: "Coordinate compatible pickups and deliveries to help reduce transport expenses.",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ activePage, setActivePage ] = useState("login");
  const [loggedInUser, setLoggedInUser] =useState(null);
  const handleLogin = (user) => {
  setLoggedInUser(user);
  setActivePage("profession");
};

const handleLogout = () => {
  setLoggedInUser(null);
  setActivePage("login");
};
const handleProfessionSelect = async (role) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("Current session:", session);
  console.log("Current user:", session?.user);

  if (!session?.user) {
    alert("Your login session has expired. Please log in again.");
    return;
  }

  const user = session.user;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: user.email,
        role: role,
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    console.error("Profile save error:", error);
    alert("Could not save your profession. Please try again.");
    return;
  }

  setLoggedInUser(user);
  setActivePage(role);
};
  const { crops, requests, addCrop, addRequest, updateRequestStatus } = useAgriData(loggedInUser);

  useEffect(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });
}, [activePage]);

// Login page
if (activePage === "login") {
  return <Login onLogin={handleLogin} />;
}

// Choose a profession after login
if (activePage === "profession") {
  return (
    <ProfessionSelection
      onSelect={handleProfessionSelect}
      onLogout={handleLogout}
    />
  );
}

// Farmer dashboard
if (activePage === "farmer") {
  return (
    <FarmerDashboard
      onBack={handleLogout}
      crops={crops}
      addCrop={addCrop}
      requests={requests}
      onRequestStatusChange={updateRequestStatus}
    />
  );
}

// Retailer dashboard
if (activePage === "retailer") {
  return (
    <RetailerDashboard
      onBack={handleLogout}
      crops={crops}
      requests={requests}
      addRequest={addRequest}
    />
  );
}

// Transporter dashboard
if (activePage === "transporter") {
  return (
    <div className="profession-page">
      <div className="profession-content">
        <h1>Transporter Dashboard</h1>
        <p>The Transporter Dashboard is under development.</p>
        <button
          className="profession-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
} 
  return (
    <div className="app" id="home">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon"><Sprout size={25} /></span>
          AgriConnect<span className="brand-dot">.</span>
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a className="nav-cta" href="#roles" onClick={() => setMenuOpen(false)}>
            Get Started <ArrowRight size={16} />
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <Leaf size={15} /> SMARTER AGRICULTURE. BETTER OPPORTUNITIES.
            </div>

            <h1>
              From Farm to Market,
              <span> Without the Hassle.</span>
            </h1>

            <p className="hero-description">
              Connect farmers directly with retailers, discover new buyers
              for fresh produce and coordinate affordable deliveries—all
              through one smart platform.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#roles">
                Get Started <ArrowRight size={18} />
              </a>
              <a className="button button-secondary" href="#how">
                See How It Works
              </a>
            </div>

            <div className="hero-points">
              <span><CheckCircle2 size={17} /> Better market access</span>
              <span><CheckCircle2 size={17} /> Transparent pricing</span>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
              alt="Green agricultural fields"
            />
            <div className="floating-card freshness-card">
              <span className="floating-icon"><Sprout size={21} /></span>
              <div>
                <strong>Freshness matters</strong>
                <p>Find demand for your harvest</p>
              </div>
            </div>
            <div className="floating-card transport-card">
              <span className="floating-icon truck-icon"><Truck size={21} /></span>
              <div>
                <strong>Shared logistics</strong>
                <p>Coordinate compatible deliveries</p>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-strip">
          <div>
            <span className="strip-icon"><Sprout size={23} /></span>
            <div><strong>For Farmers</strong><p>Reach more potential buyers.</p></div>
          </div>
          <div>
            <span className="strip-icon"><ShoppingBasket size={23} /></span>
            <div><strong>For Retailers</strong><p>Discover available produce.</p></div>
          </div>
          <div>
            <span className="strip-icon"><Truck size={23} /></span>
            <div><strong>For Transporters</strong><p>Coordinate shared deliveries.</p></div>
          </div>
        </section>

    
     
        <section className="roles-section" id="roles">
          <div className="section-heading">
            <span className="section-label">JOIN AGRICONNECT</span>
            <h2>What brings you here today?</h2>
            <p>Choose your role to explore the platform.</p>
          </div>

          <div className="roles-grid">
            <article className="role-card">
              <span className="role-icon"><Sprout size={30} /></span>
              <h3>I'm a Farmer</h3>
              <p>List available crops, explore buyer matches and estimate your earnings.</p>
              <button className="role-button" onClick={() => setActivePage("farmer")}>
                Farmer Dashboard <ArrowRight size={17} />
              </button>
            </article>

            <article className="role-card">
              <span className="role-icon buyer-icon"><ShoppingBasket size={30} /></span>
              <h3>I'm a Retailer</h3>
              <p>Post crop requirements, find available produce and manage purchase orders.</p>
              <button className="role-button" onClick={() => setActivePage("retailer")}>
                Retailer Dashboard <ArrowRight size={17} />
              </button>
            </article>

            <article className="role-card">
              <span className="role-icon transport-icon"><Truck size={30} /></span>
              <h3>I'm a Transporter</h3>
              <p>Review compatible pickups, vehicle capacity and delivery assignments.</p>
              <button className="role-button" onClick={() => alert("We'll build the Transport Dashboard next!")}>
                Transport Dashboard <ArrowRight size={17} />
              </button>
            </article>
          </div>
        </section>


    <section className="section" id="how">
          <div className="section-heading">
            <span className="section-label">HOW IT WORKS</span>
            <h2>A simpler journey from harvest to sale.</h2>
            <p>Three connected steps help turn available produce into organized orders and deliveries.</p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <span className="step-icon"><Sprout size={27} /></span>
              <h3>List Your Produce</h3>
              <p>Add crop type, available quantity, price, harvest date and pickup location.</p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <span className="step-icon"><Handshake size={27} /></span>
              <h3>Find the Right Buyers</h3>
              <p>Compare buyer demand, acceptable prices, quality and delivery deadlines.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <span className="step-icon"><Truck size={27} /></span>
              <h3>Coordinate Delivery</h3>
              <p>Group compatible orders into transport assignments and track delivery.</p>
            </article>
          </div>
        </section>


   <section className="section features-section" id="features">
          <div className="section-heading">
            <span className="section-label">OUR FEATURES</span>
            <h2>More than a marketplace.</h2>
            <p>Practical tools designed around the challenges of selling and delivering agricultural produce.</p>
          </div>

          <div className="features-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon"><Icon size={25} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>




        <section className="cta-section">
          <span className="cta-icon"><MapPin size={26} /></span>
          <h2>Let's make every harvest count.</h2>
          <p>Connect farms, buyers and transportation so more produce can reach the people who need it.</p>
          <a href="#roles" className="button button-primary">Explore AgriConnect <ArrowRight size={18} /></a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#home">
          <span className="brand-icon"><Sprout size={22} /></span>
          AgriConnect<span className="brand-dot">.</span>
        </a>
        <p>Connecting farms, buyers and better opportunities.</p>
        <span>Built for a smarter agricultural future.</span>
      </footer>
    </div>
  );
}

export default App;