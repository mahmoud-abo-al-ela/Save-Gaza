import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CurrencyDollarIcon,
  FlagIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";
import sanitizeFilename from "sanitize-filename";
import LoadingSpinner from "../Components/common/LoadingSpinner";
import { donationService, campaignService, userService } from "../services/api";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Constants
const TYPE_COLORS = {
  cash: "bg-emerald-500",
  online: "bg-blue-500",
  check: "bg-purple-500",
  bank: "bg-indigo-500",
  crypto: "bg-orange-500",
  unknown: "bg-gray-500",
};

const CHART_COLORS = {
  cash: "rgba(16, 185, 129, 0.6)",
  online: "rgba(59, 130, 246, 0.6)",
  check: "rgba(168, 85, 247, 0.6)",
  bank: "rgba(99, 102, 241, 0.6)",
  crypto: "rgba(249, 115, 22, 0.6)",
  unknown: "rgba(107, 114, 128, 0.6)",
};

// Utility Functions
const formatDate = (date) => new Date(date).toISOString().split("T")[0];

const escapeCsvField = (field) => {
  if (field == null) return "";
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
};

const formatCurrency = (amount, currency = "EGP") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    donations: { count: 0, totalAmount: 0, typeDistribution: {} },
    campaigns: { count: 0, active: 0 },
    users: { count: 0 },
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [donationsResponse, campaignsResponse, usersResponse] =
          await Promise.all([
            donationService.getAll(),
            campaignService.getAll(),
            userService.getAll(),
          ]);

        const donations = donationsResponse.donations || [];
        const campaigns = campaignsResponse.campaigns || [];
        const users = usersResponse.users || [];

        const totalDonations = donations.length;
        const totalAmount = donations.reduce(
          (sum, donation) => sum + (donation.amount || 0),
          0
        );
        const typeDistribution = donations.reduce((acc, donation) => {
          const type = donation.donation_type || "unknown";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(
          (campaign) => campaign.status === "active"
        ).length;
        const totalUsers = users.length;

        setStats({
          donations: { count: totalDonations, totalAmount, typeDistribution },
          campaigns: { count: totalCampaigns, active: activeCampaigns },
          users: { count: totalUsers },
        });

        const recent = [...donations]
          .sort((a, b) => new Date(b.date_received) - new Date(a.date_received))
          .slice(0, 5);

        setRecentDonations(recent);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDownloadOptions(false);
      }
    };

    // Add event listener when dropdown is open
    if (showDownloadOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDownloadOptions]);

  // Memoized filtered donations for export
  const filteredDonations = useMemo(() => {
    return recentDonations.filter((donation) => {
      const date = new Date(donation.date_received);
      return (
        (!dateRange.start || date >= new Date(dateRange.start)) &&
        (!dateRange.end || date <= new Date(dateRange.end))
      );
    });
  }, [recentDonations, dateRange]);

  // Memoized chart data
  const chartData = useMemo(
    () => ({
      labels: Object.keys(stats.donations.typeDistribution),
      datasets: [
        {
          label: "Donations by Type",
          data: Object.values(stats.donations.typeDistribution),
          backgroundColor: Object.keys(stats.donations.typeDistribution).map(
            (type) => CHART_COLORS[type.toLowerCase()] || CHART_COLORS.unknown
          ),
          borderColor: Object.keys(stats.donations.typeDistribution).map(
            (type) => {
              const color =
                CHART_COLORS[type.toLowerCase()] || CHART_COLORS.unknown;
              return color
                ? color.replace("0.6", "1")
                : "rgba(107, 114, 128, 1)"; // Safe fallback color if undefined
            }
          ),
          borderWidth: 1,
        },
      ],
    }),
    [stats.donations.typeDistribution]
  );

  // Download Functions
  const downloadStatsCSV = () => {
    try {
      if (
        !stats.donations.count &&
        !stats.campaigns.count &&
        !stats.users.count
      ) {
        toast.error("No data available to export");
        return;
      }

      // Create a safe timestamp string for filenames
      const now = new Date();
      const safeTimestamp = now.toISOString().replace(/[:.]/g, "-");

      let csvContent = "data:text/csv;charset=utf-8,";

      // Metadata
      csvContent += "Report Title,Donation Platform Statistics\n";
      csvContent += `Generated At,${now.toISOString()}\n`;
      csvContent += "Platform,Save Gaza\n\n";

      // Donation Summary
      csvContent += "Donation Summary\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Donations,${stats.donations.count}\n`;
      csvContent += `Total Amount,${formatCurrency(
        stats.donations.totalAmount
      )}\n`;
      csvContent += `Average Donation,${
        stats.donations.count
          ? formatCurrency(stats.donations.totalAmount / stats.donations.count)
          : "0.00"
      }\n\n`;

      // Donation Type Distribution
      csvContent += "Donation Type Distribution\n";
      csvContent += "Type,Count,Percentage\n";
      Object.entries(stats.donations.typeDistribution).forEach(
        ([type, count]) => {
          const percentage = stats.donations.count
            ? ((count / stats.donations.count) * 100).toFixed(1)
            : 0;
          csvContent += `${escapeCsvField(type)},${count},${percentage}%\n`;
        }
      );
      csvContent += "\n";

      // Campaign Stats
      csvContent += "Campaign Stats\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Campaigns,${stats.campaigns.count}\n`;
      csvContent += `Active Campaigns,${stats.campaigns.active}\n`;
      csvContent += `Success Rate,${
        stats.campaigns.count
          ? ((stats.campaigns.active / stats.campaigns.count) * 100).toFixed(1)
          : 0
      }%\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        sanitizeFilename(`savegaza_stats_${safeTimestamp}.csv`)
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Statistics CSV downloaded");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to download CSV");
    }
  };

  const downloadStatsPDF = () => {
    try {
      if (
        !stats.donations.count &&
        !stats.campaigns.count &&
        !stats.users.count
      ) {
        toast.error("No data available to export");
        return;
      }

      // Create a safe timestamp string for filenames
      const now = new Date();
      const safeTimestamp = now.toISOString().replace(/[:.]/g, "-");

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Save Gaza Statistics Report", 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${now.toISOString()}`, 14, 30);

      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Donations", stats.donations.count],
          ["Total Amount", formatCurrency(stats.donations.totalAmount)],
          [
            "Average Donation",
            stats.donations.count
              ? formatCurrency(
                  stats.donations.totalAmount / stats.donations.count
                )
              : "0.00",
          ],
          ["Total Campaigns", stats.campaigns.count],
          ["Active Campaigns", stats.campaigns.active],
          [
            "Success Rate",
            stats.campaigns.count
              ? (
                  (stats.campaigns.active / stats.campaigns.count) *
                  100
                ).toFixed(1) + "%"
              : "0%",
          ],
        ],
        theme: "striped",
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Donation Type", "Count", "Percentage"]],
        body: Object.entries(stats.donations.typeDistribution).map(
          ([type, count]) => [
            type,
            count,
            stats.donations.count
              ? ((count / stats.donations.count) * 100).toFixed(1) + "%"
              : "0%",
          ]
        ),
        theme: "striped",
      });

      doc.save(sanitizeFilename(`savegaza_stats_${safeTimestamp}.pdf`));
      toast.success("Statistics PDF downloaded");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const downloadDonationDetails = () => {
    try {
      if (!filteredDonations.length) {
        toast.error("No donation details available to export");
        return;
      }

      // Create a safe timestamp string for filenames
      const now = new Date();
      const safeTimestamp = now.toISOString().replace(/[:.]/g, "-");

      let csvContent = "data:text/csv;charset=utf-8,";

      // Metadata
      csvContent += "Report Title,Recent Donation Details\n";
      csvContent += `Generated At,${now.toISOString()}\n`;
      csvContent += "Platform,Save Gaza\n";
      if (dateRange.start || dateRange.end) {
        csvContent += `Date Range,${dateRange.start || "N/A"} to ${
          dateRange.end || "N/A"
        }\n`;
      }
      csvContent += "\n";

      // Donation Details
      csvContent += "Donor Name,Amount,Type,Date,Campaign,Created By,Status\n";
      filteredDonations.forEach((donation) => {
        const fields = [
          donation.donor_name || "Anonymous",
          donation.amount ? donation.amount.toFixed(2) : "-",
          donation.donation_type || "-",
          donation.date_received ? formatDate(donation.date_received) : "-",
          donation.campaign_id ? donation.campaign_id.title : "-",
          donation.received_by ? donation.received_by.username : "Unknown",
          donation.status || "Completed",
        ];
        csvContent += fields.map(escapeCsvField).join(",") + "\n";
      });

      // Summary
      const totalAmount = filteredDonations.reduce(
        (sum, d) => sum + (d.amount || 0),
        0
      );
      csvContent += "\nSummary\n";
      csvContent += `Total Donations,${filteredDonations.length}\n`;
      csvContent += `Total Amount,${formatCurrency(totalAmount)}\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        sanitizeFilename(`savegaza_donation_details_${safeTimestamp}.csv`)
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Donation details CSV downloaded");
    } catch (error) {
      console.error("Error generating donation details CSV:", error);
      toast.error("Failed to download donation details");
    }
  };

  const downloadDonationDetailsPDF = () => {
    try {
      if (!filteredDonations.length) {
        toast.error("No donation details available to export");
        return;
      }

      // Create a safe timestamp string for filenames
      const now = new Date();
      const safeTimestamp = now.toISOString().replace(/[:.]/g, "-");

      const doc = new jsPDF();

      // Add header
      doc.setFontSize(16);
      doc.text("Save Gaza Donation Details", 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${now.toISOString()}`, 14, 28);

      if (dateRange.start || dateRange.end) {
        doc.text(
          `Date Range: ${dateRange.start || "N/A"} to ${
            dateRange.end || "N/A"
          }`,
          14,
          34
        );
      }

      // Add donations table
      autoTable(doc, {
        startY: dateRange.start || dateRange.end ? 40 : 34,
        head: [
          [
            "Donor",
            "Amount",
            "Type",
            "Date",
            "Campaign",
            "Created By",
            "Status",
          ],
        ],
        body: filteredDonations.map((donation) => [
          donation.donor_name || "Anonymous",
          donation.amount ? formatCurrency(donation.amount) : "-",
          donation.donation_type || "-",
          donation.date_received ? formatDate(donation.date_received) : "-",
          donation.campaign_id ? donation.campaign_id.title : "-",
          donation.received_by ? donation.received_by.username : "Unknown",
          donation.status || "Completed",
        ]),
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 }, // Donor name
          1: { cellWidth: 25 }, // Amount
          2: { cellWidth: 20 }, // Type
          3: { cellWidth: 25 }, // Date
          4: { cellWidth: 35 }, // Campaign
          5: { cellWidth: 25 }, // Created By
          6: { cellWidth: 20 }, // Status
        },
      });

      // Add summary section at the bottom
      const totalAmount = filteredDonations.reduce(
        (sum, d) => sum + (d.amount || 0),
        0
      );

      const finalY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text("Summary", 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        body: [
          ["Total Donations", filteredDonations.length.toString()],
          ["Total Amount", formatCurrency(totalAmount)],
          [
            "Average Donation",
            filteredDonations.length
              ? formatCurrency(totalAmount / filteredDonations.length)
              : "-",
          ],
        ],
        theme: "plain",
        styles: { fontSize: 10 },
      });

      doc.save(
        sanitizeFilename(`savegaza_donation_details_${safeTimestamp}.pdf`)
      );
      toast.success("Donation details PDF downloaded");
    } catch (error) {
      console.error("Error generating donation details PDF:", error);
      toast.error("Failed to download donation details as PDF");
    }
  };

  const getTypeColor = (type) =>
    TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.unknown;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rwd-container space-y-6 xs:space-y-8 animate-fadeIn">
      <div className="border-b border-gray-200 pb-4 xs:pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl xs:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1.5 xs:mt-2 text-xs xs:text-sm text-gray-600 max-w-4xl">
            Overview of donation metrics, recent activities, and export options.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 relative">
          <button
            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            className="inline-flex items-center px-3 xs:px-4 py-1.5 xs:py-2 border border-transparent text-xs xs:text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            aria-expanded={showDownloadOptions}
            aria-haspopup="true"
          >
            <ArrowDownTrayIcon
              className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2"
              aria-hidden="true"
            />
            Download Reports
          </button>
          {showDownloadOptions && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-48 xs:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 animate-fadeIn"
            >
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={downloadStatsCSV}
                  className="w-full text-left block px-4 py-2 text-xs xs:text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon
                      className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-emerald-500"
                      aria-hidden="true"
                    />
                    Statistics (CSV)
                  </div>
                </button>
                <button
                  onClick={downloadStatsPDF}
                  className="w-full text-left block px-4 py-2 text-xs xs:text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon
                      className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-red-500"
                      aria-hidden="true"
                    />
                    Statistics (PDF)
                  </div>
                </button>
                <button
                  onClick={downloadDonationDetails}
                  className="w-full text-left block px-4 py-2 text-xs xs:text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon
                      className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-purple-500"
                      aria-hidden="true"
                    />
                    Donation Details (CSV)
                  </div>
                </button>
                <button
                  onClick={downloadDonationDetailsPDF}
                  className="w-full text-left block px-4 py-2 text-xs xs:text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <DocumentArrowDownIcon
                      className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-orange-500"
                      aria-hidden="true"
                    />
                    Donation Details (PDF)
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 xs:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl border border-gray-100">
          <div className="p-4 xs:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-2 xs:p-3 shadow-md">
                <CurrencyDollarIcon
                  className="h-5 w-5 xs:h-7 xs:w-7 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3 xs:ml-5 flex-1">
                <dt className="text-xs xs:text-sm font-medium text-gray-500">
                  Total Donations
                </dt>
                <dd className="text-xl xs:text-2xl font-semibold text-gray-900">
                  {stats.donations.count}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 xs:px-6 py-2 xs:py-3 flex justify-between items-center rounded-b-xl">
            <Link
              to="/donations"
              className="text-xs xs:text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center"
            >
              View all
              <svg
                className="h-3.5 w-3.5 xs:h-4 xs:w-4 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <span className="text-[10px] xs:text-xs text-gray-500 flex items-center">
              <ClockIcon
                className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-1"
                aria-hidden="true"
              />
              Updated now
            </span>
          </div>
        </div>

        <div className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl border border-gray-100">
          <div className="p-4 xs:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-2 xs:p-3 shadow-md">
                <CurrencyDollarIcon
                  className="h-5 w-5 xs:h-7 xs:w-7 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3 xs:ml-5 flex-1">
                <dt className="text-xs xs:text-sm font-medium text-gray-500">
                  Total Amount
                </dt>
                <dd className="text-xl xs:text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.donations.totalAmount)}
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 xs:px-6 py-2 xs:py-3 flex justify-between items-center rounded-b-xl">
            <Link
              to="/donations/new"
              className="text-xs xs:text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
            >
              Add new
              <svg
                className="h-3.5 w-3.5 xs:h-4 xs:w-4 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <span className="text-[10px] xs:text-xs text-gray-500 flex items-center">
              <ClockIcon
                className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-1"
                aria-hidden="true"
              />
              Updated now
            </span>
          </div>
        </div>

        <div className="bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl border border-gray-100">
          <div className="p-4 xs:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-2 xs:p-3 shadow-md">
                <FlagIcon
                  className="h-5 w-5 xs:h-7 xs:w-7 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3 xs:ml-5 flex-1">
                <dt className="text-xs xs:text-sm font-medium text-gray-500">
                  Active Campaigns
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-xl xs:text-2xl font-semibold text-gray-900">
                    {stats.campaigns.active}
                  </div>
                  <div className="ml-2 text-xs xs:text-sm text-gray-500">
                    of {stats.campaigns.count} total
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 xs:px-6 py-2 xs:py-3 flex justify-between items-center rounded-b-xl">
            <Link
              to="/campaigns"
              className="text-xs xs:text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              View all
              <svg
                className="h-3.5 w-3.5 xs:h-4 xs:w-4 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <span className="text-[10px] xs:text-xs text-gray-500 flex items-center">
              <ClockIcon
                className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-1"
                aria-hidden="true"
              />
              Updated now
            </span>
          </div>
        </div>
      </div>

      {/* Donation Type Distribution (Chart) */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100">
        <div className="px-4 xs:px-6 py-4 xs:py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base xs:text-lg font-medium text-gray-900 flex items-center">
            <ChartBarIcon
              className="h-4 w-4 xs:h-5 xs:w-5 mr-1.5 xs:mr-2 text-purple-500"
              aria-hidden="true"
            />
            Donation Types
          </h3>
          <span className="text-[10px] xs:text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
            {Object.keys(stats.donations.typeDistribution).length} categories
          </span>
        </div>
        <div className="p-4 xs:p-6">
          {Object.keys(stats.donations.typeDistribution).length > 0 ? (
            <div className="h-48 xs:h-64">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: "Donations" },
                    },
                    x: { title: { display: true, text: "Type" } },
                  },
                }}
                aria-label="Bar chart of donation types"
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              No donation types to display.
            </p>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100 p-4 xs:p-6">
        <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-3 xs:mb-4">
          Export Donations Filter
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
          <div>
            <label
              htmlFor="start-date"
              className="block text-xs xs:text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 xs:p-2 text-xs xs:text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block text-xs xs:text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 xs:p-2 text-xs xs:text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100">
        <div className="px-4 xs:px-6 py-4 xs:py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-base xs:text-lg font-medium text-gray-900 flex items-center">
            <ClockIcon
              className="h-4 w-4 xs:h-5 xs:w-5 mr-1.5 xs:mr-2 text-emerald-500"
              aria-hidden="true"
            />
            Recent Donations
          </h3>
          <span className="text-[10px] xs:text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
            Last {recentDonations.length} of {stats.donations.count}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            aria-label="Recent donations table"
          >
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-3 xs:px-6 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Donor
                </th>
                <th
                  scope="col"
                  className="px-3 xs:px-6 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-3 xs:px-6 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-3 xs:px-6 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-3 xs:px-6 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Campaign
                </th>
                <th
                  scope="col"
                  className="px-3 xs:px-6 py-2 xs:py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDonations.length > 0 ? (
                recentDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-3 xs:px-6 py-2 xs:py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          {donation.donor_name
                            ? donation.donor_name.charAt(0).toUpperCase()
                            : "A"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {donation.donor_name || "Anonymous"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 xs:px-6 py-2 xs:py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {donation.amount ? formatCurrency(donation.amount) : "-"}
                    </td>
                    <td className="px-3 xs:px-6 py-2 xs:py-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(
                          donation.donation_type
                        )} bg-opacity-10 capitalize`}
                      >
                        {donation.donation_type || "unknown"}
                      </span>
                    </td>
                    <td className="px-3 xs:px-6 py-2 xs:py-3 whitespace-nowrap text-sm text-gray-500">
                      {donation.date_received
                        ? formatDate(donation.date_received)
                        : "-"}
                    </td>
                    <td className="px-3 xs:px-6 py-2 xs:py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {donation.campaign_id ? donation.campaign_id.title : "-"}
                    </td>
                    <td className="px-3 xs:px-6 py-2 xs:py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {donation.received_by
                        ? donation.received_by.username
                        : "Unknown"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    <div className="py-6">
                      <svg
                        className="h-12 w-12 text-gray-300 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="mt-2 text-base font-medium text-gray-600">
                        No donations yet
                      </p>
                      <Link
                        to="/donations/new"
                        className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                      >
                        Add donation
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <Link
            to="/donations"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center"
          >
            View all donations
            <svg
              className="h-4 w-4 ml-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @media (max-width: 640px) {
          table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
