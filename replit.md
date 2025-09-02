# IPTV Streaming Platform

## Overview

This is a comprehensive IPTV streaming platform that provides multi-platform device management, payment processing, and playlist distribution. The system supports Android, iOS, Smart TV, and Windows applications with MAC address-based device registration, trial periods, and premium activation through multiple payment methods. It includes administrative controls for content management, user monitoring, and reseller functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Framework
- **Node.js with Express.js**: RESTful API server handling device registration, playlist management, and payment processing
- **MongoDB with Mongoose ODM**: Document-based database for storing device information, playlists, transactions, and user data
- **Passport.js Authentication**: Local strategy authentication for admin and reseller login systems

### Device Management System
- **MAC Address-Based Registration**: Unique device identification using MAC addresses with trial period management
- **Multi-Platform Support**: Dedicated API endpoints for Android (encrypted), iOS (encrypted), Smart TV, and Windows applications
- **Device Status Tracking**: Trial, activated, and expired states with automatic expiration handling
- **Rate Limiting**: Express rate limiter preventing abuse with IP-based request throttling

### Payment Processing Architecture
- **Multiple Payment Gateways**: PayPal, Stripe, and cryptocurrency payments via CoinPayments integration
- **Webhook Handling**: Automated payment verification and device activation through payment provider webhooks
- **Mobile App Store Integration**: Google Play and Apple App Store purchase validation
- **PDF Receipt Generation**: Puppeteer-based PDF creation for transaction receipts

### Content Management
- **Playlist Distribution**: M3U playlist upload and delivery system with device-specific URL management
- **EPG Integration**: Electronic Program Guide data processing and distribution
- **News and FAQ Management**: Content management system for news articles and frequently asked questions
- **Multi-language Support**: Language and translation management for international users

### Security and Protection
- **Cloudflare Integration**: DDoS protection and IP blocking through Cloudflare API
- **User Agent Validation**: Request filtering based on user agent patterns
- **Encrypted API Endpoints**: Platform-specific encryption for mobile app communications
- **IP Address Monitoring**: Automatic blocking and monitoring of suspicious IP addresses

### Administrative Features
- **Admin Dashboard**: Complete administrative interface with device management, transaction monitoring, and content controls
- **Reseller System**: Multi-level reseller management with credit-based device activation
- **Real-time Monitoring**: Device usage statistics, payment tracking, and system health monitoring
- **Bulk Operations**: Mass device management and IP blocking capabilities

## External Dependencies

### Payment Services
- **PayPal Checkout SDK**: Payment processing and webhook verification
- **Stripe API**: Credit card payment processing with webhook integration
- **CoinPayments**: Cryptocurrency payment processing with IPN callbacks
- **Mollie API**: Additional payment gateway integration

### Communication Services
- **SendGrid**: Transactional email delivery for receipts and notifications
- **Google Cloud Translate**: Multi-language content translation

### Infrastructure Services
- **Cloudflare API**: CDN, DDoS protection, and IP blocking management
- **MongoDB Atlas**: Cloud database hosting and management

### Development Tools
- **Puppeteer**: Headless browser for PDF generation and web scraping
- **Moment.js**: Date and time manipulation with timezone support
- **Express File Upload**: File handling for playlist and content uploads
- **BCrypt**: Password hashing and user authentication security