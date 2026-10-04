
import {
  Sprout,
  ShoppingBasket,
  Truck,
  ArrowRight,
  LogOut,
} from "lucide-react";
import "./ProfessionSelection.css";

function ProfessionSelection({ onSelect, onLogout }) {
  const roles = [
    {
      id: "farmer",
      title: "I'm a Farmer",
      description:
        "List available crops, connect with retailers and estimate your earnings.",
      icon: Sprout,
    },
    {
      id: "retailer",
      title: "I'm a Retailer",
      description:
        "Discover available produce, post requirements and manage buying requests.",
      icon: ShoppingBasket,
    },
    {
      id: "transporter",
      title: "I'm a Transporter",
      description:
        "Explore delivery opportunities and coordinate agricultural transportation.",
      icon: Truck,
    },
  ];

  return (
    <main className="profession-page">
      <header className="profession-topbar">
        <a className="profession-brand" href="#profession">
          <Sprout size={27} />
          AgriConnect<span>.</span>
        </a>

        <button className="profession-logout" onClick={onLogout}>
          <LogOut size={17} />
          Log Out
        </button>
      </header>

      <section className="profession-content" id="profession">
        <span className="profession-label">WELCOME TO AGRICONNECT</span>
        <h1>How will you use AgriConnect?</h1>
        <p className="profession-subtitle">
          Choose your profession to continue to the relevant dashboard.
        </p>

        <div className="profession-grid">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <article className="profession-card" key={role.id}>
                <span className="profession-icon">
                  <Icon size={30} />
                </span>

                <h2>{role.title}</h2>
                <p>{role.description}</p>

                <button
                  className="profession-button"
                  onClick={() => onSelect(role.id)}
                >
                  Continue <ArrowRight size={17} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default ProfessionSelection;