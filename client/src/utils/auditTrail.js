/**
 * Utility functions for handling audit trails and tracking entity changes
 */

/**
 * Format a timestamp in a user-friendly way
 * @param {string|Date} timestamp - The timestamp to format
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} Formatted date and time
 */
export const formatTimestamp = (timestamp, includeTime = true) => {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";

  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
};

/**
 * Format relative time (e.g. "2 hours ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return formatTimestamp(timestamp, false);
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

/**
 * Format update information in a consistent way
 * @param {Object} entity - The entity (donation, campaign, etc.)
 * @returns {Object} Formatted update information
 */
export const getUpdateInfo = (entity) => {
  // Handle different property naming conventions
  const createdAt = entity.created_at || entity.createdAt;
  const updatedAt = entity.updated_at || entity.updatedAt;
  const createdBy = entity.created_by || entity.createdBy || entity.received_by;
  const updatedBy = entity.updated_by || entity.updatedBy;

  return {
    createdAt: formatTimestamp(createdAt),
    updatedAt: formatTimestamp(updatedAt),
    relativeUpdatedAt: formatRelativeTime(updatedAt),
    createdBy: getUsername(createdBy),
    updatedBy: getUsername(updatedBy),
    wasUpdated: createdAt !== updatedAt,
  };
};

/**
 * Extract username from a user object
 * @param {Object|string} user - User object or ID
 * @returns {string} Username or a default value
 */
export const getUsername = (user) => {
  if (!user) return "Unknown";
  if (typeof user === "string") return user;
  return user.username || user.name || user.email || "Unknown";
};

/**
 * Display component for showing when and by whom an entity was last updated
 * Usage example: <LastUpdatedInfo entity={donation} />
 */
export const LastUpdatedInfo = ({ entity, className = "" }) => {
  const { createdAt, updatedAt, createdBy, updatedBy, wasUpdated } =
    getUpdateInfo(entity);

  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      {wasUpdated ? (
        <span>
          Last updated on {updatedAt} by {updatedBy}
        </span>
      ) : (
        <span>
          Created on {createdAt} by {createdBy}
        </span>
      )}
    </div>
  );
};
