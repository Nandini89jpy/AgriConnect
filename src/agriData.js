import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export function useAgriData(user) {
  const [crops, setCrops] = useState([]);
  const [requests, setRequests] = useState([]);

  // Load crops and purchase requests from Supabase
  useEffect(() => {
    if (!user) {
      setCrops([]);
      setRequests([]);
      return;
    }

    const loadData = async () => {
      // -----------------------------
      // LOAD CROPS
      // -----------------------------
      const { data: cropData, error: cropError } = await supabase
        .from("crops")
        .select("*")
        .order("created_at", { ascending: false });

      if (cropError) {
        console.error("Error loading crops:", cropError);
      } else {
        const formattedCrops = (cropData || []).map((row) => ({
          id: row.id,
          crop: row.crop_name,
          name: row.crop_name,
          quantity: Number(row.quantity),
          price: Number(row.price_per_unit),
          transport: Number(row.transport_cost || 0),
          transportCost: Number(row.transport_cost || 0),
          location: row.location || "",
          harvestDate: row.harvest_date || "",
          status: row.status || "available",
          farmer_id: row.farmer_id,
        }));

        setCrops(formattedCrops);
      }

      // -----------------------------
      // LOAD PURCHASE REQUESTS
      // -----------------------------
      const { data: requestData, error: requestError } = await supabase
        .from("purchase_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestError) {
        console.error(
          "Error loading purchase requests:",
          requestError
        );
        return;
      }

      // Convert database request data
      // into the format used by the dashboards
     const formattedRequests = (requestData || []).map((row) => {
  const relatedCrop = (cropData || []).find(
    (crop) => crop.id === row.crop_id
  );

  return {
    id: row.id,

    cropId: row.crop_id,

    // For general requirements use requested_crop.
    // For crop-specific requests use the farmer crop name.
    cropName:
      row.requested_crop ||
      relatedCrop?.crop_name ||
      "Crop requirement",

    quantity: Number(row.quantity),

    targetPrice: Number(row.target_price || 0),

    status:
      row.status === "pending"
        ? "Pending"
        : row.status === "accepted"
        ? "Accepted"
        : row.status === "rejected"
        ? "Rejected"
        : row.status,

    notes: row.notes || "",

    retailerId: row.retailer_id,

    retailerName: row.buyer_name || "Retailer",

    location:
      row.location ||
      relatedCrop?.location ||
      "",

    createdAt: row.created_at,
  };
});
      setRequests(formattedRequests);
    };

    loadData();
  }, [user]);

  // -----------------------------
  // ADD NEW CROP
  // -----------------------------
  const addCrop = async (crop) => {
    if (!user) {
      return {
        error: new Error("No logged-in user"),
      };
    }

    const { data, error } = await supabase
      .from("crops")
      .insert({
        farmer_id: user.id,
        crop_name: crop.crop || crop.name,
        quantity: Number(crop.quantity),
        unit: "kg",
        price_per_unit: Number(crop.price),
        location: crop.location || "",
        harvest_date: crop.harvestDate || null,
        transport_cost: Number(
          crop.transport ?? crop.transportCost ?? 0
        ),
        status: "available",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding crop:", error);
      return { error };
    }

    const newCrop = {
      id: data.id,
      crop: data.crop_name,
      name: data.crop_name,
      quantity: Number(data.quantity),
      price: Number(data.price_per_unit),
      transport: Number(data.transport_cost || 0),
      transportCost: Number(data.transport_cost || 0),
      location: data.location || "",
      harvestDate: data.harvest_date || "",
      status: data.status || "available",
      farmer_id: data.farmer_id,
    };

    setCrops((previous) => [newCrop, ...previous]);

    return {
      data: newCrop,
      error: null,
    };
  };

  // -----------------------------
  // ADD PURCHASE REQUEST
  // -----------------------------
  const addRequest = (request) => {
  setRequests((previous) => [
    {
      ...request,
      status: request.status || "Pending",
    },
    ...previous,
  ]);
};

// Update purchase request status
const updateRequestStatus = async (requestId, newStatus) => {
  const { data, error } = await supabase
    .from("purchase_requests")
    .update({
      status: newStatus,
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("Error updating request status:", error);
    return {
      error,
    };
  }

  const displayStatus =
    data.status === "accepted"
      ? "Accepted"
      : data.status === "rejected"
      ? "Rejected"
      : "Pending";

  setRequests((previous) =>
    previous.map((request) =>
      request.id === requestId
        ? {
            ...request,
            status: displayStatus,
          }
        : request
    )
  );

  return {
    data,
    error: null,
  };
};
  return {
    crops,
    requests,
    addCrop,
    addRequest,
    updateRequestStatus,
  };
};