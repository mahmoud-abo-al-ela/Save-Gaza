import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { donationService, campaignService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const DonationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [donationType, setDonationType] = useState("cash");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      donor_name: "",
      donation_type: "cash",
      amount: "",
      description: "",
      date_received: new Date().toISOString().split("T")[0],
      campaign_id: "",
    },
  });

  // Watch the donation type to update validation
  const currentDonationType = watch("donation_type");

  useEffect(() => {
    setDonationType(currentDonationType);
  }, [currentDonationType]);

  // Load campaigns for dropdown
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const response = await campaignService.getAll({ status: "active" });
        setCampaigns(response.campaigns || []);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        toast.error("Failed to load campaigns");
      }
    };

    loadCampaigns();
  }, []);

  // Load donation data if editing
  useEffect(() => {
    const loadDonation = async () => {
      if (id) {
        try {
          const response = await donationService.getById(id);
          const donation = response.donation; // Extract donation from response

          // Format the date to YYYY-MM-DD for the input
          const formattedDate = donation.date_received
            ? new Date(donation.date_received).toISOString().split("T")[0]
            : "";

          setValue("donor_name", donation.donor_name);
          setValue("donation_type", donation.donation_type);
          setValue("amount", donation.amount);
          setValue("description", donation.description);
          setValue("date_received", formattedDate);
          setValue("campaign_id", donation.campaign_id?._id || "");

          setDonationType(donation.donation_type);
        } catch (error) {
          console.error("Failed to load donation:", error);
          toast.error("Failed to load donation details");
          navigate("/donations");
        }
      }
    };

    loadDonation();
  }, [id, setValue, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // If donation type is goods, ensure there's a description
      if (data.donation_type === "goods" && !data.description) {
        toast.error("Description is required for goods donations");
        return;
      }

      // If donation type is cash, ensure there's an amount
      if (data.donation_type === "cash" && (!data.amount || data.amount <= 0)) {
        toast.error("Amount must be greater than 0 for cash donations");
        return;
      }

      // Prepare the donation data
      const donationData = {
        ...data,
        amount: data.amount ? Number(data.amount) : 0,
        // Only include campaign_id for cash donations
        campaign_id:
          data.donation_type === "cash" ? data.campaign_id : undefined,
      };

      let response;

      if (id) {
        // Update existing donation
        response = await donationService.update(id, donationData);
        toast.success("Donation updated successfully");
      } else {
        // Create new donation
        response = await donationService.create(donationData);
        toast.success("Donation added successfully");
      }

      // Redirect to the donations page
      navigate("/donations");
    } catch (error) {
      console.error("Donation submission error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save donation";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">
        {id ? "Edit Donation" : "Add New Donation"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Donor Name */}
        <div>
          <label className="block text-gray-700 mb-2">
            Donor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("donor_name", { required: "Donor name is required" })}
            className={`w-full p-2 border rounded ${
              errors.donor_name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.donor_name && (
            <p className="mt-1 text-red-500 text-sm">
              {errors.donor_name.message}
            </p>
          )}
        </div>

        {/* Donation Type */}
        <div>
          <label className="block text-gray-700 mb-2">
            Donation Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register("donation_type", {
              required: "Donation type is required",
            })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="cash">Cash</option>
            <option value="goods">Goods/Items</option>
          </select>
        </div>

        {/* Amount (for cash donations) */}
        {donationType === "cash" && (
          <div>
            <label className="block text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register("amount", {
                  required:
                    donationType === "cash"
                      ? "Amount is required for cash donations"
                      : false,
                  min: {
                    value: 0.01,
                    message: "Amount must be greater than 0",
                  },
                })}
                className={`w-full p-2 pl-8 border rounded ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.amount.message}
              </p>
            )}
          </div>
        )}

        {/* Campaign (for cash donations) */}
        {donationType === "cash" && (
          <div>
            <label className="block text-gray-700 mb-2">Campaign</label>
            <select
              {...register("campaign_id")}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">-- Select Campaign (Optional) --</option>
              {campaigns.map((campaign) => (
                <option key={campaign._id} value={campaign._id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description (required for goods) */}
        <div>
          <label className="block text-gray-700 mb-2">
            Description{" "}
            {donationType === "goods" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <textarea
            {...register("description", {
              required:
                donationType === "goods"
                  ? "Description is required for goods donations"
                  : false,
            })}
            rows="3"
            className={`w-full p-2 border rounded ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-red-500 text-sm">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Date Received */}
        <div>
          <label className="block text-gray-700 mb-2">
            Date Received <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("date_received", {
              required: "Date received is required",
            })}
            className={`w-full p-2 border rounded ${
              errors.date_received ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.date_received && (
            <p className="mt-1 text-red-500 text-sm">
              {errors.date_received.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/donations")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : id
              ? "Update Donation"
              : "Save Donation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;
