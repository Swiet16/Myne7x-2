# Myne7x Store - Enhanced Website

## Overview

This is an enhanced version of the Myne7x Store website featuring a modern, responsive design with advanced image management capabilities. The website includes a stylish home page with image sliders and a comprehensive admin dashboard for managing website content.

## Key Features

### 🎨 Modern UI/UX Design
- **Stylish Home Page**: Features a dynamic hero section with image slider functionality
- **Responsive Design**: Fully responsive across all device sizes
- **Modern Animations**: Smooth transitions, hover effects, and micro-interactions
- **Gradient Effects**: Beautiful neon gradients and glowing elements
- **Professional Typography**: Using Orbitron font for a futuristic look

### 🖼️ Image Management System
- **Dynamic Image Slider**: 16:9 aspect ratio hero images with automatic rotation
- **Admin Image Upload**: Upload and manage website images through the admin dashboard
- **Image Categories**: Separate hero images and slider images
- **Display Order Control**: Set custom order for image display
- **Real-time Updates**: Images update immediately on the frontend

### 🛠️ Admin Dashboard
- **Comprehensive Management**: Manage images, products, users, and payments
- **Contact Details Management**: Edit website contact information
- **Image Upload Interface**: Drag-and-drop image upload with preview
- **Statistics Overview**: Real-time stats and analytics
- **Responsive Admin Panel**: Mobile-friendly admin interface

### 🔧 Technical Features
- **Supabase Integration**: Backend database with Row Level Security (RLS)
- **Real-time Updates**: Live data synchronization
- **Authentication System**: Secure user login and admin access
- **Modern React Stack**: Built with React, TypeScript, and Tailwind CSS
- **Component Library**: Using shadcn/ui for consistent design

## Database Schema

### New Tables Added

#### `website_images`
```sql
- id: UUID (Primary Key)
- image_url: TEXT (Image URL)
- is_hero_image: BOOLEAN (Hero section flag)
- is_slider_image: BOOLEAN (Slider flag)
- display_order: INTEGER (Display order)
- alt_text: TEXT (Alt text for accessibility)
- uploaded_by: UUID (User who uploaded)
- created_at: TIMESTAMP
```

#### `contact_details`
```sql
- id: UUID (Primary Key)
- phone_number: TEXT
- email: TEXT
- address: TEXT
- updated_by: UUID
- created_at: TIMESTAMP
```

## Setup Instructions

### 1. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration script located at: `supabase/migrations/create_images_table.sql`

### 2. Environment Variables
Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
```

## Admin Access

**Login Credentials:**
- Email: `myne7x@gmail.com`
- Password: `Myne@@18`

## Admin Dashboard Features

### Image Management
- Upload new images for hero section and slider
- Set display order for images
- Add alt text for accessibility
- Delete unwanted images
- Real-time preview of uploaded images

### Contact Management
- Edit phone number, email, and address
- Changes reflect immediately on the website
- Secure admin-only access

### Statistics Dashboard
- View total users, products, and revenue
- Monitor pending and approved payment requests
- Real-time data updates

## Image Slider Functionality

The home page features an advanced image slider with:
- **Automatic Rotation**: Images change every 5 seconds
- **Manual Navigation**: Left/right arrow buttons
- **Dot Indicators**: Click to jump to specific images
- **Smooth Transitions**: 1-second fade transitions
- **16:9 Aspect Ratio**: Optimized for modern displays
- **Responsive Design**: Works on all screen sizes

## Responsive Design

The website is fully responsive with:
- **Mobile-First Approach**: Optimized for mobile devices
- **Tablet Support**: Perfect layout for tablets
- **Desktop Enhancement**: Rich experience on large screens
- **Touch-Friendly**: All interactions work on touch devices

## Modern UI Elements

### Navigation
- **Enhanced Logo**: Animated Myne7x logo with gradient effects
- **Hover Effects**: Smooth transitions on all interactive elements
- **Mobile Menu**: Collapsible navigation for mobile devices

### Buttons and Interactions
- **Neon Button Effects**: Glowing buttons with hover animations
- **Micro-interactions**: Subtle animations for better UX
- **Loading States**: Smooth loading indicators

### Typography and Colors
- **Orbitron Font**: Futuristic font for headings
- **Gradient Text**: Beautiful gradient text effects
- **Consistent Color Scheme**: Professional color palette

## File Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── admin/              # Admin-specific components
│   └── Navbar.tsx          # Enhanced navigation
├── pages/
│   ├── Index.tsx           # Enhanced home page with slider
│   ├── Admin.tsx           # Enhanced admin dashboard
│   └── ...                 # Other pages
├── integrations/
│   └── supabase/
│       ├── client.ts       # Supabase client
│       └── types.ts        # Updated database types
└── assets/                 # Static assets
```

## Security Features

- **Row Level Security (RLS)**: Database-level security
- **Admin-Only Access**: Restricted admin functionality
- **Secure Image Upload**: Validated file uploads
- **Authentication Required**: Protected admin routes

## Performance Optimizations

- **Image Optimization**: Optimized image loading
- **Code Splitting**: Efficient bundle splitting
- **Lazy Loading**: Components load when needed
- **Caching**: Efficient data caching strategies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

The website is ready for deployment and includes:
- Production build optimization
- Environment variable configuration
- Static asset optimization
- SEO-friendly structure

## Support and Maintenance

For support or questions:
- Email: myne7x@gmail.com
- WhatsApp: +92 309 6626615

## License

All rights reserved © 2025 Myne7x Store

---

**Note**: This enhanced version maintains all existing functionality while adding powerful new features for image management and improved user experience. The admin dashboard provides complete control over website content, making it easy to keep the site fresh and engaging.
