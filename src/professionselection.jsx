import { useState } from "react";
import {
  Sprout,
  ShoppingBasket,
  Truck,
  ArrowRight,
  ArrowLeft,
  LogOut,
  User,
  MapPin,
  Store,
  Car,
  Languages,
} from "lucide-react";
import "./professionselection.css";

function ProfessionSelection({ onSelect, onLogout, phone }) {
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

  const [selectedRole, setSelectedRole] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    village: "",
    district: "",
    state: "Haryana",

    shopName: "",
    businessType: "",
    shopAddress: "",

    vehicleNumber: "",
    vehicleType: "",
    serviceArea: "",

    language: "en",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.district.trim()) {
      setError("Please enter your district.");
      return;
    }

    if (!form.state.trim()) {
      setError("Please enter your state.");
      return;
    }

    if (selectedRole === "farmer" && !form.village.trim()) {
      setError("Please enter your village.");
      return;
    }

    if (selectedRole === "retailer") {
      if (!form.shopName.trim()) {
        setError("Please enter your shop or business name.");
        return;
      }

      if (!form.businessType.trim()) {
        setError("Please enter your business type.");
        return;
      }

      if (!form.shopAddress.trim()) {
        setError("Please enter your shop address.");
        return;
      }
    }

    if (selectedRole === "transporter") {
      if (!form.vehicleNumber.trim()) {
        setError("Please enter your vehicle number.");
        return;
      }

      if (!form.vehicleType.trim()) {
        setError("Please enter your vehicle type.");
        return;
      }

      if (!form.serviceArea.trim()) {
        setError("Please enter your service area.");
        return;
      }
    }

    try {
      setSaving(true);

      await onSelect(selectedRole, {
        ...form,
        phone: phone || "",
      });
    } catch (error) {
      console.error("Profile setup error:", error);
      setError("Unable to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profession-page">

      <header className="profession-topbar">
        <a className="profession-brand" href="#profession">
          <Sprout size={27} />
          AgriConnect<span>.</span>
        </a>

        <button
          className="profession-logout"
          onClick={onLogout}
        >
          <LogOut size={17} />
          Log Out
        </button>
      </header>

      {!selectedRole ? (
        /* =========================
           ROLE SELECTION
        ========================== */

        <section
          className="profession-content"
          id="profession"
        >
          <span className="profession-label">
            WELCOME TO AGRICONNECT
          </span>

          <h1>How will you use AgriConnect?</h1>

          <p className="profession-subtitle">
            Choose your profession to create your profile.
          </p>

          <div className="profession-grid">

            {roles.map((role) => {
              const Icon = role.icon;

              return (
                <article
                  className="profession-card"
                  key={role.id}
                >
                  <span className="profession-icon">
                    <Icon size={30} />
                  </span>

                  <h2>{role.title}</h2>

                  <p>{role.description}</p>

                  <button
                    className="profession-button"
                    onClick={() =>
                      handleRoleSelect(role.id)
                    }
                  >
                    Continue
                    <ArrowRight size={17} />
                  </button>
                </article>
              );
            })}

          </div>
        </section>

      ) : (

        /* =========================
           PROFILE SETUP
        ========================== */

        <section className="profile-setup-page">

          <div className="profile-setup-card">

            <button
              type="button"
              className="profile-back-button"
              onClick={handleBack}
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="profile-setup-heading">

              <div className="profile-setup-icon">

                {selectedRole === "farmer" && (
                  <Sprout size={27} />
                )}

                {selectedRole === "retailer" && (
                  <ShoppingBasket size={27} />
                )}

                {selectedRole === "transporter" && (
                  <Truck size={27} />
                )}

              </div>

              <div>
                <span className="profession-label">
                  COMPLETE YOUR PROFILE
                </span>

                <h1>
                  {selectedRole === "farmer" &&
                    "Farmer Profile"}

                  {selectedRole === "retailer" &&
                    "Retailer Profile"}

                  {selectedRole === "transporter" &&
                    "Transporter Profile"}
                </h1>

                <p>
                  Tell us a little about yourself to
                  personalize AgriConnect.
                </p>
              </div>

            </div>

            <form
              className="profile-setup-form"
              onSubmit={handleSubmit}
            >

              {/* =========================
                  BASIC INFORMATION
              ========================== */}

              <div className="profile-section">

                <div className="profile-section-title">
                  <User size={18} />
                  <span>Basic Information</span>
                </div>

                <div className="profile-form-grid">

                  <div className="profile-field full-width">

                    <label htmlFor="fullName">
                      Full Name
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={handleChange}
                    />

                  </div>

                  <div className="profile-field">

                    <label htmlFor="phone">
                      Mobile Number
                    </label>

                    <input
                      id="phone"
                      type="text"
                      value={
                        phone
                          ? `+91 ${phone}`
                          : "Mobile number"
                      }
                      disabled
                    />

                  </div>

                  <div className="profile-field">

                    <label htmlFor="district">
                      District
                    </label>

                    <input
                      id="district"
                      name="district"
                      type="text"
                      placeholder="Enter district"
                      value={form.district}
                      onChange={handleChange}
                    />

                  </div>

                  <div className="profile-field">

                    <label htmlFor="state">
                      State
                    </label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={form.state}
                      onChange={handleChange}
                    />

                  </div>

                  {selectedRole === "farmer" && (
                    <div className="profile-field">

                      <label htmlFor="village">
                        Village
                      </label>

                      <input
                        id="village"
                        name="village"
                        type="text"
                        placeholder="Enter village"
                        value={form.village}
                        onChange={handleChange}
                      />

                    </div>
                  )}

                </div>

              </div>

              {/* =========================
                  RETAILER INFORMATION
              ========================== */}

              {selectedRole === "retailer" && (
                <div className="profile-section">

                  <div className="profile-section-title">
                    <Store size={18} />
                    <span>Business Information</span>
                  </div>

                  <div className="profile-form-grid">

                    <div className="profile-field">

                      <label htmlFor="shopName">
                        Shop / Business Name
                      </label>

                      <input
                        id="shopName"
                        name="shopName"
                        type="text"
                        placeholder="e.g. Sharma Grocery"
                        value={form.shopName}
                        onChange={handleChange}
                      />

                    </div>

                    <div className="profile-field">

                      <label htmlFor="businessType">
                        Business Type
                      </label>

                      <input
                        id="businessType"
                        name="businessType"
                        type="text"
                        placeholder="e.g. Grocery Store"
                        value={form.businessType}
                        onChange={handleChange}
                      />

                    </div>

                    <div className="profile-field full-width">

                      <label htmlFor="shopAddress">
                        Shop Address
                      </label>

                      <input
                        id="shopAddress"
                        name="shopAddress"
                        type="text"
                        placeholder="Enter complete shop address"
                        value={form.shopAddress}
                        onChange={handleChange}
                      />

                    </div>

                  </div>

                </div>
              )}

              {/* =========================
                  TRANSPORTER INFORMATION
              ========================== */}

              {selectedRole === "transporter" && (
                <div className="profile-section">

                  <div className="profile-section-title">
                    <Car size={18} />
                    <span>Transport Information</span>
                  </div>

                  <div className="profile-form-grid">

                    <div className="profile-field">

                      <label htmlFor="vehicleNumber">
                        Vehicle Number
                      </label>

                      <input
                        id="vehicleNumber"
                        name="vehicleNumber"
                        type="text"
                        placeholder="e.g. HR26AB1234"
                        value={form.vehicleNumber}
                        onChange={handleChange}
                      />

                    </div>

                    <div className="profile-field">

                      <label htmlFor="vehicleType">
                        Vehicle Type
                      </label>

                      <input
                        id="vehicleType"
                        name="vehicleType"
                        type="text"
                        placeholder="e.g. Mini Truck"
                        value={form.vehicleType}
                        onChange={handleChange}
                      />

                    </div>

                    <div className="profile-field full-width">

                      <label htmlFor="serviceArea">
                        Service Area
                      </label>

                      <input
                        id="serviceArea"
                        name="serviceArea"
                        type="text"
                        placeholder="e.g. Faridabad, Delhi, Noida"
                        value={form.serviceArea}
                        onChange={handleChange}
                      />

                    </div>

                  </div>

                </div>
              )}

              {/* =========================
                  LANGUAGE
              ========================== */}

              <div className="profile-section">

                <div className="profile-section-title">
                  <Languages size={18} />
                  <span>Preferred Language</span>
                </div>

                <p className="language-help">
                  Your dashboard will automatically open
                  in the language you select.
                </p>

                <div className="language-options">

                  <button
                    type="button"
                    className={
                      form.language === "en"
                        ? "language-option active"
                        : "language-option"
                    }
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        language: "en",
                      }))
                    }
                  >
                    <span>🇬🇧</span>
                    <div>
                      <strong>English</strong>
                      <small>Use AgriConnect in English</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={
                      form.language === "hi"
                        ? "language-option active"
                        : "language-option"
                    }
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        language: "hi",
                      }))
                    }
                  >
                    <span>🇮🇳</span>
                    <div>
                      <strong>हिंदी</strong>
                      <small>AgriConnect हिंदी में इस्तेमाल करें</small>
                    </div>
                  </button>

                </div>

              </div>

              {error && (
                <div className="profile-form-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="profile-submit-button"
                disabled={saving}
              >
                {saving
                  ? "Saving Profile..."
                  : "Complete Profile"}

                {!saving && <ArrowRight size={18} />}
              </button>

            </form>

          </div>

        </section>
      )}

    </main>
  );
}

export default ProfessionSelection;