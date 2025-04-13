import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { campaignService } from "../services/api";
import {
  ArrowLeftIcon,
  DocumentIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../Components/common/LoadingSpinner";

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      goal_amount: "",
      status: "active",
    },
  });

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
          preview: URL.createObjectURL(file),
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
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeAttachment = (index) => {
    setExistingAttachments(existingAttachments.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const campaignData = {
        ...data,
        goal_amount: data.goal_amount ? parseFloat(data.goal_amount) : 0,
        created_by: user.id,
        attachments: files,
      };

      // Track removed attachments
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={() => navigate("/campaigns")}
          className="mr-4 p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Campaign" : "Create New Campaign"}
        </h1>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
            {/* Title */}
            <div className="sm:col-span-4">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Campaign Title<span className="text-red-600 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  className={`shadow-sm block w-full rounded-lg border ${
                    errors.title ? "border-red-300" : "border-gray-300"
                  } px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm transition-colors duration-200`}
                  placeholder="e.g., Winter Relief Fund"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="sm:col-span-2">
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Status<span className="text-red-600 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  id="status"
                  {...register("status", { required: "Status is required" })}
                  className={`shadow-sm block w-full rounded-lg border ${
                    errors.status ? "border-red-300" : "border-gray-300"
                  } px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm transition-colors duration-200`}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                {errors.status && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-6">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Description<span className="text-red-600 ml-1">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  rows={6}
                  {...register("description", {
                    required: "Description is required",
                  })}
                  className={`shadow-sm block w-full rounded-lg border ${
                    errors.description ? "border-red-300" : "border-gray-300"
                  } px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm transition-colors duration-200`}
                  placeholder="Details about the campaign's purpose and objectives"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Goal Amount */}
            <div className="sm:col-span-2">
              <label
                htmlFor="goal_amount"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Goal Amount<span className="text-red-600 ml-1">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
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
                    errors.goal_amount ? "border-red-300" : "border-gray-300"
                  } pl-8 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm transition-colors duration-200`}
                  placeholder="0.00"
                />
                {errors.goal_amount && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.goal_amount.message}
                  </p>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div className="sm:col-span-2">
              <label
                htmlFor="start_date"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Start Date<span className="text-red-600 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="start_date"
                  {...register("start_date", {
                    required: "Start date is required",
                  })}
                  className={`shadow-sm block w-full rounded-lg border ${
                    errors.start_date ? "border-red-300" : "border-gray-300"
                  } px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm transition-colors duration-200`}
                />
                {errors.start_date && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.start_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* End Date */}
            <div className="sm:col-span-2">
              <label
                htmlFor="end_date"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                End Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="end_date"
                  min={minEndDate}
                  {...register("end_date")}
                  className="shadow-sm block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm transition-colors duration-200"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attachments (Optional)
              </label>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`mt-1 flex justify-center px-6 pt-8 pb-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ${
                  isDragActive
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-300 hover:border-emerald-400"
                }`}
              >
                <div className="space-y-3 text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
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
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className="pl-4 pr-4 py-3 flex items-center justify-between text-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-0 flex-1 flex items-center">
                          <DocumentIcon
                            className="flex-shrink-0 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="ml-2 flex-1 w-0 truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1.5 rounded-full font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
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
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                    {existingAttachments.map((attachment, index) => (
                      <li
                        key={attachment._id}
                        className="pl-4 pr-4 py-3 flex items-center justify-between text-sm bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="w-0 flex-1 flex items-center">
                          <DocumentIcon
                            className="flex-shrink-0 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="ml-2 flex-1 w-0 truncate">
                            {attachment.fileName}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex space-x-4">
                          <a
                            href={campaignService.getAttachmentUrl(
                              attachment._id
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="p-1.5 rounded-full font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-8">
            <button
              type="button"
              onClick={() => navigate("/campaigns")}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              ) : isEditing ? (
                "Update Campaign"
              ) : (
                "Create Campaign"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignFormPage;
