
import { useState } from "react";

const initialCrops = [
  {
    id: 1,
    name: "Tomatoes",
    category: "Vegetables",
    quantity: 500,
    price: 24,
    transportCost: 1200,
    location: "Faridabad",
    farmer: "Rajesh Kumar",
    harvestDate: "2026-10-04",
    description: "Fresh, ripe tomatoes available for wholesale.",
  },
  {
    id: 2,
    name: "Potatoes",
    category: "Vegetables",
    quantity: 800,
    price: 18,
    transportCost: 1600,
    location: "Palwal",
    farmer: "Suresh Singh",
    harvestDate: "2026-10-05",
    description: "Good-quality potatoes available in bulk.",
  },
  {
    id: 3,
    name: "Spinach",
    category: "Leafy Greens",
    quantity: 100,
    price: 15,
    transportCost: 400,
    location: "Ballabhgarh",
    farmer: "Anita Devi",
    harvestDate: "2026-10-03",
    description: "Fresh green spinach.",
  },
];

export function useAgriData() {
  const [crops, setCrops] = useState(initialCrops);
  const [requests, setRequests] = useState([]);

 const addCrop = (crop) => {
  setCrops((previous) => [
    ...previous,
    {
      ...crop,
      id: Date.now(),
      crop: crop.crop || crop.name,
      name: crop.name || crop.crop,
      transport: Number(crop.transport ?? crop.transportCost ?? 0),
      transportCost: Number(crop.transportCost ?? crop.transport ?? 0),
    },
  ]);
};

  const addRequest = (request) => {
    setRequests((previous) => [
      ...previous,
      {
        ...request,
        id: Date.now(),
        status: "Pending",
      },
    ]);
  };

  return {
    crops,
    requests,
    addCrop,
    addRequest,
  };
}