import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { donationService, campaignService } from "../services/api";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  FunnelIcon,
  XMarkIcon,
  TableCellsIcon,
  ViewColumnsIcon,
  GiftIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  BuildingLibraryIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../Components/common/LoadingSpinner";
import { toast } from "react-hot-toast";

const DonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donationDetails, setDonationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filters, setFilters] = useState({
    donorName: "",
    donationType: "",
    campaignId: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [donationsPerPage] = useState(10);

  // Fetch donations and campaigns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [donationsData, campaignsData] = await Promise.all([
          donationService.getAll(),
          campaignService.getAll(),
        ]);
        setDonations(donationsData.donations || []);
        setCampaigns(campaignsData.campaigns || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load donations");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add pagination reset when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Apply filters to donations
  const filteredDonations = donations.filter((donation) => {
    // Filter by donor name
    if (
      filters.donorName &&
      (!donation.donor_name ||
        !donation.donor_name
          .toLowerCase()
          .includes(filters.donorName.toLowerCase()))
    ) {
      return false;
    }

    // Filter by donation type
    if (
      filters.donationType &&
      donation.donation_type !== filters.donationType
    ) {
      return false;
    }

    // Filter by campaign
    if (filters.campaignId && donation.campaign_id !== filters.campaignId) {
      return false;
    }

    // Filter by date range
    if (
      filters.startDate &&
      new Date(donation.date_received) < new Date(filters.startDate)
    ) {
      return false;
    }

    if (
      filters.endDate &&
      new Date(donation.date_received) > new Date(filters.endDate)
    ) {
      return false;
    }

    return true;
  });

  // Calculate pagination values
  const indexOfLastDonation = currentPage * donationsPerPage;
  const indexOfFirstDonation = indexOfLastDonation - donationsPerPage;
  const currentDonations = filteredDonations.slice(
    indexOfFirstDonation,
    indexOfLastDonation
  );
  const totalPages = Math.ceil(filteredDonations.length / donationsPerPage);

  // Handle deleting a donation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this donation?")) {
      return;
    }

    try {
      await donationService.delete(id);
      setDonations(donations.filter((donation) => donation._id !== id));
      toast.success("Donation deleted successfully");
    } catch (error) {
      console.error("Error deleting donation:", error);
      toast.error("Failed to delete donation");
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
      donorName: "",
      donationType: "",
      campaignId: "",
      startDate: "",
      endDate: "",
    });
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === "table" ? "card" : "table");
  };

  // Get campaign name by ID
  const getCampaignName = (campaignId) => {
    if (!campaignId) return "None";
    const campaign = campaigns.find((c) => c._id === campaignId);
    return campaign ? campaign.title : "Unknown";
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // View donation details
  const viewDonationDetails = async (donationId) => {
    try {
      setLoadingDetails(true);
      setSelectedDonation(donationId);

      const response = await donationService.getById(donationId);
      setDonationDetails(response.donation);
    } catch (error) {
      console.error("Error fetching donation details:", error);
      toast.error("Failed to load donation details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close donation details modal
  const closeDetails = () => {
    setSelectedDonation(null);
    setDonationDetails(null);
  };

  // Handle pagination changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading donations..." />;
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Donations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all donations
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={toggleViewMode}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
            aria-label={`Switch to ${
              viewMode === "table" ? "card" : "table"
            } view`}
          >
            {viewMode === "table" ? (
              <>
                <ViewColumnsIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-500" />
                <span className="hidden xs:inline">Card View</span>
              </>
            ) : (
              <>
                <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-500" />
                <span className="hidden xs:inline">Table View</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-500" />
            <span className="hidden xs:inline">
              {showFilters ? "Hide Filters" : "Show Filters"}
            </span>
          </button>
          <Link
            to="/donations/new"
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            <PlusIcon
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
              aria-hidden="true"
            />
            <span className="hidden xs:inline">Add Donation</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="donorName"
                className="block text-sm font-medium text-gray-700"
              >
                Donor Name
              </label>
              <input
                type="text"
                name="donorName"
                id="donorName"
                value={filters.donorName}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              />
            </div>

            <div>
              <label
                htmlFor="donationType"
                className="block text-sm font-medium text-gray-700"
              >
                Donation Type
              </label>
              <select
                name="donationType"
                id="donationType"
                value={filters.donationType}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              >
                <option value="">All Types</option>
                <option value="cash">Cash</option>
                <option value="goods">Goods</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="campaignId"
                className="block text-sm font-medium text-gray-700"
              >
                Campaign
              </label>
              <select
                name="campaignId"
                id="campaignId"
                value={filters.campaignId}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              >
                <option value="">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm form-input-custom"
              />
            </div>
          </div>
        </div>
      )}

      {filteredDonations.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 sm:p-8 text-center animate-fadeIn">
          <p className="text-gray-500 mb-4">No donations match your filters</p>
          {Object.values(filters).some((value) => value) && (
            <button
              onClick={clearFilters}
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" && (
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Donor
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type/Amount
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                    >
                      Campaign
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                    >
                      Created By
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDonations.length > 0 ? (
                    currentDonations.map((donation) => (
                      <tr key={donation._id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 capitalize">
                            {donation.donor_name}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${
                                donation.donation_type === "cash"
                                  ? "text-green-500"
                                  : "text-blue-500"
                              }`}
                            >
                              {donation.donation_type === "cash" ? (
                                <BanknotesIcon />
                              ) : (
                                <GiftIcon />
                              )}
                            </span>
                            <div className="text-xs sm:text-sm text-gray-900">
                              <span>
                                {donation.donation_type === "cash"
                                  ? `EGP ${donation.amount.toFixed(2)}`
                                  : donation.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {formatDate(donation.date_received)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs sm:text-sm text-gray-900 capitalize">
                            {getCampaignName(donation.campaign_id)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-xs sm:text-sm text-gray-900 capitalize">
                            {donation.received_by
                              ? donation.received_by.username
                              : "Unknown"}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => viewDonationDetails(donation._id)}
                              className="text-emerald-600 hover:text-emerald-900"
                              title="View details"
                            >
                              <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <Link
                              to={`/donations/edit/${donation._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit donation"
                            >
                              <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(donation._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete donation"
                            >
                              <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No donations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Card View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDonations.length > 0 ? (
                currentDonations.map((donation) => (
                  <div
                    key={donation._id}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
                  >
                    {/* Card Header with Status Badge */}
                    <div className="relative">
                      <div
                        className={`h-2 w-full ${
                          donation.donation_type === "cash"
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                      ></div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 sm:p-5">
                      <div className="flex justify-between mb-3 items-start">
                        <div>
                          <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 truncate capitalize">
                            {donation.donor_name || "Anonymous"}
                          </h3>
                          <div className="mt-1 flex items-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                donation.donation_type === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {donation.donation_type === "cash" ? (
                                <BanknotesIcon className="mr-1 h-3 w-3" />
                              ) : (
                                <GiftIcon className="mr-1 h-3 w-3" />
                              )}
                              {donation.donation_type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-1">
                          <button
                            onClick={() => viewDonationDetails(donation._id)}
                            className="text-gray-400 hover:text-emerald-600 rounded-full p-1 hover:bg-gray-100"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <Link
                            to={`/donations/edit/${donation._id}`}
                            className="text-gray-400 hover:text-blue-600 rounded-full p-1 hover:bg-gray-100"
                            title="Edit donation"
                          >
                            <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(donation._id)}
                            className="text-gray-400 hover:text-red-600 rounded-full p-1 hover:bg-gray-100"
                            title="Delete donation"
                          >
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Amount Section (For Cash) */}
                      {donation.donation_type === "cash" && (
                        <div className="mt-2 sm:mt-3 mb-3 sm:mb-4 text-center py-2 sm:py-3 px-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Amount
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">
                            EGP {donation.amount.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {/* Description Section (For Goods) */}
                      {donation.donation_type === "goods" && (
                        <div className="mt-2 sm:mt-3 mb-3 sm:mb-4 py-2 sm:py-3 px-2 sm:px-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Description
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                            {donation.description}
                          </p>
                        </div>
                      )}

                      {/* Info Grid */}
                      <div className="border-t border-gray-100 pt-3 sm:pt-4 grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Date Received</p>
                          <div className="flex items-center mt-1">
                            <CalendarIcon className="flex-shrink-0 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {formatDate(donation.date_received)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Campaign</p>
                          <div className="flex items-center mt-1">
                            <BuildingLibraryIcon className="flex-shrink-0 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate capitalize">
                              {getCampaignName(donation.campaign_id)}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Received By</p>
                          <div className="flex items-center mt-1">
                            <UserIcon className="flex-shrink-0 mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize">
                              {donation.received_by?.username || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500 mb-2">No donations found</p>
                  <Link
                    to="/donations/new"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
                    Add First Donation
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredDonations.length > donationsPerPage && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-2 py-3 sm:px-6 rounded-lg shadow">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-md px-2 py-1 text-xs sm:text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <span className="mx-2 text-xs text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md px-2 py-1 text-xs sm:text-sm font-medium ${
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
                  <p className="text-xs sm:text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {indexOfFirstDonation + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastDonation, filteredDonations.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredDonations.length}
                    </span>{" "}
                    donations
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        aria-hidden="true"
                      />
                    </button>
                    {totalPages <= 5 ? (
                      // If 5 pages or fewer, show all pages
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium ${
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
                      // If more than 5 pages, show a subset with ellipsis
                      <>
                        {/* First page */}
                        <button
                          onClick={() => handlePageChange(1)}
                          className={`relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium ${
                            currentPage === 1
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          1
                        </button>

                        {/* Ellipsis or page 2 */}
                        {currentPage > 3 && (
                          <span className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white">
                            ...
                          </span>
                        )}

                        {/* Pages around current page */}
                        {Array.from(
                          { length: Math.min(3, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (currentPage <= 3) {
                              // Near start
                              pageNum = i + 2;
                            } else if (currentPage >= totalPages - 2) {
                              // Near end
                              pageNum = totalPages - 4 + i;
                            } else {
                              // Middle
                              pageNum = currentPage - 1 + i;
                            }

                            // Only render if page is between 2 and (totalPages - 1)
                            if (pageNum > 1 && pageNum < totalPages) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium ${
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
                          }
                        ).filter(Boolean)}

                        {/* Ellipsis or second to last page */}
                        {currentPage < totalPages - 2 && (
                          <span className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white">
                            ...
                          </span>
                        )}

                        {/* Last page */}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className={`relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium ${
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
                      <ChevronRightIcon
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Donation Details Modal */}
      {selectedDonation && (
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-full sm:max-w-lg w-full sm:p-6">
              <button
                onClick={closeDetails}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 z-10"
                aria-label="Close details"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              {loadingDetails ? (
                <div className="flex justify-center">
                  <LoadingSpinner size="md" text="Loading details..." />
                </div>
              ) : donationDetails ? (
                <>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Donation Details
                      </h3>

                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Donor Name
                            </p>
                            <p className="font-medium capitalize text-xs sm:text-sm">
                              {donationDetails.donor_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Donation Type
                            </p>
                            <p className="font-medium capitalize text-xs sm:text-sm">
                              {donationDetails.donation_type}
                            </p>
                          </div>
                          {donationDetails.donation_type === "cash" && (
                            <div>
                              <p className="text-gray-500 text-xs sm:text-sm">
                                Amount
                              </p>
                              <p className="font-medium text-xs sm:text-sm">
                                EGP {donationDetails.amount.toFixed(2)}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Date Received
                            </p>
                            <p className="font-medium text-xs sm:text-sm">
                              {formatDate(donationDetails.date_received)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Created By
                            </p>
                            <p className="font-medium capitalize text-xs sm:text-sm">
                              {donationDetails.received_by
                                ? donationDetails.received_by.username
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Campaign
                            </p>
                            <p className="font-medium text-xs sm:text-sm">
                              {donationDetails.campaign_id
                                ? getCampaignName(donationDetails.campaign_id)
                                : "None"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Created At
                            </p>
                            <p className="font-medium text-xs sm:text-sm">
                              {donationDetails.created_at
                                ? new Date(
                                    donationDetails.created_at
                                  ).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">
                              Last Updated
                            </p>
                            <p className="font-medium text-xs sm:text-sm">
                              {donationDetails.updated_at
                                ? new Date(
                                    donationDetails.updated_at
                                  ).toLocaleString()
                                : "Unknown"}
                              {donationDetails.updated_by ? (
                                <span className="ml-1">
                                  by{" "}
                                  <span className="font-semibold">
                                    {donationDetails.updated_by.username ||
                                      "Unknown"}
                                  </span>
                                </span>
                              ) : donationDetails.received_by &&
                                donationDetails.updated_at ? (
                                <span className="ml-1">
                                  by{" "}
                                  <span className="font-semibold">
                                    {donationDetails.received_by.username ||
                                      "Unknown"}
                                  </span>
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      </div>

                      {donationDetails.donation_type === "goods" && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Description
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {donationDetails.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    Donation details not available
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

export default DonationsPage;
