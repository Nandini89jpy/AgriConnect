import { useState } from "react";
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import "./GrainInspection.css";

function GrainInspection({
  request,
  onClose,
  onImageReady,
}) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10 MB.");
      return;
    }

    setImage(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");
  };

  const handleContinue = () => {
    if (!image) {
      alert("Please upload a grain image first.");
      return;
    }

    onImageReady(image);
  };

  return (
    <div className="grain-inspection-overlay">

      <section className="grain-inspection-modal">

        <button
          type="button"
          className="grain-inspection-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={21} />
        </button>

        <div className="grain-inspection-header">

          <div className="grain-inspection-icon">
            <Camera size={24} />
          </div>

          <div>
            <span>QUALITY CHECK</span>

            <h2>
              Upload Grain Image
            </h2>

            <p>
              Upload a clear image so the grain condition
              can be assessed before the retailer confirms
              the order.
            </p>
          </div>

        </div>

        <div className="grain-request-summary">

          <div>
            <span>Crop</span>
            <strong>
              {request?.cropName || "Crop"}
            </strong>
          </div>

          <div>
            <span>Quantity</span>
            <strong>
              {Number(request?.quantity || 0).toLocaleString("en-IN")} kg
            </strong>
          </div>

          <div>
            <span>Target price</span>
            <strong>
              ₹{Number(request?.targetPrice || 0).toLocaleString("en-IN")}/kg
            </strong>
          </div>

        </div>

        {!preview ? (

          <label className="grain-upload-area">

            <Upload size={30} />

            <strong>
              Upload grain image
            </strong>

            <span>
              JPG, JPEG or PNG • Maximum 10 MB
            </span>

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
            />

          </label>

        ) : (

          <div className="grain-preview-container">

            <img
              src={preview}
              alt="Uploaded grain"
              className="grain-preview"
            />

            <button
              type="button"
              className="grain-remove-image"
              onClick={removeImage}
            >
              <X size={16} />
              Remove image
            </button>

          </div>

        )}

        <div className="grain-inspection-note">
          <CheckCircle2 size={17} />

          <p>
            Upload a clear, well-lit image showing the grains
            closely. The AI assessment will be used as a
            supporting quality check and not as a laboratory
            food-safety test.
          </p>
        </div>

        <div className="grain-inspection-actions">

          <button
            type="button"
            className="grain-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="grain-continue-button"
            onClick={handleContinue}
          >
            Continue to AI Analysis
          </button>

        </div>

      </section>

    </div>
  );
}

export default GrainInspection;