import { useState, useEffect, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { campaignService } from "../services/api";
import {
  ArrowLeftIcon,
  DocumentIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PencilSquareIcon,
  PaperClipIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../Components/common/LoadingSpinner";

const FileItem = memo(({ file, index, removeFile }) => (
  <li className="px-4 py-3 flex items-center justify-between text-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg">
    <div className="w-0 flex-1 flex items-center">
      {file.type.startsWith("image/") ? (
        <img
          src={file.preview}
          alt={file.name}
          className="h-8 w-8 object-cover rounded mr-2"
          loading="lazy"
        />
      ) : (
        <DocumentIcon
          className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2"
          aria-hidden="true"
        />
      )}
      <span className="flex-1 w-0 truncate">{file.name}</span>
    </div>
    <button
      type="button"
      onClick={() => removeFile(index)}
      className="p-1.5 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
      aria-label={`Remove ${file.name}`}
    >
      <XMarkIcon className="h-5 w-5" />
    </button>
  </li>
));

const AttachmentItem = memo(({ attachment, index, removeAttachment }) => (
  <li className="px-4 py-3 flex items-center justify-between text-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg">
    <div className="w-0 flex-1 flex items-center">
      {attachment.contentType && attachment.contentType.startsWith("image/") ? (
        <img
          src={campaignService.getAttachmentUrl(attachment._id)}
          alt={attachment.fileName}
          className="h-8 w-8 object-cover rounded mr-2"
          loading="lazy"
        />
      ) : (
        <DocumentIcon
          className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2"
          aria-hidden="true"
        />
      )}
      <span className="flex-1 w-0 truncate">{attachment.fileName}</span>
    </div>
    <div className="ml-4 flex-shrink-0 flex space-x-4">
      <a
        href={campaignService.getAttachmentUrl(attachment._id)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
      >
        View
      </a>
      <button
        type="button"
        onClick={() => removeAttachment(index)}
        className="p-1.5 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
        aria-label={`Remove ${attachment.fileName}`}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  </li>
));

const CampaignFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [minEndDate, setMinEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [step, setStep] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      goal_amount: "",
      status: "active",
    },
    mode: "onChange",
  });

  const watchedFields = watch();
  const descriptionLength = watchedFields.description.length || 0;
  const maxDescriptionLength = 1000;

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!isEditing) return;
      try {
        setInitialLoading(true);
        const response = await campaignService.getById(id);
        const campaign = response.campaign;
        const formattedStartDate = campaign.start_date
          ? new Date(campaign.start_date).toISOString().split("T")[0]
          : "";
        const formattedEndDate = campaign.end_date
          ? new Date(campaign.end_date).toISOString().split("T")[0]
          : "";
        reset({
          title: campaign.title,
          description: campaign.description,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          goal_amount: campaign.goal_amount || "",
          status: campaign.status,
        });
        if (formattedStartDate) {
          setMinEndDate(formattedStartDate);
        }
        if (campaign.attachments && campaign.attachments.length > 0) {
          setExistingAttachments(campaign.attachments);
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast.error("Failed to load campaign data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchCampaign();
  }, [id, isEditing, reset]);

  const startDate = watch("start_date");

  useEffect(() => {
    if (startDate) {
      setMinEndDate(startDate);
    }
  }, [startDate]);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prevFiles) => [
      ...prevFiles,
      ...acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
        })
      ),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 5242880, // 5MB
  });

  const removeFile = (index) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.filter((_, i) => i !== index);
      if (prevFiles[index].preview) {
        URL.revokeObjectURL(prevFiles[index].preview);
      }
      return newFiles;
    });
  };

  const removeAttachment = (index) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const campaignData = {
        ...data,
        status: "active",
        goal_amount: data.goal_amount ? parseFloat(data.goal_amount) : 0,
        created_by: user.id,
        attachments: files,
      };
      if (isEditing) {
        const originalAttachmentIds = existingAttachments.map((att) => att._id);
        const keptAttachmentIds = existingAttachments.map((att) => att._id);
        const remove_attachments = originalAttachmentIds.filter(
          (id) => !keptAttachmentIds.includes(id)
        );
        if (remove_attachments.length > 0) {
          campaignData.remove_attachments = JSON.stringify(remove_attachments);
        }
      }
      if (isEditing) {
        await campaignService.update(id, campaignData);
        toast.success("Campaign updated successfully");
      } else {
        await campaignService.create(campaignData);
        toast.success("Campaign added successfully");
      }
      navigate("/campaigns");
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.error(
        isEditing ? "Failed to update campaign" : "Failed to add campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(Math.min(step + 1, totalSteps));
  const prevStep = () => setStep(Math.max(step - 1, 1));

  const canProceedToStep2 = watchedFields.title && watchedFields.description;
  const canProceedToStep3 =
    canProceedToStep2 && watchedFields.goal_amount && watchedFields.start_date;

  const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  if (initialLoading) {
    return <LoadingSpinner size="md" text="Loading campaign data..." />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 form-container">
      {/* Header */}
      <div className="flex items-center mb-8 sm:mb-10">
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all duration-200"
          aria-label="Go back to campaigns"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 ml-4">
          {isEditing ? "Edit Campaign" : "Create New Campaign"}
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Step {step} of {totalSteps}:{" "}
          <span className="font-semibold text-emerald-600">
            {step === 1
              ? "Basic Info"
              : step === 2
              ? "Schedule & Goal"
              : "Attachments"}
          </span>
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden animate-slide-in">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="flex items-center mb-6">
                <PencilSquareIcon className="h-6 w-6 text-emerald-600 mr-3" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Campaign Details
                </h2>
              </div>

              {/* Title */}
              <div className="relative">
                <label
                  htmlFor="title"
                  className={`absolute -top-2 left-3 inline-block bg-white px-1 text-xs font-medium text-gray-700 transition-all duration-200 ${
                    watchedFields.title ? "text-emerald-600" : ""
                  }`}
                >
                  Campaign Title<span className="text-red-600 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  className={`block w-full rounded-lg border ${
                    errors.title
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : " focus:ring-emerald-600 focus:border-emerald-600"
                  } px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-opacity-50 outline-none transition-all duration-200 bg-gray-50 hover:bg-white`}
                  placeholder="e.g., Winter Relief Fund"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center animate-pulse">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.title.message}. Please provide a title.
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="relative">
                <label
                  htmlFor="description"
                  className={`absolute -top-2 left-3 inline-block bg-white px-1 text-xs font-medium text-gray-700 transition-all duration-200 ${
                    watchedFields.description ? "text-emerald-600" : ""
                  }`}
                >
                  Description<span className="text-red-600 ml-1">*</span>
                </label>
                <textarea
                  id="description"
                  rows={6}
                  {...register("description", {
                    required: "Description is required",
                    maxLength: {
                      value: maxDescriptionLength,
                      message: `Description cannot exceed ${maxDescriptionLength} characters`,
                    },
                  })}
                  className={`block w-full rounded-lg border ${
                    errors.description
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-emerald-600 focus:border-emerald-600"
                  } px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-opacity-50 transition-all duration-200 bg-gray-50 hover:bg-white outline-none`}
                  placeholder="Details about the campaign's purpose and objectives"
                />
                <div className="flex justify-between mt-2">
                  {errors.description ? (
                    <p className="text-sm text-red-600 flex items-center animate-pulse">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.description.message}. Try shortening it.
                    </p>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {descriptionLength}/{maxDescriptionLength} characters
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToStep2}
                  className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  Next: Schedule & Goal
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Goal */}
          {step === 2 && (
            <div className="space-y-10">
              <div className="flex items-center mb-6">
                <CalendarIcon className="h-6 w-6 text-emerald-600 mr-3" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Schedule & Goal
                </h2>
              </div>

              {/* Goal Amount */}
              <div className="relative">
                <label
                  htmlFor="goal_amount"
                  className={`absolute -top-5 left-1 inline-block bg-white px-1 text-sm font-medium text-gray-700 transition-all duration-200 ${
                    watchedFields.goal_amount ? "text-emerald-600" : ""
                  }`}
                >
                  Goal Amount<span className="text-red-600 ml-1">*</span>
                </label>
                <div className="relative rounded-lg top-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500">EGP</span>
                  </div>
                  <input
                    type="number"
                    id="goal_amount"
                    step="0.01"
                    min="0"
                    {...register("goal_amount", {
                      required: "Goal amount is required",
                      min: { value: 0, message: "Amount must be positive" },
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message:
                          "Please enter a valid amount (up to 2 decimal places)",
                      },
                    })}
                    className={`block w-full rounded-lg border ${
                      errors.goal_amount
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-emerald-600 focus:border-emerald-600"
                    } pl-12 pr-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-opacity-50 transition-all duration-200 bg-gray-50 hover:bg-white outline-none`}
                    placeholder="0.00"
                  />
                </div>
                {errors.goal_amount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center animate-pulse">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.goal_amount.message}. Enter a valid amount.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="relative">
                  <label
                    htmlFor="start_date"
                    className={`absolute -top-5 left-1 inline-block bg-white px-1 text-sm font-medium text-gray-700 transition-all duration-200 ${
                      watchedFields.start_date ? "text-emerald-600" : ""
                    }`}
                  >
                    Start Date<span className="text-red-600 ml-1">*</span>
                  </label>
                  <div className="relative top-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="start_date"
                      {...register("start_date", {
                        required: "Start date is required",
                      })}
                      className={`block w-full rounded-lg border ${
                        errors.start_date
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-200 focus:ring-emerald-600 focus:border-emerald-600"
                      } pl-10 pr-4 py-3 text-base sm:text-sm text-gray-900 focus:ring-2 focus:ring-opacity-50 transition-all duration-200 bg-gray-50 hover:bg-white`}
                    />
                  </div>
                  {errors.start_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-pulse">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.start_date.message}. Select a date.
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="relative">
                  <label
                    htmlFor="end_date"
                    className={`absolute -top-2 sm:-top-5 left-1 inline-block bg-white px-1 text-sm font-medium text-gray-700 transition-all duration-200 ${
                      watchedFields.end_date ? "text-emerald-600" : ""
                    }`}
                  >
                    End Date (Optional)
                  </label>
                  <div className="relative top-5 sm:top-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="end_date"
                      min={minEndDate}
                      {...register("end_date")}
                      className="block w-full rounded-lg border border-gray-200 pl-10 pr-4 py-3 text-base sm:text-sm text-gray-900 focus:ring-emerald-600 focus:ring-2 focus:ring-opacity-50 focus:border-emerald-600 transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-between sm:justify-end gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all duration-300 transform hover:scale-105 order-2 sm:order-1"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToStep3}
                  className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 order-1 sm:order-2"
                >
                  Next: Attachments
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Attachments */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="flex items-center mb-6">
                <PaperClipIcon className="h-6 w-6 text-emerald-600 mr-3" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Attachments
                </h2>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Attachments (Optional)
                  <span
                    className="ml-2 text-xs text-gray-500"
                    title="Add supporting documents or images"
                  >
                    ℹ️
                  </span>
                </label>
                <div
                  {...getRootProps()}
                  className={`flex justify-center px-6 pt-6 pb-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? "border-emerald-600 bg-emerald-100"
                      : "border-gray-200 hover:border-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  <div className="space-y-3 text-center">
                    <CloudArrowUpIcon
                      className={`mx-auto h-12 w-12 transition-transform duration-200 ${
                        isDragActive
                          ? "text-emerald-600 scale-110"
                          : "text-gray-400"
                      }`}
                    />
                    <div className="flex text-sm text-gray-600">
                      <input {...getInputProps()} />
                      <p className="pl-1">
                        {isDragActive
                          ? "Drop the files here..."
                          : "Drag and drop files here, or click to select files"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Images, PDFs, DOC up to 5MB
                    </p>
                  </div>
                </div>

                {/* Display selected files */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Selected Files:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {files.map((file, index) => (
                        <FileItem
                          key={index}
                          file={file}
                          index={index}
                          removeFile={removeFile}
                        />
                      ))}
                    </ul>
                  </div>
                )}

                {/* Display existing attachments */}
                {existingAttachments.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Existing Attachments:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {existingAttachments.map((attachment, index) => (
                        <AttachmentItem
                          key={attachment._id}
                          attachment={attachment}
                          index={index}
                          removeAttachment={removeAttachment}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-between sm:justify-end gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all duration-300 transform hover:scale-105 order-2 sm:order-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 order-1 sm:order-2"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 24 24"
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
                  ) : isEditing ? (
                    "Update Campaign"
                  ) : (
                    "Create Campaign"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Cancel button */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Floating Navigation */}
      <div className="sm:hidden fixed bottom-6 right-6 flex space-x-3">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="p-3 bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all duration-200"
            aria-label="Previous step"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        {step < totalSteps && (
          <button
            onClick={nextStep}
            disabled={step === 1 ? !canProceedToStep2 : !canProceedToStep3}
            className="p-3 bg-emerald-600 rounded-full shadow-lg text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50 transition-all duration-200"
            aria-label="Next step"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity"
            aria-hidden="true"
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-in">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Discard Changes?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              Are you sure you want to cancel? All unsaved changes will be lost.
            </Dialog.Description>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all duration-200"
              >
                Stay
              </button>
              <button
                onClick={() => navigate("/campaigns")}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all duration-200"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CampaignFormPage;
