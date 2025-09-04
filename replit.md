# Overview

This is a comprehensive IPTV streaming platform that provides multi-platform device management, payment processing, and content delivery. The platform allows users to register devices using MAC addresses, manage playlists, and subscribe to services through various payment methods. It includes both a customer-facing frontend and an administrative backend for managing devices, transactions, users, and content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
The platform is built using Node.js with Express.js as the web framework. It follows a traditional MVC pattern with separate controllers, models, and routes. The application uses MongoDB with Mongoose ODM for data persistence, providing flexibility for handling device information, playlists, transactions, and user data.

The server architecture includes:
- **API Layer**: RESTful endpoints for mobile apps (Android, iOS) with encrypted communication
- **Web Interface**: Traditional server-rendered pages using EJS templating
- **Admin Panel**: Comprehensive dashboard for system management
- **Reseller System**: Multi-tier reseller management with credit-based activation

## Authentication & Authorization
The system uses Passport.js with local strategy for admin authentication and session-based authentication for resellers. Device authentication is handled through MAC address validation and trial/activation status checking.

## Payment Integration
Multiple payment gateways are integrated to handle subscriptions:
- **PayPal**: Using PayPal Checkout SDK with webhook validation
- **Stripe**: Direct integration with webhook handling
- **Cryptocurrency**: CoinPayments integration for crypto transactions
- **Mobile Payments**: Google Play and Apple App Store purchase validation

## Security & Protection
The platform implements several security measures:
- **Cloudflare Integration**: For DDoS protection and IP blocking/unblocking
- **Rate Limiting**: Express rate limiter to prevent abuse
- **User Agent Validation**: To ensure requests come from legitimate clients
- **Encrypted APIs**: Mobile app endpoints use encryption for sensitive data

## Device Management
The system supports multiple device types with unified management:
- **Multi-platform Support**: Android, iOS, Smart TV, Windows applications
- **MAC Address-based Registration**: Each device is identified by its MAC address
- **Trial System**: 7-day trial periods for new device registrations
- **Activation Management**: Devices can be activated through payments or reseller credits

## Content Delivery
The platform manages IPTV content through:
- **Playlist Management**: M3U playlist upload and device assignment
- **EPG Integration**: Electronic Program Guide data handling
- **YouTube Integration**: Custom YouTube playlist management
- **News & FAQ**: Content management system for platform information

## Monitoring & Analytics
Real-time monitoring capabilities include:
- **Device Statistics**: Track active devices and usage patterns
- **Revenue Analytics**: Payment tracking and earnings calculations
- **Transaction Monitoring**: Comprehensive payment history and status tracking

## Reseller System
Multi-tier reseller architecture allows:
- **Credit-based Activation**: Resellers purchase credits to activate devices
- **Hierarchical Structure**: Resellers can create sub-resellers
- **Activity Tracking**: Detailed logs of reseller operations and device activations

# External Dependencies

## Payment Services
- **PayPal Checkout SDK**: For PayPal payment processing and webhook validation
- **Stripe**: Credit card payment processing with webhook support
- **CoinPayments**: Cryptocurrency payment gateway
- **Mollie**: European payment service provider integration

## Cloud Services
- **Cloudflare API**: IP blocking/unblocking and DDoS protection
- **SendGrid**: Transactional email service for receipts and notifications
- **Google Cloud Translate**: Multi-language support capabilities

## Development Tools
- **Puppeteer**: PDF generation for receipts and reports
- **Axios**: HTTP client for external API calls
- **Moment.js**: Date/time manipulation and timezone handling
- **bcrypt**: Password hashing and security

## Frontend Assets
- **Bootstrap**: UI framework for admin panel
- **jQuery**: Frontend JavaScript functionality
- **EJS**: Server-side templating engine
- **Font Awesome**: Icon library for user interface

## Database
- **MongoDB**: Primary database for all application data
- **Mongoose**: ODM for MongoDB with schema validation and middleware

## Utility Libraries
- **Express Middleware**: File upload, session management, flash messages
- **XML Parser**: For EPG data processing
- **HTML to Text**: Content conversion utilities