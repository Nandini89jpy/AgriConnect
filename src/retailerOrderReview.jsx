import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  ShoppingCart,
} from "lucide-react";
import "./RetailerOrderReview.css";

function RetailerOrderReview({
  order,
  onClose,
  onConfirm,
}) {
  if (!order) {
    return null;
  }

  const report = order.ai_report || {};
  const assessment =
    order.ai_assessment ||
    report.assessment ||
    "AI analysis is not available yet.";

  const recommendation =
    report.recommendation ||
    "Inspect before buying";

  const getRecommendationClass = () => {
    if (
      recommendation.toLowerCase().includes("consider")
    ) {
      return "recommend-buy";
    }

    if (
      recommendation.toLowerCase().includes("avoid")
    ) {
      return "recommend-avoid";
    }

    return "recommend-inspect";
  };

  return (
    <div className="retailer-review-overlay">
      <section className="retailer-review-modal">

        <button
          type="button"
          className="retailer-review-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="retailer-review-header">
          <div className="retailer-review-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <span>AI QUALITY CHECK</span>

            <h2>Grain Quality Report</h2>

            <p>
              Review the AI-assisted visual assessment
              before confirming your order.
            </p>
          </div>
        </div>

        <div className="retailer-review-image">
          {order.grain_image_url ? (
            <img
              src={order.grain_image_url}
              alt="Grain sample"
            />
          ) : (
            <div className="no-grain-image">
              Grain image unavailable
            </div>
          )}
        </div>

        <div className="retailer-order-summary">

          <div>
            <span>Crop</span>
            <strong>
              {order.crop_name || "Grain"}
            </strong>
          </div>

          <div>
            <span>Quantity</span>
            <strong>
              {Number(
                order.quantity || 0
              ).toLocaleString("en-IN")} kg
            </strong>
          </div>

          <div>
            <span>Target price</span>
            <strong>
              ₹
              {Number(
                order.target_price || 0
              ).toLocaleString("en-IN")}
              /kg
            </strong>
          </div>

        </div>

        <div
          className={`ai-recommendation ${getRecommendationClass()}`}
        >
          {recommendation
            .toLowerCase()
            .includes("consider") ? (
            <CheckCircle2 size={22} />
          ) : recommendation
              .toLowerCase()
              .includes("avoid") ? (
            <AlertTriangle size={22} />
          ) : (
            <AlertTriangle size={22} />
          )}

          <div>
            <span>AI Recommendation</span>
            <strong>{recommendation}</strong>
          </div>
        </div>

        <div className="ai-assessment-box">
          <h3>Visual Assessment</h3>

          <p>{assessment}</p>
        </div>

        <div className="ai-disclaimer">
          <AlertTriangle size={17} />

          <p>
            This AI assessment is based only on visible
            characteristics in the uploaded image. It is
            not a laboratory food-safety test or
            certification.
          </p>
        </div>

        <div className="retailer-review-actions">

          <button
            type="button"
            className="review-close-button"
            onClick={onClose}
          >
            Review Later
          </button>

          <button
            type="button"
            className="confirm-order-button"
            onClick={onConfirm}
          >
            <ShoppingCart size={18} />
            Confirm Order
          </button>

        </div>

      </section>
    </div>
  );
}

export default RetailerOrderReview;