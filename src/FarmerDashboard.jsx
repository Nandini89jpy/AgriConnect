import GrainGuardian from "./GrainGuardian";
import { ShieldCheck,AlertTriangle,CheckCircle2,Wheat,Lightbulb,RefreshCw} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Sprout, Plus, MapPin, IndianRupee,
  Clock, Package, TrendingUp, Search, X ,
  Settings, UserRound , Check
} from "lucide-react";
import "./FarmerDashboard.css";


const today = new Date().toISOString().slice(0, 10);

  function getUrgency(harvestDate) {
  const age = Math.floor(
    (new Date(today) - new Date(harvestDate)) / 86400000
  );

  if (age >= 2) {
    return { label: "High priority", type: "urgent" };
  }

  if (age >= 1) {
    return { label: "Needs attention", type: "warning" };
  }

  return { label: "Fresh harvest", type: "fresh" };
}


function FarmerDashboard({ 
    onBack  ,
     crops ,
      addCrop , 
      requests = [] ,
      onRequestStatusChange,
     }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeDemandTab, setActiveDemandTab] = useState("requests");
  const [showGrainGuardian, setShowGrainGuardian] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
const [selectedLanguage, setSelectedLanguage] = useState(
  () => localStorage.getItem("agriconnect-language") || "hi"
);
const [profile, setProfile] = useState({
  name: "",
  phone: "",
  village: "",
  district: "",
  state: "Haryana",
  farmName: "",
  cropsGrown: "",
  landSize: "",
});
const [profileSaved, setProfileSaved] = useState(false);

  const [form, setForm] = useState({
    crop: "",
    quantity: "",
    price: "",
    transport: "",
    location: "",
    harvestDate: today,
  });

  const totalQuantity = crops.reduce(
    (sum, crop) => sum + crop.quantity, 0
  );

  const totalRevenue = crops.reduce(
    (sum, crop) => sum + crop.quantity * crop.price, 0
  );

  const totalTransport = crops.reduce(
    (sum, crop) => sum + crop.transport, 0
  );

  const filteredCrops = useMemo(
    () => crops.filter((crop) =>
      `${crop.crop} ${crop.location}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ),
    [crops, search]
  );
const retailerRequests = requests.filter(
  (item) => item.cropId
);

const retailerRequirements = requests.filter(
  (item) => !item.cropId
);
  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleAddCrop(event) {
  event.preventDefault();

  const quantity = Number(form.quantity);
  const price = Number(form.price);
  const transport = Number(form.transport);

  if (!form.crop || !form.location) {
    setNotice("Please enter crop name and pickup location.");
    return;
  }

  if (quantity <= 0 || price <= 0 || transport < 0) {
    setNotice("Enter a valid quantity, price and transport cost.");
    return;
  }

  const result = await addCrop({
    crop: form.crop,
    quantity,
    price,
    transport,
    transportCost: transport,
    location: form.location,
    harvestDate: form.harvestDate,
    status: "Available",
  });

  if (result?.error) {
    console.error("Crop save error:", result.error);
    setNotice("Could not save crop. Please try again.");
    return;
  }

  setForm({
    crop: "",
    quantity: "",
    price: "",
    transport: "",
    location: "",
    harvestDate: today,
  });

  setShowForm(false);
  setNotice("Crop listing added successfully!");
}
  return (
    <div className="farmer-app">
      <header className="farmer-nav">
        <a href="#dashboard" className="farmer-brand">
          <span><Sprout size={23} /></span> AgriConnect
        </a>
       <div className="farmer-nav-actions">
  <button
    type="button"
    className="settings-button"
    onClick={() => setShowSettings(true)}
  >
    <Settings size={18} />
    Settings / सेटिंग्स
  </button>

  <button className="back-button" onClick={onBack}>
    Logout
  </button>
</div>
      </header>

      <main className="farmer-main" id="dashboard">
        <div className="farmer-heading">
          <div>
            <span className="farmer-kicker">FARMER WORKSPACE</span>
            <h1>Your Farm Dashboard</h1>
            <p>Manage your harvest, monitor urgency and estimate your earnings.</p>
          </div>
          <button className="add-crop-button" onClick={() => {
            setNotice("");
            setShowForm(true);
          }}>
            <Plus size={18} /> Add Crop Listing
          </button>
        </div>

        {notice && (
          <div className="farmer-notice">
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

<button
  className="grain-guardian-open-btn"
  onClick={() => setShowGrainGuardian(true)}
>
  <ShieldCheck size={20} />
  <span>Protect My Grains</span>
</button>


        <section className="farmer-stats">
          <article className="farmer-stat">
            <span className="stat-icon"><Package /></span>
            <p>Active listings</p>
            <h2>{crops.length}</h2>
            <small>Produce available for sale</small>
          </article>
          <article className="farmer-stat">
            <span className="stat-icon"><Sprout /></span>
            <p>Total produce</p>
            <h2>{totalQuantity.toLocaleString("en-IN")} <small>kg</small></h2>
            <small>Across all current listings</small>
          </article>
          <article className="farmer-stat">
            <span className="stat-icon"><IndianRupee /></span>
            <p>Expected revenue</p>
            <h2>₹{totalRevenue.toLocaleString("en-IN")}</h2>
            <small>Before transport costs</small>
          </article>
          <article className="farmer-stat">
            <span className="stat-icon"><TrendingUp /></span>
            <p>Estimated net earnings</p>
            <h2>₹{(totalRevenue - totalTransport).toLocaleString("en-IN")}</h2>
            <small>After estimated transport</small>
          </article>
        </section>


        <section className="crop-section">
          <div className="crop-section-heading">
            <div>
              <h2>Your crop listings</h2>
              <p>Review availability and prioritize time-sensitive produce.</p>
            </div>
            <label className="crop-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search crops or location"
              />
            </label>
          </div>

          <div className="crop-list">
            {filteredCrops.map((crop) => {
              const urgency = getUrgency(crop.harvestDate);
              const revenue = crop.quantity * crop.price;

              return (
                <article className="crop-card" key={crop.id}>
                  <div className="crop-symbol"><Sprout size={25} /></div>
                  <div className="crop-details">
                    <div className="crop-title-row">
                      <h3>{crop.crop}</h3>
                      <span className={`urgency ${urgency.type}`}>
                        <Clock size={13} /> {urgency.label}
                      </span>
                    </div>
                    <p><MapPin size={14} /> {crop.location}</p>
                    <div className="crop-facts">
                      <span><b>{crop.quantity.toLocaleString("en-IN")} kg</b> available</span>
                      <span><b>₹{crop.price}/kg</b> asking price</span>
                      <span>Harvest: {crop.harvestDate}</span>
                    </div>
                  </div>
                  
                  <div className="crop-earnings">
                    <small>Net estimate</small>
                    <strong>₹{(revenue - crop.transportCost).toLocaleString("en-IN")}</strong>
                    <small>Transport: ₹{crop.transportCost.toLocaleString("en-IN")}</small>
                  </div>
                </article>
              );
            })}

            {filteredCrops.length === 0 && (
              <div className="empty-crops">
                No matching crops found. Try another search or add a listing.
              </div>
            )}
          </div>
          <p className="demo-note">
            Demo data: sample listings and transport estimates are illustrative.
            Urgency is based on harvest date only; crop-specific shelf life is not yet modelled.
          </p>
        </section>
       <section className="retailer-demands">

  <div className="demands-header">
    <div>
      <span className="section-eyebrow">MARKETPLACE</span>
      <h2>Retailer Activity</h2>
      <p>
        Manage retailer requests and discover new buying requirements.
      </p>
    </div>
  </div>

  {/* DEMAND TABS */}
  <div className="demand-tabs">

    <button
      type="button"
      className={`demand-tab ${
        activeDemandTab === "requests" ? "active" : ""
      }`}
      onClick={() => setActiveDemandTab("requests")}
    >
      <span className="demand-tab-icon">📨</span>

      <span className="demand-tab-content">
        <strong>Requests</strong>
        <small>
          {retailerRequests.length} requests
        </small>
      </span>
    </button>

    <button
      type="button"
      className={`demand-tab ${
        activeDemandTab === "requirements" ? "active" : ""
      }`}
      onClick={() => setActiveDemandTab("requirements")}
    >
      <span className="demand-tab-icon">📋</span>

      <span className="demand-tab-content">
        <strong>Retailer Requirements</strong>
        <small>
          {retailerRequirements.length} requirements
        </small>
      </span>
    </button>

  </div>


  {/* REQUESTS */}
  {activeDemandTab === "requests" && (
    <div className="demand-content">

      <div className="demand-section-title">
        <div>
          <h3>Purchase Requests</h3>
          <p>
            Requests from retailers interested in your listed crops.
          </p>
        </div>
      </div>

      {retailerRequests.length > 0 ? (
        <div className="demand-grid">

          {retailerRequests.map((item) => (
            <article className="demand-card" key={item.id}>

              <div className="demand-card-header">
                <div className="demand-crop-icon">🌾</div>

                <span className="demand-status">
                  {item.status || "Pending"}
                </span>
              </div>

              <h3>
                {item.cropName || item.name || "Crop request"}
              </h3>

              <p className="demand-subtitle">
                Retailer is interested in your crop
              </p>

              <div className="demand-info-grid">

                <div className="demand-info">
                  <span>Required quantity</span>
                  <strong>
                    {Number(item.quantity || 0).toLocaleString("en-IN")} kg
                  </strong>
                </div>

                <div className="demand-info">
                  <span>Target price</span>
                  <strong>
                    ₹{Number(item.targetPrice || 0).toLocaleString("en-IN")}
                    <small>/kg</small>
                  </strong>
                </div>

              </div>

              <div className="demand-divider" />

              <div className="demand-retailer">

                <div className="retailer-avatar">
                  {(item.retailerName || "R")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span>Requested by</span>

                  <strong>
                    {item.retailerName || "Retailer"}
                  </strong>
                </div>

              </div>

              <div className="demand-location">
                <span>📍</span>
                {item.location || "Location not specified"}
              </div>

              {item.status === "Pending" && (
                <div className="demand-actions">

                  <button
                    className="demand-accept-btn"
                    onClick={() =>
                      onRequestStatusChange(
                        item.id,
                        "accepted"
                      )
                    }
                  >
                    <Check size={17} />
                    <span>Accept Request</span>
                  </button>

                  <button
                    className="demand-reject-btn"
                    onClick={() =>
                      onRequestStatusChange(
                        item.id,
                        "rejected"
                      )
                    }
                  >
                    <X size={17} />
                    <span>Reject</span>
                  </button>

                </div>
              )}

            </article>
          ))}

        </div>
      ) : (

        <div className="demands-empty">
          <div className="empty-icon">📨</div>

          <h3>No purchase requests</h3>

          <p>
            When a retailer requests one of your listed crops,
            the request will appear here.
          </p>
        </div>

      )}

    </div>
  )}


  {/* GENERAL RETAILER REQUIREMENTS */}
  {activeDemandTab === "requirements" && (
    <div className="demand-content">

      <div className="demand-section-title">
        <div>
          <h3>Retailer Requirements</h3>
          <p>
            Discover what retailers are currently looking to buy.
          </p>
        </div>
      </div>

      {retailerRequirements.length > 0 ? (
        <div className="demand-grid">

          {retailerRequirements.map((item) => (
            <article className="demand-card" key={item.id}>

              <div className="demand-card-header">

                <div className="demand-crop-icon">
                  📋
                </div>

                <span className="demand-status">
                  {item.status || "Pending"}
                </span>

              </div>

              <h3>
                {item.cropName || "Crop requirement"}
              </h3>

              <p className="demand-subtitle">
                Retailer is looking for this crop
              </p>

              <div className="demand-info-grid">

                <div className="demand-info">
                  <span>Required quantity</span>

                  <strong>
                    {Number(item.quantity || 0).toLocaleString("en-IN")} kg
                  </strong>
                </div>

                <div className="demand-info">
                  <span>Target price</span>

                  <strong>
                    ₹{Number(item.targetPrice || 0).toLocaleString("en-IN")}
                    <small>/kg</small>
                  </strong>
                </div>

              </div>

              <div className="demand-divider" />

              <div className="demand-retailer">

                <div className="retailer-avatar">
                  {(item.retailerName || "R")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span>Requirement posted by</span>

                  <strong>
                    {item.retailerName || "Retailer"}
                  </strong>
                </div>

              </div>

              <div className="demand-location">
                <span>📍</span>
                {item.location || "Location not specified"}
              </div>

              {item.status === "Pending" && (
                <div className="demand-actions">

                  <button
                    className="demand-accept-btn"
                    onClick={() =>
                      onRequestStatusChange(
                        item.id,
                        "accepted"
                      )
                    }
                  >
                    <Check size={17} />
                    <span>Accept Requirement</span>
                  </button>

                  <button
                    className="demand-reject-btn"
                    onClick={() =>
                      onRequestStatusChange(
                        item.id,
                        "rejected"
                      )
                    }
                  >
                    <X size={17} />
                    <span>Reject</span>
                  </button>

                </div>
              )}

            </article>
          ))}

        </div>
      ) : (

        <div className="demands-empty">

          <div className="empty-icon">📋</div>

          <h3>No retailer requirements</h3>

          <p>
            New requirements posted by retailers will
            appear here.
          </p>

        </div>

      )}

    </div>
  )}

</section>

        {showForm && (
          <div className="farmer-modal-backdrop">
            <section className="farmer-modal" role="dialog" aria-modal="true"
              aria-labelledby="crop-form-title">
              <div className="modal-heading">
                <div>
                  <span className="farmer-kicker">NEW LISTING</span>
                  <h2 id="crop-form-title">Add your produce</h2>
                </div>
                <button className="modal-close" onClick={() => setShowForm(false)}
                  aria-label="Close form"><X /></button>
              </div>

              <form onSubmit={handleAddCrop}>
                <label>Crop name
                  <input name="crop" value={form.crop} onChange={updateField}
                    placeholder="e.g. Onions" required />
                </label>

                <div className="form-two-columns">
                  <label>Quantity (kg)
                    <input name="quantity" type="number" min="1" step="any"
                      value={form.quantity} onChange={updateField} required />
                  </label>
                  <label>Asking price (₹/kg)
                    <input name="price" type="number" min="0.01" step="any"
                      value={form.price} onChange={updateField} required />
                  </label>
                </div>

                <label>Pickup location
                  <input name="location" value={form.location} onChange={updateField}
                    placeholder="Village, district, state" required />
                </label>

                <div className="form-two-columns">
                  <label>Harvest date
                    <input name="harvestDate" type="date" max={today}
                      value={form.harvestDate} onChange={updateField} required />
                  </label>
                  <label>Estimated transport (₹)
                    <input name="transport" type="number" min="0" step="any"
                      value={form.transport} onChange={updateField} required />
                  </label>
                </div>

                {form.quantity && form.price && form.transport !== "" && (
                  <div className="form-estimate">
                    Estimated net earnings:
                    <strong>
                      ₹{(
                        Number(form.quantity) * Number(form.price) -
                        Number(form.transport)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}


                <div className="form-actions">
                  <button type="button" className="cancel-button"
                    onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="add-crop-button">
                    <Plus size={17} /> Save Listing
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>

{showSettings && (
  <div className="farmer-modal-backdrop">
    <section
      className="farmer-modal settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="modal-heading">
        <div>
          <span className="farmer-kicker">YOUR ACCOUNT</span>
          <h2 id="settings-title">
            Settings / सेटिंग्स
          </h2>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowSettings(false)}
          aria-label="Close settings"
        >
          <X />
        </button>
      </div>

      <form
       onSubmit={(event) => {
  event.preventDefault();
  setProfileSaved(true);
  setNotice("Personal details saved successfully!");
  setShowSettings(false);
}}>
        <h3>
          <UserRound size={18} /> Personal Details / व्यक्तिगत जानकारी
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
          Village / गाँव
          <input
            value={profile.village}
            onChange={(e) =>
              setProfile({ ...profile, village: e.target.value })
            }
            placeholder="Enter village name"
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
          Farm name / खेत का नाम (optional)
          <input
            value={profile.farmName}
            onChange={(e) =>
              setProfile({ ...profile, farmName: e.target.value })
            }
            placeholder="Enter farm name"
          />
        </label>

        <label>
          Crops grown / उगाई जाने वाली फसलें
          <input
            value={profile.cropsGrown}
            onChange={(e) =>
              setProfile({ ...profile, cropsGrown: e.target.value })
            }
            placeholder="e.g. Wheat, Rice"
          />
        </label>

        <label>
          Land size in acres / भूमि (एकड़ में)
          <input
            type="number"
            min="0"
            step="any"
            value={profile.landSize}
            onChange={(e) =>
              setProfile({ ...profile, landSize: e.target.value })
            }
            placeholder="Enter land size"
          />
        </label>

        <div className="settings-language">
          <h3>Language / भाषा चुनें</h3>

          <label htmlFor="farmer-language">
            Preferred language / पसंदीदा भाषा
          </label>

          <select
            id="farmer-language"
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

          <p className="settings-help">
            Choose the language you are most comfortable with.
            / अपनी सुविधानुसार भाषा चुनें।
          </p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => setShowSettings(false)}
          >
            Cancel / रद्द करें
          </button>

          <button type="submit" className="add-crop-button">
            Save Details / सेव करें
          </button>
        </div>
      </form>
    </section>
  </div>
)}


    {showGrainGuardian && (
  <div className="grain-guardian-overlay">
    <div className="grain-guardian-modal">
      <button
        type="button"
        className="grain-guardian-close"
        onClick={() => setShowGrainGuardian(false)}
        aria-label="Close grain protection"
      >
        <X size={22} />
      </button>

      <GrainGuardian crops={crops || []} />
    </div>
  </div>
   )}

</div>

  );
}


export default FarmerDashboard;