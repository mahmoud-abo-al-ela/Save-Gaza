import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { campaignService, donationService } from "../services/api";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../Components/common/LoadingSpinner";
import { toast } from "react-hot-toast";

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filters, setFilters] = useState({
    title: "",
    status: "",
    startDateFrom: "",
    startDateTo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [campaignsPerPage] = useState(6);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await campaignService.getAll();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle deleting a campaign
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      await campaignService.delete(id);
      setCampaigns(campaigns.filter((campaign) => campaign._id !== id));
      toast.success("Campaign deleted successfully");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      title: "",
      status: "",
      startDateFrom: "",
      startDateTo: "",
    });
  };

  // Apply filters to campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Filter by title
    if (
      filters.title &&
      !campaign.title.toLowerCase().includes(filters.title.toLowerCase())
    ) {
      return false;
    }

    // Filter by status
    if (filters.status && campaign.status !== filters.status) {
      return false;
    }

    // Filter by start date range
    if (
      filters.startDateFrom &&
      new Date(campaign.start_date) < new Date(filters.startDateFrom)
    ) {
      return false;
    }

    if (
      filters.startDateTo &&
      new Date(campaign.start_date) > new Date(filters.startDateTo)
    ) {
      return false;
    }

    return true;
  });

  // Calculate pagination values
  const indexOfLastCampaign = currentPage * campaignsPerPage;
  const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;
  const currentCampaigns = filteredCampaigns.slice(
    indexOfFirstCampaign,
    indexOfLastCampaign
  );
  const totalPages = Math.ceil(filteredCampaigns.length / campaignsPerPage);

  // Handle pagination changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format currency with proper 2 decimal places
  const formatCurrency = (amount) => {
    return (amount || 0).toFixed(2);
  };

  // Calculate the progress percentage of each campaign
  const calculateProgress = (campaign) => {
    if (!campaign.goal_amount || campaign.goal_amount <= 0) return 0;

    // Calculate using current_amount which is updated with donation changes
    const currentAmount = campaign.current_amount || 0;
    const percentage = (currentAmount / campaign.goal_amount) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  // View campaign details with donations
  const viewCampaignDetails = async (campaignId) => {
    try {
      setLoadingDetails(true);
      setSelectedCampaign(campaignId);

      const response = await campaignService.getById(campaignId);
      setCampaignDetails(response.campaign);
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      toast.error("Failed to load campaign details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close campaign details modal
  const closeDetails = () => {
    setSelectedCampaign(null);
    setCampaignDetails(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading campaigns..." />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all donation campaigns
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Campaign
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Campaign Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={filters.title}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="startDateFrom"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date (From)
              </label>
              <input
                type="date"
                name="startDateFrom"
                id="startDateFrom"
                value={filters.startDateFrom}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="startDateTo"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date (To)
              </label>
              <input
                type="date"
                name="startDateTo"
                id="startDateTo"
                value={filters.startDateTo}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.length > 0 ? (
          currentCampaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
            >
              {/* Card Header with Status Badge */}
              <div className="relative">
                <div
                  className={`h-2 w-full ${
                    campaign.status === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-500"
                  }`}
                ></div>
              </div>

              <div className="p-5">
                {/* Card Header */}
                <div className="flex justify-between mb-3 items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 truncate capitalize">
                      {campaign.title}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-1">
                    <button
                      onClick={() => viewCampaignDetails(campaign._id)}
                      className="text-gray-400 hover:text-emerald-600 rounded-full p-1 hover:bg-gray-100"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <Link
                      to={`/campaigns/edit/${campaign._id}`}
                      className="text-gray-400 hover:text-blue-600 rounded-full p-1 hover:bg-gray-100"
                      title="Edit campaign"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(campaign._id)}
                      className="text-gray-400 hover:text-red-600 rounded-full p-1 hover:bg-gray-100"
                      title="Delete campaign"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {campaign.description}
                </p>

                {/* Progress Section */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">Progress</span>
                    <span className="font-bold text-emerald-600">
                      {calculateProgress(campaign).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        calculateProgress(campaign) >= 100
                          ? "bg-emerald-600"
                          : calculateProgress(campaign) > 75
                          ? "bg-emerald-500"
                          : calculateProgress(campaign) > 40
                          ? "bg-emerald-400"
                          : "bg-emerald-300"
                      }`}
                      style={{ width: `${calculateProgress(campaign)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-gray-600">
                    <div>
                      <span className="text-gray-500">Raised:</span>
                      <span className="ml-1 font-semibold">
                        EGP {formatCurrency(campaign.current_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Goal:</span>
                      <span className="ml-1 font-semibold">
                        EGP {formatCurrency(campaign.goal_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {campaign.end_date
                        ? new Date(campaign.end_date).toLocaleDateString()
                        : "Ongoing"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Donations</p>
                    <p className="text-sm font-medium text-gray-900">
                      {campaign.donation_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="text-sm font-medium text-gray-900 truncate capitalize">
                      {campaign.created_by
                        ? campaign.created_by.username
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {campaign.attachments && campaign.attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={campaignService.getAttachmentUrl(
                            attachment._id
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          <DocumentIcon className="h-3.5 w-3.5 mr-1" />
                          {attachment.fileName || `File ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-2">No campaigns found</p>
            <Link
              to="/campaigns/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add First Campaign
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredCampaigns.length > campaignsPerPage && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{indexOfFirstCampaign + 1}</span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastCampaign, filteredCampaigns.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredCampaigns.length}</span>{" "}
                campaigns
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {totalPages <= 7 ? (
                  // If 7 pages or fewer, show all pages
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                          currentPage === page
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )
                ) : (
                  // If more than 7 pages, show a subset with ellipsis
                  <>
                    {/* First page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        currentPage === 1
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      1
                    </button>

                    {/* Ellipsis or page 2 */}
                    {currentPage > 3 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white">
                        ...
                      </span>
                    )}

                    {/* Pages around current page */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (currentPage <= 3) {
                        // Near start
                        pageNum = i + 2;
                      } else if (currentPage >= totalPages - 2) {
                        // Near end
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Middle
                        pageNum = currentPage - 2 + i;
                      }

                      // Only render if page is between 2 and (totalPages - 1)
                      if (pageNum > 1 && pageNum < totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                              currentPage === pageNum
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    }).filter(Boolean)}

                    {/* Ellipsis or second to last page */}
                    {currentPage < totalPages - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white">
                        ...
                      </span>
                    )}

                    {/* Last page */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        currentPage === totalPages
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closeDetails}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {loadingDetails ? (
                <div className="flex justify-center">
                  <LoadingSpinner size="md" text="Loading details..." />
                </div>
              ) : campaignDetails ? (
                <>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {campaignDetails.title}
                      </h3>

                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Status</p>
                            <p className="font-medium capitalize">
                              {campaignDetails.status}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Goal</p>
                            <p className="font-medium">
                              EGP {formatCurrency(campaignDetails.goal_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Current Amount</p>
                            <p className="font-medium">
                              EGP{" "}
                              {formatCurrency(campaignDetails.current_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="font-medium">
                              {calculateProgress(campaignDetails).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Start Date</p>
                            <p className="font-medium">
                              {formatDate(campaignDetails.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">End Date</p>
                            <p className="font-medium">
                              {formatDate(campaignDetails.end_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created By</p>
                            <p className="font-medium">
                              {campaignDetails.created_by
                                ? campaignDetails.created_by.username
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created At</p>
                            <p className="font-medium">
                              {campaignDetails.createdAt
                                ? new Date(
                                    campaignDetails.createdAt
                                  ).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500">Last Updated</p>
                            <p className="font-medium">
                              {campaignDetails.updatedAt
                                ? new Date(
                                    campaignDetails.updatedAt
                                  ).toLocaleString()
                                : "Unknown"}
                              {campaignDetails.updated_by ? (
                                <span className="ml-1">
                                  by{" "}
                                  <span className="font-semibold">
                                    {campaignDetails.updated_by.username ||
                                      "Unknown"}
                                  </span>
                                </span>
                              ) : campaignDetails.created_by &&
                                campaignDetails.updatedAt ? (
                                <span className="ml-1">
                                  by{" "}
                                  <span className="font-semibold">
                                    {campaignDetails.created_by.username ||
                                      "Unknown"}
                                  </span>
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-emerald-600 h-2.5 rounded-full"
                              style={{
                                width: `${calculateProgress(campaignDetails)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-gray-600">
                          {campaignDetails.description}
                        </p>
                      </div>

                      {campaignDetails.donations &&
                      campaignDetails.donations.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Recent Donations
                          </h4>
                          <div className="max-h-60 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                  >
                                    Donor
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                  >
                                    Amount
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                  >
                                    Date
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {campaignDetails.donations.map((donation) => (
                                  <tr key={donation._id}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {donation.donor_name}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      EGP {formatCurrency(donation.amount)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(donation.date_received)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No donations yet
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Link
                      to={`/campaigns/edit/${campaignDetails._id}`}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Edit Campaign
                    </Link>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={closeDetails}
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    Campaign details not available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
