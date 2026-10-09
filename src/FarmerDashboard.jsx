import { t } from "./translations";
import { supabase } from "./lib/supabaseClient";
import GrainGuardian from "./GrainGuardian.jsx";
import GrainInspection  from "./grainInspection.jsx";
import { ShieldCheck,AlertTriangle,CheckCircle2,Wheat,Lightbulb,RefreshCw} from "lucide-react";
import { useMemo, useState , useEffect} from "react";
import {
  ArrowLeft, Sprout, Plus, MapPin, IndianRupee,
  Clock, Package, TrendingUp, Search, X ,
  Settings, UserRound , Check
} from "lucide-react";
import "./FarmerDashboard.css";


const today = new Date().toISOString().slice(0, 10);

 function getUrgency(harvestDate, language) {
  const age = Math.floor(
    (new Date(today) - new Date(harvestDate)) / 86400000
  );

  if (age >= 2) {
    return {
      label: t(language, "highPriority"),
      type: "urgent",
    };
  }

  if (age >= 1) {
    return {
      label: t(language, "needsAttention"),
      type: "warning",
    };
  }

  return {
    label: t(language, "freshHarvest"),
    type: "fresh",
  };
}


function FarmerDashboard({ 
    onBack  ,
     crops ,
      addCrop , 
      requests = [] ,
      onRequestStatusChange,
      onRequirementInterest,
      language="en",
     }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
const [selectedFarmerOrder, setSelectedFarmerOrder] = useState(null);
  const [activeDemandTab, setActiveDemandTab] = useState("requests");
  const [activeFarmerTab, setActiveFarmerTab] = useState("requests");
  const [showGrainGuardian, setShowGrainGuardian] = useState(false);
  const [showGrainInspection, setShowGrainInspection] = useState(false);
const [selectedInspectionRequest, setSelectedInspectionRequest] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notInterestedLoading, setNotInterestedLoading] = useState(null);
const [showRequirementOffer, setShowRequirementOffer] = useState(false);
const [selectedRequirement, setSelectedRequirement] = useState(null);

const [requirementResponseOverrides, setRequirementResponseOverrides] =
  useState({});

const [farmerOrders, setFarmerOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(true);

const [offerForm, setOfferForm] = useState({
  quantity: "",
  price: "",
  deadline: "",
  image: null,
});
const updateOfferForm = (event) => {
  const { name, value, files } = event.target;

  setOfferForm((previous) => ({
    ...previous,
    [name]: files ? files[0] : value,
  }));
};
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
  const openRequirementOffer = async (requirement) => {
  const result = await onRequirementInterest(requirement.id);

  if (result?.error) {
    alert(
      "Could not respond to this requirement. Please try again."
    );
    return;
  }

  setSelectedRequirement(requirement);

  setOfferForm({
    quantity: "",
    price: "",
    deadline: "",
    image: null,
  });

  setShowRequirementOffer(true);
};
const handleNotInterested = async (requirement) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Your login session has expired. Please log in again.");
      return;
    }

    const { error } = await supabase
      .from("purchase_requests")
      .update({
        farmer_id: user.id,
        farmer_response_status: "not_interested",
      })
      .eq("id", requirement.id);

    if (error) {
      console.error("Not interested update error:", error);
      alert("Could not update your response. Please try again.");
      return;
    }

    setRequirementResponseOverrides((previous) => ({
      ...previous,
      [requirement.id]: "not_interested",
    }));

    alert("You have marked this requirement as Not Interested.");
  } catch (error) {
    console.error("Unexpected not-interested error:", error);
    alert("Something went wrong. Please try again.");
  }
};
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



const retailerRequests= requests.filter(
  (item) => !item.cropId
);

