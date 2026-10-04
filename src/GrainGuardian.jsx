import { useState } from "react";
import { useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Wheat,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import "./GrainGuardian.css";

const grainKeywords = [
  "wheat", "rice", "paddy", "maize", "corn",
  "barley", "millet", "bajra", "jowar",
  "ragi", "oats", "gram", "lentils",
  "pulses", "soybean", "mustard"
];

function analyseCrop(crop) {
  const name = String(crop.name || crop.crop || "").toLowerCase();
  const description = String(crop.description || "").toLowerCase();
  const storage = String(crop.storage || "").toLowerCase();
  const problem = String(crop.problem || "").toLowerCase();

  
  const isGrain = grainKeywords.some((word) =>
    name.includes(word)
  );

  const reasons = [];
  const solutions = [];

  // These are preliminary warning rules, not confirmed diagnoses.
  if (
    /mould|mold|fungus|fungal|damp|moisture|wet|fungus/.test(
      `${description} ${problem} ${storage}`
    )
  ) {
    reasons.push("Possible moisture or mould concern");
    solutions.push(
      "Keep the grain separate from unaffected stock. Check for dampness and visible mould; seek agricultural advice before using affected grain."
    );
  }

  if (/insect|pest|weevil|bug|कीड़े/.test(`${description} ${problem}`)) {
    reasons.push("Possible insect or pest concern");
    solutions.push(
      "Inspect the grain and storage area. Clean the storage area and seek advice on a grain-safe pest-control method."
    );
  }

  if (/rain|flood|leak|बारिश/.test(`${description} ${problem}`)) {
    reasons.push("Possible rain or water exposure");
    solutions.push(
      "Move unaffected grain to a dry, covered location and protect it from leaks and ground moisture."
    );
  }

  if (
    storage.includes("open") ||
    storage.includes("outdoor") ||
    storage.includes("outside")
  ) {
    reasons.push("Storage may be exposed to weather");
    solutions.push(
      "Use a clean, dry, covered storage area and keep bags off the floor."
    );
  }

  if (reasons.length === 0) {
    reasons.push("No specific damage warning in the available data");
    solutions.push(
      "Keep the grain dry, use clean and suitable storage, inspect it regularly, and follow recommended storage conditions for this grain."
    );
  }

  const level =
    reasons.some((reason) =>
      /mould|moisture|water|insect|pest/i.test(reason)
    )
      ? "High"
      : reasons.some((reason) =>
          /exposed/i.test(reason)
        )
        ? "Medium"
        : "Needs monitoring";

  return {
    ...crop,
    displayName: crop.name || crop.crop || "Unnamed crop",
    isGrain,
    level,
    reasons,
    solutions,
  };
}

function GrainGuardian({ crops = [] }) {
  const [grainImage, setGrainImage] = useState(null);
const [imageName, setImageName] = useState("");

const handleImageUpload = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  // Limit image size to 5 MB
  if (file.size > 5 * 1024 * 1024) {
    alert("Please choose an image smaller than 5 MB.");
    event.target.value = "";
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  setGrainImage((previousImage) => {
    if (previousImage) URL.revokeObjectURL(previousImage);
    return imageUrl;
  });

  setImageName(file.name);
};
  const grainAssessments = useMemo(
    () => crops.filter(Boolean).map(analyseCrop).filter((crop) => crop.isGrain),
    [crops]
  );

  const highRisk = grainAssessments.filter(
    (crop) => crop.level === "High"
  ).length;

  const mediumRisk = grainAssessments.filter(
    (crop) => crop.level === "Medium"
  ).length;

  return (
    <div className="grain-guardian">
      <div className="gg-heading">
        <div className="gg-icon">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2>Grain Guardian</h2>
          <p>Check your grain listings and discover ways to protect them.</p>
        </div>
      </div>

      <div className="gg-summary">
        <div className="gg-stat">
          <span>Grain listings</span>
          <strong>{grainAssessments.length}</strong>
        </div>

   
   
        <div className="gg-stat">
          <span>High-risk warnings</span>
          <strong>{highRisk}</strong>
        </div>
        <div className="gg-stat">
          <span>Medium-risk warnings</span>
          <strong>{mediumRisk}</strong>
        </div>
      </div>

      {grainAssessments.length === 0 ? (
        <div className="gg-empty">
          <Wheat size={38} />
          <h3>No grain listings found</h3>
          <p>
            Add a grain such as wheat, rice, maize, millet or pulses
            to your crop listings. Grain Guardian will then assess
            the available details.
          </p>
        </div>
      ) : (

      <div className="gg-dashboard-layout">
         <aside className="gg-upload-column">
   
<section className="gg-upload-section">
  <h3>📸 Upload Your Grain Photo</h3>

  <p>
    Upload a clear picture of your grains to help
    assess possible visible damage.
  </p>

  <label
    htmlFor="grain-photo"
    className="gg-upload-label"
  >
    Upload Grain Photo
  </label>

  <input
    id="grain-photo"
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleImageUpload}
  />

  {grainImage && (
    <div className="gg-image-preview">
      <img
        src={grainImage}
        alt="Uploaded grain sample"
      />

      <p>{imageName}</p>

      <button
        type="button"
        onClick={() => {
          URL.revokeObjectURL(grainImage);
          setGrainImage(null);
          setImageName("");
        }}
      >
        Remove Photo
      </button>
    </div>
  )}
  </section>
  </aside>
  </div>
      )}


  <div className="gg-results-column">
        <div className="gg-results">
          {grainAssessments.map((crop) => (
            <article className="gg-crop-card" key={crop.id}>
              <div className="gg-crop-top">
                <div>
                  <h3>{crop.displayName}</h3>
                  <p>
                    Quantity: {crop.quantity ?? "Not provided"} kg
                  </p>
                </div>

                <span
                  className={`gg-risk gg-risk-${crop.level
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {crop.level === "Needs monitoring"
                    ? "Monitor"
                    : `${crop.level} risk`}
                </span>
              </div>

              <div className="gg-reasons">
                <strong>
                  <AlertTriangle size={17} />
                  Assessment
                </strong>
                {crop.reasons.map((reason, index) => (
                  <p key={index}>{reason}</p>
                ))}
              </div>

              <div className="gg-solutions">
                <strong>
                  <Lightbulb size={17} />
                  Recommended actions
                </strong>
                {crop.solutions.map((solution, index) => (
                  <p key={index}>
                    <CheckCircle2 size={16} />
                    {solution}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
          </div>
  <p className="gg-disclaimer"></p>


      <p className="gg-disclaimer">
        <RefreshCw size={14} />
        Assessments use the information currently available in your
        listings. They are preliminary warnings, not confirmed
        grain-damage diagnoses. Add accurate storage and problem
        details for more useful guidance.
      </p>
    </div>
  );
}

export default GrainGuardian;