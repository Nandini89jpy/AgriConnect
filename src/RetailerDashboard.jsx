import { t } from "./translations";
import React, { useMemo, useState , useEffect , useRef} from "react";
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
import { supabase } from "./lib/supabaseClient";

const initialRequest = {
  cropName: "",
  quantity: "",
  targetPrice: "",
  deadline:"",
  location: "Faridabad",
  buyerName: "",
  notes: "",
};

function RetailerDashboard({ 
    onBack ,
    crops ,
    requests ,
    addRequest , 
    user,
    language="en",
 }) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [request, setRequest] = useState(initialRequest);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [orders, setOrders] = useState([]);
const [selectedOrder, setSelectedOrder] = useState(null);
const [showOrderDetails, setShowOrderDetails] = useState(false);
const [currentTime, setCurrentTime] = useState(Date.now());
const notifiedOrdersRef = useRef(new Set());
const [activeBuyingTab, setActiveBuyingTab] = useState(
  "requirements"
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
const [selectedRequirementOffer, setSelectedRequirementOffer] =
  useState(null);
  
const [showRequirementOfferReview, setShowRequirementOfferReview] =
  useState(false);

const [requirementOfferImageUrl, setRequirementOfferImageUrl] =
  useState("");

const [requirementDecisionLoading, setRequirementDecisionLoading] =
  useState(false);

const [requirementResponseOverrides, setRequirementResponseOverrides] =
  useState({});
 

 const openRequirementOfferReview = async (requirement) => {
  try {
    setSelectedRequirementOffer(requirement);
    setRequirementOfferImageUrl("");

    if (requirement.farmerGrainImageUrl) {
      const { data, error } = await supabase.storage
        .from("grain-images")
        .createSignedUrl(
          requirement.farmerGrainImageUrl,
          60 * 60
        );

      if (error) {
        console.error(
          "Error creating grain image URL:",
          error
        );
      } else {
        setRequirementOfferImageUrl(
          data?.signedUrl || ""
        );
      }
    }

    setShowRequirementOfferReview(true);
  } catch (error) {
    console.error(
      "Unexpected offer review error:",
      error
    );

    alert("Could not open the farmer offer.");
  }
};
const rejectRequirementOffer = async () => {
  try {
    if (!selectedRequirementOffer) {
      return;
    }

    setRequirementDecisionLoading(true);

    const { error } = await supabase
      .from("purchase_requests")
      .update({
        farmer_response_status: "rejected",
      })
      .eq("id", selectedRequirementOffer.id)
      .eq("retailer_id", user.id);

    if (error) {
      console.error(
        "Reject farmer offer error:",
        error
      );

      alert(
        "Could not reject the farmer offer. Please try again."
      );

      return;
    }

    setRequirementResponseOverrides((previous) => ({
      ...previous,
      [selectedRequirementOffer.id]: "rejected",
    }));

    setShowRequirementOfferReview(false);
    setSelectedRequirementOffer(null);
    setRequirementOfferImageUrl("");

    alert("Farmer offer rejected.");
  } catch (error) {
    console.error(
      "Unexpected reject error:",
      error
    );

    alert("Something went wrong while rejecting the offer.");
  } finally {
    setRequirementDecisionLoading(false);
  }
};
const confirmRequirementOffer = async () => {
  try {
    if (!selectedRequirementOffer) {
      return;
    }

    setRequirementDecisionLoading(true);

    const { data, error } = await supabase.rpc(
      "confirm_requirement_offer",
      {
        p_request_id: selectedRequirementOffer.id,
      }
    );

    if (error) {
      console.error(
        "Confirm requirement offer error:",
        error
      );

      alert(
        error.message ||
          "Could not confirm this farmer offer."
      );

      return;
    }

    setRequirementResponseOverrides((previous) => ({
      ...previous,
      [selectedRequirementOffer.id]: "accepted",
    }));

    setShowRequirementOfferReview(false);
    setSelectedRequirementOffer(null);
    setRequirementOfferImageUrl("");

    alert(
      "✅ Order confirmed successfully!"
    );

    console.log("Created order:", data);
  } catch (error) {
    console.error(
      "Unexpected confirmation error:",
      error
    );

    alert(
      "Something went wrong while confirming the order."
    );
  } finally {
    setRequirementDecisionLoading(false);
  }
};

const getRemainingTime = (deadline) => {
  if (!deadline) {
    return null;
  }
   const difference =
    new Date(deadline).getTime() - currentTime;

  if (difference <= 0) {
    return {
      expired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(difference / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    hours,
    minutes,
    seconds,
  };
};
 useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, []);
useEffect(() => {
  if (!orders.length) return;

  orders.forEach((order) => {
    if (
      order.status !== "confirmed" ||
      !order.cancellation_deadline
    ) {
      return;
    }

    const deadline = new Date(
      order.cancellation_deadline
    ).getTime();

    if (
      currentTime >= deadline &&
      !notifiedOrdersRef.current.has(order.id)
    ) {
      notifiedOrdersRef.current.add(order.id);

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("AgriConnect – Cancellation Window Expired", {
          body: "The 24-hour cancellation period for your order has expired.",
        });
      }
    }
  });
}, [currentTime, orders]);
const enableOrderNotifications = async () => {
  if (!("Notification" in window)) {
    alert("Browser notifications are not supported on this device.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    alert("✅ Order notifications enabled.");
  } else {
    alert(
      "Notifications are blocked. Please allow notifications in your browser settings."
    );
  }
};
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

  const submitRequest = async (event) => {
  event.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    setSuccessMessage(
      "Your login session has expired. Please log in again."
    );
    return;
  }

  const cropName = request.cropName.trim();
  const quantity = Number(request.quantity);
  const targetPrice = Number(request.targetPrice);
  const deadline = request.deadline;

  // Basic validation
  if (!cropName) {
    setSuccessMessage(t(language, "pleaseEnterCrop"));
    return;
  }

  if (quantity <= 0) {
    setSuccessMessage(t(language, "pleaseEnterValidQuantity"));
    return;
  }

  if (targetPrice <= 0) {
    setSuccessMessage(t(language, "pleaseEnterValidTargetPrice"));
    return;
  }
  if (!deadline) {
  setSuccessMessage(t(language, "pleaseSelectDeadline"));
  return;
}

  const { data, error } = await supabase
    .from("purchase_requests")
    .insert({
      retailer_id: user.id,

      // If retailer selected a farmer's crop,
      // connect the request to that crop.
      // Otherwise this remains null for a general requirement.
      crop_id: selectedCrop?.id || null,

      quantity: quantity,

      target_price: targetPrice,

      deadline: deadline,

      status: "pending",

      notes: request.notes || null,

      requested_crop: cropName,

      buyer_name: request.buyerName || null,

      location: request.location || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Purchase request error:", error);

    setSuccessMessage(
      "Could not post your requirement. Please try again."
    );

    return;
  }

  // Add the request immediately to the dashboard
  // so the retailer sees it without refreshing.
  addRequest({
    id: data.id,
    cropId: data.crop_id,
    cropName: data.requested_crop,
    quantity: Number(data.quantity),
    targetPrice: Number(data.target_price),
    deadline: data.deadline || "",
    status: "Pending",
    retailerId: data.retailer_id,
    retailerName: data.buyer_name,
    location: data.location || "",
    notes: data.notes || "",
  });

  setShowRequestForm(false);

  setSuccessMessage(
    `Your requirement for ${quantity} kg of ${cropName} has been posted for farmers.`
  );

  setRequest(initialRequest);
  setSelectedCrop(null);
};
const totalAvailable = crops.reduce(
  (total, crop) => total + crop.quantity,
  0
);
useEffect(() => {
  const loadOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
      .eq("retailer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
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

    setOrders(ordersWithImages);
  };

  loadOrders();
}, []);
  return (
    <div className="retailer-dashboard">
      
<header className="retailer-header">
  <div className="retailer-brand">
    <span className="retailer-logo-icon">
      <Sprout size={27} />
    </span>

    <div className="retailer-brand-text">
      <h2>{t(language, "agriconnect")}</h2>
      <span>{t(language, "retailerPortal")}</span>
    </div>
  </div>

  <div className="retailer-header-actions">
  <button
    type="button"
    className="retailer-logout-btn"
    onClick={onBack}
  >
    <LogOut size={17} />
    <span>{t(language, "logout")}</span>
  </button>
</div>
</header>

      <main className="retailer-main">
        <section className="retailer-welcome">
          <div>
            <span className="retailer-eyebrow">{t(language, "buyFreshBuyDirect")}</span>
            <h1>{t(language, "findFreshProduce")}</h1>
            <p>
             {t(language, "discoverCrops")} Discover crops from local farmers, {t(language, "comparePrices")} {t(language, "andTellfarmers")} {t(language, "whatyourBusinessNeeds")}.
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
              <p>{t(language, "availableListings")}</p>
              <h2>{crops.length}</h2>
            </div>
          </div>

          <div className="retailer-stat-card">
            <span className="retailer-stat-icon">
              <Leaf size={21} />
            </span>
            <div>
              <p>{t(language, "totalProduceAvailable")}</p>
              <h2>{totalAvailable.toLocaleString("en-IN")} kg</h2>
            </div>
          </div>

          <div className="retailer-stat-card">
            <span className="retailer-stat-icon">
              <ShoppingBasket size={21} />
            </span>
            <div>
              <p>{t(language, "myRequirements")}</p>
              <h2>{requests.length}</h2>
            </div>
          </div>
        </section>

        <section className="retailer-listings">
          <div className="retailer-section-heading">
            <div>
              <span className="retailer-eyebrow">{t(language, "farmerMarketplace")}</span>
              <h2>{t(language, "availableCrops")}</h2>
              <p>{t(language, "compareLocalProduce")}</p>
            </div>

            <button
              className="retailer-outline-btn"
              onClick={() => openRequestForm()}
            >
              {t(language, "postARequirement")}
            </button>
          </div>

          <div className="retailer-filters">
            <label className="retailer-search">
              <Search size={19} />
              <input
                type="search"
                placeholder={t(language, "searchCropFarmerLocation")}
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
              <option value="recommended">{t(language, "recommendedOrder")}</option>
              <option value="price-low">{t(language, "priceLowToHigh")}</option>
              <option value="price-high">{t(language, "priceHighToLow")}</option>
              <option value="quantity">{t(language, "largestQuantity")}</option>
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
                      {t(language, "available")}
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
                    {t(language, "sendBuyingRequest")}
                    <Send size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="retailer-empty">
              <Search size={35} />
              <h3>{t(language, "noCropsFound")}</h3>
              <p>{t(language, "tryAnotherCropName")}</p>
              <button
                className="retailer-outline-btn"
                onClick={() => {
                  setSearch("");
                  setLocationFilter("All Locations");
                }}
              >
                {t(language, "clearFilters")}
              </button>
            </div>
          )}
        </section>

        <section className="retailer-my-requests">
          <div className="retailer-section-heading">
            <div>
              <span className="retailer-eyebrow">{t(language, "yourActivity")}</span>
              <h2>{t(language, "myBuyingRequirements")}</h2>
 <p>{t(language, "requirementsSubmittedThisSession")}</p>
 </div>
 </div>
              <div className="buying-tabs">
  <button
    type="button"
    className={
      activeBuyingTab === "requirements"
        ? "buying-tab active"
        : "buying-tab"
    }
    onClick={() =>
      setActiveBuyingTab("requirements")
    }
  >
    {t(language, "requirements")}
  </button>

  <button
    type="button"
    className={
      activeBuyingTab === "orders"
        ? "buying-tab active"
        : "buying-tab"
    }
    onClick={() =>
      setActiveBuyingTab("orders")
    }
  >
    {t(language, "myOrders")}
  </button>
</div>

{activeBuyingTab === "requirements" && (
  <>
          {requests.length === 0 ? (
            <div className="retailer-empty retailer-empty-small">
              <ShoppingBasket size={29} />
              <p>{t(language, "noRequirementsSubmitted")}</p>
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
                    <small>{t(language, "quantityNeeded")}</small>
                    <strong>{item.quantity} kg</strong>
                  </div>
                  <div>
                    <small>{t(language, "targetPrice")}</small>
                    <strong>₹{item.targetPrice}/kg</strong>
                  </div>
                  <div>
  <small>{t(language, "deadline")}</small>
  <strong>
    {item.deadline
      ? new Date(item.deadline).toLocaleDateString("en-IN")
      : "Not specified"}
  </strong>
</div>
                  <span className="retailer-request-status">
                    {item.status}
                  </span>
                  {(
  requirementResponseOverrides[item.id] ??
  item.farmerResponseStatus
) === "submitted" && (
  <div className="farmer-offer-alert">
    <div>
      <strong>🌾 {t(language, "farmerOfferReceived")}</strong>
      <p>
        {t(language, "farmerHasSubmittedOffer")}
      </p>
    </div>

    <button
      type="button"
      className="demand-accept-btn"
      onClick={() => openRequirementOfferReview(item)}
    >
      {t(language, "viewFarmerOffer")}
    </button>
  </div>
)}


                </div>
              ))}
            </div>
          )}
          </>
        
)}
  </section>
      {/* MY ORDERS */}
      {activeBuyingTab === "orders" &&(
      <section className="retailer-orders-section">
        <div className="section-heading">
          <div>
            <span>{t(language, "orderManagement")}</span>
            <h2>{t(language, "myOrders")}</h2>
            <p>{t(language, "viewOrdersSubmittedByFarmers")}</p>

<button
  type="button"
  className="enable-order-notifications"
  onClick={enableOrderNotifications}
>
  🔔 {t(language, "enableOrderNotifications")}
</button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <p>No orders available yet.</p>
          </div>
        ) : (
          <div className="retailer-orders-grid">
            {orders.map((order) => {
              const request = order.purchase_requests;

              return (
                <article
                  className="retailer-order-card"
                  key={order.id}
                >
                  <div className="retailer-order-card-top">
                    <div>
                      <span>ORDER STATUS</span>

                      <strong>
                        {order.status === "inspection_pending"
                          ? "Pending Review"
                          : order.status === "confirmed"
                          ? "Confirmed"
                          : order.status === "cancelled"
                          ? "Cancelled"
                          : order.status}
                      </strong>
                    </div>
                  </div>

                  <div className="retailer-order-info">
                    <div>
                      <span>Crop</span>
                      <strong>
                        {request?.requested_crop || "Crop"}
                      </strong>
                    </div>

                    <div>
                      <span>{t(language, "quantity")}</span>
                      <strong>
                        {Number(
                          request?.quantity || 0
                        ).toLocaleString("en-IN")}{" "}
                        kg
                      </strong>
                    </div>

                    <div>
                      <span>{t(language, "targetPrice")}</span>
                      <strong>
                        ₹
                        {Number(
                          request?.target_price || 0
                        ).toLocaleString("en-IN")}
                        /kg
                      </strong>
                    </div>
                  </div>

                  {order.signedImageUrl && (
                    <img
                      src={order.signedImageUrl}
                      alt="Grain sample"
                      className="retailer-order-image"
                    />
                  )}

                  {order.status === "inspection_pending" && (
                    <button
                      type="button"
                      className="review-ai-button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                    >
                      {t(language, "viewOrder")}
                    </button>
                  )}

                 {order.status === "confirmed" && (
  <div className="confirmed-order-area">
    <div className="order-confirmed-label">
      ✓ {t(language, "orderConfirmed")}
    </div>

    {(() => {
      const remaining = getRemainingTime(
        order.cancellation_deadline
      );

      if (!remaining || remaining.expired) {
        return (
          <div className="cancellation-expired">
            {t(language, "cancellationWindowExpired")}
          </div>
        );
      }

      return (
        <>
          <div className="cancellation-timer">
            <span className="timer-label">
              {t(language, "cancellationAvailableFor")}
            </span>

            <div className="timer-value">
              <div>
                <strong>
                  {String(remaining.hours).padStart(2, "0")}
                </strong>
                <small>HRS</small>
              </div>

              <span>:</span>

              <div>
                <strong>
                  {String(remaining.minutes).padStart(2, "0")}
                </strong>
                <small>MIN</small>
              </div>

              <span>:</span>

              <div>
                <strong>
                  {String(remaining.seconds).padStart(2, "0")}
                </strong>
                <small>SEC</small>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="cancel-order-button"
            onClick={async () => {
              const confirmed = window.confirm(
                "Are you sure you want to cancel this order?"
              );

              if (!confirmed) return;

              const { data, error } = await supabase.rpc(
                "cancel_order",
                {
                  p_order_id: order.id,
                }
              );

              if (error) {
                console.error(
                  "Order cancellation error:",
                  error
                );

                alert(
                  error.message ||
                    "Could not cancel the order."
                );

                return;
              }

              setOrders((previous) =>
                previous.map((item) =>
                  item.id === order.id
                    ? { ...item, ...data }
                    : item
                )
              );

              alert("✅ Order cancelled successfully.");
            }}
          >
            {t(language, "cancelOrder")}
          </button>
        </>
      );
    })()}
  </div>
)}

                  {order.status === "cancelled" && (
                    <div className="order-pending-label">
                      Order cancelled
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      )}

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
                <span className="retailer-eyebrow">{t(language, "buyerRequirement")}</span>
                <h2 id="retailer-modal-title">{t(language,"Whatdoyouneed?")}</h2>
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
  Requirement deadline
  <input
    type="date"
    name="deadline"
    value={request.deadline}
    onChange={updateRequest}
    min={new Date().toISOString().split("T")[0]}
    required
  />
</label>

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
      {showOrderDetails && selectedOrder && (
  <div
    className="retailer-modal-backdrop"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setShowOrderDetails(false);
        setSelectedOrder(null);
      }
    }}
  >
    <section
      className="retailer-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="retailer-modal-heading">
        <div>
          <span>{t(language, "orderDetails")}</span>
          <h2>{t(language, "reviewYourOrder")}</h2>
          <p>
            {t(language, "checkOrderDetailsBeforeConfirming")}
          </p>
        </div>

        <button
          type="button"
          className="retailer-close-btn"
          onClick={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
          aria-label="Close order details"
        >
          ×
        </button>
      </div>

      <div className="retailer-order-detail-card">
        <div className="retailer-order-detail-row">
          <span>{t(language, "status")}</span>
          <strong>
            {selectedOrder.status === "inspection_pending"
              ? t(language, "pendingReview")
              : selectedOrder.status}
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>{t(language, "crop")}</span>
          <strong>
            {selectedOrder.purchase_requests?.requested_crop ||
              "Crop"}
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>{t(language, "quantity")}</span>
          <strong>
            {Number(
              selectedOrder.purchase_requests?.quantity || 0
            ).toLocaleString("en-IN")}{" "}
            kg
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>{t(language, "targetPrice")}</span>
          <strong>
            ₹
            {Number(
              selectedOrder.purchase_requests?.target_price || 0
            ).toLocaleString("en-IN")}
            /kg
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>{t(language, "location")}</span>
          <strong>
            {selectedOrder.purchase_requests?.location ||
              "Not provided"}
          </strong>
        </div>

        {selectedOrder.purchase_requests?.notes && (
          <div className="retailer-order-detail-notes">
            <span>{t(language, "notes")}</span>
            <p>
              {selectedOrder.purchase_requests.notes}
            </p>
          </div>
        )}
      </div>

      {selectedOrder.signedImageUrl && (
        <div className="retailer-order-detail-image">
          <span>{t(language, "grainSample")}</span>

          <img
            src={selectedOrder.signedImageUrl}
            alt="Grain sample"
          />
        </div>
      )}

      <div className="order-ai-skipped-note">
        <strong>{t(language, "aiAnalysisSkipped")}</strong>
        <p>
          {t(language, "grainImageSubmitted")}
          {t(language, "aiQualityAnalysisLater")}
        </p>
      </div>

      <div className="retailer-order-actions">
        <button
          type="button"
          className="review-close-button"
          onClick={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        >
          Review Later
        </button>

        <button
          type="button"
          className="confirm-order-button"
          onClick={async () => {
            const { data, error } = await supabase.rpc(
              "confirm_order",
              {
                p_order_id: selectedOrder.id,
              }
            );

            if (error) {
              console.error(
                "Order confirmation error:",
                error
              );

              alert(
                error.message ||
                  "Could not confirm the order."
              );

              return;
            }

            setOrders((previous) =>
              previous.map((order) =>
                order.id === selectedOrder.id
                  ? {
                      ...order,
                      ...data,
                    }
                  : order
              )
            );

            setShowOrderDetails(false);
            setSelectedOrder(null);

            alert(
              "✅ Order confirmed successfully! You can cancel this order within 24 hours."
            );
          }}
        >
          Confirm Order
        </button>
      </div>
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
{showRequirementOfferReview &&
  selectedRequirementOffer && (
    <div
      className="farmer-offer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setShowRequirementOfferReview(false);
          setSelectedRequirementOffer(null);
          setRequirementOfferImageUrl("");
        }
      }}
    >
      <section
        className="farmer-offer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="farmer-offer-title"
      >
        {/* HEADER */}
        <div className="farmer-offer-modal-header">
          <div className="farmer-offer-title-area">
            <div className="farmer-offer-title-icon">
              🌾
            </div>

            <div>
              <span className="farmer-offer-eyebrow">
               {t(language, "farmerResponse")}
              </span>

              <h2 id="farmer-offer-title">
                {t(language, "farmerOffer")}
              </h2>

              <p>
                {t(language, "reviewFarmersOffer")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="farmer-offer-close"
            onClick={() => {
              setShowRequirementOfferReview(false);
              setSelectedRequirementOffer(null);
              setRequirementOfferImageUrl("");
            }}
            aria-label="Close farmer offer"
          >
            <X size={20} />
          </button>
        </div>

        {/* CROP SUMMARY */}
        <div className="farmer-offer-crop-banner">
          <div>
            <span>{t(language, "cropRequested")}</span>
            <strong>
              {selectedRequirementOffer.cropName || "Crop"}
            </strong>
          </div>

          <div className="farmer-offer-location">
            <MapPin size={16} />
            <span>
              {selectedRequirementOffer.location ||
                "Location not provided"}
            </span>
          </div>
        </div>

        {/* GRAIN PHOTO */}
        <div className="farmer-offer-photo-section">
          <div className="farmer-offer-section-heading">
            <div>
              <span>{t(language, "grainSample")}</span>
              <h3>{t(language, "farmersGrainPhoto")}</h3>
            </div>
          </div>

          {requirementOfferImageUrl ? (
            <div className="farmer-offer-photo-container">
              <img
                src={requirementOfferImageUrl}
                alt={t(language, "farmersGrainPhoto")}
                className="farmer-offer-grain-image"
              />
            </div>
          ) : (
            <div className="farmer-offer-no-photo">
              <Leaf size={32} />
              <span>{t(language, "noGrainPhoto")}</span>
            </div>
          )}
        </div>

        {/* FARMER OFFER */}
        <div className="farmer-offer-section">
          <div className="farmer-offer-section-heading">
            <div>
              <span>{t(language, "farmersOffer")}</span>
              <h3>{t(language, "whatFarmerIsOffering")}</h3>
            </div>

            <span className="farmer-offer-status-badge">
              {t(language, "offerReceived")}
            </span>
          </div>

          <div className="farmer-offer-details-grid">
            <div className="farmer-offer-detail-card">
              <div className="farmer-offer-detail-icon">
                <Package size={19} />
              </div>

              <div>
                <span>{t(language, "availableQuantity")}</span>
                <strong>
                  {selectedRequirementOffer.farmerQuantity
                    ? `${selectedRequirementOffer.farmerQuantity} kg`
                    : "Not specified"}
                </strong>
              </div>
            </div>

            <div className="farmer-offer-detail-card">
              <div className="farmer-offer-detail-icon">
                <IndianRupee size={19} />
              </div>

              <div>
                <span>{t(language, "farmerPrice")}</span>
                <strong>
                  {selectedRequirementOffer.farmerPrice
                    ? `₹${selectedRequirementOffer.farmerPrice}/kg`
                    : "Not specified"}
                </strong>
              </div>
            </div>

            <div className="farmer-offer-detail-card">
              <div className="farmer-offer-detail-icon">
                <Clock size={19} />
              </div>

              <div>
                <span>{t(language, "availableUntil")}</span>
                <strong>
                  {selectedRequirementOffer.farmerDeadline
                    ? new Date(
                        selectedRequirementOffer.farmerDeadline
                      ).toLocaleDateString("en-IN")
                    : "Not specified"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* REQUIREMENT COMPARISON */}
        <div className="farmer-offer-section">
          <div className="farmer-offer-section-heading">
            <div>
              <span>{t(language, "yourRequirement")}</span>
              <h3>{t(language, "compareWithYourRequest")}</h3>
            </div>
          </div>

          <div className="farmer-offer-comparison">
            <div className="comparison-row comparison-header">
              <span>{t(language, "details")}</span>
              <span>{t(language, "yourRequirement")}</span>
              <span>{t(language, "farmerOffer")}</span>
            </div>

            <div className="comparison-row">
              <span>{t(language, "quantity")}</span>

              <strong>
                {selectedRequirementOffer.quantity || 0} kg
              </strong>

              <strong>
                {selectedRequirementOffer.farmerQuantity || 0} kg
              </strong>
            </div>

            <div className="comparison-row">
              <span>Price</span>

              <strong>
                ₹{selectedRequirementOffer.targetPrice || 0}/kg
              </strong>

              <strong className="farmer-price-highlight">
                ₹{selectedRequirementOffer.farmerPrice || 0}/kg
              </strong>
            </div>

            <div className="comparison-row">
              <span>{t(language, "deadline")}</span>

              <strong>
                {selectedRequirementOffer.deadline
                  ? new Date(
                      selectedRequirementOffer.deadline
                    ).toLocaleDateString("en-IN")
                  : "Not specified"}
              </strong>

              <strong>
                {selectedRequirementOffer.farmerDeadline
                  ? new Date(
                      selectedRequirementOffer.farmerDeadline
                    ).toLocaleDateString("en-IN")
                  : "Not specified"}
              </strong>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {selectedRequirementOffer.notes && (
          <div className="farmer-offer-notes">
            <div className="farmer-offer-notes-icon">
              <Send size={16} />
            </div>

            <div>
              <span>Farmer's Note</span>
              <p>
                {selectedRequirementOffer.notes}
              </p>
            </div>
          </div>
        )}

        {/* CONFIRMATION MESSAGE */}
        <div className="farmer-offer-confirmation">
          <div className="farmer-offer-confirmation-icon">
            <CheckCircle size={22} />
          </div>

          <div>
            <strong>
              {t(language, "readyToConfirmOffer")}
            </strong>

            <p>
              {t(language, "confirmingWillCreateOrder")}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="farmer-offer-actions">
          <button
            type="button"
            className="farmer-offer-reject-btn"
            onClick={rejectRequirementOffer}
            disabled={requirementDecisionLoading}
          >
            <X size={17} />

            {requirementDecisionLoading
              ? "Processing..."
              : "Reject Offer"}
          </button>

          <button
            type="button"
            className="farmer-offer-confirm-btn"
            onClick={confirmRequirementOffer}
            disabled={requirementDecisionLoading}
          >
            <CheckCircle size={17} />

            {requirementDecisionLoading
              ? "Processing..."
              : "Confirm Order"}
          </button>
        </div>

        <p className="farmer-offer-footer-note">
          {t(language, "footerNote")}
        </p>
      </section>
    </div>
  )}
    </div>
  );
}

export default RetailerDashboard;