console.log("All requests:", requests);
console.log("Retailer-posted requirements:", retailerRequests);
useEffect(() => {
  const loadFarmerOrders = async () => {
    try {
      setOrdersLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFarmerOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          purchase_requests (
            requested_crop,
            quantity,
            target_price,
            buyer_name,
            location,
            notes
          )
        `)
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading farmer orders:", error);
        return;
      }

      const ordersWithImages = await Promise.all(
        (data || []).map(async (order) => {
          let imageUrl = "";

          if (order.grain_image_url) {
            const { data: signedImage } =
              await supabase.storage
                .from("grain-images")
                .createSignedUrl(
                  order.grain_image_url,
                  60 * 60
                );

            imageUrl = signedImage?.signedUrl || "";
          }

          return {
            ...order,
            signedImageUrl: imageUrl,
          };
        })
      );

      setFarmerOrders(ordersWithImages);
    } catch (error) {
      console.error("Unexpected farmer orders error:", error);
       } finally { 
      setOrdersLoading(false); 
    } 
  };

  loadFarmerOrders();

  const channel = supabase
    .channel("farmer-orders-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      async () => {
        await loadFarmerOrders();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  

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
          <span><Sprout size={23} /></span>{t(language, "agriConnect")}
        </a>
       <div className="farmer-nav-actions">
  
  <button className="back-button" onClick={onBack}>
    {t(language, "logout")}
  </button>
</div>
      </header>

      <main className="farmer-main" id="dashboard">
        <div className="farmer-heading">
          <div>
            <span className="farmer-kicker">
  {t(language, "farmerWorkspace")}
</span>

<h1>
  {t(language, "farmerDashboard")}
</h1>

<p>
  {t(language, "farmerDashboardSubtitle")}
</p>
           </div>
          <button className="add-crop-button" onClick={() => {
            setNotice("");
            setShowForm(true);
          }}>
            <Plus size={18} />
{t(language, "addCropListing")}
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
  <span>{t(language, "protectMyGrains")}</span>
</button>


        <section className="farmer-stats">
          <article className="farmer-stat">
            <span className="stat-icon"><Package /></span>
            <p>{t(language, "activeListings")}</p>
            <h2>{crops.length}</h2>
            <small>{t(language, "produceAvailableForSale")}</small>
          </article>
          <article className="farmer-stat">
            <span className="stat-icon"><Sprout /></span>
            <p>{t(language, "totalProduce")}</p>
            <h2>{totalQuantity.toLocaleString("en-IN")} <small>kg</small></h2>
            <small>{t(language, "acrossCurrentListings")}</small>
          </article>
          <article className="farmer-stat">
            <span className="stat-icon"><IndianRupee /></span>
            <p>{t(language, "expectedRevenue")}</p>
            <h2>₹{totalRevenue.toLocaleString("en-IN")}</h2>
            <small>{t(language, "beforeTransportCosts")}</small>
          </article>
          <article className="farmer-stat">
            <span className="stat-icon"><TrendingUp /></span>
            <p>{t(language, "estimatedNetEarnings")}</p>
            <h2>₹{(totalRevenue - totalTransport).toLocaleString("en-IN")}</h2>
            <small>{t(language, "afterEstimatedTransport")}</small>
          </article>
        </section>


        <section className="crop-section">
          <div className="crop-section-heading">
            <div>
             <h2>{t(language, "yourCropListings")}</h2>

<p>
  {t(language, "reviewAvailability")}
</p>
            </div>
            <label className="crop-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(language, "searchCropsLocation")}
              />
            </label>
          </div>

          <div className="crop-list">
            {filteredCrops.map((crop) => {
              const urgency = getUrgency(crop.harvestDate,language);
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
                    <small>{t(language, "netEstimate")}</small>
                    <strong>₹{(revenue - crop.transportCost).toLocaleString("en-IN")}</strong>
                    <small>Transport: ₹{crop.transportCost.toLocaleString("en-IN")}</small>
                  </div>
                </article>
              );
            })}

            {filteredCrops.length === 0 && (
              <div className="empty-crops">
                {t(language, "noMatchingCrops")}
              </div>
            )}
          </div>
        </section>
       <section className="retailer-demands">

  <div className="demands-header">
    <div>
      <span className="section-eyebrow">{t(language, "marketplace")}</span>
      <h2>{t(language, "retailerActivity")}</h2>
      <p>
       {t(language, "manageRetailerRequests")}
      </p>
    </div>
  </div>
  <div className="farmer-main-tabs">
 
  <button
    type="button"
    className={
      activeFarmerTab === "requirements"
        ? "farmer-main-tab active"
        : "farmer-main-tab"
    }
    onClick={() => setActiveFarmerTab("requirements")}
  >
    📋 {t(language, "retailerRequirements")}
  </button>

  <button
    type="button"
    className={
      activeFarmerTab === "orders"
        ? "farmer-main-tab active"
        : "farmer-main-tab"
    }
    onClick={() => setActiveFarmerTab("orders")}
  >
    📦 {t(language, "myOrders")}
  </button>
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
        <strong>{t(language, "requests")}</strong>
        <small>
          {retailerRequests.length} requests
        </small>
      </span>
    </button>

  
  </div>


  {/*  RETAILERREQUESTS */}
  {activeFarmerTab === "requirements" && (
    <div className="demand-content">

      <div className="demand-section-title">
        <div>
          <h3>{t(language, "purchaseRequests")}</h3>
          <p>
           {t(language, "requestsFromRetailers")}
          </p>
        </div>
      </div>

      {retailerRequests.length > 0 ? (
        <div className="demand-grid">

       {retailerRequests.map((item) => {
  const responseStatus =
    requirementResponseOverrides[item.id] ??
    item.farmerResponseStatus;

  return (
    <article className="demand-card" key={item.id}>

      <div className="demand-card-header">
        <div className="demand-crop-icon">🌾</div>

        <span className="demand-status">
          {responseStatus === "submitted"
            ? "In Process"
            : responseStatus === "interested"
            ? "Interested"
            : responseStatus === "not_interested"
            ? "Not Interested"
            : responseStatus === "accepted"
            ? "Accepted"
            : responseStatus === "rejected"
            ? "Rejected"
            : "Waiting for Response"}
        </span>
      </div>

      <h3>
        <h3>
  {item.cropName ||
    item.requestedCrop ||
    item.requested_crop ||
    item.name ||
    "Crop request"}
</h3>
      </h3>

      <p className="demand-subtitle">
        {t(language, "retailerIsInterestedInYourCrop")}
      </p>

      <div className="demand-info-grid">

        <div className="demand-info">
          <span>{t(language, "requiredQuantity")}</span>
          <strong>
            {Number(item.quantity || 0).toLocaleString("en-IN")} kg
          </strong>
        </div>

        <div className="demand-info">
          <span>{t(language, "targetPrice")}</span>
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
          <span>{t(language, "requestedBy")}</span>

          <strong>
            {item.retailerName || "Retailer"}
          </strong>
        </div>

      </div>

      <div className="demand-location">
        <span>📍</span>
        {item.location || "Location not specified"}
      </div>

      {/* BEFORE FARMER RESPONDS */}
      {!item.farmerResponseStatus && (
        <div className="demand-actions">

          <button
            type="button"
            className="demand-accept-btn"
            onClick={() => openRequirementOffer(item)}
          >
            <Check size={17} />
            <span>{t(language, "interested")}</span>
          </button>

          <button
            type="button"
            className="demand-not-interested-btn"
            onClick={() => handleNotInterested(item)}
            disabled={notInterestedLoading === item.id}
          >
            {notInterestedLoading === item.id
              ? "Updating..."
              : "Not Interested"}
          </button>

        </div>
      )}

      {/* FARMER HAS SHOWN INTEREST */}
      {/* FARMER RESPONSE / ACTIONS */}
<div className="farmer-request-response">

  {/* No response yet */}
  {!responseStatus && (
    <div className="farmer-response-prompt">

      <div className="farmer-response-label">
        <span className="farmer-response-dot waiting"></span>
        <span>{t(language, "wouldYouLikeToRespond")}</span>
      </div>

      <div className="farmer-response-buttons">

        <button
          type="button"
          className="farmer-interest-btn"
          onClick={() => openRequirementOffer(item)}
        >
          {t(language, "interested")}
        </button>

        <button
          type="button"
          className="farmer-not-interest-btn"
          onClick={() => handleNotInterested(item)}
          disabled={notInterestedLoading === item.id}
        >
          {notInterestedLoading === item.id
            ? "Updating..."
            : "✕ Not Interested"}
        </button>

      </div>

    </div>
  )}

  {/* Farmer showed interest */}
  {responseStatus === "interested" && (
    <div className="farmer-status-box interested">

      <div className="farmer-status-icon">✓</div>

      <div>
        <strong>{t(language, "youreInterested")}</strong>
        <span>{t(language, "completeOfferToContinue")}</span>
      </div>

      <button
        type="button"
        className="complete-offer-btn"
        onClick={() => openRequirementOffer(item)}
      >
        {t(language, "completeOffer")}
      </button>

    </div>
  )}

  {/* Offer submitted */}
  {responseStatus === "submitted" && (
    <div className="farmer-status-box in-process">

      <div className="farmer-status-icon">⏳</div>

      <div>
        <strong>{t(language, "inProcess")}</strong>
        <span>
         {t(language, "offerSubmitted")} {t(language, "waitingForRetailerDecision")}
        </span>
      </div>

    </div>
  )}

  {/* Retailer accepted */}
  {responseStatus === "accepted" && (
    <div className="farmer-status-box accepted">

      <div className="farmer-status-icon">✓</div>

      <div>
        <strong>{t(language, "orderAccepted")}</strong>
        <span>
         {t(language, "retailerAcceptedOffer")}
        </span>
      </div>

    </div>
  )}

  {/* Retailer rejected */}
  {responseStatus === "rejected" && (
    <div className="farmer-status-box rejected">

      <div className="farmer-status-icon">!</div>

      <div>
        <strong>{t(language, "offerNotAccepted")}</strong>
        <span>
          {t(language, "retailerNotAcceptedOffer")}
        </span>
      </div>

    </div>
  )}

  {/* Farmer declined */}
  {responseStatus === "not_interested" && (
    <div className="farmer-status-box not-interested">

      <div className="farmer-status-icon">✕</div>

      <div>
        <strong>{t(language, "notInterested")}</strong>
        <span>
          {t(language, "youChoseNotToRespond")}
        </span>
      </div>

    </div>
  )}

</div>
    </article>
  );
})}
        </div>
      ) : (

        <div className="demands-empty">
          <div className="empty-icon">📨</div>

          <h3>NO PURCHASE REQUESTS</h3>

          <p>
            No Purchase Request Note
          </p>
        </div>

      )}

    </div>
  )}

{activeFarmerTab === "orders" && (
  <div className="farmer-orders-content">

    <div className="demand-section-title">
      <div>
        <h3>{t(language, "myOrders")}</h3>
        <p>
          {t(language, "trackOrdersCreatedFromYourAcceptedRetailerRequests")}
        </p>
      </div>
    </div>

    {ordersLoading ? (
      <div className="demands-empty">
        <div className="empty-icon">⏳</div>
        <h3>{t(language, "loadingOrders")}</h3>
        <p>{t(language, "pleaseWaitWhileWeLoadYourOrders")}</p>
      </div>
    ) : farmerOrders.length === 0 ? (
      <div className="demands-empty">
        <div className="empty-icon">📦</div>
        <h3>{t(language, "noOrdersYet")}</h3>
        <p>
          {t(language, "ordersCreatedFromYourAcceptedRetailerRequestsWillAppearHere")}
        </p>
      </div>
    ) : (
      <div className="farmer-orders-grid">

        {farmerOrders.map((order) => {
          const request = order.purchase_requests;

          const cropName =
            request?.requested_crop ||
            "Crop order";

          const quantity =
            Number(request?.quantity || 0);

          const targetPrice =
            Number(request?.target_price || 0);

          const retailerName =
            request?.buyer_name ||
            "Retailer";

          const location =
            request?.location ||
            "Location not specified";

          const orderStatus =
            order.status === "inspection_pending"
              ? "Pending retailer review"
              : order.status === "ai_reviewed"
              ? "Reviewed"
              : order.status === "confirmed"
              ? "Confirmed"
              : order.status === "cancelled"
              ? "Cancelled"
              : order.status === "completed"
              ? "Completed"
              : order.status;

          return (
            <article
              className="farmer-order-card"
              key={order.id}
            >

              <div className="farmer-order-header">
                <div>
                  <span>{t(language, "order")}</span>
                  <strong>
                    {cropName}
                  </strong>
                </div>

                <span
                  className={`farmer-order-status ${
                    order.status
                  }`}
                >
                  {orderStatus}
                </span>
              </div>

              {order.signedImageUrl && (
                <img
                  src={order.signedImageUrl}
                  alt={`${cropName} grain`}
                  className="farmer-order-image"
                />
              )}

              <div className="farmer-order-info">

                <div>
                  <span>{t(language, "quantity")}</span>
                  <strong>
                    {quantity.toLocaleString("en-IN")} kg
                  </strong>
                </div>

                <div>
                  <span>{t(language, "targetPrice")}</span>
                  <strong>
                    ₹{targetPrice.toLocaleString("en-IN")}/kg
                  </strong>
                </div>

                <div>
                  <span>{t(language, "retailer")}</span>
                  <strong>
                    {retailerName}
                  </strong>
                </div>

              </div>

              <div className="farmer-order-details">

                <div>
                  <span>{t(language, "location")}</span>
                  <strong>{location}</strong>
                </div>

                <div>
                  <span>{t(language, "orderDate")}</span>
                  <strong>
                    {order.created_at
                      ? new Date(
                          order.created_at
                        ).toLocaleDateString("en-IN")
                      : "—"}
                  </strong>
                </div>

              </div>
              <div className="farmer-order-tracker">

  <div
    className={`tracker-step ${
      order.status
        ? "completed"
        : ""
    }`}
  >
    <span className="tracker-dot">✓</span>
    <div>
      <strong>{t(language, "orderPlaced")}</strong>
      <small>{t(language, "requestAccepted")}</small>
    </div>
  </div>

  <div
    className={`tracker-line ${
      order.status !== "inspection_pending"
        ? "completed"
        : ""
    }`}
  />

  <div
    className={`tracker-step ${
      order.status !== "inspection_pending"
        ? "completed"
        : "current"
    }`}
  >
    <span className="tracker-dot">
      {order.status !== "inspection_pending" ? "✓" : "2"}
    </span>
    <div>
      <strong>{t(language, "retailerReview")}</strong>
      <small>
        {order.status === "inspection_pending"
          ? t(language, "waitingForConfirmation")
          : t(language, "reviewCompleted")}
      </small>
    </div>
  </div>

  <div
    className={`tracker-line ${
      order.status === "confirmed" ||
      order.status === "completed"
        ? "completed"
        : ""
    }`}
  />

  <div
    className={`tracker-step ${
      order.status === "confirmed" ||
      order.status === "completed"
        ? "completed"
        : "upcoming"
    }`}
  >
    <span className="tracker-dot">
      {order.status === "confirmed" ||
      order.status === "completed"
        ? "✓"
        : "3"}
    </span>
    <div>
      <strong>{t(language, "confirmed")}</strong>
      <small>
        {order.status === "confirmed" ||
        order.status === "completed"
          ? t(language, "orderConfirmed")
          : t(language, "awaitingConfirmation")}
      </small>
    </div>
  </div>

  <div
    className={`tracker-line ${
      order.status === "completed"
        ? "completed"
        : ""
    }`}
  />

  <div
    className={`tracker-step ${
      order.status === "completed"
        ? "completed"
        : "upcoming"
    }`}
  >
    <span className="tracker-dot">
      {order.status === "completed" ? "✓" : "4"}
    </span>
    <div>
      <strong>{t(language, "completed")}</strong>
      <small>
        {order.status === "completed"
          ? "Order completed"
          : "Pending"}
      </small>
    </div>
  </div>

</div>

              {order.status === "inspection_pending" && (
                <div className="farmer-order-note">
                  {t(language, "grainImageSubmitted")}
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="farmer-order-note confirmed">
                 {t(language, "retailerHasConfirmedThisOrder")}
                </div>
              )}
              {order.status === "cancelled" && (
  <div className="farmer-order-cancelled-tracker">
    <div className="cancelled-tracker-icon">✕</div>
    <div>
      <strong>{t(language, "orderCancelled")}</strong>
      <span>
       {t(language, "orderCancelledMessage")}
      </span>
    </div>
  </div>
)}

              {order.status === "cancelled" && (
                <div className="farmer-order-note cancelled">
                  {t(language, "orderCancelledNote")}
                </div>
              )}
              <button
  type="button"
  className="farmer-view-order-button"
  onClick={() => setSelectedFarmerOrder(order)}
>
  {t(language, "viewOrderDetails")}
</button>

            </article>
          );
        })}

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
                  <span className="farmer-kicker">{t(language, "newListing")}</span>
                  <h2 id="crop-form-title">{t(language, "addYourProduce")}</h2>
                </div>
                <button className="modal-close" onClick={() => setShowForm(false)}
                  aria-label="Close form"><X /></button>
              </div>

              <form onSubmit={handleAddCrop}>
                <label>{t(language, "cropName")}
                  <input name="crop" value={form.crop} onChange={updateField}
                    placeholder="e.g. Onions" required />
                </label>

                <div className="form-two-columns">
                  <label>{t(language, "quantity")} (kg)
                    <input name="quantity" type="number" min="1" step="any"
                      value={form.quantity} onChange={updateField} required />
                  </label>
                  <label>{t(language, "askingPrice")} (₹/kg)
                    <input name="price" type="number" min="0.01" step="any"
                      value={form.price} onChange={updateField} required />
                  </label>
                </div>

                <label>{t(language, "pickupLocation")}
                  <input name="location" value={form.location} onChange={updateField}
                    placeholder="Village, district, state" required />
                </label>

                <div className="form-two-columns">
                  <label>{t(language, "harvestDate")}
                    <input name="harvestDate" type="date" max={today}
                      value={form.harvestDate} onChange={updateField} required />
                  </label>
                  <label>{t(language, "estimatedTransport")}

                    <input name="transport" type="number" min="0" step="any"
                      value={form.transport} onChange={updateField} required />
                  </label>
                </div>

                {form.quantity && form.price && form.transport !== "" && (
                  <div className="form-estimate">
                    {t(language, "estimatedNetEarnings")}:
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
                    onClick={() => setShowForm(false)}>
                    {t(language, "cancel")}
                  </button>
                  <button type="submit" className="add-crop-button">
                    <Plus size={17} /> {t(language, "saveListing")}
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
   {showGrainInspection && (
  <GrainInspection
    request={selectedInspectionRequest}
    onClose={() => {
      setShowGrainInspection(false);
      setSelectedInspectionRequest(null);
    }}
   onImageReady={async (image) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Your login session has expired. Please log in again.");
      return;
    }

    if (!image) {
      alert("Please upload a grain image first.");
      return;
    }
    // SPECIAL FLOW:
// Farmer is responding to a general retailer requirement.
// Do NOT create an order yet.
// First submit the grain image for retailer review.

if (!selectedInspectionRequest.cropId) {
  const fileExtension = image.name.split(".").pop();

  const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("grain-images")
    .upload(fileName, image, {
      contentType: image.type,
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "Requirement grain image upload error:",
      uploadError
    );

    alert("Could not upload the grain image. Please try again.");
    return;
  }

  const { error: updateError } = await supabase
    .from("purchase_requests")
    .update({
      farmer_id: user.id,
      farmer_response_status: "submitted",
      farmer_grain_image_url: fileName,
    })
    .eq("id", selectedInspectionRequest.id);


  if (updateError) {
    console.error(
      "Requirement response update error:",
      updateError
    );

    await supabase.storage
      .from("grain-images")
      .remove([fileName]);

    alert(
      "The image was uploaded, but your response could not be submitted."
    );

    return;
  }

  setShowGrainInspection(false);
  setSelectedInspectionRequest(null);

  alert(
    "✅ Grain image submitted successfully. Waiting for retailer review."
  );

  return;
}

    // Create a unique file name
    const fileExtension = image.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("grain-images")
      .upload(fileName, image, {
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Grain image upload error:", uploadError);
      alert("Could not upload the grain image. Please try again.");
      return;
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        purchase_request_id: selectedInspectionRequest.id,
        retailer_id: selectedInspectionRequest.retailerId,
        farmer_id: user.id,
        crop_id: row.crop_id,
        status: "inspection_pending",
        grain_image_url: fileName,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);

      // Remove uploaded image if order creation failed
      await supabase.storage
        .from("grain-images")
        .remove([fileName]);

      alert("The image was uploaded, but the order could not be created.");
      return;
    }

    console.log("Order created:", order);
    const { error: requestStatusError } = await supabase
  .from("purchase_requests")
  .update({
    status: "accepted",
  })
  .eq("id", selectedInspectionRequest.id);

if (requestStatusError) {
  console.error(
    "Could not update purchase request status:",
    requestStatusError
  );
}

    setShowGrainInspection(false);
    setSelectedInspectionRequest(null);

    alert(
      "✅Your grain has been submitted for AI analysis successfully."
    );
  } catch (error) {
    console.error("Unexpected grain submission error:", error);

    alert(
      "Something went wrong while submitting the grain for analysis."
    );
  }
}}
  />
)}
{selectedFarmerOrder && (
  <div
    className="farmer-modal-backdrop"
    onClick={() => setSelectedFarmerOrder(null)}
  >
    <section
      className="farmer-modal farmer-order-details-modal"
      role="dialog"
      aria-modal="true"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="modal-heading">
        <div>
          <span className="farmer-kicker">{t(language, "orderDetails")}</span>
          <h2>
            {selectedFarmerOrder.purchase_requests?.requested_crop ||
              "Crop Order"}
          </h2>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setSelectedFarmerOrder(null)}
          aria-label="Close order details"
        >
          <X />
        </button>
      </div>

      {selectedFarmerOrder.signedImageUrl && (
        <img
          src={selectedFarmerOrder.signedImageUrl}
          alt="Grain"
          className="farmer-order-modal-image"
        />
      )}

      <div className="farmer-order-modal-grid">

        <div>
          <span>{t(language, "quantity")}</span>
          <strong>
            {Number(
              selectedFarmerOrder.purchase_requests?.quantity || 0
            ).toLocaleString("en-IN")} kg
          </strong>
        </div>

        <div>
          <span>{t(language, "targetPrice")}</span>
          <strong>
            ₹{Number(
              selectedFarmerOrder.purchase_requests?.target_price || 0
            ).toLocaleString("en-IN")}/kg
          </strong>
        </div>

        <div>
          <span>{t(language, "retailer")}</span>
          <strong>
            {selectedFarmerOrder.purchase_requests?.buyer_name ||
              "Retailer"}
          </strong>
        </div>

        <div>
          <span>{t(language, "location")}</span>
          <strong>
            {selectedFarmerOrder.purchase_requests?.location ||
              "Not specified"}
          </strong>
        </div>

        <div>
          <span>{t(language, "orderDate")}</span>
          <strong>
            {selectedFarmerOrder.created_at
              ? new Date(
                  selectedFarmerOrder.created_at
                ).toLocaleDateString("en-IN")
              : "—"}
          </strong>
        </div>

        <div>
          <span>{t(language, "status")}</span>
          <strong>
            {selectedFarmerOrder.status === "inspection_pending"
              ? "Pending retailer review"
              : selectedFarmerOrder.status === "confirmed"
              ? "Confirmed"
              : selectedFarmerOrder.status === "cancelled"
              ? "Cancelled"
              : selectedFarmerOrder.status === "completed"
              ? "Completed"
              : selectedFarmerOrder.status}
          </strong>
        </div>

      </div>

      {selectedFarmerOrder.purchase_requests?.notes && (
        <div className="farmer-order-modal-notes">
          <span>{t(language, "retailerNotes")}</span>
          <p>
            {selectedFarmerOrder.purchase_requests.notes}
          </p>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => setSelectedFarmerOrder(null)}
        >
          {t(language, "close")}
        </button>
      </div>
    </section>
  </div>
)}
{showRequirementOffer && selectedRequirement && (
  <div
    className="farmer-modal-backdrop"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setShowRequirementOffer(false);
        setSelectedRequirement(null);
      }
    }}
  >
    <section className="farmer-modal">
      <div className="farmer-modal-heading">
        <div>
          <span className="farmer-eyebrow">
            {t(language, "farmerOffer")}
          </span>

          <h2>
            {t(language, "respondTo")} {selectedRequirement.cropName}
          </h2>

          <p>
            {t(language, "submitYourOffer")}
          </p>
        </div>

        <button
          type="button"
          className="farmer-close-btn"
          onClick={() => {


            setShowRequirementOffer(false);
            setSelectedRequirement(null);
          }}
        >
          ×
        </button>
      </div>

      <div className="farmer-requirement-summary">
        <div>
          <span>{t(language, "retailerNeeds")}</span>
          <strong>
            {selectedRequirement.quantity} kg
          </strong>
        </div>

        <div>
          <span>{t(language, "targetPrice")}</span>
          <strong>
            ₹{selectedRequirement.targetPrice}/kg
          </strong>
        </div>

        <div>
          <span>{t(language, "retailerDeadline")}</span>
          <strong>
            {selectedRequirement.deadline
              ? new Date(
                  selectedRequirement.deadline
                ).toLocaleDateString("en-IN")
              : "Not specified"}
          </strong>
        </div>
      </div>

      <div className="farmer-offer-form">

  {/* YOUR OFFER */}
  <div className="offer-section-title">
    <span className="offer-section-number">1</span>
    <div>
      <strong>{t(language, "yourOffer")}</strong>
      <small>{t(language, "enterQuantityPrice")}</small>
    </div>
  </div>

  <div className="offer-input-row">

    <div className="offer-field">
      <label htmlFor="farmer-quantity">
        {t(language, "availableQuantity")}
        <span>kg</span>
      </label>

      <div className="offer-input-wrapper">
        <input
          id="farmer-quantity"
          type="number"
          name="quantity"
          value={offerForm.quantity}
          onChange={updateOfferForm}
          min="1"
          step="1"
          placeholder="e.g. 500"
          required
        />
        <span>kg</span>
      </div>
    </div>

    <div className="offer-field">
      <label htmlFor="farmer-price">
        {t(language, "yourPrice")}
        <span>₹ / kg</span>
      </label>

      <div className="offer-input-wrapper">
        <span className="input-prefix">₹</span>

        <input
          id="farmer-price"
          type="number"
          name="price"
          value={offerForm.price}
          onChange={updateOfferForm}
          min="0.01"
          step="0.01"
          placeholder="e.g. 28"
          required
        />

        <span>/kg</span>
      </div>
    </div>

  </div>


  {/* AVAILABILITY */}
  <div className="offer-section-title offer-section-spacing">
    <span className="offer-section-number">2</span>

    <div>
      <strong>{t(language, "availability")}</strong>
      <small>{t(language, "whenCanYouProvide")}</small>
    </div>
  </div>

  <div className="offer-field">
    <label htmlFor="farmer-deadline">
      {t(language, "availableUntil")}
    </label>

    <div className="offer-date-wrapper">
      <input
        id="farmer-deadline"
        type="date"
        name="deadline"
        value={offerForm.deadline}
        onChange={updateOfferForm}
        min={new Date().toISOString().split("T")[0]}
        required
      />
    </div>
  </div>


  {/* GRAIN PHOTO */}
  <div className="offer-section-title offer-section-spacing">
    <span className="offer-section-number">3</span>

    <div>
      <strong>{t(language, "grainQualityPhoto")}</strong>
      <small>{t(language, "uploadClearPhoto")}</small>
    </div>
  </div>

  <label
    className={`grain-upload-box ${
      offerForm.image ? "has-image" : ""
    }`}
  >

    {!offerForm.image ? (
      <>
        <div className="grain-upload-icon">
          📷
        </div>

        <strong>{t(language, "uploadGrainPhoto")}</strong>

        <span>
         {t(language, "clickHereToChoosePhoto")}
        </span>

        <small>
          {t(language, "jpgPngOrWebpClearPhotoRecommended")}
        </small>
      </>
    ) : (
      <>
        <div className="grain-selected-icon">
          ✓
        </div>

        <strong>
          {t(language, "photoSelected")}
        </strong>

        <span className="grain-file-name">
          {offerForm.image.name}
        </span>

        <small>
          {t(language, "clickToChooseDifferentPhoto")}
        </small>
      </>
    )}

    <input
      type="file"
      name="image"
      accept="image/*"
      onChange={updateOfferForm}
      required={!offerForm.image}
    />

  </label>


  {/* IMAGE PREVIEW */}
  {offerForm.image && (
    <div className="grain-image-preview">

      <div className="grain-preview-heading">
        <span>{t(language, "photoPreview")}</span>

        <span className="grain-preview-check">
          ✓ {t(language, "ready")}
        </span>
      </div>

      <div className="grain-preview-image-container">
        <img
          src={URL.createObjectURL(offerForm.image)}
          alt="Selected grain"
        />
      </div>

    </div>
  )}


  {/* ACTIONS */}
  <div className="farmer-modal-actions">

    <button
      type="button"
      className="farmer-secondary-btn"
      onClick={() => {
        setShowRequirementOffer(false);
        setSelectedRequirement(null);

        setOfferForm({
          quantity: "",
          price: "",
          deadline: "",
          image: null,
        });
      }}
    >
      {t(language, "cancel")}
    </button>

    <button
      type="button"
      className="farmer-primary-btn"
      onClick={async () => {

        try {

          if (!selectedRequirement) {
            alert("No requirement selected.");
            return;
          }

          if (!offerForm.image) {
            alert("Please upload a grain photo.");
            return;
          }

          if (
            !offerForm.quantity ||
            Number(offerForm.quantity) <= 0
          ) {
            alert("Please enter a valid quantity.");
            return;
          }

          if (
            !offerForm.price ||
            Number(offerForm.price) <= 0
          ) {
            alert("Please enter a valid price.");
            return;
          }

          if (!offerForm.deadline) {
            alert("Please select your deadline.");
            return;
          }

          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            alert(
              "Your login session has expired. Please log in again."
            );
            return;
          }

          const image = offerForm.image;

          const fileExtension =
            image.name.split(".").pop() || "jpg";

          const fileName =
            `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;


          /* 1. Upload grain photo */

          const { error: uploadError } =
            await supabase.storage
              .from("grain-images")
              .upload(fileName, image, {
                contentType: image.type,
                upsert: false,
              });

          if (uploadError) {

            console.error(
              "Farmer grain image upload error:",
              uploadError
            );

            alert(
              "Could not upload the grain photo. Please try again."
            );

            return;
          }


          /* 2. Save farmer offer */

          const { error: updateError } =
            await supabase
              .from("purchase_requests")
              .update({
                farmer_id: user.id,
                farmer_quantity:
                  Number(offerForm.quantity),
                farmer_price:
                  Number(offerForm.price),
                farmer_deadline:
                  offerForm.deadline,
                farmer_grain_image_url:
                  fileName,
                farmer_response_status:
                  "submitted",
              })
              .eq(
                "id",
                selectedRequirement.id
              );


          if (updateError) {

            console.error(
              "Farmer offer update error:",
              updateError
            );

            await supabase.storage
              .from("grain-images")
              .remove([fileName]);

            alert(
              "The photo was uploaded, but your offer could not be submitted."
            );

            return;
          }


          /* Update card immediately */

          setRequirementResponseOverrides(
            (previous) => ({
              ...previous,
              [selectedRequirement.id]:
                "submitted",
            })
          );


          /* Close form */

          setShowRequirementOffer(false);
          setSelectedRequirement(null);

          setOfferForm({
            quantity: "",
            price: "",
            deadline: "",
            image: null,
          });


          alert(
          "✅ Your offer has been submitted to the retailer."
          );

        } catch (error) {

          console.error(
            "Unexpected farmer offer submission error:",
            error
          );

          alert(
            "Something went wrong while submitting your offer."
          );
        }

      }}
    >
      {t(language, "submitOffer")}
    </button>

  </div>

</div>
 </section>
  </div>
)}
</div>


  );

} 



export default FarmerDashboard;
     