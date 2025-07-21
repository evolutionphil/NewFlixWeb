
# IPTV Streaming Platform

A comprehensive IPTV streaming platform built with Node.js, Express, and MongoDB. This application provides device management, payment processing, playlist management, and administrative controls for IPTV services.

## Features

### Core Features
- **Multi-platform Support**: Android, iOS, Samsung TV, LG TV, Windows applications
- **Device Management**: MAC address-based device registration and activation
- **Payment Processing**: PayPal, Stripe, and cryptocurrency payment integration
- **Playlist Management**: M3U playlist upload and management
- **Admin Dashboard**: Complete administrative interface
- **Real-time Monitoring**: Device statistics and usage tracking

### Payment & Billing
- PayPal integration with webhooks
- Stripe payment processing
- Cryptocurrency payments via CoinPayments
- Google Play and Apple App Store purchase validation
- Automated email receipts with PDF generation

### Security & Protection
- Cloudflare integration for DDoS protection
- Rate limiting and IP blocking
- User agent validation
- Encrypted API endpoints for mobile apps

### Content Management
- EPG (Electronic Program Guide) integration
- News and FAQ management
- Multi-language support
- Custom themes and branding

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Payment**: PayPal, Stripe, CoinPayments APIs
- **Email**: SendGrid for transactional emails
- **File Processing**: Puppeteer for PDF generation
- **Real-time**: Socket.IO (configurable)
- **Authentication**: Passport.js with local strategy

## API Endpoints

### Device Registration
- `GET /api/playlist_information/:mac_address/:app_type?` - Web playlist access
- `POST /api/playlist_information` - Android (encrypted)
- `POST /api/playlist_info` - iOS (encrypted)
- `POST /api/device_info` - Smart TV (encrypted)
- `POST /api/Ya6qrVdbcxy69CI` - Windows (encrypted)

### Payment Processing
- `POST /api/paypal-webhook` - PayPal payment notifications
- `POST /api/stripe-webhook` - Stripe payment notifications
- `POST /api/crypto-ipn-url/:transaction_id` - Cryptocurrency payments
- `POST /api/google_pay_encrypt` - Google Play purchases
- `POST /api/app_purchase` - Apple App Store purchases

### Device Management
- `POST /api/saveLockState*` - Device lock/unlock
- `POST /api/updateParentAccountPassword*` - Parental controls
- `POST /api/activate-from-external` - External activation

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Environment Variables
Create a `.env` file with the following variables:

```env
# Database
DATABASE_DSN=mongodb://localhost:27017/iptv_platform

# Session
SESSION_SECRET=your_session_secret_here

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox # or live

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_EMAIL_FROM=noreply@yourdomain.com
SENDGRID_TEMPLATE_ID=your_email_template_id

# Cloudflare (Optional)
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ZONE_ID=your_zone_id

# CoinPayments
CRYPTO_PUBLIC_KEY=your_crypto_public_key
CRYPTO_PRIVATE_KEY=your_crypto_private_key
CRYPTO_MERCHANT_ID=your_merchant_id
CRYPTO_IPN_SECRET=your_ipn_secret

# OpenSubtitles (Optional)
OPENSUBTITLES_API_KEY=your_opensubtitles_api_key
OPENSUBTITLES_USERNAME=your_username
OPENSUBTITLES_PASSWORD=your_password

# Application
NODE_ENV=production
PORT=4000
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd iptv-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the application**
```bash
# Development
npm run dev

# Production
npm start
```

The application will be available at `http://localhost:4000`

## Usage

### Admin Access
- Access admin panel at `/admin`
- Default credentials need to be set up through database

### API Integration
- Use provided API endpoints for device integration
- Implement proper encryption for mobile app communications
- Handle payment webhooks for automated activation

### Device Activation
1. Users register devices with MAC addresses
2. Payment processing activates devices
3. Playlist access granted based on activation status

## Configuration

### Payment Setup
1. Configure PayPal/Stripe credentials in admin panel
2. Set up webhook URLs in payment provider dashboards
3. Test payment flows in sandbox mode

### Email Configuration
1. Set up SendGrid account and API key
2. Create email templates for receipts
3. Configure sender email address

### Security Configuration
1. Set up Cloudflare protection (recommended)
2. Configure rate limiting thresholds
3. Set valid user agent keys for device validation

## File Structure

```
├── controllers/          # Route controllers
├── models/              # MongoDB models
├── routes/              # Express routes
├── middlewares/         # Custom middlewares
├── views/               # EJS templates
├── public/              # Static assets
├── services/            # External service integrations
├── utils/               # Utility functions
└── server.js           # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or questions, please contact the development team.
