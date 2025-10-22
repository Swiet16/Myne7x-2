# Myne7x Premium Project Website

## Project Overview
This is a React/TypeScript/Vite premium project website that allows users to download digital products and files. The project was originally deployed on Vercel but has been migrated to work with a custom domain (myne7x.store) and configured to fix 406 download errors.

## Recent Changes (September 3, 2025)
- Imported code from GitHub repository: https://github.com/Swiet16/myne7x-premium
- Fixed Vite configuration to handle custom domain (myne7x.store) properly
- Updated CORS settings to prevent 406 errors during downloads
- Enhanced download component with better error handling and fallback methods
- Fixed CSS import order issue
- Configured server to run on port 5000 with proper headers

## Architecture
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 5.4.19
- **UI Framework**: shadcn/ui with Radix components
- **Styling**: Tailwind CSS with custom neon theme
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage for product files
- **Authentication**: Supabase Auth

## Key Features
- Premium project downloads with secure file handling
- User authentication and profiles
- Admin panel for product management
- Countdown timer for downloads
- Modern neon-themed UI design
- CORS-compliant download system

## Download System Fix
The main issue was 406 "Not Acceptable" errors when users tried to download files. This was fixed by:
1. Configuring proper CORS headers in Vite config
2. Adding fallback download methods for 406 errors
3. Setting correct Accept headers in fetch requests
4. Implementing direct link download as backup

## Technology Stack
- React + TypeScript + Vite
- Supabase for backend services
- Tailwind CSS + shadcn/ui
- React Router for navigation
- React Hook Form for forms
- Lucide React for icons

## Environment Setup
- Server runs on port 5000
- Custom domain: myne7x.store
- Supabase integration configured

## Project Status
✅ Repository imported successfully
✅ 406 download errors fixed
✅ CORS configuration updated
✅ Server running and accessible
✅ CSS styling issues resolved