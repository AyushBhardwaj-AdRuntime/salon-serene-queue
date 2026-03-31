

# Plan: Add Landing Page + UI Overhaul + Bug Fixes

## Overview
The app currently drops users directly into a "Loading salons..." screen with a plain, washed-out UI. This plan adds a proper landing page as the entry point and overhauls the visual design with richer colors, gradients, and modern styling.

## 1. Create a Landing Page (`src/pages/LandingPage.tsx`)

A visually rich hero-based page that serves as the app's front door:

- **Hero Section**: Full-width gradient background (rose-gold to warm coral), large headline ("Skip the Wait, Join the Queue"), subtitle, and two CTA buttons: "Find Nearby Salons" and "Staff Login"
- **Features Section**: 3-4 cards highlighting key features (Real-time Queue, QR Check-in, Book Appointments, Ratings & Reviews) with icons and descriptions
- **How It Works Section**: 3-step visual flow (Find a Salon -> Join Queue -> Get Served)
- **Footer**: Simple footer with app name and links

## 2. Update Routing (`src/pages/Index.tsx` + `src/App.tsx`)

- Landing page becomes the `/` route
- Move current public queue view to `/salons` route
- Staff login accessible from landing page CTA -> navigates to `/login`
- Add `/login` route for `AuthForm`
- Authenticated users auto-redirect to `/dashboard` (StaffDashboard)

## 3. UI Design Overhaul

**Color & Style Improvements:**
- Add vibrant gradient backgrounds to hero sections and key cards
- Add colored accent borders and gradient overlays to salon cards
- Improve the `PublicQueueView` header with a gradient banner
- Add hover animations and shadow effects to interactive cards
- Style buttons with gradients instead of flat primary color
- Add decorative background patterns/shapes for visual depth

**Component Styling Updates:**
- `SalonFilters.tsx`: Add colored filter chips instead of plain selects
- `PublicQueueView.tsx`: Gradient header, colored stat badges, better card layout with service icons
- `StaffDashboard.tsx`: Colored tab indicators, improved card styling
- `CustomerCheckin.tsx`: Gradient header with salon name, better form styling
- `QueueDisplay.tsx`: More dramatic "Now Serving" display with animation

**CSS Updates (`src/index.css`):**
- Add gradient utility classes
- Add glass-morphism card variants
- Add colored shadow utilities
- Add hero pattern backgrounds

## 4. Bug Fixes

- **Salon select query**: The `useSalons.ts` fetches columns like `is_open, is_queue_paused` in a redundant `.select("*, is_open, ...")` pattern -- clean this to just `*`
- **PublicQueueView casting**: `(salon as any).is_open` -- use proper typing since the field exists in the schema
- **QueueDisplay missing request_status filter**: The TV display page doesn't filter by `request_status = approved`, potentially showing pending customers
- **AuthForm auto-signin after signup**: Currently tries to auto-sign-in which will fail if email confirmation is required -- add proper handling

## Technical Details

### New Files
- `src/pages/LandingPage.tsx` - Landing page component

### Modified Files
- `src/App.tsx` - Add new routes (`/salons`, `/login`, `/dashboard`)
- `src/pages/Index.tsx` - Redirect logic update
- `src/index.css` - New gradient classes, hero styles, enhanced animations
- `src/components/PublicQueueView.tsx` - Visual overhaul + type fixes
- `src/components/StaffDashboard.tsx` - Improved tab and card styling
- `src/pages/CustomerCheckin.tsx` - Gradient header styling
- `src/pages/QueueDisplay.tsx` - Add request_status filter, enhanced visuals
- `src/hooks/useSalons.ts` - Clean select query
- `src/components/AuthForm.tsx` - Fix auto-signin flow
- `src/components/SalonFilters.tsx` - Visual improvements

