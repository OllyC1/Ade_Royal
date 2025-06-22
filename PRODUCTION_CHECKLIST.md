# 📋 Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### Code Preparation
- [ ] All demo credentials removed from login page
- [ ] Registration redirects to admin contact message
- [ ] All console.logs appropriate for production
- [ ] Error handling implemented for production
- [ ] Loading states and error states properly handled

### Environment Configuration
- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with appropriate permissions
- [ ] IP whitelist configured (0.0.0.0/0 for global access)
- [ ] Connection string obtained

### Security Configuration
- [ ] JWT secret generated (32+ characters)
- [ ] Session secret generated (32+ characters)
- [ ] Strong database password set
- [ ] CORS origins properly configured

## 🚀 Backend Deployment (Render)

### Render Setup
- [ ] GitHub repository connected to Render
- [ ] Web service created with correct settings:
  - [ ] Environment: Node
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Root Directory: `Backend`

### Environment Variables (Render)
- [ ] NODE_ENV=production
- [ ] PORT=10000
- [ ] MONGODB_URI=(your MongoDB connection string)
- [ ] JWT_SECRET=(generated secret)
- [ ] SESSION_SECRET=(generated secret)
- [ ] FRONTEND_URL=(will be updated after frontend deployment)
- [ ] CORS_ORIGIN=(same as FRONTEND_URL)
- [ ] RATE_LIMIT_WINDOW=15
- [ ] RATE_LIMIT_MAX=100

### Backend Verification
- [ ] Deployment successful without errors
- [ ] Health check endpoint accessible: `/api/health`
- [ ] Backend URL noted for frontend configuration

## 🌐 Frontend Deployment (Vercel)

### Vercel Setup
- [ ] GitHub repository connected to Vercel
- [ ] Project configured with correct settings:
  - [ ] Framework: Create React App
  - [ ] Root Directory: `Frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`

### Environment Variables (Vercel)
- [ ] REACT_APP_API_BASE_URL=(your Render backend URL)
- [ ] REACT_APP_ENVIRONMENT=production
- [ ] REACT_APP_SCHOOL_NAME=Ade-Royal Group of Schools
- [ ] REACT_APP_VERSION=1.0.0
- [ ] GENERATE_SOURCEMAP=false

### Frontend Verification
- [ ] Deployment successful without errors
- [ ] Application loads without console errors
- [ ] All routes accessible
- [ ] Frontend URL noted for backend CORS update

## 🔄 Cross-Configuration Updates

### Update Backend CORS
- [ ] Update FRONTEND_URL in Render environment variables
- [ ] Update CORS_ORIGIN in Render environment variables
- [ ] Redeploy backend if necessary
- [ ] Verify CORS working correctly

### Update Frontend API URL
- [ ] Verify REACT_APP_API_BASE_URL points to correct backend
- [ ] Update vercel.json proxy configuration if needed
- [ ] Redeploy frontend if necessary

## ✅ Final Verification

### Functionality Testing
- [ ] Login system works end-to-end
- [ ] Registration shows admin contact message
- [ ] Admin dashboard accessible after login
- [ ] API calls working without CORS errors
- [ ] Real-time features (Socket.io) working
- [ ] File uploads working (if applicable)

### Performance Testing
- [ ] Frontend loads quickly
- [ ] Backend responds within acceptable time
- [ ] Database queries optimized
- [ ] No memory leaks or performance issues

### Security Testing
- [ ] HTTPS enforced on both frontend and backend
- [ ] Authentication/authorization working
- [ ] No sensitive data exposed in frontend
- [ ] Rate limiting working correctly
- [ ] CORS properly configured

## 🔧 Post-Deployment Setup

### Admin Account
- [ ] Default admin account created automatically
- [ ] Login with: admin@aderoyalschools.org.ng / admin123
- [ ] **CRITICAL: Change admin password immediately**
- [ ] Create additional admin users if needed

### School Data Setup
- [ ] Nigerian school classes initialized
- [ ] Nigerian school subjects initialized
- [ ] Create school-specific classes if needed
- [ ] Create teachers and assign subjects

### System Configuration
- [ ] Test exam creation and taking flow
- [ ] Verify results calculation and display
- [ ] Test all user roles (admin, teacher, student)
- [ ] Configure system settings as needed

## 📊 Monitoring Setup

### Application Monitoring
- [ ] Vercel Analytics enabled (optional)
- [ ] Render metrics monitoring
- [ ] Error tracking configured
- [ ] Uptime monitoring setup

### Database Monitoring
- [ ] MongoDB Atlas monitoring alerts
- [ ] Database backup schedule configured
- [ ] Performance monitoring enabled

## 🔐 Security Hardening

### Environment Variables
- [ ] All secrets properly secured
- [ ] No hardcoded credentials in code
- [ ] Regular secret rotation plan

### Application Security
- [ ] Dependencies updated to latest secure versions
- [ ] Security headers properly configured
- [ ] Input validation and sanitization in place

## 📝 Documentation

### Deployment Documentation
- [ ] Deployment guide reviewed and updated
- [ ] Environment variables documented
- [ ] Troubleshooting guide available

### User Documentation
- [ ] Admin user guide available
- [ ] Teacher user guide available
- [ ] Student user guide available
- [ ] System administrator guide available

## 🆘 Rollback Plan

### Emergency Procedures
- [ ] Rollback procedure documented
- [ ] Previous version backup available
- [ ] Emergency contact information ready
- [ ] Downtime communication plan ready

---

## 🎯 Production URLs

**Frontend:** https://your-app-name.vercel.app
**Backend:** https://your-backend-name.onrender.com
**Database:** MongoDB Atlas cluster

## 👥 Access Credentials

**Default Admin:**
- Email: admin@aderoyalschools.org.ng
- Password: admin123 (CHANGE IMMEDIATELY)

**Database:**
- Connection via environment variables only

---

## ✅ Sign-off

- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Performance testing passed
- [ ] User acceptance testing completed
- [ ] Production deployment approved

**Deployed by:** _______________
**Date:** _______________
**Version:** 1.0.0 