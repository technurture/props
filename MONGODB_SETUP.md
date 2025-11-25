# MongoDB Atlas Setup Guide

## Quick Setup Instructions

Follow these steps to connect your EMR system to MongoDB Atlas:

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (no credit card required)
3. Verify your email address

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Select **"M0 FREE"** tier (perfect for development)
3. Choose your preferred cloud provider and region (select one closest to you)
4. Cluster Name: Leave as default or name it `lifepoint-emr`
5. Click **"Create"**

### Step 3: Set Up Database Access

1. You'll see a security quickstart page
2. **Create a Database User:**
   - Username: Choose a username (e.g., `emr_admin`)
   - Password: Click "Autogenerate Secure Password" and **SAVE IT**
   - Click **"Create User"**

3. **Add IP Address:**
   - Click "Add My Current IP Address" 
   - **IMPORTANT**: Also click "Add a Different IP Address" and enter `0.0.0.0/0` (allows access from anywhere - needed for Replit)
   - Click **"Finish and Close"**

### Step 4: Get Connection String

1. Click **"Database"** in the left sidebar
2. Click **"Connect"** button next to your cluster
3. Select **"Connect your application"**
4. Choose: **Driver**: Node.js, **Version**: 5.5 or later
5. Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **IMPORTANT**: Replace `<username>` and `<password>` with your actual credentials
   - Also add the database name at the end: `/lifepoint-emr`
   - Final format:
   ```
   mongodb+srv://emr_admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/lifepoint-emr?retryWrites=true&w=majority
   ```

### Step 5: Update Replit Environment

1. In Replit, go to **Tools** → **Secrets** (or use the lock icon in the left sidebar)
2. Add a new secret:
   - **Key**: `MONGODB_URI`
   - **Value**: Your complete connection string from Step 4
3. Click **"Add new secret"**

**OR** update `.env.local` file:
```bash
MONGODB_URI=mongodb+srv://emr_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/lifepoint-emr?retryWrites=true&w=majority
```

### Step 6: Restart the Server

1. Stop the current workflow (if running)
2. Restart it - the app will now connect to MongoDB

### Step 7: Seed the Database

1. Open a new terminal or use the Shell
2. Run the seed script:
   ```bash
   curl -X POST http://localhost:5000/api/seed
   ```

3. You should see:
   ```json
   {
     "success": true,
     "message": "Database seeded successfully"
   }
   ```

### Step 8: Login to the System

Use these credentials to login:

- **Admin**: admin@lifepointmedical.com / admin123
- **Doctor**: dr.sarah@lifepointmedical.com / doctor123
- **Front Desk**: frontdesk@lifepointmedical.com / desk123
- **Nurse**: nurse@lifepointmedical.com / nurse123

## Troubleshooting

### Connection Error

If you see "Failed to connect to MongoDB":
- Verify your connection string is correct
- Make sure you replaced `<username>` and `<password>`
- Confirm you added `0.0.0.0/0` to Network Access in Atlas
- Check that your cluster is running (not paused)

### Authentication Failed

- Double-check your username and password
- Make sure there are no special characters that need URL encoding
- Try regenerating the password in MongoDB Atlas

### Database Already Seeded

If you see "Database already seeded", the database was previously initialized. You can:
- Login with existing credentials
- Or delete all collections in MongoDB Atlas and run seed again

## Next Steps

Once connected:
1. Login as Admin
2. Create additional branches in Settings
3. Add doctors, staff, and patients
4. Start managing your healthcare data!

## Security Notes

- **Never commit your MongoDB connection string to Git**
- Use Replit Secrets for production
- Rotate your database password regularly
- Use MongoDB's built-in audit logs for tracking access
