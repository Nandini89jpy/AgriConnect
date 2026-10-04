
import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  MapPin,
  ShoppingBasket,
  Leaf,
  IndianRupee,
  Package,
  Send,
  X,
  CheckCircle,
  Sprout,
  LogOut, 
  Clock,
  ArrowRight,
  Settings,
  UserRound
} from "lucide-react";
import "./RetailerDashboard.css";

const initialRequest = {
  cropName: "",
  quantity: "",
  targetPrice: "",
  location: "Faridabad",
  buyerName: "",
  notes: "",
};

function RetailerDashboard({ 
    onBack ,
    crops ,
    requests ,
    addRequest , 
 }) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [request, setRequest] = useState(initialRequest);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);

const [selectedLanguage, setSelectedLanguage] = useState(
  () => localStorage.getItem("agriconnect-language") || "hi"
);

const [profile, setProfile] = useState(() => {
  const saved = localStorage.getItem("agriconnect-retailer-profile");

  return saved
    ? JSON.parse(saved)
    : {
        name: "",
        phone: "",
        shopName: "",
        shopAddress: "",
        district: "",
        state: "Haryana",
        businessType: "Grocery Store",
      };
});

  const locations = useMemo(
    () => ["All Locations", ...new Set(crops.map((crop) => crop.location))],
    [crops]
  );
  const filteredCrops = useMemo(() => {
  const searchText = search.toLowerCase();

  const result = crops.filter((crop) => {
    const name = String(crop.name ?? "");
    const farmer = String(crop.farmer ?? "");
    const location = String(crop.location ?? "");

    const matchesSearch =
      name.toLowerCase().includes(searchText) ||
      farmer.toLowerCase().includes(searchText) ||
      location.toLowerCase().includes(searchText);

    const matchesLocation =
      locationFilter === "All Locations" ||
      location === locationFilter;

    return matchesSearch && matchesLocation;
  });

  if (sortBy === "price-low") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    result.sort((a, b) => b.price - a.price);
  } else if (sortBy === "quantity") {
    result.sort((a, b) => b.quantity - a.quantity);
  }

  return result;
}, [crops, search, locationFilter, sortBy]);

  const updateRequest = (event) => {
    const { name, value } = event.target;
    setRequest((previous) => ({ ...previous, [name]: value }));
  };

  const openRequestForm = (crop = null) => {
    setSelectedCrop(crop);
    setRequest({
      ...initialRequest,
      cropName: crop ? crop.name : "",
      targetPrice: crop ? String(crop.price) : "",
    });
    setSuccessMessage("");
    setShowRequestForm(true);
  };

  const submitRequest = (event) => {
    event.preventDefault();

    const newRequest = {
      ...request,
      id: Date.now(),
      quantity: Number(request.quantity),
      targetPrice: Number(request.targetPrice),
      status: "Submitted",
    };

    addRequest(newRequest);
    setShowRequestForm(false);
    setSuccessMessage(
      `Your request for ${newRequest.quantity} kg of ${newRequest.cropName} has been recorded.`
    );
    setRequest(initialRequest);
  };

  const totalAvailable = crops.reduce(
    (total, crop) => total + crop.quantity,
    0
  );

  return (
    <div className="retailer-dashboard">
      
<header className="retailer-header">
  <div className="retailer-brand">
    <span className="retailer-logo-icon">
      <Sprout size={27} />
    </span>

    <div className="retailer-brand-text">
      <h2>AgriConnect</h2>
      <span>Retailer Portal</span>
    </div>
  </div>

  <div className="retailer-header-actions">
  <button
    type="button"
    className="retailer-settings-btn"
    onClick={() => setShowSettings(true)}
  >
    <Settings size={17} />
    <span>Settings / सेटिंग्स</span>
  </button>

  <button
    className="retailer-logout-btn"
    onClick={onBack}
  >
    <LogOut size={17} />
    <span>Logout</span>
  </button>
</div>
</header>

      <main className="retailer-main">
        <section className="retailer-welcome">
          <div>
            <span className="retailer-eyebrow">BUY FRESH, BUY DIRECT</span>
            <h1>Find fresh produce for your business.</h1>
            <p>
              Discover crops from local farmers, compare prices, and tell
              farmers what your business needs.
            </p>
          </div>
          <div className="retailer-welcome-icon">
            <ShoppingBasket size={58} strokeWidth={1.3} />
          </div>
        </section>

        {successMessage && (
          <div className="retailer-success">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
            <button
              aria-label="Dismiss message"
              onClick={() => setSuccessMessage("")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="retailer-stats">
          <div className="retailer-stat-card">
            <span className="retailer-stat-icon">
              <Package size={21} />
            </span>
            <div>
              <p>Available listings</p>
              <h2>{crops.length}</h2>
            </div>
          </div>

          <div className="retailer-stat-card">
            <span className="retailer-stat-icon">
              <Leaf size={21} />
            </span>
            <div>
              <p>Total produce available</p>
              <h2>{totalAvailable.toLocaleString("en-IN")} kg</h2>
            </div>
          </div>

          <div className="retailer-stat-card">
            <span className="retailer-stat-icon">
              <ShoppingBasket size={21} />
            </span>
            <div>
              <p>My requirements</p>
              <h2>{requests.length}</h2>
            </div>
          </div>
        </section>

        <section className="retailer-listings">
          <div className="retailer-section-heading">
            <div>
              <span className="retailer-eyebrow">FARMER MARKETPLACE</span>
              <h2>Available crops</h2>
              <p>Compare local produce before placing a requirement.</p>
            </div>

            <button
              className="retailer-outline-btn"
              onClick={() => openRequestForm()}
            >
              + Post a requirement
            </button>
          </div>

          <div className="retailer-filters">
            <label className="retailer-search">
              <Search size={19} />
              <input
                type="search"
                placeholder="Search crop, farmer or location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by location"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort crops"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="recommended">Recommended order</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="quantity">Largest quantity</option>
            </select>
          </div>

          <div className="retailer-results-count">
            Showing {filteredCrops.length} of {crops.length} listings
          </div>

          {filteredCrops.length > 0 ? (
            <div className="retailer-crop-grid">
              {filteredCrops.map((crop) => (
                <article className="retailer-crop-card" key={crop.id}>
                  <div className="retailer-crop-top">
                    <span className="retailer-category">
                      {crop.category}
                    </span>
                    <span className="retailer-available">
                      <span />
                      Available
                    </span>
                  </div>

                  <div className="retailer-crop-illustration">
                    <Leaf size={37} strokeWidth={1.4} />
                  </div>

                  <h3>{crop.name}</h3>
                  <p className="retailer-crop-description">
                    {crop.description}
                  </p>

                  <div className="retailer-crop-price">
                    <strong>
                      ₹{crop.price}
                      <small>/kg</small>
                    </strong>
                    <span>{crop.quantity.toLocaleString("en-IN")} kg</span>
                  </div>

                  <div className="retailer-crop-meta">
                    <span>
                      <MapPin size={15} />
                      {crop.location || "Location not provided"}
                    </span>
                    <span>
                      <Clock size={15} />
                      Harvest: {crop.harvestDate || "Not specified"}
                    </span>
                  </div>

                  <div className="retailer-farmer">
                    <span className="retailer-farmer-avatar">
                      {(crop.farmer || "Farmer").charAt(0)}
                    </span>
                    <span>
                      <small>Listed by</small>
                      <strong>{crop.farmer || "Unknown Farmer"}</strong>
                    </span>
                  </div>

                  <button
                    className="retailer-primary-btn retailer-card-btn"
                    onClick={() => openRequestForm(crop)}
                  >
                    Send buying request
                    <Send size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="retailer-empty">
              <Search size={35} />
              <h3>No crops found</h3>
              <p>Try another crop name or select a different location.</p>
              <button
                className="retailer-outline-btn"
                onClick={() => {
                  setSearch("");
                  setLocationFilter("All Locations");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="retailer-my-requests">
          <div className="retailer-section-heading">
            <div>
              <span className="retailer-eyebrow">YOUR ACTIVITY</span>
              <h2>My buying requirements</h2>
              <p>Requirements submitted during this session.</p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="retailer-empty retailer-empty-small">
              <ShoppingBasket size={29} />
              <p>You haven't submitted any requirements yet.</p>
            </div>
          ) : (
            <div className="retailer-request-list">
              {requests.map((item) => (
                <div className="retailer-request-row" key={item.id}>
                  <div className="retailer-request-crop">
                    <span className="retailer-farmer-avatar">
                      {item.cropName.charAt(0).toUpperCase() || "C"}
                    </span>
                    <div>
                      <strong>{item.cropName}</strong>
                      <small>{item.location}</small>
                    </div>
                  </div>
                  <div>
                    <small>Quantity needed</small>
                    <strong>{item.quantity} kg</strong>
                  </div>
                  <div>
                    <small>Target price</small>
                    <strong>₹{item.targetPrice}/kg</strong>
                  </div>
                  <span className="retailer-request-status">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="retailer-demo-note">
          Demo version: the listings are sample data. Requests are stored
          temporarily in this browser session and are not sent to real farmers.
        </p>
      </main>

      {showRequestForm && (
        <div
          className="retailer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRequestForm(false);
            }
          }}
        >
          <section
            className="retailer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="retailer-modal-title"
          >
            <div className="retailer-modal-heading">
              <div>
                <span className="retailer-eyebrow">BUYER REQUIREMENT</span>
                <h2 id="retailer-modal-title">What do you need?</h2>
                <p>Tell farmers what quantity your business requires.</p>
              </div>
              <button
                className="retailer-close-btn"
                aria-label="Close form"
                onClick={() => setShowRequestForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitRequest}>
              <label>
                Your name / business name
                <input
                  name="buyerName"
                  value={request.buyerName}
                  onChange={updateRequest}
                  placeholder="e.g. Fresh Mart"
                  required
                />
              </label>

              <label>
                Crop required
                <input
                  name="cropName"
                  value={request.cropName}
                  onChange={updateRequest}
                  placeholder="e.g. Tomatoes"
                  required
                />
              </label>

              <div className="retailer-form-row">
                <label>
                  Quantity (kg)
                  <input
                    type="number"
                    name="quantity"
                    value={request.quantity}
                    onChange={updateRequest}
                    min="1"
                    step="1"
                    placeholder="e.g. 100"
                    required
                  />
                </label>

                <label>
                  Target price (₹/kg)
                  <input
                    type="number"
                    name="targetPrice"
                    value={request.targetPrice}
                    onChange={updateRequest}
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 22"
                    required
                  />
                </label>
              </div>

              <label>
                Delivery location
                <input
                  name="location"
                  value={request.location}
                  onChange={updateRequest}
                  placeholder="e.g. Faridabad"
                  required
                />
              </label>

              <label>
                Additional notes (optional)
                <textarea
                  name="notes"
                  value={request.notes}
                  onChange={updateRequest}
                  placeholder="Quality, delivery date, packaging, etc."
                  rows="3"
                />
              </label>

              <div className="retailer-modal-actions">
                <button
                  type="button"
                  className="retailer-outline-btn"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="retailer-primary-btn"
                >
                  <Send size={16} />
                  Submit requirement
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      
{showSettings && (
  <div className="retailer-modal-backdrop">
    <section
      className="retailer-modal retailer-settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retailer-settings-title"
    >
      <div className="retailer-modal-heading">
        <div>
          <span className="retailer-eyebrow">YOUR ACCOUNT</span>
          <h2 id="retailer-settings-title">
            Settings / सेटिंग्स
          </h2>
          <p>Manage your details and preferred language.</p>
        </div>

        <button
          type="button"
          className="retailer-close-btn"
          onClick={() => setShowSettings(false)}
          aria-label="Close settings"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          localStorage.setItem(
            "agriconnect-retailer-profile",
            JSON.stringify(profile)
          );

          localStorage.setItem(
            "agriconnect-language",
            selectedLanguage
          );

          setSuccessMessage("Settings saved successfully!");
          setShowSettings(false);
        }}
      >
        <h3>
          <UserRound size={18} />
          Personal Details / व्यक्तिगत जानकारी
        </h3>

        <label>
          Full name / पूरा नाम
          <input
            value={profile.name}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
            placeholder="Enter your name"
            required
          />
        </label>

        <label>
          Mobile number / मोबाइल नंबर
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value })
            }
            placeholder="Enter mobile number"
          />
        </label>

        <label>
          Shop name / दुकान का नाम
          <input
            value={profile.shopName}
            onChange={(e) =>
              setProfile({ ...profile, shopName: e.target.value })
            }
            placeholder="e.g. Fresh Mart"
            required
          />
        </label>

        <label>
          Shop address / दुकान का पता
          <input
            value={profile.shopAddress}
            onChange={(e) =>
              setProfile({ ...profile, shopAddress: e.target.value })
            }
            placeholder="Enter shop address"
          />
        </label>

        <label>
          District / जिला
          <input
            value={profile.district}
            onChange={(e) =>
              setProfile({ ...profile, district: e.target.value })
            }
            placeholder="Enter district"
          />
        </label>

        <label>
          State / राज्य
          <input
            value={profile.state}
            onChange={(e) =>
              setProfile({ ...profile, state: e.target.value })
            }
            placeholder="Enter state"
          />
        </label>

        <label>
          Business type / व्यवसाय का प्रकार
          <select
            value={profile.businessType}
            onChange={(e) =>
              setProfile({ ...profile, businessType: e.target.value })
            }
          >
            <option value="Grocery Store">Grocery Store</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Retail Shop">Retail Shop</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Food Processor">Food Processor</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <div className="retailer-settings-language">
          <h3>Language / भाषा चुनें</h3>

          <label htmlFor="retailer-language">
            Preferred language / पसंदीदा भाषा
          </label>

          <select
            id="retailer-language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="en">English</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>

          <p>
            Choose the language you are most comfortable with.
            / अपनी सुविधानुसार भाषा चुनें।
          </p>
        </div>

        <div className="retailer-modal-actions">
          <button
            type="button"
            className="retailer-outline-btn"
            onClick={() => setShowSettings(false)}
          >
            Cancel / रद्द करें
          </button>

          <button type="submit" className="retailer-primary-btn">
            Save Details / सेव करें
          </button>
        </div>
      </form>
    </section>
  </div>
)}
    </div>
  );
}

export default RetailerDashboard;