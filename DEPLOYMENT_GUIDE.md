# 🚀 Ade-Royal CBT System - Production Deployment Guide

This guide will help you deploy the Ade-Royal CBT System to production using **Vercel** for the frontend and **Render** for the backend.

## 📋 Prerequisites

Before deploying, ensure you have:
- A GitHub repository with your code
- A Vercel account
- A Render account
- A MongoDB Atlas database (or MongoDB hosting service)

## 🌐 Frontend Deployment on Vercel

### Step 1: Prepare the Frontend Repository

1. **Push your code to GitHub**
2. **Ensure you have the `vercel.json` configuration file** (already created)

### Step 2: Deploy on Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - Framework Preset: `Create React App`
   - Root Directory: `Frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

### Step 3: Environment Variables on Vercel

Add these environment variables in Vercel dashboard:

```bash
REACT_APP_API_BASE_URL=https://your-backend-app.onrender.com
REACT_APP_ENVIRONMENT=production
REACT_APP_SCHOOL_NAME=Ade-Royal Group of Schools
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

### Step 4: Update Backend URL

After deploying the backend (see below), update the `REACT_APP_API_BASE_URL` with your actual Render backend URL.

## 🖥️ Backend Deployment on Render

### Step 1: Prepare the Backend Repository

1. **Ensure you have the `render.yaml` configuration file** (already created)
2. **Your backend code should be in the `Backend` directory**

### Step 2: Deploy on Render

1. **Go to [Render Dashboard](https://render.com/dashboard)**
2. **Click "New" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - Name: `ade-royal-cbt-backend`
   - Environment: `Node`
   - Region: `Oregon (US West)`
   - Branch: `main` (or your main branch)
   - Root Directory: `Backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

### Step 3: Environment Variables on Render

Add these environment variables in Render dashboard:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ade_royal_cbt
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
SESSION_SECRET=your-super-secure-session-secret-key
FRONTEND_URL=https://your-frontend-app.vercel.app
CORS_ORIGIN=https://your-frontend-app.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Important Notes for Environment Variables:

- **MONGODB_URI**: Use your MongoDB Atlas connection string
- **JWT_SECRET**: Generate a secure random string (at least 32 characters)
- **SESSION_SECRET**: Generate a secure random string
- **FRONTEND_URL**: Your Vercel app URL (update after frontend deployment)
- **CORS_ORIGIN**: Your Vercel app URL (same as FRONTEND_URL)

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. **Go to [MongoDB Atlas](https://cloud.mongodb.com/)**
2. **Create a new cluster** (free tier is available)
3. **Create a database user**
4. **Whitelist your IP addresses** (or use 0.0.0.0/0 for all IPs)
5. **Get your connection string**

### Step 2: Database Configuration

Your MongoDB connection string should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/ade_royal_cbt?retryWrites=true&w=majority
```

## 🔄 Deployment Process

### Deploy Backend First:

1. **Deploy to Render** following the backend steps above
2. **Wait for deployment to complete**
3. **Note your backend URL** (e.g., `https://ade-royal-cbt-backend.onrender.com`)

### Then Deploy Frontend:

1. **Update the `vercel.json` file** with your actual backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://ade-royal-cbt-backend.onrender.com/api/$1"
       }
     ]
   }
   ```

2. **Update environment variables** in Vercel with the actual backend URL
3. **Deploy to Vercel**

### Update Backend CORS:

1. **Update the environment variables** in Render with your actual Vercel URL
2. **Redeploy the backend** if necessary

## ✅ Verification Steps

### Backend Health Check:
Visit: `https://your-backend-app.onrender.com/api/health`
Should return: `{"status": "OK", "message": "Server is running"}`

### Frontend Access:
Visit: `https://your-frontend-app.vercel.app`
Should show the Ade-Royal login page

### API Connection Test:
Try logging in from the frontend - it should connect to the backend successfully.

## 🔧 Post-Deployment Configuration

### 1. Create Admin Account
The system will automatically create a default admin account on first run:
- Email: `admin@aderoyalschools.org.ng`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately after first login!**

### 2. SSL Certificates
Both Vercel and Render provide SSL certificates automatically.

### 3. Custom Domain (Optional)
You can configure custom domains in both Vercel and Render dashboards.

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure `FRONTEND_URL` and `CORS_ORIGIN` are correctly set in backend
   - Check that URLs don't have trailing slashes

2. **Database Connection Issues:**
   - Verify MongoDB Atlas connection string
   - Check that IP addresses are whitelisted
   - Ensure database user has proper permissions

3. **Environment Variables:**
   - Double-check all environment variables are set correctly
   - Ensure no trailing spaces in values

4. **Build Failures:**
   - Check build logs in Vercel/Render dashboards
   - Ensure all dependencies are in package.json

## 📊 Monitoring

### Vercel Analytics:
- Enable Vercel Analytics for frontend monitoring
- Monitor build times and deployments

### Render Metrics:
- Use Render's built-in metrics for backend monitoring
- Set up health check endpoints

### Database Monitoring:
- Use MongoDB Atlas monitoring tools
- Set up alerts for database issues

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use strong passwords and secrets
   - Rotate secrets regularly

2. **Database Security:**
   - Use MongoDB Atlas security features
   - Regular backups
   - Monitor for unusual activity

3. **Application Security:**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Use HTTPS only

## 📝 Final Notes

- **Free Tier Limitations:** Both Vercel and Render have free tier limitations
- **Scaling:** Consider upgrading plans for production use
- **Backups:** Set up regular database backups
- **Monitoring:** Implement proper logging and monitoring

## 🆘 Support

If you encounter issues during deployment:
1. Check the troubleshooting section above
2. Review deployment logs in Vercel/Render dashboards
3. Verify all environment variables are correct
4. Test database connectivity separately

---

**✅ Deployment Complete!** Your Ade-Royal CBT System should now be live and accessible to users.

Remember to:
- Change default admin password
- Test all functionality
- Set up monitoring and alerts
- Configure regular backups 