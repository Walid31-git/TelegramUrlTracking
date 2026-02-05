# Telegram Conversion Tracker - Admin Dashboard

A comprehensive admin dashboard for tracking Telegram promoter performance and conversions built with Next.js 16, Supabase, and shadcn/ui.

## Features

### Dashboard
- Real-time statistics with trend indicators
- 30-day performance charts for clicks and conversions
- Top promoter rankings
- Recent activity feed with click and conversion tracking

### Promoters Management
- Add, edit, and manage Telegram promoters
- Track both public and private channels
- View promoter statistics including clicks, conversions, and active links
- Toggle promoter active/inactive status

### Tracked Links
- Generate unique tracking links for each promoter
- Advanced filtering by search, status, and promoter
- Copy tracking codes and full URLs to clipboard
- Monitor clicks and conversions per link
- Link activation/deactivation

### Analytics
- Promoter comparison charts
- Conversion rate rankings
- Geographic distribution by country
- Device breakdown (mobile, desktop, tablet)
- Detailed performance metrics

### Configuration
- Key-value configuration management
- Add, edit, and delete system settings
- Track configuration update history

## Database Schema

The application uses the following Supabase tables:

- `promoters` - Telegram channel/promoter information
- `tracked_links` - Generated tracking URLs with unique codes
- `clicks` - Click tracking data with IP, user agent, device type, and location
- `conversions` - Conversion events linked to clicks
- `telegram_stats` - Daily Telegram channel statistics
- `configuration` - System configuration key-value pairs

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Environment Variables

Required Supabase environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Set up your Supabase project and run the migration script in `/scripts/setup-database.sql`
2. Add your Supabase credentials to the environment variables
3. Install dependencies and run the development server:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view the dashboard

## Color Scheme

The dashboard uses a professional blue and violet color scheme:
- **Primary**: Blue (#3B82F6) for public channels
- **Secondary**: Violet (#8B5CF6) for private channels
- **Accent colors** for charts and data visualization

## Features Overview

### Real-time Data
All dashboard components fetch real-time data from Supabase and display loading states during data retrieval.

### Responsive Design
The dashboard is fully responsive and works seamlessly on desktop, tablet, and mobile devices.

### Type Safety
Built with TypeScript for complete type safety throughout the application.
