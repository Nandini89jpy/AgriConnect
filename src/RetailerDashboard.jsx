
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
  const [orders, setOrders] = useState([]);
const [selectedOrder, setSelectedOrder] = useState(null);
const [showOrderDetails, setShowOrderDetails] = useState(false);
const [currentTime, setCurrentTime] = useState(Date.now());
const notifiedOrdersRef = useRef(new Set());
const [activeBuyingTab, setActiveBuyingTab] = useState(
  "requirements"
);

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

  // Basic validation
  if (!cropName) {
    setSuccessMessage("Please enter the crop you need.");
    return;
  }

  if (quantity <= 0) {
    setSuccessMessage("Please enter a valid quantity.");
    return;
  }

  if (targetPrice <= 0) {
    setSuccessMessage("Please enter a valid target price.");
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
        const handleCancelOrder = async (orderId) => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this order?"
  );

  if (!confirmed) {
    return;
  }

  const { data, error } = await supabase.rpc(
    "cancel_order",
    {
      p_order_id: orderId,
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
    previous.map((order) =>
      order.id === orderId
        ? {
            ...order,
            ...data,
          }
        : order
    )
  );

  alert("✅ Order cancelled successfully.");
};

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
    Requirements
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
    My Orders
  </button>
</div>

{activeBuyingTab === "requirements" && (
  <>
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
          </>
        
)}
  </section>
      {/* MY ORDERS */}
      {activeBuyingTab === "orders" &&(
      <section className="retailer-orders-section">
        <div className="section-heading">
          <div>
            <span>ORDER MANAGEMENT</span>
            <h2>My Orders</h2>
            <p>View orders submitted by farmers and confirm your purchases.</p>

<button
  type="button"
  className="enable-order-notifications"
  onClick={enableOrderNotifications}
>
  🔔 Enable Order Notifications
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
                      <span>Quantity</span>
                      <strong>
                        {Number(
                          request?.quantity || 0
                        ).toLocaleString("en-IN")}{" "}
                        kg
                      </strong>
                    </div>

                    <div>
                      <span>Target Price</span>
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
                      View Order
                    </button>
                  )}

                 {order.status === "confirmed" && (
  <div className="confirmed-order-area">
    <div className="order-confirmed-label">
      ✓ Order confirmed
    </div>

    {(() => {
      const remaining = getRemainingTime(
        order.cancellation_deadline
      );

      if (!remaining || remaining.expired) {
        return (
          <div className="cancellation-expired">
            Cancellation window expired
          </div>
        );
      }

      return (
        <>
          <div className="cancellation-timer">
            <span className="timer-label">
              Cancellation available for
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
            Cancel Order
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
          <span>ORDER DETAILS</span>
          <h2>Review Your Order</h2>
          <p>
            Check the order details before confirming your purchase.
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
          <span>Status</span>
          <strong>
            {selectedOrder.status === "inspection_pending"
              ? "Pending Review"
              : selectedOrder.status}
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>Crop</span>
          <strong>
            {selectedOrder.purchase_requests?.requested_crop ||
              "Crop"}
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>Quantity</span>
          <strong>
            {Number(
              selectedOrder.purchase_requests?.quantity || 0
            ).toLocaleString("en-IN")}{" "}
            kg
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>Target Price</span>
          <strong>
            ₹
            {Number(
              selectedOrder.purchase_requests?.target_price || 0
            ).toLocaleString("en-IN")}
            /kg
          </strong>
        </div>

        <div className="retailer-order-detail-row">
          <span>Location</span>
          <strong>
            {selectedOrder.purchase_requests?.location ||
              "Not provided"}
          </strong>
        </div>

        {selectedOrder.purchase_requests?.notes && (
          <div className="retailer-order-detail-notes">
            <span>Notes</span>
            <p>
              {selectedOrder.purchase_requests.notes}
            </p>
          </div>
        )}
      </div>

      {selectedOrder.signedImageUrl && (
        <div className="retailer-order-detail-image">
          <span>Grain Sample</span>

          <img
            src={selectedOrder.signedImageUrl}
            alt="Grain sample"
          />
        </div>
      )}

      <div className="order-ai-skipped-note">
        <strong>AI analysis skipped for now</strong>
        <p>
          The grain image has been submitted successfully.
          AI quality analysis will be added later.
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
    </div>
  );
}

export default RetailerDashboard;