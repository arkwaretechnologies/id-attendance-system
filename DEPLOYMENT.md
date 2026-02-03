# ID Attendance System - Deployment Guide

## Production Deployment Options

### 1. Vercel (Recommended)

#### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project configured

#### Steps
1. Push your code to GitHub repository
2. Connect Vercel to your GitHub account
3. Import your repository in Vercel
4. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy automatically (Vercel detects Next.js and uses default build/output)

### 2. Netlify

#### Steps
1. Connect repository; Netlify will detect Next.js
2. Build command: `npm run build`; publish directory: `.next` (or use Netlify Next.js runtime)
3. Configure environment variables in Netlify dashboard
4. Set up continuous deployment from GitHub

### 3. Traditional Web Hosting (Node.js)

Next.js requires a Node.js server for production. You cannot serve only static files like a Vite SPA.

#### Steps
1. Run `npm run build` to create production build (output in `.next` folder)
2. Run `npm run start` (or `next start`) on your server
3. Use a process manager (e.g. PM2) and reverse proxy (e.g. Nginx) to serve the app on port 3000 (or your chosen port)

## Environment Variables for Production

### Required Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Variables (for notifications)
```env
NEXT_PUBLIC_EMAIL_SERVICE_API_KEY=your-email-api-key
SEMAPHORE_API_KEY=your-sms-api-key
```

## Supabase Production Setup

### 1. Database Configuration
- Execute `database/schema.sql` in Supabase SQL editor
- Verify Row Level Security (RLS) policies are active
- Test database connections

### 2. Authentication Settings
- Configure allowed redirect URLs in Supabase dashboard
- Set up email templates for user verification
- Configure password requirements

### 3. API Settings
- Verify API keys are correctly configured
- Test database operations from production environment

## Security Checklist

- [ ] Environment variables properly configured
- [ ] Supabase RLS policies active and tested
- [ ] HTTPS enabled on production domain
- [ ] API keys not exposed in client-side code
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive information

## Performance Optimization

### Build Optimization
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Supabase Optimization
- Enable database indexes (included in schema)
- Use connection pooling for high traffic
- Monitor query performance

## Monitoring and Maintenance

### Application Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor application performance
- Track user engagement metrics

### Database Monitoring
- Monitor Supabase dashboard for:
  - Database usage
  - API requests
  - Authentication events
  - Error rates

### Regular Maintenance
- Update dependencies regularly
- Monitor security advisories
- Backup database regularly
- Test critical functionality

## Troubleshooting Common Issues

### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### Environment Variable Issues
- Use the `NEXT_PUBLIC_` prefix for any variable needed in the browser (e.g. Supabase URL and anon key). Next.js inlines these at build time.
- Restart development server after changes to `.env.local`
- Verify variables are set in production environment (e.g. Vercel/Netlify dashboard)

### Supabase Connection Issues
- Check API keys are correct
- Verify project URL format
- Test connection in Supabase dashboard

### Routing Issues (404 errors)
- Ensure you are running `next start` (or your platform’s Next.js runtime) so the App Router can serve all routes
- Do not deploy only the `.next` folder as static files; Next.js needs its server to handle routing

## Support and Updates

### Getting Help
- Check application logs for errors
- Review Supabase dashboard for API issues
- Consult documentation files in project

### Updating the Application
1. Test updates in development environment
2. Update dependencies: `npm update`
3. Run tests: `npm run lint`
4. Build and deploy: `npm run build`

## Backup Strategy

### Database Backup
- Use Supabase automatic backups (Pro plan)
- Export data regularly via Supabase dashboard
- Store backups in secure location

### Code Backup
- Use version control (Git)
- Regular commits to remote repository
- Tag releases for easy rollback

---

**Note**: This deployment guide assumes you have completed the setup process outlined in `SETUP.md` and have a working development environment.