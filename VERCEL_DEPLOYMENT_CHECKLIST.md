# Vercel Deployment Readiness Checklist

## ✅ Project Structure & Configuration

- [x] **Next.js 16.1.1** - Compatible with Vercel
- [x] **package.json** - Has proper build scripts (`build`, `start`)
- [x] **next.config.ts** - Properly configured with image domains
- [x] **TypeScript** - Properly configured
- [x] **.gitignore** - Includes `.env*` and `.vercel`

## ⚠️ Required Environment Variables

You **MUST** configure these in Vercel's dashboard before deployment:

### Database (Required)
- `MONGODB_URI` - OR use individual variables:
  - `MONGO_DB_SRV`
  - `MONGO_DB_USER`
  - `MONGO_DB_PASSWORD`
  - `MONGO_DB_NAME`

### Authentication (Required)
- `JWT_SECRET` - Secret key for JWT token signing

### Cloudinary (Required for image uploads)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Payment Processing (Required if using payments)
- `STRIPE_SECRET_KEY` - Required (throws error if missing)
- `STRIPE_WEBHOOK_SECRET` - Optional but recommended for webhooks
- `PAYMONGO_SECRET_KEY` - Required (throws error if missing)

### Email Service (Required for email functionality)
Choose one provider:

**Option 1: SendGrid**
- `SENDGRID_API_KEY` - Required
- `SENDGRID_FROM_EMAIL` - Optional (defaults to noreply@techeventx.com)
- `SENDGRID_FROM_NAME` - Optional (defaults to TechEventX)
- `EMAIL_PROVIDER=sendgrid` - Optional (defaults to sendgrid)

**Option 2: Mailgun**
- `MAILGUN_API_KEY` - Required
- `MAILGUN_DOMAIN` - Required
- `MAILGUN_FROM_EMAIL` - Optional (defaults to noreply@techeventx.com)
- `EMAIL_PROVIDER=mailgun` - Set this to use Mailgun

### Public URLs (Optional but recommended)
- `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., https://techeventx.com)
- `NEXT_PUBLIC_APP_URL` - Used in email templates (defaults to https://techeventx.com)

## ✅ Code Compatibility

- [x] **Node.js Runtime** - Ticket download route uses `export const runtime = 'nodejs'` (required for fs/path)
- [x] **No Edge Runtime Issues** - All routes compatible with Vercel's serverless functions
- [x] **File System Access** - Only used for reading public assets (compatible with Vercel)

## 📋 Pre-Deployment Steps

1. **Test Build Locally**
   ```bash
   npm run build
   ```
   Ensure the build completes without errors.

2. **Set Up MongoDB Atlas**
   - Ensure your MongoDB cluster is accessible from anywhere (0.0.0.0/0 in IP whitelist)
   - Or use Vercel's IP whitelist if available

3. **Configure Environment Variables in Vercel**
   - Go to your project settings → Environment Variables
   - Add all required variables listed above
   - Set them for Production, Preview, and Development environments

4. **Verify External Services**
   - Cloudinary account is active
   - Stripe/PayMongo accounts are configured
   - Email service (SendGrid/Mailgun) is set up

## 🚀 Deployment Steps

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Configure Build Settings**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables**
   - Add all variables from the list above
   - Make sure to set them for the correct environments

5. **Deploy**
   - Click "Deploy"
   - Monitor the build logs for any issues

## ⚠️ Potential Issues & Solutions

### Issue 1: MongoDB Connection Timeout
**Solution**: Ensure MongoDB Atlas allows connections from 0.0.0.0/0 or add Vercel's IP ranges

### Issue 2: Missing Environment Variables
**Solution**: Double-check all required variables are set in Vercel dashboard

### Issue 3: Build Failures
**Solution**: 
- Check build logs in Vercel dashboard
- Test build locally first: `npm run build`
- Ensure all dependencies are in `package.json` (not just devDependencies)

### Issue 4: File System Access
**Solution**: The ticket download route uses `fs` to read logo from `public` folder. This should work, but if it fails, consider:
- Using Next.js Image component
- Serving logo via CDN
- Embedding logo as base64

### Issue 5: Webhook Endpoints
**Solution**: For Stripe/PayMongo webhooks:
- Configure webhook URLs in Stripe/PayMongo dashboard
- Use format: `https://your-domain.vercel.app/api/webhooks/stripe` (or similar)
- Add webhook secrets to environment variables

## ✅ Post-Deployment Checklist

- [ ] Test authentication (sign up, sign in)
- [ ] Test event creation
- [ ] Test booking flow
- [ ] Test payment processing
- [ ] Test email notifications
- [ ] Test image uploads
- [ ] Test ticket generation/download
- [ ] Verify all API routes are working
- [ ] Check admin dashboard functionality
- [ ] Test on mobile devices

## 📝 Notes

- **No `vercel.json` needed** - Vercel auto-detects Next.js projects
- **Serverless Functions** - All API routes will be deployed as serverless functions
- **Edge Runtime** - Most routes use default runtime (compatible with Edge)
- **Node.js Runtime** - Ticket download route explicitly uses Node.js runtime for file system access
- **Environment Variables** - All sensitive data should be in Vercel's environment variables, not in code

## 🎯 Summary

**Status: ✅ READY FOR DEPLOYMENT**

Your project is Vercel-ready! Just ensure:
1. All environment variables are configured
2. External services (MongoDB, Cloudinary, etc.) are accessible
3. Build passes locally (`npm run build`)

Then deploy to Vercel and monitor the first deployment for any issues.
