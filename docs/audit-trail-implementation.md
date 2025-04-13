# Audit Trail Implementation Guide

This document outlines a plan for tracking when and by whom entities (like donations and campaigns) are updated in the application.

## Current State

Currently, the application tracks timestamps for creation and updates using:

- `created_at`/`createdAt` - When the record was created
- `updated_at`/`updatedAt` - When the record was last updated

For creator information, the application has:

- For campaigns: `created_by` field referencing the User who created the campaign
- For donations: `received_by` field referencing the User who received the donation

However, the system does not currently track who made subsequent updates to the records.

## Recommended Improvements

### 1. Database Schema Changes

Update the Campaign and Donation models to include:

```javascript
// For both Campaign and Donation schemas
{
  // Existing fields

  // For tracking updates
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}
```

### 2. Update API Endpoints

Modify all endpoints that update records to save the user ID of the person making the update:

```javascript
// In PUT/PATCH endpoints
router.put("/donations/:id", authenticateToken, async (req, res) => {
  try {
    // Existing code...

    // Add the user who is making the update
    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      {
        // Existing fields...
        updated_by: req.user.id, // Add this to track who updated the record
      },
      { new: true }
    );

    // Rest of the code...
  } catch (error) {
    // Error handling
  }
});
```

### 3. Create an Audit History Table (Optional, More Advanced)

For comprehensive tracking, create a separate collection to log all changes:

```javascript
const AuditSchema = new mongoose.Schema({
  entity_type: {
    type: String,
    required: true,
    enum: ["donation", "campaign", "user"],
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["create", "update", "delete"],
  },
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  changes: {
    type: Object,
    default: {},
  },
});
```

### 4. Frontend Implementation

Add utility functions to display update information to users:

```javascript
// Already implemented in client/src/utils/auditTrail.js
import { getUpdateInfo, LastUpdatedInfo } from "../utils/auditTrail";

// Then in components:
<LastUpdatedInfo entity={donation} />;
```

### 5. Utilizing the Update Information

1. Show "Updated by" information in detail views for both campaigns and donations
2. Add filters to allow searching for donations/campaigns by who last updated them
3. Add sorting options based on last update time
4. Create an activity feed on the dashboard showing recent updates

## Implementation Priority

1. **Phase 1**: Add `updated_by` fields to database models
2. **Phase 2**: Update API endpoints to track the user making updates
3. **Phase 3**: Improve frontend display of update information
4. **Phase 4**: (Optional) Implement full audit history tracking

## Security Considerations

- Ensure that only authenticated users can make updates
- Consider adding role-based permissions for viewing audit information
- Log sensitive updates for security auditing purposes

## Benefits

- Better accountability for changes
- Improved tracking of user activity
- Enhanced data integrity and trust
- Support for regulatory compliance requirements
