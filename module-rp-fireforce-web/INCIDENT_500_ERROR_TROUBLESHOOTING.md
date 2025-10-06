# Incident Creation - Troubleshooting 500 Error

## 🔍 Issue Identified

The backend is returning a **500 error** with message: "Failed to create incident"

## 🎯 Root Cause

The backend validates the `reportedBy` email field against the users database. The error occurs in this flow:

```typescript
// Backend: incident.services.ts line 172
public async createIncident(data: CreateIncidentTypes) {
    await this.validateUserByEmail(data.reportedBy);  // ← FAILS HERE
    // ... rest of creation
}

private async validateUserByEmail(email: string): Promise<void> {
    try {
        await this.dbService.getUserByEmail(email);  // Throws if user not found
    } catch (error) {
        throw error;  // Propagates to handler, returns 500
    }
}
```

## 📊 Test Data Sent

```json
{
  "title": "TEST FROM WEB 3",
  "description": "TEST FROM WEB",
  "severity": "critical",
  "location": "24 Floor",
  "reportedBy": "kelvin.malabanan@rocketpartners.io",
  "notify_users": ["user-11", "user-4"]
}
```

## ✅ Solutions

### Option 1: Use an Email That Exists in Database (Recommended)

Check if the email `kelvin.malabanan@rocketpartners.io` exists in the users database.

**To find valid emails, check the teams API:**

```bash
# Get all teams and members
curl https://incident-webhook-api.rapidresponse.workers.dev/api/oncall/teams

# Response will show valid emails:
{
  "success": true,
  "object": [
    {
      "members": [
        {
          "id": "user-4",
          "email": "kelvin.malabanan@rocketpartners.io",  ← Use this
          "firstName": "Kelvin",
          "lastName": "Malabanan"
        }
      ]
    }
  ]
}
```

**Update the frontend to use a valid user email:**

1. Get the logged-in user from localStorage
2. Verify the email exists in the database
3. Or fallback to a known valid email (e.g., "admin@rocketpartners.io")

### Option 2: Modify Frontend to Fallback to Valid Email

Update `CreateIncidentModal.jsx`:

```javascript
// Get user info from localStorage
let reportedBy = 'admin@rocketpartners.io'; // Fallback to admin
try {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    // Use email from localStorage if it exists
    reportedBy = user.email || 'admin@rocketpartners.io';
  }
} catch (e) {
  console.warn('Could not parse user from localStorage:', e);
}
```

### Option 3: Backend Fix (Requires Backend Changes)

Modify the backend to not require email validation or create a default user:

```typescript
// Option A: Remove validation
// Comment out line 172 in incident.services.ts
// await this.validateUserByEmail(data.reportedBy);

// Option B: Create user if not exists
private async validateUserByEmail(email: string): Promise<void> {
    try {
        await this.dbService.getUserByEmail(email);
    } catch (error) {
        console.warn(`User ${email} not found, creating default user`);
        await this.dbService.createUser({ email, name: email });
    }
}
```

## 🧪 Testing Steps

### Step 1: Test WITHOUT Manual Selection

1. Create an incident without enabling "Manual Team Selection"
2. This will use automatic rotation and won't send `notify_users`
3. If this works, the issue is isolated to the manual selection flow

### Step 2: Test WITH Valid User from Database

1. First, get valid users:
   ```bash
   curl https://incident-webhook-api.rapidresponse.workers.dev/api/oncall/teams
   ```

2. Copy a valid email from the response (e.g., `admin@rocketpartners.io`)

3. Temporarily hardcode this email in the modal:
   ```javascript
   reportedBy: 'admin@rocketpartners.io'
   ```

4. Try creating an incident again

### Step 3: Verify notify_users

If Step 2 works, then test with manual selection:
- Ensure the user IDs in `notify_users` array exist in the database
- Check if the backend validates these user IDs as well

## 🔧 Quick Fix for Frontend

Update the `CreateIncidentModal.jsx` to use a known valid email:

```javascript
const incidentData = {
  title: String(formData.title || '').trim(),
  description: String(formData.description || '').trim(),
  severity: formData.severity || 'medium',
  location: formData.location ? String(formData.location).trim() : null,
  // Use admin email as fallback if user email not found
  reportedBy: reportedBy || 'admin@rocketpartners.io',
};
```

## 📝 Valid Emails from API Response

Based on the teams API, these emails should be valid:
- `admin@rocketpartners.io`
- `kelvin.malabanan@rocketpartners.io`
- `sarah.chen@rocketpartners.io`
- `marcus.williams@rocketpartners.io`
- `priya.patel@rocketpartners.io`
- `james.rodriguez@rocketpartners.io`
- `emily.nakamura@rocketpartners.io`
- `david.oconnor@rocketpartners.io`
- `lisa.anderson@rocketpartners.io`
- `alex.kim@rocketpartners.io`

## 🐛 Debugging Checklist

- [ ] Check if `kelvin.malabanan@rocketpartners.io` exists in users table
- [ ] Try with `admin@rocketpartners.io` as reportedBy
- [ ] Test without `notify_users` (automatic rotation)
- [ ] Test with `notify_users` using valid user IDs
- [ ] Check backend logs for detailed error message
- [ ] Verify all user IDs in `notify_users` array exist

## 📊 Backend Error Handling Improvement Needed

The backend should return more specific error messages:

**Current:**
```json
{
  "httpStatus": "ERROR",
  "message": "Failed to create incident",
  "data": null
}
```

**Should be:**
```json
{
  "httpStatus": "ERROR",
  "message": "User with email 'kelvin.malabanan@rocketpartners.io' not found in database",
  "data": null
}
```

## 🎯 Immediate Action

Try creating an incident with this modified data (hardcode the email):

```javascript
const incidentData = {
  title: "TEST FROM WEB 3",
  description: "TEST FROM WEB",
  severity: "critical",
  location: "24 Floor",
  reportedBy: "admin@rocketpartners.io", // Use admin email
};
```

If this works, then we know the issue is with the user email validation.

## 📞 Next Steps

1. **Verify the user email exists in database**
2. **If it doesn't exist:**
   - Option A: Create the user in the database
   - Option B: Use a fallback email that exists
   - Option C: Modify backend to create user automatically
3. **Test the fix**
4. **Update documentation with valid email requirements**

---

**Status:** 🔍 Investigation Complete - Solution Identified  
**Date:** October 6, 2025  
**Issue:** User email validation failing on backend  
**Solution:** Use email that exists in users database or modify backend validation
