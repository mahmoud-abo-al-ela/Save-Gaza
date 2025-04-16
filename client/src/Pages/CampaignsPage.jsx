import { useState, useEffect, memo, useRef } from "react";
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
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../Components/common/LoadingSpinner";
import { toast } from "react-hot-toast";

const CampaignCard = memo(({ campaign, viewCampaignDetails, handleDelete }) => (
  <div className="campaign-card bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
    <div className="relative">
      <div
        className={`h-2 w-full ${
          campaign.status === "active" ? "bg-emerald-500" : "bg-gray-500"
        }`}
      ></div>
    </div>
    <div className="p-5">
      <div className="flex justify-between mb-3 items-start">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate capitalize leading-7">
            {campaign.title}
          </h3>
          <div className="mt-1 flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                campaign.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              aria-label={`Campaign status: ${campaign.status}`}
            >
              {campaign.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => viewCampaignDetails(campaign._id)}
            className="text-gray-400 hover:text-emerald-600 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="View details"
            aria-label={`View details for ${campaign.title}`}
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <Link
            to={`/campaigns/edit/${campaign._id}`}
            className="text-gray-400 hover:text-blue-600 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Edit campaign"
            aria-label={`Edit ${campaign.title}`}
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={() => handleDelete(campaign._id)}
            className="text-gray-400 hover:text-red-600 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete campaign"
            aria-label={`Delete ${campaign.title}`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mb-4 py-2">
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          <span className="text-xs uppercase tracking-wide">Description</span>
        </div>
        <p className="text-sm sm:text-base text-gray-700 line-clamp-2 leading-6">
          {campaign.description}
        </p>
        {campaign.description && campaign.description.length > 100 && (
          <button
            onClick={() => viewCampaignDetails(campaign._id)}
            className="mt-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium focus:outline-none"
          >
            Read more
          </button>
        )}
      </div>
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-900">Progress</span>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (campaign.current_amount / campaign.goal_amount) * 100 >= 100
                ? "bg-emerald-100 text-emerald-800"
                : (campaign.current_amount / campaign.goal_amount) * 100 > 75
                ? "bg-emerald-100 text-emerald-800"
                : (campaign.current_amount / campaign.goal_amount) * 100 > 40
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {((campaign.current_amount / campaign.goal_amount) * 100).toFixed(
              0
            )}
            %
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full progress-fill transition-all duration-1000 ease-out ${
              (campaign.current_amount / campaign.goal_amount) * 100 >= 100
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : (campaign.current_amount / campaign.goal_amount) * 100 > 75
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : (campaign.current_amount / campaign.goal_amount) * 100 > 40
                ? "bg-gradient-to-r from-blue-400 to-blue-500"
                : "bg-gradient-to-r from-amber-400 to-amber-500"
            }`}
            style={{
              width: `${Math.min(
                (campaign.current_amount / campaign.goal_amount) * 100,
                100
              )}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 text-gray-600">
          <div>
            <span className="text-gray-500">Raised:</span>
            <span className="ml-1 font-semibold text-emerald-700">
              EGP {(campaign.current_amount || 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Goal:</span>
            <span className="ml-1 font-semibold text-gray-700">
              EGP {(campaign.goal_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>
        {(campaign.current_amount / campaign.goal_amount) * 100 >= 100 && (
          <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-200 flex items-center">
            <svg
              className="h-4 w-4 mr-1.5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Goal achieved!
          </div>
        )}
      </div>
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
            {campaign.created_by ? campaign.created_by.username : "N/A"}
          </p>
        </div>
      </div>
      {campaign.attachments && campaign.attachments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Attachments</p>
          <div className="flex flex-wrap gap-2">
            {campaign.attachments.map((attachment, index) => (
              <a
                key={index}
                href={campaignService.getAttachmentUrl(attachment._id)}
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
));

const SortDropdown = ({ sortConfig, setSortConfig, setCurrentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getSortLabel = () => {
    const labels = {
      title: "Title",
      status: "Status",
      start_date: "Start Date",
      end_date: "End Date",
      current_amount: "Amount Raised",
      goal_amount: "Goal Amount",
      progress: "Progress",
    };
    return labels[sortConfig.key] || "Sort By";
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 text-emerald-600 ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-emerald-600 ml-1" />
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 min-w-[140px]"
      >
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 text-gray-500" />
          <span>{getSortLabel()}</span>
          {getSortIcon(sortConfig.key)}
        </div>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-slideDown">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Sort By
            </div>
            {[
              { key: "start_date", label: "Start Date" },
              { key: "end_date", label: "End Date" },
              { key: "current_amount", label: "Amount Raised" },
              { key: "goal_amount", label: "Goal Amount" },
              { key: "progress", label: "Progress" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleSort(option.key)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${
                  sortConfig.key === option.key
                    ? "text-emerald-600 font-medium bg-emerald-50"
                    : "text-gray-700"
                }`}
              >
                {option.label}
                {getSortIcon(option.key)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [sortConfig, setSortConfig] = useState({
    key: "start_date",
    direction: "desc",
  });
  const [activeSortTooltip, setActiveSortTooltip] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await campaignService.getAll();
        const fetchedCampaigns = data.campaigns || [];
        setCampaigns(fetchedCampaigns);
        fetchedCampaigns.forEach((campaign) => {
          updateCampaignStatusIfGoalAchieved(campaign);
        });
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      title: "",
      status: "",
      startDateFrom: "",
      startDateTo: "",
    });
  };

  const filteredCampaigns = campaigns
    .filter((campaign) => {
      if (
        filters.title &&
        !campaign.title.toLowerCase().includes(filters.title.toLowerCase())
      ) {
        return false;
      }

      if (filters.status && campaign.status !== filters.status) {
        return false;
      }

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
    })
    .sort((a, b) => {
      if (sortConfig.key) {
        if (
          sortConfig.key === "current_amount" ||
          sortConfig.key === "goal_amount"
        ) {
          const valueA = a[sortConfig.key] || 0;
          const valueB = b[sortConfig.key] || 0;
          return sortConfig.direction === "asc"
            ? valueA - valueB
            : valueB - valueA;
        } else if (sortConfig.key === "progress") {
          const progressA = a.goal_amount
            ? (a.current_amount / a.goal_amount) * 100
            : 0;
          const progressB = b.goal_amount
            ? (b.current_amount / b.goal_amount) * 100
            : 0;
          return sortConfig.direction === "asc"
            ? progressA - progressB
            : progressB - progressA;
        } else if (
          sortConfig.key === "start_date" ||
          sortConfig.key === "end_date"
        ) {
          const dateA = a[sortConfig.key]
            ? new Date(a[sortConfig.key])
            : new Date(0);
          const dateB = b[sortConfig.key]
            ? new Date(b[sortConfig.key])
            : new Date(0);
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
        }
      }
      return 0;
    });

  const indexOfLastCampaign = currentPage * campaignsPerPage;
  const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;
  const currentCampaigns = filteredCampaigns.slice(
    indexOfFirstCampaign,
    indexOfLastCampaign
  );
  const totalPages = Math.ceil(filteredCampaigns.length / campaignsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toFixed(2);
  };

  const calculateProgress = (campaign) => {
    if (!campaign.goal_amount || campaign.goal_amount <= 0) return 0;
    const currentAmount = campaign.current_amount || 0;
    const percentage = (currentAmount / campaign.goal_amount) * 100;
    return Math.min(percentage, 100);
  };

  const updateCampaignStatusIfGoalAchieved = async (campaign) => {
    if (
      campaign.status === "active" &&
      campaign.current_amount >= campaign.goal_amount
    ) {
      try {
        const updatedCampaign = {
          ...campaign,
          status: "completed",
        };
        await campaignService.update(campaign._id, { status: "completed" });
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((c) =>
            c._id === campaign._id ? { ...c, status: "completed" } : c
          )
        );
        if (campaignDetails && campaignDetails._id === campaign._id) {
          setCampaignDetails({ ...campaignDetails, status: "completed" });
        }
        toast.success(`${campaign.title} campaign marked as completed!`);
      } catch (error) {
        console.error("Error updating campaign status:", error);
        toast.error("Failed to update campaign status");
      }
    }
  };

  const viewCampaignDetails = async (campaignId) => {
    try {
      setLoadingDetails(true);
      setSelectedCampaign(campaignId);
      const response = await campaignService.getById(campaignId);
      const campaign = response.campaign || {};
      setCampaignDetails(campaign);
      if (campaign) {
        updateCampaignStatusIfGoalAchieved(campaign);
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      toast.error("Failed to load campaign details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedCampaign(null);
    setCampaignDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
  };

  const showSortTooltip = (columnName) => {
    setActiveSortTooltip(columnName);
  };

  const hideSortTooltip = () => {
    setActiveSortTooltip(null);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading campaigns..." />;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all donation campaigns
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <SortDropdown
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            setCurrentPage={setCurrentPage}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
            aria-label={showFilters ? "Hide filters" : "Show filters"}
          >
            <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-500" />
            <span className="hidden xs:inline">
              {showFilters ? "Hide Filters" : "Show Filters"}
            </span>
          </button>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            <PlusIcon
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
              aria-hidden="true"
            />
            <span className="hidden xs:inline">Add Campaign</span>
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center transition-colors duration-200"
            >
              <XMarkIcon className="h-4 mr-1" />
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                placeholder="Search by title..."
                value={filters.title}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              />
            </div>
            <div>
              <label
                htmlFor="startDateTo"
                className="block text-sm font-medium text-gray-700"
              >
                End Date (To)
              </label>
              <input
                type="date"
                name="startDateTo"
                id="startDateTo"
                value={filters.startDateTo}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              />
            </div>
          </div>
        </div>
      )}

      {sortConfig && (
        <div className="flex items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-sm text-emerald-700 animate-fadeIn">
          <div className="mr-2 flex-shrink-0">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            Sorted by{" "}
            <span className="font-medium">
              {sortConfig.key === "start_date"
                ? "Start Date"
                : sortConfig.key === "end_date"
                ? "End Date"
                : sortConfig.key === "current_amount"
                ? "Amount Raised"
                : sortConfig.key === "goal_amount"
                ? "Goal Amount"
                : sortConfig.key === "progress"
                ? "Progress"
                : sortConfig.key}
            </span>{" "}
            ({sortConfig.direction === "asc" ? "ascending" : "descending"})
          </div>
          {sortConfig.key !== "start_date" && (
            <button
              onClick={() =>
                setSortConfig({ key: "start_date", direction: "desc" })
              }
              className="ml-auto text-xs bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded text-emerald-700"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.length > 0 ? (
          currentCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              viewCampaignDetails={viewCampaignDetails}
              handleDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            {Object.values(filters).some((value) => value) ? (
              <>
                <p className="text-gray-500 mb-4 text-lg">
                  No campaigns match your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none transition-colors duration-200"
                >
                  <XMarkIcon className="mr-2 h-5 w-5" />
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4 text-lg">No campaigns found</p>
                <Link
                  to="/campaigns/new"
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-6 w-6" aria-hidden="true" />
                  Add First Campaign
                </Link>
              </>
            )}
          </div>
        )}
      </div>

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
              aria-label="Previous page"
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
              aria-label="Next page"
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
                role="navigation"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    )
                  )
                ) : (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === 1
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      aria-current={currentPage === 1 ? "page" : undefined}
                    >
                      1
                    </button>
                    {currentPage > 3 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white">
                        ...
                      </span>
                    )}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (currentPage <= 3) {
                        pageNum = i + 2;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      if (pageNum > 1 && pageNum < totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNum
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                            aria-current={
                              currentPage === pageNum ? "page" : undefined
                            }
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    }).filter(Boolean)}
                    {currentPage < totalPages - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === totalPages
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      aria-current={
                        currentPage === totalPages ? "page" : undefined
                      }
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
                  className={`relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeDetails}
              aria-hidden="true"
            ></div>
            <div className="relative bg-white rounded-lg w-full max-w-md sm:max-w-lg md:max-w-2xl mx-4 sm:mx-auto shadow-2xl transform transition-all duration-300 ease-in-out animate-fade-in flex flex-col max-h-[90vh] h-[700px] modal-campaign-details">
              <button
                onClick={closeDetails}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 z-10"
                aria-label="Close details"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              {loadingDetails ? (
                <div className="flex justify-center items-center h-full p-8">
                  <LoadingSpinner size="md" text="Loading details..." />
                </div>
              ) : campaignDetails ? (
                <div className="flex flex-col h-full">
                  <div className="p-6 sm:p-8 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate capitalize">
                      {campaignDetails.title}
                    </h3>
                  </div>

                  <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar flex-grow">
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
                            EGP {formatCurrency(campaignDetails.current_amount)}
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
                              : "N/A"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Created At</p>
                          <p className="font-medium">
                            {formatDateTime(campaignDetails.created_at)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Last Updated</p>
                          <p className="font-medium">
                            {formatDateTime(campaignDetails.updated_at)}
                            {campaignDetails.updated_by ? (
                              <span className="ml-1">
                                by{" "}
                                <span className="font-semibold">
                                  {campaignDetails.updated_by.username || "N/A"}
                                </span>
                              </span>
                            ) : campaignDetails.created_by &&
                              campaignDetails.updated_at ? (
                              <span className="ml-1">
                                by{" "}
                                <span className="font-semibold">
                                  {campaignDetails.created_by.username || "N/A"}
                                </span>
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">
                            Progress
                          </p>
                          <div className="flex items-center">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                calculateProgress(campaignDetails) >= 100
                                  ? "bg-emerald-100 text-emerald-800"
                                  : calculateProgress(campaignDetails) >= 75
                                  ? "bg-emerald-100 text-emerald-800"
                                  : calculateProgress(campaignDetails) >= 40
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {calculateProgress(campaignDetails).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="relative w-full">
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full progress-fill transition-all duration-1000 ease-out ${
                                calculateProgress(campaignDetails) >= 100
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                  : calculateProgress(campaignDetails) >= 75
                                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  : calculateProgress(campaignDetails) >= 40
                                  ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                  : "bg-gradient-to-r from-amber-400 to-amber-500"
                              }`}
                              style={{
                                width: `${calculateProgress(campaignDetails)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                          <div>
                            <span className="text-gray-500">Raised:</span>
                            <span className="ml-1 font-semibold text-emerald-700">
                              EGP{" "}
                              {formatCurrency(campaignDetails.current_amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Goal:</span>
                            <span className="ml-1 font-semibold text-gray-700">
                              EGP {formatCurrency(campaignDetails.goal_amount)}
                            </span>
                          </div>
                        </div>

                        {calculateProgress(campaignDetails) >= 100 && (
                          <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-200 flex items-center">
                            <svg
                              className="h-4 w-4 mr-1.5 text-emerald-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Goal achieved! Campaign has met its funding target.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h7"
                          />
                        </svg>
                        Description
                      </h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {campaignDetails.description}
                      </p>
                    </div>
                    {campaignDetails.donations &&
                    campaignDetails.donations.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Recent Donations
                        </h4>
                        <div className="border rounded-lg overflow-hidden max-h-64">
                          <div className="overflow-y-auto max-h-64 custom-scrollbar">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0 z-10">
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
                                  <tr
                                    key={donation._id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {donation.donor_name}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-emerald-700">
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
                        {campaignDetails.donations.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2 italic text-right">
                            Scroll to view all{" "}
                            {campaignDetails.donations.length} donations
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 mx-auto text-gray-400 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-gray-500">
                          No donations yet for this campaign
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
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
