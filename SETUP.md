# Setup and Installation Guide

This guide will help you set up and run the ID Attendance System on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

### 1. Node.js and npm

**Download and Install Node.js:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for your operating system
3. Run the installer and follow the installation wizard
4. Node.js installation includes npm (Node Package Manager) automatically

**Verify Installation:**
Open a terminal/command prompt and run:
```bash
node --version
npm --version
```
You should see version numbers for both commands.

### 2. Supabase Account

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (see `database/setup-guide.md` for detailed instructions)

## Installation Steps

### Step 1: Install Dependencies

Open a terminal/command prompt in the project directory and run:

```bash
npm install
```

This will install all the required dependencies including:
- Next.js and React
- Supabase JavaScript client
- Tailwind CSS
- Lucide React for icons

### Step 2: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Or on Windows:
   ```cmd
   copy .env.example .env.local
   ```

2. Open the `.env.local` file and replace the placeholder values with your actual Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **Where to find these values:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "Project URL" and "anon public" key

### Step 3: Set Up the Database

Follow the instructions in `database/setup-guide.md` to:
1. Create your Supabase project
2. Run the database schema
3. Configure authentication settings

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start and be available at:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

The development server will automatically open your default browser.

## Usage

### First Time Setup

1. **Create an Account:**
   - Navigate to http://localhost:3000
   - Click "Register" to create a new account
   - Fill in your details (use "teacher" or "administrator" as role)
   - Check your email for verification (if email is configured)

2. **Add Students:**
   - Go to the "Students" section
   - Click "Add New Student"
   - Fill in student information including RF ID
   - Save the student profile

3. **Test RF ID Scanning:**
   - Go to the "Scanner" section
   - Enter a student's RF ID (or use sample IDs: 1234567890, 2345678901, 3456789012)
   - Click "Scan" to record attendance

### Sample Data

The database schema includes sample students for testing:
- **John Doe** - RF ID: 1234567890
- **Alice Smith** - RF ID: 2345678901
- **Mike Johnson** - RF ID: 3456789012

## Available Scripts

In the project directory, you can run:

### `npm run dev`
Starts the development server with hot reload.

### `npm run build`
Builds the app for production (output in `.next` folder).

### `npm run start` / `npm run preview`
Serves the production build locally with `next start`.

### `npm run lint`
Runs ESLint to check for code quality issues.

## Project Structure

```
id-attendance-system/
├── app/                    # Next.js App Router (TypeScript)
│   ├── layout.tsx          # Root layout and providers
│   ├── page.tsx            # Home (redirects to dashboard or login)
│   ├── globals.css         # Global styles
│   ├── login/
│   ├── dashboard/
│   ├── students/
│   ├── scanner/
│   ├── attendance/
│   └── ...
├── public/                 # Static assets
├── src/
│   ├── components/         # React components (.tsx)
│   │   ├── Login.tsx       # Login page
│   │   ├── Register.tsx    # Registration page
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── StudentManagement.tsx  # Student CRUD
│   │   ├── AttendanceScanner.tsx  # RF ID scanner
│   │   ├── AttendanceRecords.tsx # Attendance history
│   │   └── Navbar.tsx      # Navigation bar
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/              # useAuth, useStudent
│   ├── lib/                # Utility libraries (.ts)
│   │   └── supabase.ts     # Supabase configuration
│   ├── types/              # Shared TypeScript types
│   └── index.css           # Legacy global styles (app uses app/globals.css)
├── database/               # Database related files
│   ├── schema.sql          # Database schema
│   └── setup-guide.md      # Database setup guide
├── .env.example            # Environment variables template (.env.local for local)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── next.config.mjs         # Next.js configuration
```

## Features

### ✅ Implemented Features
- **User Authentication** - Login/Register with Supabase Auth
- **Student Management** - Add, edit, delete student profiles
- **RF ID Scanning** - Record attendance by scanning RF IDs
- **Dashboard** - View attendance statistics and recent activity
- **Attendance Records** - View and filter attendance history
- **Responsive Design** - Works on desktop and mobile devices

### 🚧 Planned Features
- **Parent Notifications** - Email/SMS alerts when students arrive
- **Advanced Reporting** - Export attendance data to CSV/PDF
- **Role-based Access** - Different permissions for teachers/admins
- **Real-time Updates** - Live attendance updates across devices

## Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   - Install Node.js from nodejs.org
   - Restart your terminal after installation
   - Verify with `node --version` and `npm --version`

2. **"Supabase connection error"**
   - Check your `.env.local` file has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Verify your Supabase project is active
   - Check network connectivity

3. **"Permission denied" errors**
   - Ensure Row Level Security policies are set up correctly
   - Verify you're logged in when accessing protected routes

4. **"Module not found" errors**
   - Run `npm install` to install dependencies
   - Delete `node_modules` and `package-lock.json`, then run `npm install` again

5. **Port 3000 already in use**
   - Kill the process using port 3000: `npx kill-port 3000`
   - Or use a different port: `npm run dev -- --port 3001`

### Getting Help

1. Check the browser console for error messages
2. Check the terminal output for build/runtime errors
3. Verify your Supabase dashboard for database issues
4. Review the setup guides in the `database/` folder

## Development

### Code Style
- Uses ESLint for code quality
- Follows React best practices
- Uses functional components with hooks
- Implements proper error handling

### Adding New Features
1. Create new components in `src/components/` (TypeScript/React: `.tsx`)
2. Add routes under `app/` (e.g. `app/my-page/page.tsx`) using Next.js App Router
3. Use the `useAuth` hook for authentication
4. Use database functions from `src/lib/supabase.ts`; env vars use `NEXT_PUBLIC_*` for client exposure

## Deployment

For production deployment:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy** to your hosting provider (see DEPLOYMENT.md):
   - Vercel (recommended for Next.js)
   - Netlify (Next.js runtime)
   - Or run `npm run start` on a Node.js server

3. **Update environment variables** in your hosting provider's settings

4. **Update Supabase settings:**
   - Add your production URL to Supabase Auth settings
   - Update CORS settings if needed

## Security

- All database access is protected by Row Level Security (RLS)
- Authentication is handled by Supabase Auth
- Environment variables keep sensitive data secure
- Input validation prevents common security issues

## Support

If you encounter issues:
1. Check this setup guide
2. Review the database setup guide
3. Check the browser developer tools for errors
4. Verify your Supabase configuration