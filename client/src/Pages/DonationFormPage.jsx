import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { donationService, campaignService } from "../services/api";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  GiftIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../Components/common/LoadingSpinner";

const DonationFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [campaigns, setCampaigns] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [donationType, setDonationType] = useState("cash");
  const [animating, setAnimating] = useState(false);

  const formSteps = [
    { id: 1, name: "Type", description: "Select donation type" },
    { id: 2, name: "Details", description: "Enter donation details" },
    { id: 3, name: "Review", description: "Review and submit" },
  ];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      donor_name: "",
      donation_type: "cash",
      amount: "",
      description: "",
      date_received: new Date().toISOString().split("T")[0],
      campaign_id: "",
    },
    mode: "onChange",
  });

  // Watch form values for real-time validation and UI updates
  const watchDonationType = watch("donation_type");
  const watchAmount = watch("amount");
  const watchDonorName = watch("donor_name");
  const watchDescription = watch("description");
  const watchCampaign = watch("campaign_id");
  const watchDate = watch("date_received");

  // Update donation type when it changes in the form
  useEffect(() => {
    setDonationType(watchDonationType);
  }, [watchDonationType]);

  // Fetch donation data if editing and available campaigns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Fetch campaigns - only active campaigns
        const campaignsData = await campaignService.getAll({
          status: "active",
        });
        setCampaigns(campaignsData.campaigns || []);

        // If editing, fetch donation details
        if (isEditing) {
          const response = await donationService.getById(id);
          const donation = response.donation; // Extract donation from response

          // Format the date for the form (YYYY-MM-DD)
          const formattedDate = donation.date_received
            ? new Date(donation.date_received).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

          reset({
            donor_name: donation.donor_name,
            donation_type: donation.donation_type,
            amount: donation.amount || "",
            description: donation.description || "",
            date_received: formattedDate,
            campaign_id: donation.campaign_id?._id || "",
          });

          setDonationType(donation.donation_type || "cash");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Format the data
      const donationData = {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : null,
        received_by: user.id, // Current user ID
      };

      if (isEditing) {
        await donationService.update(id, donationData);
        toast.success("Donation updated successfully");
      } else {
        await donationService.create(donationData);
        toast.success("Donation added successfully");
      }

      // Navigate back to dashboard with state
      navigate("/", { state: { fromDonationForm: true } });
    } catch (error) {
      console.error("Error saving donation:", error);
      toast.error(
        isEditing ? "Failed to update donation" : "Failed to add donation"
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (animating) return;
    setAnimating(true);
    setDirection("forward");
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, formSteps.length));
      setAnimating(false);
    }, 300);
  };

  const prevStep = () => {
    if (animating) return;
    setAnimating(true);
    setDirection("backward");
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      setAnimating(false);
    }, 300);
  };

  // Simplified function to check if current step is valid
  const isStepValid = () => {
    if (currentStep === 1) {
      return true; // Type selection is always valid
    } else if (currentStep === 2) {
      // Basic validation for step 2
      if (
        donationType === "cash" &&
        (!watchAmount || parseFloat(watchAmount) <= 0)
      ) {
        return false;
      }
      if (!watchDate) {
        return false;
      }
      return true;
    }
    return true;
  };

  if (initialLoading) {
    return <LoadingSpinner size="md" text="Loading donation data..." />;
  }

  const getStepAnimationClass = () => {
    if (animating) {
      return direction === "forward"
        ? "step-exit-active"
        : "step-prev-exit-active";
    }
    return direction === "forward"
      ? "step-enter-active"
      : "step-prev-enter-active";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Improved responsive header */}
      <div className="flex flex-row sm:flex-col sm:items-center mb-6 sm:mb-8">
        <button
          type="button"
          onClick={() => navigate("/donations")}
          className="self-start mb-4 sm:mb-0 mr-4 p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Donation" : "Add New Donation"}
        </h1>
      </div>

      {/* Improved responsive step progress */}
      <nav aria-label="Progress" className="mb-6 sm:mb-8 overflow-x-auto pb-2">
        <ol className="flex items-center min-w-max">
          {formSteps.map((step, index) => (
            <li
              key={step.id}
              className={`relative ${
                index !== 0 ? "pl-4 sm:pl-6 md:pl-8" : ""
              } ${
                index !== formSteps.length - 1 ? "pr-4 sm:pr-6 md:pr-8" : ""
              } flex-1`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div
                  className={`flex items-center ${
                    currentStep >= step.id
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 ${
                      currentStep > step.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : currentStep === step.id
                        ? "border-emerald-600 bg-white text-emerald-600"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircleIcon
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span
                    className={`ml-2 text-xs sm:text-sm font-medium ${
                      currentStep >= step.id
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                <div className="mt-0.5 ml-2 sm:ml-4 hidden sm:block">
                  <span className="text-xs text-gray-500">
                    {step.description}
                  </span>
                </div>
              </div>

              {index !== formSteps.length - 1 && (
                <div className="absolute top-4 right-0 hidden h-0.5 w-3 sm:w-5 md:w-10 bg-gray-200 sm:block" />
              )}
              {index !== 0 && (
                <div className="absolute top-4 left-0 hidden h-0.5 w-3 sm:w-5 md:w-10 bg-gray-200 sm:block" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Improved responsive form container */}
      <div className="bg-white shadow-md sm:shadow-lg rounded-xl overflow-hidden transition-all duration-300">
        <form className="p-4 sm:p-6 md:p-8">
          {/* Step 1: Donation Type */}
          {currentStep === 1 && (
            <div
              className={`space-y-4 sm:space-y-6 ${getStepAnimationClass()}`}
            >
              <h2 className="text-lg font-medium text-gray-900">
                Select Donation Type
              </h2>
              <p className="text-sm text-gray-500">
                Choose the type of donation you're recording
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4">
                <div
                  className={`border-2 p-4 sm:p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                    donationType === "cash"
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-opacity-50 shadow-lg"
                      : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50 shadow-sm hover:shadow-md"
                  }`}
                  onClick={() => {
                    setValue("donation_type", "cash");
                    setDonationType("cash");
                  }}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div
                      className={`flex-shrink-0 p-2 sm:p-3 rounded-full ${
                        donationType === "cash"
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <BanknotesIcon
                        className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors duration-300 ${
                          donationType === "cash"
                            ? "text-emerald-500"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                          donationType === "cash"
                            ? "text-emerald-700"
                            : "text-gray-900"
                        }`}
                      >
                        Cash Donation
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        Money contributions with monetary value
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    value="cash"
                    className="sr-only"
                    {...register("donation_type", {
                      onChange: () => {
                        setDonationType("cash");
                      },
                    })}
                    checked={donationType === "cash"}
                  />
                </div>

                <div
                  className={`border-2 p-4 sm:p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                    donationType === "goods"
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-opacity-50 shadow-lg"
                      : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50 shadow-sm hover:shadow-md"
                  }`}
                  onClick={() => {
                    setValue("donation_type", "goods");
                    setDonationType("goods");
                  }}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div
                      className={`flex-shrink-0 p-2 sm:p-3 rounded-full ${
                        donationType === "goods"
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <GiftIcon
                        className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors duration-300 ${
                          donationType === "goods"
                            ? "text-emerald-500"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                          donationType === "goods"
                            ? "text-emerald-700"
                            : "text-gray-900"
                        }`}
                      >
                        Goods Donation
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        Physical items and non-monetary contributions
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    value="goods"
                    className="sr-only"
                    {...register("donation_type", {
                      onChange: () => {
                        setDonationType("goods");
                      },
                    })}
                    checked={donationType === "goods"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Donation Details */}
          {currentStep === 2 && (
            <div
              className={`space-y-6 sm:space-y-8 ${getStepAnimationClass()}`}
            >
              <h2 className="text-lg font-medium text-gray-900">
                Donation Details
              </h2>
              <p className="text-sm text-gray-500">
                {donationType === "cash"
                  ? "Enter the details of the cash donation"
                  : "Describe the goods that were donated"}
              </p>

              <div className="grid grid-cols-1 gap-y-6 sm:gap-y-8 gap-x-4 sm:gap-x-6 sm:grid-cols-6">
                {/* Donor Name */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="donor_name"
                    className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                  >
                    Donor Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="donor_name"
                      {...register("donor_name")}
                      className="shadow-sm block w-full rounded-lg border border-gray-300 pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 text-sm transition-colors duration-200"
                      placeholder="Anonymous"
                    />
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs text-gray-500">
                    Leave empty for anonymous donations
                  </p>
                </div>

                {/* Date Received */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="date_received"
                    className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                  >
                    Date Received<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date_received"
                      {...register("date_received", {
                        required: "Date is required",
                      })}
                      className={`shadow-sm block w-full rounded-lg border ${
                        errors.date_received
                          ? "border-red-300"
                          : "border-gray-300"
                      } pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 text-sm transition-colors duration-200`}
                    />
                  </div>
                  {errors.date_received && (
                    <p className="mt-1 sm:mt-2 text-sm text-red-600 animate-fadeIn">
                      {errors.date_received.message}
                    </p>
                  )}
                </div>

                {/* Amount - Only show for cash donations */}
                {donationType === "cash" && (
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="amount"
                      className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                    >
                      Amount<span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="amount"
                        step="0.01"
                        min="0.01"
                        {...register("amount", {
                          required:
                            donationType === "cash"
                              ? "Amount is required"
                              : false,
                          min: {
                            value: 0.01,
                            message: "Amount must be greater than 0",
                          },
                          pattern: {
                            value: /^\d+(\.\d{1,2})?$/,
                            message:
                              "Please enter a valid amount (up to 2 decimal places)",
                          },
                        })}
                        className={`block w-full rounded-lg border ${
                          errors.amount ? "border-red-300" : "border-gray-300"
                        } pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 text-sm transition-colors duration-200`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 sm:mt-2 text-sm text-red-600 animate-fadeIn">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Campaign - Only relevant for cash donations */}
                {donationType === "cash" && (
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="campaign_id"
                      className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                    >
                      Campaign
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <BuildingLibraryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <select
                        id="campaign_id"
                        {...register("campaign_id")}
                        className="shadow-sm block w-full rounded-lg border border-gray-300 pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 text-sm transition-colors duration-200"
                      >
                        <option value="">No Campaign</option>
                        {campaigns.map((campaign) => (
                          <option key={campaign._id} value={campaign._id}>
                            {campaign.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 sm:mt-2 text-xs text-gray-500">
                      Optional - associate with a campaign
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="sm:col-span-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                  >
                    Description
                    {donationType === "goods" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute top-2 sm:top-3 left-3 sm:left-4 flex items-start pointer-events-none">
                      <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="description"
                      rows={4}
                      {...register("description", {
                        required:
                          donationType === "goods"
                            ? "Description is required for goods donations"
                            : false,
                      })}
                      className={`shadow-sm block w-full rounded-lg border ${
                        errors.description
                          ? "border-red-300"
                          : "border-gray-300"
                      } pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 text-sm transition-colors duration-200`}
                      placeholder={
                        donationType === "goods"
                          ? "Describe the donated items (required)"
                          : "Additional details about the donation (optional)"
                      }
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-1 sm:mt-2 text-sm text-red-600 animate-fadeIn">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review and Submit */}
          {currentStep === 3 && (
            <div
              className={`space-y-4 sm:space-y-6 ${getStepAnimationClass()}`}
            >
              <h2 className="text-lg font-medium text-gray-900">
                Review and Submit
              </h2>
              <p className="text-sm text-gray-500">
                Review the donation information before submitting
              </p>

              <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 pb-4 border-b border-gray-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center mb-2 sm:mb-0">
                    <span className="inline-block p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-full mr-2 sm:mr-3">
                      {donationType === "cash" ? (
                        <BanknotesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </span>
                    {donationType === "cash"
                      ? "Cash Donation"
                      : "Goods Donation"}
                  </h3>
                  <span className="px-2 sm:px-3 py-1 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium rounded-full self-start sm:self-auto">
                    {new Date(watchDate).toLocaleDateString()}
                  </span>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-5">
                  <div className="relative group overflow-hidden transition-all duration-300 transform hover:translate-x-1 col-span-1">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 flex items-center">
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                      Donor
                    </dt>
                    <dd className="text-sm sm:text-base font-medium text-gray-900 truncate pr-10 pl-1 sm:pl-2">
                      {watchDonorName || "Anonymous"}
                    </dd>
                    <div className="absolute inset-0 border-l-2 border-transparent group-hover:border-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  </div>

                  {donationType === "cash" && (
                    <div className="relative group overflow-hidden transition-all duration-300 transform hover:translate-x-1 col-span-1">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 flex items-center">
                        <BanknotesIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                        Amount
                      </dt>
                      <dd className="text-lg sm:text-xl font-bold text-emerald-600 truncate pl-1 sm:pl-2">
                        ${parseFloat(watchAmount || 0).toFixed(2)}
                      </dd>
                      <div className="absolute inset-0 border-l-2 border-transparent group-hover:border-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </div>
                  )}

                  {donationType === "cash" && watchCampaign && (
                    <div className="relative group overflow-hidden transition-all duration-300 transform hover:translate-x-1 col-span-1">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 flex items-center">
                        <BuildingLibraryIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                        Campaign
                      </dt>
                      <dd className="text-sm sm:text-base font-medium text-gray-900 truncate pl-1 sm:pl-2">
                        {campaigns.find((c) => c._id === watchCampaign)
                          ?.title || "No Campaign"}
                      </dd>
                      <div className="absolute inset-0 border-l-2 border-transparent group-hover:border-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </div>
                  )}

                  {watchDescription && (
                    <div className="col-span-full mt-1 sm:mt-2 relative group overflow-hidden">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 flex items-center">
                        <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                        Description
                      </dt>
                      <dd className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 sm:p-3 rounded border border-gray-100 group-hover:border-emerald-200 transition-colors duration-200">
                        {watchDescription}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mr-1 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Please confirm the information above before submitting
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons - Improved responsive layout */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-4 pt-6 sm:pt-8 border-t mt-6 sm:mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="mt-3 sm:mt-0 group relative bg-white w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-y-0 left-0 flex items-center justify-center w-8 sm:w-10 bg-gray-100 group-hover:bg-gray-200 transition-all duration-200 transform -translate-x-8 sm:-translate-x-10 group-hover:translate-x-0">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </span>
                <span className="relative group-hover:translate-x-2 transition-transform duration-200 inline-flex">
                  Back
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-3 sm:mt-0 group relative bg-white w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <span className="relative inline-flex items-center">
                  <svg
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </span>
              </button>
            )}

            {currentStep < formSteps.length ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="w-full sm:w-auto group relative inline-flex items-center justify-center py-2.5 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
              >
                <span className="relative inline-flex">Continue</span>
                <span className="absolute inset-y-0 right-0 flex items-center justify-center w-8 sm:w-10 transform translate-x-8 sm:translate-x-10 group-hover:translate-x-0 transition-transform duration-200">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="w-full sm:w-auto group relative inline-flex items-center justify-center py-2.5 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    {isEditing ? "Update Donation" : "Submit Donation"}
                    <svg
                      className="ml-2 -mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white group-hover:translate-x-1 transition-transform duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationFormPage;
