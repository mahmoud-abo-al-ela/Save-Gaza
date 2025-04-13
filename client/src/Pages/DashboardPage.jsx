import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { donationService, campaignService, userService } from "../services/api";
import {
  CurrencyDollarIcon,
  FlagIcon,
  UsersIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../Components/common/LoadingSpinner";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    donations: { count: 0, totalAmount: 0 },
    campaigns: { count: 0, active: 0 },
    users: { count: 0 },
  });
  const [recentDonations, setRecentDonations] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch data in parallel
        const [donationsResponse, campaignsResponse, usersResponse] =
          await Promise.all([
            donationService.getAll(),
            campaignService.getAll(),
            userService.getAll(),
          ]);

        // Extract donations array from response
        const donations = donationsResponse.donations || [];
        const campaigns = campaignsResponse.campaigns || [];
        const users = usersResponse.users || [];

        // Calculate stats
        const totalDonations = donations.length;
        const totalAmount = donations.reduce(
          (sum, donation) => sum + (donation.amount || 0),
          0
        );
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(
          (campaign) => campaign.status === "active"
        ).length;
        const totalUsers = users.length;

        // Get 5 most recent donations
        const recent = [...donations]
          .sort((a, b) => new Date(b.date_received) - new Date(a.date_received))
          .slice(0, 5);

        setStats({
          donations: { count: totalDonations, totalAmount },
          campaigns: { count: totalCampaigns, active: activeCampaigns },
          users: { count: totalUsers },
        });

        setRecentDonations(recent);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard data..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of donation management platform
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Donations card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-500 rounded-md p-3">
                <CurrencyDollarIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Donations
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.donations.count}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/donations"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                View all donations
              </Link>
            </div>
          </div>
        </div>

        {/* Total Amount card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <CurrencyDollarIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      EGP {stats.donations.totalAmount.toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/donations/new"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Add new donation
              </Link>
            </div>
          </div>
        </div>

        {/* Campaigns card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <FlagIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Campaigns
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stats.campaigns.active} / {stats.campaigns.count}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/campaigns"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                View all campaigns
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent donations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Donations
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Donor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Campaign Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDonations.length > 0 ? (
                recentDonations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.donor_name || "Anonymous"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.amount
                        ? `EGP ${donation.amount.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {donation.donation_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(donation.date_received).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.campaign_id ? donation.campaign_id.title : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    No donations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
          <Link
            to="/donations"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            View all donations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
