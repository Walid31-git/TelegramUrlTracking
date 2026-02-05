# Telegram Conversion Tracker – Admin Dashboard

A modern and scalable admin dashboard designed to track Telegram promoter performance, clicks, and conversions in real time.  
Built with Next.js 16, Supabase, and shadcn/ui, this project focuses on performance, clarity, and maintainability.

---

## Overview

Telegram Conversion Tracker provides a centralized interface for monitoring marketing performance across Telegram channels.  
It allows administrators to manage promoters, generate tracking links, analyze conversions, and access detailed analytics through a clean and responsive dashboard.

---

## Features

### Dashboard
- Real-time statistics with trend indicators
- 30-day performance charts for clicks and conversions
- Top promoter rankings
- Recent activity feed for clicks and conversions

### Promoters Management
- Create, edit, and manage Telegram promoters
- Support for public and private Telegram channels
- Detailed promoter statistics:
  - Total clicks
  - Total conversions
  - Active tracking links
- Activate or deactivate promoters

### Tracked Links
- Generate unique tracking links per promoter
- Advanced filtering by search, status, and promoter
- Copy tracking codes and full URLs
- Monitor clicks and conversions per link
- Link activation and deactivation

### Analytics
- Promoter comparison charts
- Conversion rate rankings
- Geographic distribution by country
- Device breakdown (mobile, desktop, tablet)
- Detailed performance metrics

### Configuration
- Key-value system configuration management
- Add, edit, and delete configuration entries
- Configuration update history tracking

---

## Database Schema

The application relies on the following Supabase tables:

- **promoters**: Telegram channel and promoter information
- **tracked_links**: Generated tracking URLs with unique codes
- **clicks**: Click events with IP, user agent, device type, and location
- **conversions**: Conversion events linked to clicks
- **telegram_stats**: Daily Telegram channel statistics
- **configuration**: System configuration key-value storage

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui and Radix UI
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Language**: TypeScript

---

## Environment Variables

The following environment variables are required:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
