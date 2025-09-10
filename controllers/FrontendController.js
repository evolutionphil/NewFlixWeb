let helpers=require('../utils/helpers');
let CoinList=require('../models/CoinList.model');
let Device=require('../models/Device.model');
let PlayList=require('../models/PlayList.model');
let Transaction=require('../models/Transaction.model');
let Setting=require('../models/Setting.model');
let News=require('../models/News.model');
let Faq=require('../models/Faq.model');
let TermsContent=require('../models/TermsContent.model');
let PrivacyContent=require('../models/PrivacyContent.model');
let ActivationContent=require('../models/ActivationContent.model');
let Instruction=require('../models/Instruction.model');
let MyListContent=require('../models/MyListContent.model');
let YoutubeListContent=require('../models/YoutubeListContent.model');
let YoutubeList=require('../models/YoutubeList.model');
const fs = require('node:fs');
const process = require('node:process');


const axios = require('axios');
let crypto = require('crypto');
let moment=require('moment');
let Coinpayments =require('coinpayments');
const { createMollieClient } = require('@mollie/api-client');
let stripe = require('stripe');
const {convert} = require("html-to-text");
const path = require("path");

// Helper function to generate URL-friendly slug from title
function generateSlugFromTitle(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim() // Remove leading/trailing spaces
        .substring(0, 100); // Limit length to 100 characters
}

exports.news=(req,res)=>{
    let keys=['news_meta_title','news_meta_keyword','news_meta_content']
    let data={
        news_meta_title: 'Flix IPTV News - Latest Updates and Announcements | Professional Streaming Platform',
        news_meta_keyword: 'IPTV news, Flix IPTV updates, streaming news, IPTV announcements, platform updates, IPTV industry news, streaming platform news, digital streaming updates, ibo player news, ibo iptv news, net iptv news, set iptv news, smart iptv player news, iptv player news, m3u player news, smart iptv news, iptv smarters news, perfect player news, kodi iptv news, vlc iptv news, mx player iptv news, iptv extreme news, duplex iptv news, ottplayer news, lazy iptv news, iptv pro news, ss iptv news, gse iptv news, tivimate news, myiptv player news, live nettv news, purple iptv news, stb emulator news, mag player news, stalker portal news, ministra player news, infomir mag news, gse smart iptv news, iptv ultimate news, xciptv news, implayer news, televizo news, plex iptv news, emby iptv news, jellyfin iptv news, streaming news, tv streaming news, cord cutting news, iptv updates, streaming updates, iptv breaking news, iptv latest news, iptv platform news, iptv service news, iptv technology news, iptv application news, iptv software news, streaming app news, streaming device news, android tv iptv news, firestick iptv news, roku iptv news, smart tv iptv news, professional streaming news, enterprise streaming news, business streaming news',
        news_meta_content: 'Stay updated with the latest Flix IPTV news, platform updates, and streaming industry announcements. Get comprehensive information about our professional IPTV streaming service, technology updates, and industry developments.'
    }
    
    keys.map(key => {
        if(settings && settings[key] && settings[key].trim() !== '' && settings[key] !== 'FLIX APP NEWS') {
            data[key] = settings[key];
        }
    })
    
    News.find()
.sort({_id:-1})
        .exec()
        .then(async news=>{
        // Auto-generate missing slugs for existing news articles
        for (let article of news) {
            if (!article.slug && article.title) {
                article.slug = generateSlugFromTitle(article.title);
                await article.save();
            }
        }
        let title=data.news_meta_title || 'Flix IPTV News - Latest Updates';
        let keyword=data.news_meta_keyword || 'IPTV news, Flix IPTV updates, streaming news';
        let description=data.news_meta_content || 'Stay updated with the latest Flix IPTV news and platform updates.';

        res.render('frontend/pages/news/index',
            {
                menu: 'news',
                title: title,
                keyword: keyword,
                description: description,
                news: news.map(item=>({
                    _id: item._id, 
                    title: item.title, 
                    content: convert(item.content).substring(0, 80),
                    slug: item.slug || generateSlugFromTitle(item.title),
                    urlPath: `/news/${item.slug || generateSlugFromTitle(item.title)}`
                })),
                pageType: 'news-listing',
                canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/news` : 'https://flixapp.net/news'
            }
        );
    })
}

exports.showNewsDetail = (req, res) => {
    const slug = req.params.slug;
    
    // Try finding by slug first, then fall back to ID for backward compatibility
    let findQuery = { slug: slug };
    
    // If slug looks like MongoDB ObjectId, also try finding by ID
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        findQuery = { $or: [{ slug: slug }, { _id: slug }] };
    }
    
    News.findOne(findQuery)
        .exec()
        .then(async news => {
            if (!news) {
                return res.status(404).send('News article not found');
            }
            
            // Auto-generate slug if missing
            if (!news.slug && news.title) {
                news.slug = generateSlugFromTitle(news.title);
                await news.save();
            }
            
            // If found by ID (backward compatibility), redirect to proper slug URL
            if (slug.match(/^[0-9a-fA-F]{24}$/) && news.slug) {
                return res.redirect(301, `/news/${news.slug}`);
            }
            
            let title = `${news.title} - Flix IPTV News`;
            let description = news.content.substring(0, 160) + '...';

            res.render('frontend/pages/news/show',
                {
                    menu: 'news/show',
                    title: title,
                    keyword: `IPTV news, streaming news, ${news.title}, Flix IPTV updates`,
                    description: description,
                    news: news,
                    pageType: 'news-article',
                    canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/news/${news.slug}` : `https://flixapp.net/news/${news.slug}`
                }
            );
        })
        .catch(err => {
            console.error('Error finding news:', err);
            res.status(404).send('News article not found');
        });
}

exports.faq=(req,res)=>{
    let keys=['faq_meta_title','faq_meta_keyword','faq_meta_content']
    let data={
        faq_meta_title: 'Frequently Asked Questions - Flix IPTV',
        faq_meta_keyword: 'IPTV FAQ, Flix IPTV help, IPTV questions, streaming help, IPTV support, how to use IPTV, IPTV troubleshooting, IPTV guide, streaming questions, IPTV setup, ibo player faq, ibo iptv faq, net iptv faq, set iptv faq, smart iptv player faq, iptv player faq, m3u player faq, smart iptv faq, iptv smarters faq, perfect player faq, kodi iptv faq, vlc iptv faq, mx player iptv faq, iptv extreme faq, duplex iptv faq, ottplayer faq, lazy iptv faq, iptv pro faq, ss iptv faq, gse iptv faq, tivimate faq, myiptv player faq, live nettv faq, purple iptv faq, stb emulator faq, mag player faq, stalker portal faq, ministra player faq, infomir mag faq, gse smart iptv faq, iptv ultimate faq, xciptv faq, implayer faq, televizo faq, plex iptv faq, emby iptv faq, jellyfin iptv faq, streaming faq, tv streaming help, firestick iptv setup, android tv iptv help, roku iptv guide, iptv help, iptv setup guide, iptv installation help, iptv configuration faq, iptv player help, iptv troubleshooting guide, iptv support faq, iptv questions and answers, iptv how to guide, iptv tutorial faq, iptv device setup, iptv app help, streaming app faq, streaming device help, cord cutting faq, smart tv iptv faq',
        faq_meta_content: 'Find answers to frequently asked questions about Flix IPTV streaming service. Get help with setup, troubleshooting, device compatibility, and more.'
    }
    
    keys.map(key => {
        if(settings[key]) {
            data[key] = settings[key];
        }
    })
    
    Faq.find().then(faqs=>{
        let title=data.faq_meta_title || 'Frequently Asked Questions - Flix IPTV';
        let keyword=data.faq_meta_keyword || 'IPTV FAQ, Flix IPTV help, IPTV questions, streaming help';
        let description=data.faq_meta_content || 'Find answers to frequently asked questions about Flix IPTV streaming service.';
        res.render('frontend/pages/faq',
            {
                menu:'faq',
                title:title, 
                keyword:keyword,
                description:description,
                faqs:faqs,
                pageType: 'faq',
                canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/faq` : 'https://flixapp.net/faq'
            }
        );
    })
}

exports.instructions = async (req, res) => {
    let keys = ['instruction_meta_title', 'instruction_meta_keyword', 'instruction_meta_content']

    let data = {}

    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })

    let instructions = await Instruction.find({
        kind: {
            $ne: 'summary'
        }
    }).sort({kind: 1})

    let title = data.instruction_meta_title;
    let keyword = data.instruction_meta_keyword;
    let description = data.instruction_meta_content;


    let meta_data = {
        title: title, keyword: keyword, description: description
    }
    instructions = instructions.map((instruction) => {
        let imagePath = path.resolve(__dirname, `../public/images/devices/${instruction.kind}.png`);
        return {
            ...instruction._doc,
            image: fs.existsSync(imagePath) ? `/images/devices/${instruction.kind}.png` : null
        }
    })

    res.render('frontend/pages/instructions/index', {menu: 'instruction', instructions: instructions, ...meta_data});
}

exports.showInstructionDetail = async (req, res) => {
    let keys = ['instruction_meta_title', 'instruction_meta_keyword', 'instruction_meta_content']
    let data = {}

    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })

    var kind = req.params.kind;
    kind = kind.toLocaleLowerCase();

    let instruction = await Instruction.findOne({kind: kind})

    // Handle missing instruction types gracefully
    if (!instruction) {
        // Return 404 for truly non-existent instruction types
        if (!['amazonstick', 'android', 'ios', 'windows', 'smarttv', 'samsung', 'lg', 'epg', 'apple-tv', 'playlist', 'samsung&lg&android'].includes(kind)) {
            return res.status(404).send('Instruction not found');
        }
        
        // Create placeholder instruction for valid types not yet in admin
        instruction = {
            kind: kind,
            content: `<h2>Instructions for ${kind.charAt(0).toUpperCase() + kind.slice(1)}</h2>
                     <p>Detailed setup instructions for ${kind} will be available soon.</p>
                     <p>Please check back later or contact support for assistance.</p>`
        };
    }

    // Device-specific SEO optimization - prioritize device-specific content
    let deviceSEO = getDeviceSpecificSEO(kind);
    
    // Use device-specific SEO if available, otherwise fall back to admin settings
    let title = deviceSEO.title || data.instruction_meta_title;
    let keyword = deviceSEO.keywords || data.instruction_meta_keyword;
    let description = deviceSEO.description || data.instruction_meta_content;

    let meta_data = {
        title: title, 
        keyword: keyword, 
        description: description,
        pageType: 'instruction-guide',
        deviceType: kind,
        canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/instructions/${kind}` : `https://flixapp.net/instructions/${kind}`
    }

    res.render('frontend/pages/instructions/show', {menu: 'instruction', instruction: instruction, ...meta_data});
}

// Device-specific SEO helper function
function getDeviceSpecificSEO(deviceType) {
    const deviceSEOData = {
        'amazonstick': {
            title: 'Flix IPTV Setup Guide for Amazon Fire TV Stick - Installation Instructions',
            keywords: 'Amazon Fire Stick IPTV, Fire TV Stick setup, Flix IPTV Fire Stick, Amazon Fire TV IPTV installation, Fire Stick streaming, Fire TV IPTV player, Fire Stick IPTV guide, Amazon streaming device, Fire TV Stick apps, Fire Stick sideload, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, smart iptv, iptv smarters, perfect player, kodi iptv, vlc iptv, firestick iptv, amazon fire tv iptv, fire tv streaming',
            description: 'Complete step-by-step guide to install and setup Flix IPTV on Amazon Fire TV Stick. Learn how to sideload IPTV apps and configure streaming on your Fire Stick device.'
        },
        'android': {
            title: 'Flix IPTV Android Setup Guide - Installation Instructions',
            keywords: 'Android IPTV setup, Flix IPTV Android, Android TV IPTV, Android streaming, IPTV Android app, mobile IPTV, android iptv player, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, smart iptv, iptv smarters, perfect player, kodi iptv, android tv iptv, android streaming apps',
            description: 'Step-by-step instructions to install and configure Flix IPTV on Android devices. Setup guide for Android phones, tablets, and Android TV boxes.'
        },
        'ios': {
            title: 'Flix IPTV iOS Setup Guide - iPhone/iPad Installation Instructions',
            keywords: 'iOS IPTV setup, iPhone IPTV, iPad IPTV, Flix IPTV iOS, Apple TV IPTV, iOS streaming, iPhone streaming app, iPad streaming, mobile IPTV iOS, ios iptv player, apple tv iptv, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player',
            description: 'Complete guide to install and setup Flix IPTV on iPhone, iPad, and Apple TV devices. Learn how to configure IPTV streaming on iOS devices.'
        },
        'windows': {
            title: 'Flix IPTV Windows Setup Guide - PC Installation Instructions',
            keywords: 'Windows IPTV setup, PC IPTV player, Windows streaming, Flix IPTV Windows, desktop IPTV, windows iptv app, pc streaming software, windows media player, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, vlc iptv, kodi iptv, windows iptv streaming',
            description: 'Step-by-step guide to install and configure Flix IPTV on Windows PC. Complete setup instructions for Windows desktop IPTV streaming.'
        },
        'smarttv': {
            title: 'Flix IPTV Smart TV Setup Guide - Installation Instructions',
            keywords: 'Smart TV IPTV setup, Samsung Smart TV IPTV, LG Smart TV IPTV, Smart TV streaming, TV IPTV app, smart tv iptv player, tizen iptv, webos iptv, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, smart iptv, ss iptv, smart tv streaming',
            description: 'Complete guide to setup Flix IPTV on Smart TVs including Samsung, LG, Sony, and other Smart TV brands. Easy installation instructions for TV streaming.'
        },
        'apple-tv': {
            title: 'Flix IPTV Apple TV Setup Guide - Installation Instructions',
            keywords: 'Apple TV IPTV setup, tvOS IPTV, Apple TV IPTV app, Apple TV streaming, IPTV Apple TV installation, Apple TV 4K IPTV, Apple TV IPTV player, ibo player apple tv, ibo iptv apple tv, net iptv apple tv, set iptv apple tv, smart iptv apple tv, perfect player apple tv, apple tv iptv guide',
            description: 'Step-by-step guide to install and configure Flix IPTV on Apple TV. Complete setup instructions for Apple TV 4K and Apple TV HD streaming.'
        },
        'playlist': {
            title: 'Flix IPTV Playlist Management Guide - Setup Instructions',
            keywords: 'IPTV playlist setup, m3u playlist guide, playlist management, IPTV playlist upload, streaming playlist, m3u8 playlist, playlist configuration, IPTV m3u setup, ibo player playlist, ibo iptv playlist, net iptv playlist, smart iptv playlist, iptv smarters playlist, perfect player playlist, playlist instructions',
            description: 'Complete guide to manage and setup IPTV playlists. Learn how to upload, configure, and manage M3U playlists for optimal streaming experience.'
        },
        'samsung&lg&android': {
            title: 'Flix IPTV Multi-Device Setup Guide - Samsung, LG & Android',
            keywords: 'multi device IPTV setup, Samsung LG Android IPTV, cross platform IPTV, Smart TV Android setup, multiple device IPTV, unified IPTV guide, Samsung LG setup, Android TV IPTV, multi platform streaming, ibo player multi device, smart iptv multiple devices, cross platform streaming',
            description: 'Comprehensive setup guide for Flix IPTV across Samsung Smart TVs, LG Smart TVs, and Android devices. Universal installation instructions for multiple platforms.'
        }
    };

    return deviceSEOData[deviceType] || {
        title: 'Flix IPTV Setup Guide - Device Installation Instructions',
        keywords: 'IPTV setup guide, device installation, streaming setup, IPTV player installation, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, smart iptv, iptv smarters, perfect player',
        description: 'Step-by-step instructions to install and configure Flix IPTV on your device. Complete setup guide for IPTV streaming.'
    };
}


exports.activation=(req,res)=>{
    let promises=[];
    let keys=[
        'activation_meta_title','activation_meta_keyword','activation_meta_content',
        'show_paypal','show_coin','show_mollie','paypal_client_id','show_stripe',
        'paypal_mode','stripe_public_key','crypto_public_key','price'
    ]
    let data={}
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    promises.push(new Promise((resolve, reject)=>{
        CoinList.find().then(
            data=>{
                resolve(data)
            },
            error=>{
                reject(error);
            }
        )
    }))
    promises.push(new Promise((resolve, reject)=> {
        ActivationContent.findOne().then(
            activation_content => {
                resolve(activation_content);
            }
        )
    }));
    Promise.all(promises).then(values=> {
        if(data.activation_meta_title=='')
            data.activation_meta_title='Flix IPTV';
        data.title=data.activation_meta_title;
        data.keyword=data.activation_meta_keyword;
        data.description=data.activation_meta_content;
        let coin_list=values[0] ? values[0] : [];
        data.activation_content=values[1] ? values[1] : null;
        data.coin_list=coin_list;
        res.render('frontend/pages/activation', {menu: 'activation',...data});
    });
}

exports.codes=(req,res)=>{
    // Complete EPG codes database from siptv.eu/codes
    const epgCodes = [
        // International News & Entertainment
        { name: 'BBC Entertainment', code: 'bbc-entertainment', country: 'UK', category: 'Entertainment' },
        { name: 'BBC News', code: 'bbc-world', country: 'UK', category: 'News' },
        { name: 'BBC', code: 'bbc', country: 'UK', category: 'General' },
        { name: 'CNN', code: 'cnn', country: 'USA', category: 'News' },
        { name: 'Bloomberg', code: 'bloomberg', country: 'USA', category: 'News' },
        { name: 'CNBC Europe', code: 'cnbc', country: 'Europe', category: 'News' },
        
        // Kids & Animation
        { name: 'Cartoon Network', code: 'cartoon', country: 'International', category: 'Kids' },
        { name: 'Cartoonito', code: 'boomerang', country: 'International', category: 'Kids' },
        { name: 'BabyTV', code: 'baby-tv', country: 'International', category: 'Kids' },
        { name: 'Cartoons 90', code: 'cartoons-90', country: 'International', category: 'Kids' },
        { name: 'Cartoons Big', code: 'cartoons-big', country: 'International', category: 'Kids' },
        { name: 'Cartoons Short', code: 'cartoons-short', country: 'International', category: 'Kids' },
        
        // Documentary & Educational
        { name: 'Animal Planet', code: 'animal_rus', country: 'Russia', category: 'Documentary' },
        { name: 'Animal Planet Europe', code: 'animal_ukr', country: 'Europe', category: 'Documentary' },
        { name: 'Animal Planet HD', code: 'animal-hd', country: 'International', category: 'Documentary' },
        { name: 'Da Vinci Learning Россия', code: 'da_vinci-rus', country: 'Russia', category: 'Documentary' },
        { name: 'Curiosity Stream', code: 'curiosity-stream', country: 'International', category: 'Documentary' },
        { name: 'CBS Reality', code: 'CBSReality.ru', country: 'Russia', category: 'Documentary' },
        
        // Movies & Cinema
        { name: 'Cinema', code: 'park-razvlecheniy', country: 'Russia', category: 'Movies' },
        { name: 'Cinema (Космос ТВ)', code: 'Cinema.ru', country: 'Russia', category: 'Movies' },
        { name: 'CineMan', code: 'cineman', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Action', code: 'cineman-action', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Marvel', code: 'cineman-marvel', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Thriller', code: 'cineman-thriller', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Comedy', code: 'cineman-comedy', country: 'Russia', category: 'Movies' },
        { name: 'AMC Украина и Прибалтика', code: 'mgm-int', country: 'Ukraine', category: 'Movies' },
        
        // Premium Movie Channels
        { name: 'BCU Cinema HD', code: 'bcu-cinema', country: 'Russia', category: 'Movies' },
        { name: 'BCU Action HD', code: 'bcu-action', country: 'Russia', category: 'Movies' },
        { name: 'BCU Comedy HD', code: 'bcu-comedy', country: 'Russia', category: 'Movies' },
        { name: 'BCU Marvel HD', code: 'bcu-marvel', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere HD', code: 'bcu-premiere', country: 'Russia', category: 'Movies' },
        { name: 'BCU Fantastic HD', code: 'bcu-fantastic', country: 'Russia', category: 'Movies' },
        { name: 'BCU History HD', code: 'bcu-history', country: 'Russia', category: 'Documentary' },
        
        // Box Premium Channels
        { name: 'BOX Oscar HD', code: 'box-oscar', country: 'Russia', category: 'Movies' },
        { name: 'BOX Gangster HD', code: 'box-gangster', country: 'Russia', category: 'Movies' },
        { name: 'BOX Western HD', code: 'box-western', country: 'Russia', category: 'Movies' },
        { name: 'BOX Fantasy HD', code: 'box-fantasy', country: 'Russia', category: 'Movies' },
        { name: 'BOX Horror HD', code: 'box-zombie', country: 'Russia', category: 'Movies' },
        { name: 'BOX Spy HD', code: 'box-spy', country: 'Russia', category: 'Movies' },
        
        // Sports
        { name: 'BOX SportCast HD', code: 'box-sportcast', country: 'Russia', category: 'Sports' },
        { name: 'Adjarasport 1', code: 'Adjarasport1.ge', country: 'Georgia', category: 'Sports' },
        
        // Music & Entertainment
        { name: 'Bridge TV', code: 'bridge', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Deluxe', code: 'bridge-hd', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Hits', code: 'dange', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Rock', code: 'bridge-tv-rock', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Classic', code: 'topsong', country: 'Russia', category: 'Music' },
        { name: 'Clubbing TV', code: 'clubbing-tv', country: 'International', category: 'Music' },
        { name: '4Ever Music HD', code: '4evermusic', country: 'International', category: 'Music' },
        
        // Ukrainian Channels
        { name: '1+1 Международный', code: '1p1_int', country: 'Ukraine', category: 'General' },
        { name: '2+2', code: '2p2', country: 'Ukraine', category: 'General' },
        { name: '1+1 Марафон', code: '1p1', country: 'Ukraine', category: 'General' },
        { name: '8 канал (Украина)', code: 'pro-vse', country: 'Ukraine', category: 'General' },
        { name: '7 канал (Одесса)', code: '7-kanal-od', country: 'Ukraine', category: 'Regional' },
        
        // Russian Channels
        { name: '5 канал', code: '5kanal', country: 'Russia', category: 'General' },
        { name: '8 канал (Россия)', code: '8-kanal', country: 'Russia', category: 'General' },
        { name: '12 канал Омск', code: '12-omsk', country: 'Russia', category: 'Regional' },
        { name: '49 канал (Новосибирск)', code: '49kanal', country: 'Russia', category: 'Regional' },
        { name: '360° Новости', code: '360-news', country: 'Russia', category: 'News' },
        { name: '24 (Телеканал новостей 24)', code: 'news24', country: 'Russia', category: 'News' },
        { name: '2х2', code: '2x2', country: 'Russia', category: 'Entertainment' },
        { name: 'Bolt Россия', code: 'bolt', country: 'Russia', category: 'Entertainment' },
        
        // Comedy & Entertainment
        { name: 'Comedy Central Russian', code: 'paramount-comedy', country: 'Russia', category: 'Entertainment' },
        { name: 'Candy', code: 'candy', country: 'Russia', category: 'Entertainment' },
        
        // Georgian Channels
        { name: '1 TV GE', code: 'FirstChannel.ge', country: 'Georgia', category: 'General' },
        { name: '2 TV GE', code: '2TV.ge', country: 'Georgia', category: 'General' },
        { name: 'Ajara TV', code: 'AjaraTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Comedy TV GE', code: 'ComedyTV.ge', country: 'Georgia', category: 'Entertainment' },
        
        // Armenian Channels
        { name: '21TV AM', code: '21TV.am', country: 'Armenia', category: 'General' },
        { name: 'Armenia TV', code: 'ArmeniaTV.am', country: 'Armenia', category: 'General' },
        { name: 'ArmNews', code: 'ArmNews.am', country: 'Armenia', category: 'News' },
        { name: 'AR AM', code: 'AR.am', country: 'Armenia', category: 'General' },
        { name: 'Ararat', code: 'Ararat.am', country: 'Armenia', category: 'General' },
        { name: 'ATV Армения', code: 'ATV.am', country: 'Armenia', category: 'General' },
        { name: 'Armcinema', code: 'Armcinema.am', country: 'Armenia', category: 'Movies' },
        { name: 'Comedy AM', code: 'Comedy.am', country: 'Armenia', category: 'Entertainment' },
        { name: 'Cineman AM', code: 'Cineman.am', country: 'Armenia', category: 'Movies' },
        
        // Belarusian Channels
        { name: '8 канал (Беларусь)', code: '8channel', country: 'Belarus', category: 'General' },
        
        // French Channels
        { name: 'Cine+', code: 'cine+', country: 'France', category: 'Movies' },
        { name: 'Cine+ HD', code: 'cine+hd', country: 'France', category: 'Movies' },
        { name: 'Cine+ Hit HD', code: 'cine+hit-hd', country: 'France', category: 'Movies' },
        { name: 'Cine+ Kids', code: 'cine+kids', country: 'France', category: 'Kids' },
        { name: 'Cine+ Legend', code: 'cine+legend', country: 'France', category: 'Movies' },
        
        // Bulgarian Channels
        { name: 'Box Music TV BG', code: 'box-music-tv-bg', country: 'Bulgaria', category: 'Music' },
        
        // International Premium
        { name: 'Bollywood HD', code: 'bollywood-hd', country: 'India', category: 'Movies' },
        { name: 'Arirang', code: 'arirang-en', country: 'Korea', category: 'General' },
        { name: 'CGTN Русский', code: 'cctv', country: 'China', category: 'News' },
        
        // Adult Content
        { name: 'Blue Hustler', code: 'hustler-blue', country: 'International', category: 'Adult' },
        
        // Regional & Specialty
        { name: 'ATR', code: 'atr', country: 'Crimea', category: 'Regional' },
        { name: 'AzTV', code: 'aztv', country: 'Azerbaijan', category: 'General' },
        { name: 'CNL Украина', code: 'cnl-ukraine', country: 'Ukraine', category: 'General' },
        { name: 'DetectiveJam', code: 'detectivejam', country: 'Russia', category: 'Entertainment' },
        
        // Clarity4K Premium Channels
        { name: 'Clarity4K Anime', code: 'clarity4k-anime', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Netflix', code: 'clarity4k-netflix', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K HBO series', code: 'clarity4k-hboseries', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Walt Disney', code: 'clarity4k-waltdisney', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Боевик', code: 'clarity4k-boevik', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Комедия', code: 'clarity4k-komedia', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Фантастика', code: 'clarity4k-fantastik', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Ужасы', code: 'clarity4k-uzasy', country: 'Russia', category: 'Movies' },
        
        // Turkish Channels - Comprehensive List
        { name: 'TRT 1', code: 'trt1', country: 'Turkey', category: 'General' },
        { name: 'TRT Haber', code: 'trt-haber', country: 'Turkey', category: 'News' },
        { name: 'TRT Spor', code: 'trt-spor', country: 'Turkey', category: 'Sports' },
        { name: 'TRT Çocuk', code: 'trt-cocuk', country: 'Turkey', category: 'Kids' },
        { name: 'TRT Müzik', code: 'trt-muzik', country: 'Turkey', category: 'Music' },
        { name: 'TRT Belgesel', code: 'trt-belgesel', country: 'Turkey', category: 'Documentary' },
        { name: 'TRT Türk', code: 'trt-turk', country: 'Turkey', category: 'General' },
        { name: 'TRT Avaz', code: 'trt-avaz', country: 'Turkey', category: 'General' },
        { name: 'TRT World', code: 'trt-world', country: 'Turkey', category: 'News' },
        { name: 'ATV Türkiye', code: 'atv-tr', country: 'Turkey', category: 'General' },
        { name: 'Kanal D', code: 'kanal-d', country: 'Turkey', category: 'General' },
        { name: 'Show TV', code: 'show-tv', country: 'Turkey', category: 'General' },
        { name: 'Star TV', code: 'star-tv', country: 'Turkey', category: 'General' },
        { name: 'Fox TV', code: 'fox-tv-tr', country: 'Turkey', category: 'General' },
        { name: 'TV8', code: 'tv8-tr', country: 'Turkey', category: 'Entertainment' },
        { name: 'NTV', code: 'ntv-tr', country: 'Turkey', category: 'News' },
        { name: 'Habertürk TV', code: 'haberturk', country: 'Turkey', category: 'News' },
        { name: 'CNN Türk', code: 'cnn-turk', country: 'Turkey', category: 'News' },
        { name: 'A Haber', code: 'a-haber', country: 'Turkey', category: 'News' },
        { name: 'Haber Global', code: 'haber-global', country: 'Turkey', category: 'News' },
        { name: 'Halk TV', code: 'halk-tv', country: 'Turkey', category: 'News' },
        { name: 'TGRT Haber', code: 'tgrt-haber', country: 'Turkey', category: 'News' },
        { name: 'TV100', code: 'tv100', country: 'Turkey', category: 'News' },
        { name: 'Ulusal Kanal', code: 'ulusal-kanal', country: 'Turkey', category: 'News' },
        { name: 'Kanal 7', code: 'kanal7', country: 'Turkey', category: 'General' },
        { name: 'Beyaz TV', code: 'beyaz-tv', country: 'Turkey', category: 'General' },
        { name: 'NOW TV', code: 'now-tv-tr', country: 'Turkey', category: 'General' },
        { name: 'TV8.5', code: 'tv8-5', country: 'Turkey', category: 'Entertainment' },
        { name: 'Teve2', code: 'teve2', country: 'Turkey', category: 'General' },
        { name: 'Flash TV', code: 'flash-tv', country: 'Turkey', category: 'General' },
        { name: 'Number1 TV', code: 'number1-tv', country: 'Turkey', category: 'Music' },
        { name: 'Kral TV', code: 'kral-tv', country: 'Turkey', category: 'Music' },
        { name: 'Power TV', code: 'power-tv', country: 'Turkey', category: 'Music' },
        { name: 'Dream TV', code: 'dream-tv', country: 'Turkey', category: 'Music' },
        { name: 'FashionTV Turkey', code: 'fashion-tv-tr', country: 'Turkey', category: 'Entertainment' },
        { name: 'Dmax Türkiye', code: 'dmax-tr', country: 'Turkey', category: 'Documentary' },
        { name: 'National Geographic Turkey', code: 'natgeo-tr', country: 'Turkey', category: 'Documentary' },
        { name: 'Discovery Channel Turkey', code: 'discovery-tr', country: 'Turkey', category: 'Documentary' },
        { name: 'TLC Turkey', code: 'tlc-tr', country: 'Turkey', category: 'Entertainment' },
        { name: 'Minika Çocuk', code: 'minika-cocuk', country: 'Turkey', category: 'Kids' },
        { name: 'Minika GO', code: 'minika-go', country: 'Turkey', category: 'Kids' },
        { name: 'Cartoon Network Turkey', code: 'cartoon-tr', country: 'Turkey', category: 'Kids' },
        { name: 'Disney Channel Turkey', code: 'disney-tr', country: 'Turkey', category: 'Kids' },
        { name: 'Nickelodeon Turkey', code: 'nick-tr', country: 'Turkey', category: 'Kids' },
        { name: 'CNBC-e', code: 'cnbc-e', country: 'Turkey', category: 'News' },
        { name: 'Bloomberg HT', code: 'bloomberg-ht', country: 'Turkey', category: 'News' },
        { name: 'Akit TV', code: 'akit-tv', country: 'Turkey', category: 'News' },
        { name: 'Ülke TV', code: 'ulke-tv', country: 'Turkey', category: 'News' },
        { name: 'Yeni Şafak', code: 'yeni-safak', country: 'Turkey', category: 'News' },
        { name: 'Meltem TV', code: 'meltem-tv', country: 'Turkey', category: 'General' },
        { name: 'Kanal Firat', code: 'kanal-firat', country: 'Turkey', category: 'Regional' },
        { name: 'GRT', code: 'grt', country: 'Turkey', category: 'Regional' },
        { name: 'Diyalog TV', code: 'diyalog-tv', country: 'Turkey', category: 'Regional' },
        
        // German/Austrian/Swiss Channels (DE/AT/CH)
        { name: 'Das Erste', code: 'das-erste', country: 'Germany', category: 'General' },
        { name: 'ZDF', code: 'zdf', country: 'Germany', category: 'General' },
        { name: 'RTL', code: 'rtl-de', country: 'Germany', category: 'General' },
        { name: 'SAT.1', code: 'sat1', country: 'Germany', category: 'General' },
        { name: 'ProSieben', code: 'pro7', country: 'Germany', category: 'General' },
        { name: 'VOX', code: 'vox-de', country: 'Germany', category: 'General' },
        { name: 'RTL2', code: 'rtl2', country: 'Germany', category: 'General' },
        { name: 'Kabel Eins', code: 'kabel1', country: 'Germany', category: 'General' },
        { name: 'N-TV', code: 'ntv-de', country: 'Germany', category: 'News' },
        { name: 'N24 DOKU', code: 'n24-doku', country: 'Germany', category: 'Documentary' },
        { name: 'ORF 1', code: 'orf1', country: 'Austria', category: 'General' },
        { name: 'ORF 2', code: 'orf2', country: 'Austria', category: 'General' },
        { name: 'SRF 1', code: 'srf1', country: 'Switzerland', category: 'General' },
        { name: 'SRF zwei', code: 'srf2', country: 'Switzerland', category: 'General' },
        
        // Spanish Channels
        { name: 'La 1', code: 'la1', country: 'Spain', category: 'General' },
        { name: 'La 2', code: 'la2', country: 'Spain', category: 'General' },
        { name: 'Antena 3', code: 'antena3', country: 'Spain', category: 'General' },
        { name: 'Cuatro', code: 'cuatro', country: 'Spain', category: 'General' },
        { name: 'Telecinco', code: 'telecinco', country: 'Spain', category: 'General' },
        { name: 'La Sexta', code: 'lasexta', country: 'Spain', category: 'General' },
        { name: 'Canal+ España', code: 'canal-plus-es', country: 'Spain', category: 'Movies' },
        { name: 'Movistar+', code: 'movistar-plus', country: 'Spain', category: 'Movies' },
        
        // Italian Channels
        { name: 'Rai 1', code: 'rai1', country: 'Italy', category: 'General' },
        { name: 'Rai 2', code: 'rai2', country: 'Italy', category: 'General' },
        { name: 'Rai 3', code: 'rai3', country: 'Italy', category: 'General' },
        { name: 'Canale 5', code: 'canale5', country: 'Italy', category: 'General' },
        { name: 'Italia 1', code: 'italia1', country: 'Italy', category: 'General' },
        { name: 'Rete 4', code: 'rete4', country: 'Italy', category: 'General' },
        { name: 'La7', code: 'la7', country: 'Italy', category: 'General' },
        { name: 'Sky Cinema Uno', code: 'sky-cinema-uno', country: 'Italy', category: 'Movies' },
        
        // Polish Channels
        { name: 'TVP 1', code: 'tvp1', country: 'Poland', category: 'General' },
        { name: 'TVP 2', code: 'tvp2', country: 'Poland', category: 'General' },
        { name: 'Polsat', code: 'polsat', country: 'Poland', category: 'General' },
        { name: 'TVN', code: 'tvn', country: 'Poland', category: 'General' },
        { name: 'TVP Info', code: 'tvp-info', country: 'Poland', category: 'News' },
        { name: 'TVN24', code: 'tvn24', country: 'Poland', category: 'News' },
        { name: 'Polsat News', code: 'polsat-news', country: 'Poland', category: 'News' },
        
        // Nordic Channels
        { name: 'SVT1', code: 'svt1', country: 'Sweden', category: 'General' },
        { name: 'SVT2', code: 'svt2', country: 'Sweden', category: 'General' },
        { name: 'TV4', code: 'tv4-se', country: 'Sweden', category: 'General' },
        { name: 'NRK1', code: 'nrk1', country: 'Norway', category: 'General' },
        { name: 'NRK2', code: 'nrk2', country: 'Norway', category: 'General' },
        { name: 'TV 2 Norge', code: 'tv2-no', country: 'Norway', category: 'General' },
        { name: 'DR1', code: 'dr1', country: 'Denmark', category: 'General' },
        { name: 'DR2', code: 'dr2', country: 'Denmark', category: 'General' },
        { name: 'TV 2 Danmark', code: 'tv2-dk', country: 'Denmark', category: 'General' },
        { name: 'YLE TV1', code: 'yle1', country: 'Finland', category: 'General' },
        { name: 'YLE TV2', code: 'yle2', country: 'Finland', category: 'General' },
        
        // Portuguese/Brazilian Channels
        { name: 'RTP 1', code: 'rtp1', country: 'Portugal', category: 'General' },
        { name: 'RTP 2', code: 'rtp2', country: 'Portugal', category: 'General' },
        { name: 'SIC', code: 'sic', country: 'Portugal', category: 'General' },
        { name: 'TVI', code: 'tvi', country: 'Portugal', category: 'General' },
        { name: 'Globo', code: 'globo', country: 'Brazil', category: 'General' },
        { name: 'SBT', code: 'sbt', country: 'Brazil', category: 'General' },
        { name: 'Record TV', code: 'record', country: 'Brazil', category: 'General' },
        { name: 'Band', code: 'band', country: 'Brazil', category: 'General' },
        
        // Greek Channels
        { name: 'ERT1', code: 'ert1', country: 'Greece', category: 'General' },
        { name: 'ERT2', code: 'ert2', country: 'Greece', category: 'General' },
        { name: 'Mega Channel', code: 'mega-gr', country: 'Greece', category: 'General' },
        { name: 'ANT1', code: 'ant1-gr', country: 'Greece', category: 'General' },
        { name: 'Alpha TV', code: 'alpha-tv', country: 'Greece', category: 'General' },
        { name: 'Star Channel', code: 'star-gr', country: 'Greece', category: 'General' },
        
        // Middle East Channels
        { name: 'Al Jazeera', code: 'aljazeera', country: 'Qatar', category: 'News' },
        { name: 'Al Arabiya', code: 'alarabiya', country: 'UAE', category: 'News' },
        { name: 'MBC 1', code: 'mbc1', country: 'UAE', category: 'General' },
        { name: 'MBC 2', code: 'mbc2', country: 'UAE', category: 'Movies' },
        { name: 'Dubai TV', code: 'dubai-tv', country: 'UAE', category: 'General' },
        
        // Canadian Channels
        { name: 'CBC', code: 'cbc', country: 'Canada', category: 'General' },
        { name: 'CTV', code: 'ctv', country: 'Canada', category: 'General' },
        { name: 'Global TV', code: 'global-tv', country: 'Canada', category: 'General' },
        { name: 'TVA', code: 'tva', country: 'Canada', category: 'General' },
        { name: 'Radio-Canada', code: 'radio-canada', country: 'Canada', category: 'General' },
        
        // Romanian & Hungarian Channels
        { name: 'TVR 1', code: 'tvr1', country: 'Romania', category: 'General' },
        { name: 'Pro TV', code: 'pro-tv-ro', country: 'Romania', category: 'General' },
        { name: 'Antena 1', code: 'antena1-ro', country: 'Romania', category: 'General' },
        { name: 'M1', code: 'm1-hu', country: 'Hungary', category: 'General' },
        { name: 'M2', code: 'm2-hu', country: 'Hungary', category: 'General' },
        { name: 'RTL Klub', code: 'rtl-klub', country: 'Hungary', category: 'General' },
        
        // Czech/Slovak Channels
        { name: 'ČT1', code: 'ct1', country: 'Czech Republic', category: 'General' },
        { name: 'ČT2', code: 'ct2', country: 'Czech Republic', category: 'General' },
        { name: 'Nova', code: 'nova-cz', country: 'Czech Republic', category: 'General' },
        { name: 'Prima', code: 'prima-cz', country: 'Czech Republic', category: 'General' },
        { name: 'JOJ', code: 'joj', country: 'Slovakia', category: 'General' },
        { name: 'Markíza', code: 'markiza', country: 'Slovakia', category: 'General' },
        
        // Israeli Channels
        { name: 'Channel 11', code: 'channel11-il', country: 'Israel', category: 'General' },
        { name: 'Channel 12', code: 'channel12-il', country: 'Israel', category: 'General' },
        { name: 'Channel 13', code: 'channel13-il', country: 'Israel', category: 'General' },
        { name: 'Channel 14', code: 'channel14-il', country: 'Israel', category: 'General' },
        
        // Mexican & Latin American
        { name: 'Las Estrellas', code: 'las-estrellas', country: 'Mexico', category: 'General' },
        { name: 'Canal 5', code: 'canal5-mx', country: 'Mexico', category: 'General' },
        { name: 'Azteca Uno', code: 'azteca-uno', country: 'Mexico', category: 'General' },
        { name: 'Televisa', code: 'televisa', country: 'Mexico', category: 'General' },
        
        // Chilean & Argentinian
        { name: 'TVN Chile', code: 'tvn-cl', country: 'Chile', category: 'General' },
        { name: 'Canal 13 Chile', code: 'canal13-cl', country: 'Chile', category: 'General' },
        { name: 'Mega Chile', code: 'mega-cl', country: 'Chile', category: 'General' },
        { name: 'Telefe', code: 'telefe', country: 'Argentina', category: 'General' },
        { name: 'Canal 13 Argentina', code: 'canal13-ar', country: 'Argentina', category: 'General' },
        { name: 'América TV', code: 'america-tv-ar', country: 'Argentina', category: 'General' },
        
        // Baltic States
        { name: 'LTV1', code: 'ltv1', country: 'Latvia', category: 'General' },
        { name: 'TV3 Latvia', code: 'tv3-lv', country: 'Latvia', category: 'General' },
        { name: 'LRT', code: 'lrt', country: 'Lithuania', category: 'General' },
        { name: 'TV3 Lithuania', code: 'tv3-lt', country: 'Lithuania', category: 'General' },
        { name: 'ETV', code: 'etv', country: 'Estonia', category: 'General' },
        { name: 'Kanal 2', code: 'kanal2-ee', country: 'Estonia', category: 'General' },
        
        // Benelux
        { name: 'NPO 1', code: 'npo1', country: 'Netherlands', category: 'General' },
        { name: 'NPO 2', code: 'npo2', country: 'Netherlands', category: 'General' },
        { name: 'RTL 4', code: 'rtl4', country: 'Netherlands', category: 'General' },
        { name: 'SBS6', code: 'sbs6', country: 'Netherlands', category: 'General' },
        { name: 'VRT 1', code: 'vrt1', country: 'Belgium', category: 'General' },
        { name: 'Vtm', code: 'vtm', country: 'Belgium', category: 'General' },
        { name: 'RTL-TVI', code: 'rtl-tvi', country: 'Belgium', category: 'General' },
        
        // Additional Major European Channels
        { name: 'Eurosport 1', code: 'eurosport1', country: 'Europe', category: 'Sports' },
        { name: 'Eurosport 2', code: 'eurosport2', country: 'Europe', category: 'Sports' },
        { name: 'MTV Europe', code: 'mtv-eu', country: 'Europe', category: 'Music' },
        { name: 'VH1 Europe', code: 'vh1-eu', country: 'Europe', category: 'Music' },
        { name: 'Comedy Central Europe', code: 'comedy-central-eu', country: 'Europe', category: 'Entertainment' },
        { name: 'Nickelodeon Europe', code: 'nick-eu', country: 'Europe', category: 'Kids' },
        { name: 'Discovery Europe', code: 'discovery-eu', country: 'Europe', category: 'Documentary' },
        { name: 'History Europe', code: 'history-eu', country: 'Europe', category: 'Documentary' },
        { name: 'National Geographic Europe', code: 'natgeo-eu', country: 'Europe', category: 'Documentary' },
        
        // Albanian Channels
        { name: 'RTSH 1', code: 'rtsh1', country: 'Albania', category: 'General' },
        { name: 'RTSH 2', code: 'rtsh2', country: 'Albania', category: 'General' },
        { name: 'Top Channel', code: 'top-channel', country: 'Albania', category: 'General' },
        { name: 'Klan TV', code: 'klan-tv', country: 'Albania', category: 'General' },
        { name: 'TV Klan', code: 'tv-klan', country: 'Albania', category: 'General' },
        { name: 'Vizion Plus', code: 'vizion-plus', country: 'Albania', category: 'General' },
        { name: 'News 24', code: 'news24-al', country: 'Albania', category: 'News' },
        { name: 'Report TV', code: 'report-tv', country: 'Albania', category: 'News' },
        { name: 'ABC News', code: 'abc-news-al', country: 'Albania', category: 'News' },
        { name: 'Ora News', code: 'ora-news', country: 'Albania', category: 'News' },
        
        // Macedonian Channels
        { name: 'MRT 1', code: 'mrt1', country: 'Macedonia', category: 'General' },
        { name: 'MRT 2', code: 'mrt2', country: 'Macedonia', category: 'General' },
        { name: 'Sitel TV', code: 'sitel', country: 'Macedonia', category: 'General' },
        { name: 'Kanal 5', code: 'kanal5-mk', country: 'Macedonia', category: 'General' },
        { name: 'Alfa TV', code: 'alfa-tv-mk', country: 'Macedonia', category: 'General' },
        { name: 'Telma', code: 'telma', country: 'Macedonia', category: 'General' },
        { name: '24 Vesti', code: '24vesti', country: 'Macedonia', category: 'News' },
        
        // Serbian Channels (ExYu)
        { name: 'RTS 1', code: 'rts1', country: 'Serbia', category: 'General' },
        { name: 'RTS 2', code: 'rts2', country: 'Serbia', category: 'General' },
        { name: 'Pink', code: 'pink', country: 'Serbia', category: 'General' },
        { name: 'B92', code: 'b92', country: 'Serbia', category: 'General' },
        { name: 'Nova S', code: 'nova-s', country: 'Serbia', category: 'General' },
        { name: 'N1 Srbija', code: 'n1-srbija', country: 'Serbia', category: 'News' },
        { name: 'Happy TV', code: 'happy-tv', country: 'Serbia', category: 'General' },
        { name: 'Studio B', code: 'studio-b', country: 'Serbia', category: 'General' },
        { name: 'TV Prva', code: 'tv-prva', country: 'Serbia', category: 'General' },
        
        // Croatian Channels (ExYu)
        { name: 'HRT 1', code: 'hrt1', country: 'Croatia', category: 'General' },
        { name: 'HRT 2', code: 'hrt2', country: 'Croatia', category: 'General' },
        { name: 'Nova TV', code: 'nova-tv-hr', country: 'Croatia', category: 'General' },
        { name: 'RTL Hrvatska', code: 'rtl-hr', country: 'Croatia', category: 'General' },
        { name: 'N1 Hrvatska', code: 'n1-hrvatska', country: 'Croatia', category: 'News' },
        { name: 'Doma TV', code: 'doma-tv', country: 'Croatia', category: 'General' },
        
        // Bosnian Channels (ExYu)
        { name: 'BHRT', code: 'bhrt', country: 'Bosnia', category: 'General' },
        { name: 'FTV', code: 'ftv', country: 'Bosnia', category: 'General' },
        { name: 'OBN', code: 'obn', country: 'Bosnia', category: 'General' },
        { name: 'N1 BiH', code: 'n1-bih', country: 'Bosnia', category: 'News' },
        { name: 'Al Jazeera Balkans', code: 'aj-balkans', country: 'Bosnia', category: 'News' },
        
        // Slovenian Channels (ExYu)
        { name: 'RTV SLO 1', code: 'rtvslo1', country: 'Slovenia', category: 'General' },
        { name: 'RTV SLO 2', code: 'rtvslo2', country: 'Slovenia', category: 'General' },
        { name: 'POP TV', code: 'pop-tv', country: 'Slovenia', category: 'General' },
        { name: 'Kanal A', code: 'kanal-a', country: 'Slovenia', category: 'General' },
        { name: 'TV3 Slovenia', code: 'tv3-si', country: 'Slovenia', category: 'General' },
        
        // Bulgarian Channels
        { name: 'BNT 1', code: 'bnt1', country: 'Bulgaria', category: 'General' },
        { name: 'BNT 2', code: 'bnt2', country: 'Bulgaria', category: 'General' },
        { name: 'bTV', code: 'btv', country: 'Bulgaria', category: 'General' },
        { name: 'Nova TV Bulgaria', code: 'nova-bg', country: 'Bulgaria', category: 'General' },
        { name: 'Bulgaria ON AIR', code: 'bg-onair', country: 'Bulgaria', category: 'News' },
        { name: 'TV7 Bulgaria', code: 'tv7-bg', country: 'Bulgaria', category: 'General' },
        { name: 'BG Music', code: 'bg-music', country: 'Bulgaria', category: 'Music' },
        { name: 'Folklor TV', code: 'folklor-tv', country: 'Bulgaria', category: 'Music' },
        
        // Indian Channels
        { name: 'Star Plus', code: 'star-plus', country: 'India', category: 'General' },
        { name: 'Colors TV', code: 'colors', country: 'India', category: 'General' },
        { name: 'Sony TV', code: 'sony-tv', country: 'India', category: 'General' },
        { name: 'Zee TV', code: 'zee-tv', country: 'India', category: 'General' },
        { name: 'Star Gold', code: 'star-gold', country: 'India', category: 'Movies' },
        { name: 'Zee Cinema', code: 'zee-cinema', country: 'India', category: 'Movies' },
        { name: 'Sony Max', code: 'sony-max', country: 'India', category: 'Movies' },
        { name: 'Colors Cineplex', code: 'colors-cineplex', country: 'India', category: 'Movies' },
        { name: 'NDTV 24x7', code: 'ndtv-24x7', country: 'India', category: 'News' },
        { name: 'Times Now', code: 'times-now', country: 'India', category: 'News' },
        { name: 'India Today', code: 'india-today', country: 'India', category: 'News' },
        { name: 'Republic TV', code: 'republic-tv', country: 'India', category: 'News' },
        { name: 'Star Sports 1', code: 'star-sports1', country: 'India', category: 'Sports' },
        { name: 'Sony Six', code: 'sony-six', country: 'India', category: 'Sports' },
        { name: 'Pogo', code: 'pogo', country: 'India', category: 'Kids' },
        { name: 'Nick India', code: 'nick-india', country: 'India', category: 'Kids' },
        { name: 'Disney India', code: 'disney-india', country: 'India', category: 'Kids' },
        
        // Additional Premium Movie Channels from Reference Site
        { name: '1HD', code: '1hdru', country: 'Russia', category: 'Movies' },
        { name: '1+2', code: '1-2', country: 'Russia', category: 'General' },
        { name: '34 канал (Днепр)', code: '34kanal', country: 'Ukraine', category: 'Regional' },
        { name: '36,6 TV', code: '36-6-tv', country: 'Russia', category: 'General' },
        { name: '360TuneBox', code: '360-tunebox', country: 'Russia', category: 'Music' },
        { name: '365 дней ТВ', code: '365dney', country: 'Russia', category: 'General' },
        { name: '78', code: '78kanal', country: 'Russia', category: 'Regional' },
        { name: '8 канал - Красноярский край', code: 'ya1pm', country: 'Russia', category: 'Regional' },
        { name: '4ever Cinema', code: '4ever-cinema', country: 'International', category: 'Movies' },
        { name: '4ever Drama', code: '4ever-drama', country: 'International', category: 'Movies' },
        { name: '4ever Music', code: '4ever-music', country: 'International', category: 'Music' },
        { name: '4ever Theater', code: '4ever-theater', country: 'International', category: 'Movies' },
        { name: '9 волна', code: '9volna', country: 'Russia', category: 'Regional' },
        { name: 'A1', code: 'amedia1', country: 'Russia', category: 'Movies' },
        { name: 'A2', code: 'amedia2', country: 'Russia', category: 'Movies' },
        { name: 'Adjarasport 2', code: 'Adjarasport2.ge', country: 'Georgia', category: 'Sports' },
        { name: 'AIVA', code: 'aiva', country: 'Russia', category: 'General' },
        { name: 'Amedia Hit', code: 'amedia-hit', country: 'Russia', category: 'Movies' },
        { name: 'Amedia Premium HD', code: 'amedia-hd', country: 'Russia', category: 'Movies' },
        { name: 'Bazmots TV', code: 'BazmotsTV.am', country: 'Armenia', category: 'General' },
        
        // Complete BCU Premium Movie Collection
        { name: 'BCU Catastrophe HD', code: 'bcu-catastrophe', country: 'Russia', category: 'Movies' },
        { name: 'BCU Charm HD', code: 'bcu-charm', country: 'Russia', category: 'Movies' },
        { name: 'BCU Cinema+ HD', code: 'bcu-cinema-plus', country: 'Russia', category: 'Movies' },
        { name: 'BCU Cosmo HD', code: 'bcu-cosmo', country: 'Russia', category: 'Movies' },
        { name: 'BCU Cosmo HDR', code: 'bcu-cosmo-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Criminal HD', code: 'bcu-criminal', country: 'Russia', category: 'Movies' },
        { name: 'BCU FilMystic HD', code: 'bcu-filmystic', country: 'Russia', category: 'Movies' },
        { name: 'BCU Kids 4K', code: 'bcu-kids-4k', country: 'Russia', category: 'Kids' },
        { name: 'BCU Kids HD', code: 'bcu-kids', country: 'Russia', category: 'Kids' },
        { name: 'BCU Kids+ HD', code: 'bcu-kids-plus', country: 'Russia', category: 'Kids' },
        { name: 'BCU Kinorating HD', code: 'bcu-kinorating', country: 'Russia', category: 'Movies' },
        { name: 'BCU Kinozakaz 4K', code: 'bcu-kinozakaz-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Kinozakaz Premiere 4K', code: 'bcu-kinozakaz-priemiere-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Little HD', code: 'bcu-little', country: 'Russia', category: 'Kids' },
        { name: 'BCU Marvel 4K', code: 'bcu-marvel-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Multserial HD', code: 'bcu-multserial', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere 1 HD', code: 'bcu-kinozal-prem1', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere 2 HD', code: 'bcu-kinozal-prem2', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere 3 HD', code: 'bcu-kinozal-prem3', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere Ultra 4K', code: 'bcu-premiere-ultra-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere Ultra 4K', code: 'bcu-premiere-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium 80 лет Победы 4K HDR', code: 'bcu-premium-pobed', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Action 4K HDR', code: 'bcu-premium-action-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Crime 4K HDR', code: 'bcu-premium-crime-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Fantastic 4K HDR', code: 'bcu-premium-fantstic-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Franchise 4K HDR', code: 'bcu-premium-franshise-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium History 4K HDR', code: 'bcu-premium-history-4k-hdr', country: 'Russia', category: 'Documentary' },
        { name: 'BCU Reality HD', code: 'bcu-reality', country: 'Russia', category: 'Documentary' },
        { name: 'BCU Romantic HD', code: 'bcu-romantic', country: 'Russia', category: 'Movies' },
        { name: 'BCU RUSerial HD', code: 'bcu-ruserial', country: 'Russia', category: 'Movies' },
        { name: 'BCU Russia 90s HD', code: 'bcu-russia-90s', country: 'Russia', category: 'Movies' },
        { name: 'BCU Russian HD', code: 'bcu-russian', country: 'Russia', category: 'Movies' },
        { name: 'BCU Stars HD', code: 'bcu-stars', country: 'Russia', category: 'Movies' },
        { name: 'BCU Survival HD', code: 'bcu-survival', country: 'Russia', category: 'Documentary' },
        { name: 'BCU TruMotion HD', code: 'bcu-trumotion', country: 'Russia', category: 'Movies' },
        { name: 'BCU Ultra 4K', code: 'bcu-ultra-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU VHS HD', code: 'bcu-vhs', country: 'Russia', category: 'Movies' },
        { name: 'BCU Сваты 4K', code: 'bcu-svaty-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Сваты HD', code: 'bcu-svaty', country: 'Russia', category: 'Movies' },
        { name: 'BCU СССР HD', code: 'bcu-ussr', country: 'Russia', category: 'Movies' },
        { name: 'BCU СССР HDR', code: 'bcu-ussr-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCUMedia HD', code: 'bcu-media', country: 'Russia', category: 'Movies' },
        
        // Complete BOX Premium Movie Collection
        { name: 'BOX Anime HD', code: 'box-anime', country: 'Russia', category: 'Kids' },
        { name: 'BOX Be ON Edge 1 live HD', code: 'box-beonedge-1-live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 1 Live HD', code: 'box-beonedge1live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 2 Live HD', code: 'box-beonedge2live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 2 live HD', code: 'box-beonedge-2-live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 3 Live HD', code: 'box-beonedge3live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge HD', code: 'box-beonedge', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Cyber HD', code: 'box-cyber', country: 'Russia', category: 'Movies' },
        { name: 'BOX Docu. HD', code: 'box-docu', country: 'Russia', category: 'Documentary' },
        { name: 'BOX Franchise HD', code: 'box-franchise', country: 'Russia', category: 'Movies' },
        { name: 'BOX Franchise HDR', code: 'box-franchise-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BOX Game HD', code: 'box-game', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Ghost HD', code: 'box-ghost', country: 'Russia', category: 'Movies' },
        { name: 'BOX Gurman HD', code: 'box-gurman', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX History 4K', code: 'box-history-4k', country: 'Russia', category: 'Documentary' },
        { name: 'BOX Hybrid HD', code: 'box-hybrid', country: 'Russia', category: 'Movies' },
        { name: 'BOX Kosmo 4K', code: 'box-kosmo-4k', country: 'Russia', category: 'Documentary' },
        { name: 'BOX LoFi HD', code: 'box-lofi', country: 'Russia', category: 'Music' },
        { name: 'BOX M.Serial HD', code: 'box-m-serial', country: 'Russia', category: 'Movies' },
        { name: 'BOX M.Serial HD', code: 'box-mserial', country: 'Russia', category: 'Movies' },
        { name: 'BOX Mayday HD', code: 'box-myday', country: 'Russia', category: 'Documentary' },
        { name: 'BOX Memory HD', code: 'box-memory', country: 'Russia', category: 'Movies' },
        { name: 'BOX Metall HD', code: 'box-metall', country: 'Russia', category: 'Music' },
        { name: 'BOX Music 4K', code: 'box-music-4k', country: 'Russia', category: 'Music' },
        { name: 'BOX Music 4K', code: 'box-music4k', country: 'Russia', category: 'Music' },
        { name: 'BOX Premiere+ 4K HDR', code: 'box-premiere-plus-4khdr', country: 'Russia', category: 'Movies' },
        { name: 'BOX Relax 4K', code: 'box-relax', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Relax 4K', code: 'box-relax4k', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Remast 4K', code: 'box-remast-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Remast+ 4K', code: 'box-remast-plus-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX RU.RAP HD', code: 'box-ru-rap', country: 'Russia', category: 'Music' },
        { name: 'BOX Russian 4K', code: 'box-russian-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Serial 4K', code: 'box-serial4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Serial HD', code: 'box-serial', country: 'Russia', category: 'Movies' },
        { name: 'BOX Serial Premiere 4K', code: 'box-serial-premiere-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Sitcom HD', code: 'box-sitcom', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX SportCast Live 1 HD', code: 'box-sportcast-live1', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 2 HD', code: 'box-sportcast-live2', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 3 HD', code: 'box-sportcast-live3', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 4 HD', code: 'box-sportcast-live4', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 5 HD', code: 'box-sportcast-live5', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 6 HD', code: 'box-sportcast-live6', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 7 HD', code: 'box-sportcast-live7', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 8 HD', code: 'box-sportcast-live8', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 9 HD', code: 'box-sportcast-live9', country: 'Russia', category: 'Sports' },
        { name: 'BOX Travel HD', code: 'box-travel', country: 'Russia', category: 'Documentary' },
        
        // Additional Music Channels
        { name: 'Bridge Rock', code: 'bridge-fresh', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Русский хит', code: 'rusong', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Фрэш', code: 'bridge-tv-fresh', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Шлягер', code: 'shlyager', country: 'Russia', category: 'Music' },
        
        // Complete Georgian Premium Channels Collection
        { name: 'Beyonce+ HD', code: 'BeyoncePlusHD.ge', country: 'Georgia', category: 'Music' },
        { name: 'Christmas + HD', code: 'ChristmasPlusHD.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Chveni Magti', code: 'ChveniMagti.ge', country: 'Georgia', category: 'General' },
        { name: 'CINE+ Classic', code: 'CINEPlusClassic.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Emotion', code: 'CINEPlusEmotion.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Family', code: 'CINEPlusFamily.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Festival', code: 'CINEPlusFestival.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Frisson', code: 'CINEPlusFrisson.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Ocs', code: 'CINEPlusOcs.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Comedie+ HD', code: 'ComediePlusHD.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Dardimandi', code: 'Dardimandi.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi + 4K Ultra HD', code: 'DigiPlus4KUltraHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Action HD', code: 'DigiPlusActionHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Cinema HD', code: 'DigiPlusCinemaHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Comedy HD', code: 'DigiPlusComedyHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Documentary HD', code: 'DigiPlusDocumentaryHD.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Digi + Drama HD', code: 'DigiPlusDramaHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Family HD', code: 'DigiPlusFamilyHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + HD', code: 'DigiPlusHD.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi + Horror HD', code: 'DigiPlusHorrorHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Idol HD', code: 'DigiPlusIdolHD.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Digi + Kids HD', code: 'DigiPlusKidsHD.ge', country: 'Georgia', category: 'Kids' },
        { name: 'Digi + Music HD', code: 'DigiPlusMusicHD.ge', country: 'Georgia', category: 'Music' },
        { name: 'Digi + Premiere HD', code: 'DigiPlusPremiereHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi+ City HD', code: 'DigiPlusCityHD.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi+ Georgian HD', code: 'DigiPlusGeorgianHD.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi+ Hits HD', code: 'DigiPlusHitsHD.ge', country: 'Georgia', category: 'Music' },
        { name: 'DIGI+ MUSIC 4K', code: 'DIGIPlusMUSIC4K.ge', country: 'Georgia', category: 'Music' },
        { name: 'DIGI+ Play 1', code: 'DIGIPlusPlay1.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Play 2', code: 'DIGIPlusPlay2.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Play 3', code: 'DIGIPlusPlay3.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Play 4', code: 'DIGIPlusPlay4.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Series HD', code: 'DIGIPlusSeriesHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'DIGI+ Stars', code: 'DIGIPlusStars.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'DIGI+4K 2', code: 'DIGIPlus4K2.ge', country: 'Georgia', category: 'Movies' },
        
        // Complete Clarity4K Premium Collection
        { name: 'Clarity4K Asia', code: 'clarity4k-asia', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Concert', code: 'clarity4k-concert', country: 'Russia', category: 'Music' },
        { name: 'Clarity4K Gamefilm', code: 'clarity4k-gamefilm', country: 'Russia', category: 'Entertainment' },
        { name: 'Clarity4K Kинодети CССР', code: 'clarity4k-kinidetisssr', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Travel Blog', code: 'clarity4k-puteshestvie', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K Авто Блог', code: 'clarity4k-avtomaster', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K Боевик VHS', code: 'clarity4k-boevikvhs', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Драмы', code: 'clarity4k-dramy', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Единоборства', code: 'clarity4k-edinoborstva', country: 'Russia', category: 'Sports' },
        { name: 'Clarity4K Запал', code: 'clarity4k-zapal', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Звериный мир', code: 'clarity4k-zwerinmir', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K КиноНовинки', code: 'clarity4k-kinonowinki', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K КиноСССР', code: 'clarity4k-sdelanowsssr', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K КиноФраншизы', code: 'clarity4k-kinofranshizy', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K КиноШарм', code: 'clarity4k-kinoszarm', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Классика кино', code: 'clarity4k-western', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Комедия СССР 1', code: 'clarity4k-komediasssr1', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Комедия СССР 2', code: 'clarity4k-komediasssr2', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Космомир', code: 'clarity4k-kosmomir', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K Мультимир', code: 'clarity4k-multimir', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Мультляндия', code: 'clarity4k-multlandia', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Мюзикл', code: 'clarity4k-muzikl', country: 'Russia', category: 'Music' },
        { name: 'Clarity4K Первый женский', code: 'clarity4k-pervyzenski', country: 'Russia', category: 'Entertainment' },
        { name: 'Clarity4K Приключения', code: 'clarity4k-prikluchenia', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Семейный', code: 'clarity4k-semejny', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Сумеречный Эфир', code: 'clarity4k-sumerefir', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Ужасы VHS', code: 'clarity4k-istoriivrema', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Фэнтези', code: 'clarity4k-fentezy', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4К Города', code: 'clarity4k-relaxkamin', country: 'Russia', category: 'Documentary' },
        
        // Additional CineMan Premium Collection
        { name: 'CineMan Melodrama', code: 'cineman-melodrama', country: 'Russia', category: 'Movies' },
        { name: 'CineMan MiniSeries', code: 'cineman-miniseries', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Premium', code: 'cineman-premium', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Top', code: 'cineman-top', country: 'Russia', category: 'Movies' },
        { name: 'CineMan VHS', code: 'cineman-vhs', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Военные Сериалы', code: 'cineman-vovserials', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Катастрофы', code: 'cineman-disasters', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Комедийные сериалы', code: 'cineman-komseri', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Криминальные Сериалы', code: 'cineman-gluhar', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Лесник', code: 'cineman-forester', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Ментовские Войны', code: 'cineman-MW', country: 'Russia', category: 'Movies' },
        { name: 'CineMan ПёС + Лихач', code: 'cineman-PES', country: 'Russia', category: 'Movies' },
        { name: 'CineMan РуКино', code: 'cineman-rukino', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Сваты', code: 'cineman-svaty', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Симпсоны', code: 'cineman-thesimps', country: 'Russia', category: 'Entertainment' },
        { name: 'CineMan Скорая помощь', code: 'cineman-ER', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Ужасы', code: 'cineman-uzhasy', country: 'Russia', category: 'Movies' },
        
        // Additional Premium International Channels
        { name: '.black', code: 'sony-turbo', country: 'International', category: 'Entertainment' },
        { name: '.red', code: 'set', country: 'International', category: 'Entertainment' },
        { name: '.red HD', code: 'set-hd', country: 'International', category: 'Entertainment' },
        { name: '.sci-fi', code: 'axn', country: 'International', category: 'Entertainment' },
        { name: '+TV', code: '+tv', country: 'International', category: 'General' },
        { name: 'CandyMan', code: 'candyman', country: 'International', category: 'Entertainment' },
        { name: 'Detektiv.tv', code: 'detektiv', country: 'Russia', category: 'Entertainment' },
        { name: 'Brodilo TV', code: 'brodilo', country: 'International', category: 'Entertainment' },
        
        // Additional Kids Channels
        { name: 'Ani', code: 'ani', country: 'International', category: 'Kids' },
        { name: 'C-Cartoon', code: 'c-cartoon', country: 'International', category: 'Kids' },
        { name: 'C-Comedy', code: 'c-comedy', country: 'International', category: 'Kids' },
        { name: 'C-History', code: 'c-history', country: 'International', category: 'Kids' },
        { name: 'C-Inquest', code: 'c-inquest', country: 'International', category: 'Kids' },
        { name: 'C-Marvel', code: 'c-marvel', country: 'International', category: 'Kids' },
        
        // Complete Georgian Channel Collection from Reference Site
        { name: '1 TV GE', code: 'FirstChannel.ge', country: 'Georgia', category: 'General' },
        { name: '2 TV GE', code: '2TV.ge', country: 'Georgia', category: 'General' },
        { name: 'Ajara TV', code: 'AjaraTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Comedy TV GE', code: 'ComedyTV.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Discovery Channel GE', code: 'DiscoveryChannel.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Discovery Science GE', code: 'DiscoveryScience.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Euronews GE', code: 'Euronews.ge', country: 'Georgia', category: 'News' },
        { name: 'First TV GE', code: 'FirstTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Fox Movies GE', code: 'FoxMovies.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Fox Series GE', code: 'FoxSeries.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Georgian Public Broadcasting GE', code: 'GPB.ge', country: 'Georgia', category: 'General' },
        { name: 'History Channel GE', code: 'HistoryChannel.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Imedi TV GE', code: 'ImediTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Mtavari Arkhi GE', code: 'MtavariArkhi.ge', country: 'Georgia', category: 'News' },
        { name: 'Rustavi 2 GE', code: 'Rustavi2.ge', country: 'Georgia', category: 'General' },
        { name: 'TV Pirveli GE', code: 'TVPirveli.ge', country: 'Georgia', category: 'General' },
        
        // Complete Armenian Channel Collection
        { name: '21TV AM', code: '21TV.am', country: 'Armenia', category: 'General' },
        { name: 'AR AM', code: 'AR.am', country: 'Armenia', category: 'General' },
        { name: 'Ararat', code: 'Ararat.am', country: 'Armenia', category: 'General' },
        { name: 'Armcinema', code: 'Armcinema.am', country: 'Armenia', category: 'Movies' },
        { name: 'Armenia TV', code: 'ArmeniaTV.am', country: 'Armenia', category: 'General' },
        { name: 'ArmNews', code: 'ArmNews.am', country: 'Armenia', category: 'News' },
        { name: 'ATV Армения', code: 'ATV.am', country: 'Armenia', category: 'General' },
        { name: 'Cineman AM', code: 'Cineman.am', country: 'Armenia', category: 'Movies' },
        { name: 'Comedy AM', code: 'Comedy.am', country: 'Armenia', category: 'Entertainment' },
        
        // Additional Russian Regional and Specialty Channels
        { name: '12 канал Омск', code: '12-omsk', country: 'Russia', category: 'Regional' },
        { name: '24 (Телеканал новостей 24)', code: 'news24', country: 'Russia', category: 'News' },
        { name: '2х2', code: '2x2', country: 'Russia', category: 'Entertainment' },
        { name: '2х2 (+2)', code: '2x2+2', country: 'Russia', category: 'Entertainment' },
        { name: '2х2 (+4)', code: '2x2+4', country: 'Russia', category: 'Entertainment' },
        { name: '2х2 (+7)', code: '2x2+7', country: 'Russia', category: 'Entertainment' },
        { name: '360° Новости', code: '360-news', country: 'Russia', category: 'News' },
        { name: '49 канал (Новосибирск)', code: '49kanal', country: 'Russia', category: 'Regional' },
        { name: '5 канал (Россия) (+6)', code: 'piter+6', country: 'Russia', category: 'General' },
        { name: '5 канал (Россия) (+8)', code: 'piter+8', country: 'Russia', category: 'General' },
        { name: '8 канал (Беларусь)', code: '8channel', country: 'Belarus', category: 'General' },
        { name: '8 канал (Россия)', code: '8-kanal', country: 'Russia', category: 'General' },
        { name: 'Bolt Россия', code: 'bolt', country: 'Russia', category: 'Entertainment' },
        
        // Additional Premium Movie Collections
        { name: 'Box Music TV BG', code: 'box-music-tv-bg', country: 'Bulgaria', category: 'Music' },
        { name: 'BOX Zombie HD', code: 'box-zombie', country: 'Russia', category: 'Movies' },
        { name: 'Candy', code: 'candy', country: 'Russia', category: 'Entertainment' },
        { name: 'Cine+', code: 'cine+', country: 'International', category: 'Movies' },
        { name: 'Cine+ HD', code: 'cine+hd', country: 'International', category: 'Movies' },
        { name: 'Cine+ Hit HD', code: 'cine+hit-hd', country: 'International', category: 'Movies' },
        { name: 'Cine+ Kids', code: 'cine+kids', country: 'International', category: 'Kids' },
        { name: 'Cine+ Legend', code: 'cine+legend', country: 'International', category: 'Movies' },
        { name: 'Comedy Central Russian', code: 'paramount-comedy', country: 'Russia', category: 'Entertainment' },
        
        // Complete Discovery Channel Collection
        { name: 'Discovery Channel Россия', code: 'discovery-ru', country: 'Russia', category: 'Documentary' },
        { name: 'Discovery Science', code: 'discovery-science', country: 'International', category: 'Documentary' },
        { name: 'Discovery Turbo', code: 'turbo', country: 'International', category: 'Documentary' },
        { name: 'Discovery World', code: 'discovery-world', country: 'International', category: 'Documentary' },
        { name: 'Discovery БВ', code: 'discovery-bv', country: 'Russia', category: 'Documentary' },
        { name: 'DTX', code: 'dtx', country: 'International', category: 'Documentary' },
        { name: 'Duna TV', code: 'duna-tv', country: 'Hungary', category: 'General' },
        { name: 'Duna World', code: 'duna-world', country: 'Hungary', category: 'General' },
        
        // French Channel Collection
        { name: 'Euronews Français', code: 'euronews-fr', country: 'France', category: 'News' },
        { name: 'Europe 1', code: 'europe1', country: 'France', category: 'News' },
        { name: 'France 2', code: 'france2', country: 'France', category: 'General' },
        { name: 'France 3', code: 'france3', country: 'France', category: 'General' },
        { name: 'France 4', code: 'france4', country: 'France', category: 'General' },
        { name: 'France 5', code: 'france5', country: 'France', category: 'General' },
        { name: 'France 24', code: 'france24', country: 'France', category: 'News' },
        { name: 'France Info', code: 'france-info', country: 'France', category: 'News' },
        
        // German Channel Collection
        { name: 'Euronews Deutsch', code: 'euronews-de', country: 'Germany', category: 'News' },
        { name: 'Eurosport 1 Deutschland', code: 'eurosport1-de', country: 'Germany', category: 'Sports' },
        { name: 'Eurosport 2 Deutschland', code: 'eurosport2-de', country: 'Germany', category: 'Sports' },
        { name: 'ProSieben', code: 'pro7', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL II', code: 'rtl2', country: 'Germany', category: 'Entertainment' },
        { name: 'SAT.1', code: 'sat1', country: 'Germany', category: 'Entertainment' },
        { name: 'VOX', code: 'vox-de', country: 'Germany', category: 'Entertainment' },
        { name: 'WDR', code: 'wdr', country: 'Germany', category: 'Regional' },
        
        // UK Channel Collection
        { name: 'Channel 4', code: 'channel4', country: 'UK', category: 'General' },
        { name: 'Channel 5', code: 'channel5', country: 'UK', category: 'General' },
        { name: 'ITV', code: 'itv', country: 'UK', category: 'General' },
        { name: 'ITV2', code: 'itv2', country: 'UK', category: 'Entertainment' },
        { name: 'Sky News', code: 'sky-news', country: 'UK', category: 'News' },
        { name: 'Sky Sports', code: 'sky-sports', country: 'UK', category: 'Sports' },
        
        // Italian Channel Collection
        { name: 'Canale 5', code: 'canale5', country: 'Italy', category: 'General' },
        { name: 'Italia 1', code: 'italia1', country: 'Italy', category: 'Entertainment' },
        { name: 'La7', code: 'la7', country: 'Italy', category: 'News' },
        { name: 'Rai 1', code: 'rai1', country: 'Italy', category: 'General' },
        { name: 'Rai 2', code: 'rai2', country: 'Italy', category: 'General' },
        { name: 'Rai 3', code: 'rai3', country: 'Italy', category: 'General' },
        { name: 'Rete 4', code: 'rete4', country: 'Italy', category: 'General' },
        
        // Spanish Channel Collection
        { name: 'Antena 3', code: 'antena3', country: 'Spain', category: 'General' },
        { name: 'Cuatro', code: 'cuatro', country: 'Spain', category: 'Entertainment' },
        { name: 'La 1', code: 'la1', country: 'Spain', category: 'General' },
        { name: 'La 2', code: 'la2', country: 'Spain', category: 'General' },
        { name: 'Telecinco', code: 'telecinco', country: 'Spain', category: 'General' },
        { name: 'Telemadrid', code: 'telemadrid', country: 'Spain', category: 'Regional' },
        
        // Nordic Channel Collection  
        { name: 'DR1', code: 'dr1', country: 'Denmark', category: 'General' },
        { name: 'NRK1', code: 'nrk1', country: 'Norway', category: 'General' },
        { name: 'SVT1', code: 'svt1', country: 'Sweden', category: 'General' },
        { name: 'TV 2 Danmark', code: 'tv2-dk', country: 'Denmark', category: 'General' },
        { name: 'TV 2 Norge', code: 'tv2-no', country: 'Norway', category: 'General' },
        { name: 'TV4 Sverige', code: 'tv4-se', country: 'Sweden', category: 'General' },
        { name: 'Yle TV1', code: 'yle-tv1', country: 'Finland', category: 'General' },
        
        // Eastern European Collection
        { name: 'Czech Television', code: 'ct1', country: 'Czech Republic', category: 'General' },
        { name: 'Markíza', code: 'markiza', country: 'Slovakia', category: 'General' },
        { name: 'Nova TV', code: 'nova-cz', country: 'Czech Republic', category: 'General' },
        { name: 'Polish Television', code: 'tvp1', country: 'Poland', category: 'General' },
        { name: 'Prima TV', code: 'prima-tv', country: 'Czech Republic', category: 'General' },
        { name: 'Slovak Television', code: 'stv1', country: 'Slovakia', category: 'General' },
        
        // Balkan Collection (ExYu region)
        { name: 'B92', code: 'b92', country: 'Serbia', category: 'News' },
        { name: 'BN TV', code: 'bn-tv', country: 'Bosnia', category: 'General' },
        { name: 'Face TV', code: 'face-tv', country: 'Bosnia', category: 'General' },
        { name: 'HRT 1', code: 'hrt1', country: 'Croatia', category: 'General' },
        { name: 'Nova S', code: 'nova-s', country: 'Serbia', category: 'General' },
        { name: 'OBN', code: 'obn', country: 'Bosnia', category: 'General' },
        { name: 'Pink', code: 'pink', country: 'Serbia', category: 'Entertainment' },
        { name: 'RTS 1', code: 'rts1', country: 'Serbia', category: 'General' },
        { name: 'RTL Croatia', code: 'rtl-hr', country: 'Croatia', category: 'General' },
        
        // Additional International Premium Channels
        { name: 'History Channel', code: 'history', country: 'International', category: 'Documentary' },
        { name: 'Nat Geo Wild', code: 'natgeo-wild', country: 'International', category: 'Documentary' },
        { name: 'National Geographic', code: 'natgeo', country: 'International', category: 'Documentary' },
        { name: 'Travel Channel', code: 'travel', country: 'International', category: 'Documentary' },
        { name: 'Viasat Explore', code: 'viasat-explore', country: 'International', category: 'Documentary' },
        { name: 'Viasat History', code: 'viasat-history', country: 'International', category: 'Documentary' },
        { name: 'Viasat Nature', code: 'viasat-nature', country: 'International', category: 'Documentary' },

        // MISSING CHANNELS FROM REFERENCE SITE - MASSIVE EXPANSION

        // Complete Discovery Channel Family
        { name: 'Discovery Channel', code: 'discovery', country: 'International', category: 'Documentary' },
        { name: 'Discovery Channel Россия', code: 'discovery-ru', country: 'Russia', category: 'Documentary' },
        { name: 'Discovery Historia', code: 'discovery-historia', country: 'International', category: 'Documentary' },
        { name: 'Discovery ID', code: 'discovery-id', country: 'International', category: 'Documentary' },
        { name: 'Discovery Life', code: 'discovery-life', country: 'International', category: 'Documentary' },
        { name: 'Discovery Science Россия', code: 'discovery-science-ru', country: 'Russia', category: 'Documentary' },
        { name: 'Discovery Showcase', code: 'discovery-showcase', country: 'International', category: 'Documentary' },
        { name: 'Discovery Turbo', code: 'discovery-turbo', country: 'International', category: 'Documentary' },
        { name: 'Discovery World', code: 'discovery-world', country: 'International', category: 'Documentary' },
        { name: 'Discovery БВ', code: 'discovery-bv', country: 'Russia', category: 'Documentary' },

        // German/Austrian/Swiss Channels (DE/AT/CH) - COMPLETE COLLECTION
        { name: '3sat', code: '3sat', country: 'Germany', category: 'General' },
        { name: 'ARD', code: 'ard', country: 'Germany', category: 'General' },
        { name: 'Arte', code: 'arte', country: 'Germany', category: 'Culture' },
        { name: 'Arte Français', code: 'arte-fr', country: 'France', category: 'Culture' },
        { name: 'BR', code: 'br', country: 'Germany', category: 'Regional' },
        { name: 'DMAX Deutschland', code: 'dmax-de', country: 'Germany', category: 'Documentary' },
        { name: 'Euronews Deutsch', code: 'euronews-de', country: 'Germany', category: 'News' },
        { name: 'Eurosport 1 Deutschland', code: 'eurosport1-de', country: 'Germany', category: 'Sports' },
        { name: 'Eurosport 2 Deutschland', code: 'eurosport2-de', country: 'Germany', category: 'Sports' },
        { name: 'HSE24', code: 'hse24', country: 'Germany', category: 'Shopping' },
        { name: 'Kabel 1', code: 'kabel1', country: 'Germany', category: 'Entertainment' },
        { name: 'KiKA', code: 'kika', country: 'Germany', category: 'Kids' },
        { name: 'n-tv', code: 'n-tv', country: 'Germany', category: 'News' },
        { name: 'NDR', code: 'ndr', country: 'Germany', category: 'Regional' },
        { name: 'ORF 1', code: 'orf1', country: 'Austria', category: 'General' },
        { name: 'ORF 2', code: 'orf2', country: 'Austria', category: 'General' },
        { name: 'ORF III', code: 'orf3', country: 'Austria', category: 'Culture' },
        { name: 'ORF Sport +', code: 'orf-sport', country: 'Austria', category: 'Sports' },
        { name: 'Phoenix', code: 'phoenix', country: 'Germany', category: 'News' },
        { name: 'ProSieben', code: 'pro7', country: 'Germany', category: 'Entertainment' },
        { name: 'ProSieben Maxx', code: 'pro7maxx', country: 'Germany', category: 'Entertainment' },
        { name: 'QVC Deutschland', code: 'qvc-de', country: 'Germany', category: 'Shopping' },
        { name: 'RTL', code: 'rtl-de', country: 'Germany', category: 'General' },
        { name: 'RTL 2', code: 'rtl2', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL Crime', code: 'rtl-crime', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL Living', code: 'rtl-living', country: 'Germany', category: 'Lifestyle' },
        { name: 'RTL Nitro', code: 'rtl-nitro', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL Passion', code: 'rtl-passion', country: 'Germany', category: 'Entertainment' },
        { name: 'SAT.1', code: 'sat1', country: 'Germany', category: 'Entertainment' },
        { name: 'SAT.1 Gold', code: 'sat1-gold', country: 'Germany', category: 'Entertainment' },
        { name: 'ServusTV', code: 'servus-tv', country: 'Austria', category: 'General' },
        { name: 'Sixx', code: 'sixx', country: 'Germany', category: 'Entertainment' },
        { name: 'Sky Deutschland', code: 'sky-de', country: 'Germany', category: 'Premium' },
        { name: 'Sport1', code: 'sport1', country: 'Germany', category: 'Sports' },
        { name: 'SRF 1', code: 'srf1', country: 'Switzerland', category: 'General' },
        { name: 'SRF 2', code: 'srf2', country: 'Switzerland', category: 'General' },
        { name: 'Super RTL', code: 'super-rtl', country: 'Germany', category: 'Kids' },
        { name: 'SWR', code: 'swr', country: 'Germany', category: 'Regional' },
        { name: 'Tele 5', code: 'tele5', country: 'Germany', category: 'Entertainment' },
        { name: 'TLC Deutschland', code: 'tlc-de', country: 'Germany', category: 'Entertainment' },
        { name: 'VOX', code: 'vox-de', country: 'Germany', category: 'Entertainment' },
        { name: 'VOXUP', code: 'voxup', country: 'Germany', category: 'Entertainment' },
        { name: 'WDR', code: 'wdr', country: 'Germany', category: 'Regional' },
        { name: 'ZDF', code: 'zdf', country: 'Germany', category: 'General' },
        { name: 'ZDFinfo', code: 'zdfinfo', country: 'Germany', category: 'Documentary' },
        { name: 'ZDFneo', code: 'zdfneo', country: 'Germany', category: 'Entertainment' },

        // Complete French Channel Collection  
        { name: 'BFM TV', code: 'bfm-tv', country: 'France', category: 'News' },
        { name: 'Canal+', code: 'canal-plus', country: 'France', category: 'Premium' },
        { name: 'Canal+ Cinéma', code: 'canal-cinema', country: 'France', category: 'Movies' },
        { name: 'Canal+ Décalé', code: 'canal-decale', country: 'France', category: 'Entertainment' },
        { name: 'Canal+ Family', code: 'canal-family', country: 'France', category: 'Family' },
        { name: 'Canal+ Sport', code: 'canal-sport', country: 'France', category: 'Sports' },
        { name: 'Chérie 25', code: 'cherie25', country: 'France', category: 'Entertainment' },
        { name: 'Euronews Français', code: 'euronews-fr', country: 'France', category: 'News' },
        { name: 'Eurosport 1 France', code: 'eurosport1-fr', country: 'France', category: 'Sports' },
        { name: 'Eurosport 2 France', code: 'eurosport2-fr', country: 'France', category: 'Sports' },
        { name: 'France 2', code: 'france2', country: 'France', category: 'General' },
        { name: 'France 3', code: 'france3', country: 'France', category: 'General' },
        { name: 'France 4', code: 'france4', country: 'France', category: 'General' },
        { name: 'France 5', code: 'france5', country: 'France', category: 'General' },
        { name: 'France 24', code: 'france24', country: 'France', category: 'News' },
        { name: 'France Info', code: 'france-info', country: 'France', category: 'News' },
        { name: 'LCI', code: 'lci', country: 'France', category: 'News' },
        { name: 'M6', code: 'm6', country: 'France', category: 'General' },
        { name: 'NRJ 12', code: 'nrj12', country: 'France', category: 'Music' },
        { name: 'RMC Découverte', code: 'rmc-decouverte', country: 'France', category: 'Documentary' },
        { name: 'RMC Story', code: 'rmc-story', country: 'France', category: 'Entertainment' },
        { name: 'TF1', code: 'tf1', country: 'France', category: 'General' },
        { name: 'TFX', code: 'tfx', country: 'France', category: 'Entertainment' },
        { name: 'TMC', code: 'tmc', country: 'France', category: 'Entertainment' },
        { name: 'TV5 Monde', code: 'tv5monde', country: 'France', category: 'International' },
        { name: 'W9', code: 'w9', country: 'France', category: 'Entertainment' },

        // Complete UK Channel Collection
        { name: 'BBC Four', code: 'bbc4', country: 'UK', category: 'Culture' },
        { name: 'BBC iPlayer', code: 'bbc-iplayer', country: 'UK', category: 'Streaming' },
        { name: 'BBC One', code: 'bbc1', country: 'UK', category: 'General' },
        { name: 'BBC Three', code: 'bbc3', country: 'UK', category: 'Entertainment' },
        { name: 'BBC Two', code: 'bbc2', country: 'UK', category: 'General' },
        { name: 'Channel 4', code: 'channel4', country: 'UK', category: 'General' },
        { name: 'Channel 5', code: 'channel5', country: 'UK', category: 'General' },
        { name: 'Dave', code: 'dave', country: 'UK', category: 'Entertainment' },
        { name: 'Drama', code: 'drama-uk', country: 'UK', category: 'Drama' },
        { name: 'E4', code: 'e4', country: 'UK', category: 'Entertainment' },
        { name: 'Film4', code: 'film4', country: 'UK', category: 'Movies' },
        { name: 'Gold', code: 'gold-uk', country: 'UK', category: 'Entertainment' },
        { name: 'ITV', code: 'itv', country: 'UK', category: 'General' },
        { name: 'ITV2', code: 'itv2', country: 'UK', category: 'Entertainment' },
        { name: 'ITV3', code: 'itv3', country: 'UK', category: 'Entertainment' },
        { name: 'ITV4', code: 'itv4', country: 'UK', category: 'Entertainment' },
        { name: 'ITVBe', code: 'itvbe', country: 'UK', category: 'Lifestyle' },
        { name: 'More4', code: 'more4', country: 'UK', category: 'Entertainment' },
        { name: 'Sky Atlantic', code: 'sky-atlantic', country: 'UK', category: 'Premium' },
        { name: 'Sky Cinema', code: 'sky-cinema', country: 'UK', category: 'Movies' },
        { name: 'Sky News', code: 'sky-news', country: 'UK', category: 'News' },
        { name: 'Sky Sports', code: 'sky-sports', country: 'UK', category: 'Sports' },
        { name: 'Sky Sports News', code: 'sky-sports-news', country: 'UK', category: 'Sports' },

        // Complete Italian Channel Collection
        { name: 'Canale 5', code: 'canale5', country: 'Italy', category: 'General' },
        { name: 'Iris', code: 'iris-it', country: 'Italy', category: 'Movies' },
        { name: 'Italia 1', code: 'italia1', country: 'Italy', category: 'Entertainment' },
        { name: 'La7', code: 'la7', country: 'Italy', category: 'News' },
        { name: 'La7d', code: 'la7d', country: 'Italy', category: 'Documentary' },
        { name: 'Mediaset Extra', code: 'mediaset-extra', country: 'Italy', category: 'Entertainment' },
        { name: 'Premium Cinema', code: 'premium-cinema-it', country: 'Italy', category: 'Movies' },
        { name: 'Rai 1', code: 'rai1', country: 'Italy', category: 'General' },
        { name: 'Rai 2', code: 'rai2', country: 'Italy', category: 'General' },
        { name: 'Rai 3', code: 'rai3', country: 'Italy', category: 'General' },
        { name: 'Rai 4', code: 'rai4', country: 'Italy', category: 'Entertainment' },
        { name: 'Rai 5', code: 'rai5', country: 'Italy', category: 'Culture' },
        { name: 'Rai Movie', code: 'rai-movie', country: 'Italy', category: 'Movies' },
        { name: 'Rai News 24', code: 'rai-news24', country: 'Italy', category: 'News' },
        { name: 'Rai Sport', code: 'rai-sport', country: 'Italy', category: 'Sports' },
        { name: 'Rete 4', code: 'rete4', country: 'Italy', category: 'General' },
        { name: 'Sky Italia', code: 'sky-it', country: 'Italy', category: 'Premium' },
        { name: 'TV8', code: 'tv8-it', country: 'Italy', category: 'Entertainment' },

        // Complete Spanish Channel Collection
        { name: 'Antena 3', code: 'antena3', country: 'Spain', category: 'General' },
        { name: 'Atreseries', code: 'atreseries', country: 'Spain', category: 'Entertainment' },
        { name: 'Canal Sur', code: 'canal-sur', country: 'Spain', category: 'Regional' },
        { name: 'Cuatro', code: 'cuatro', country: 'Spain', category: 'Entertainment' },
        { name: 'Energy', code: 'energy-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Eurosport España', code: 'eurosport-es', country: 'Spain', category: 'Sports' },
        { name: 'FDF', code: 'fdf', country: 'Spain', category: 'Entertainment' },
        { name: 'La 1', code: 'la1', country: 'Spain', category: 'General' },
        { name: 'La 2', code: 'la2', country: 'Spain', category: 'General' },
        { name: 'LaSexta', code: 'lasexta', country: 'Spain', category: 'Entertainment' },
        { name: 'Mega', code: 'mega-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Movistar+', code: 'movistar-plus', country: 'Spain', category: 'Premium' },
        { name: 'Neox', code: 'neox', country: 'Spain', category: 'Entertainment' },
        { name: 'Nova', code: 'nova-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Paramount Network España', code: 'paramount-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Telecinco', code: 'telecinco', country: 'Spain', category: 'General' },
        { name: 'Telemadrid', code: 'telemadrid', country: 'Spain', category: 'Regional' },
        { name: 'TV3', code: 'tv3-es', country: 'Spain', category: 'Regional' },

        // Complete Nordic Collection
        { name: 'DR1', code: 'dr1', country: 'Denmark', category: 'General' },
        { name: 'DR2', code: 'dr2', country: 'Denmark', category: 'Culture' },
        { name: 'DR3', code: 'dr3', country: 'Denmark', category: 'Entertainment' },
        { name: 'MTV3', code: 'mtv3', country: 'Finland', category: 'Entertainment' },
        { name: 'Nelonen', code: 'nelonen', country: 'Finland', category: 'Entertainment' },
        { name: 'NRK1', code: 'nrk1', country: 'Norway', category: 'General' },
        { name: 'NRK2', code: 'nrk2', country: 'Norway', category: 'Culture' },
        { name: 'NRK3', code: 'nrk3', country: 'Norway', category: 'Entertainment' },
        { name: 'SVT1', code: 'svt1', country: 'Sweden', category: 'General' },
        { name: 'SVT2', code: 'svt2', country: 'Sweden', category: 'Culture' },
        { name: 'TV 2 Danmark', code: 'tv2-dk', country: 'Denmark', category: 'General' },
        { name: 'TV 2 Norge', code: 'tv2-no', country: 'Norway', category: 'General' },
        { name: 'TV4 Sverige', code: 'tv4-se', country: 'Sweden', category: 'General' },
        { name: 'Viasat 4', code: 'viasat4', country: 'Nordic', category: 'Entertainment' },
        { name: 'Yle TV1', code: 'yle-tv1', country: 'Finland', category: 'General' },
        { name: 'Yle TV2', code: 'yle-tv2', country: 'Finland', category: 'General' },

        // Complete Eastern European Collection 
        { name: 'Czech Television', code: 'ct1', country: 'Czech Republic', category: 'General' },
        { name: 'CT2', code: 'ct2', country: 'Czech Republic', category: 'Culture' },
        { name: 'CT24', code: 'ct24', country: 'Czech Republic', category: 'News' },
        { name: 'JOJ', code: 'joj', country: 'Slovakia', category: 'General' },
        { name: 'Markíza', code: 'markiza', country: 'Slovakia', category: 'General' },
        { name: 'Nova TV', code: 'nova-cz', country: 'Czech Republic', category: 'General' },
        { name: 'Polish Television', code: 'tvp1', country: 'Poland', category: 'General' },
        { name: 'Prima TV', code: 'prima-tv', country: 'Czech Republic', category: 'General' },
        { name: 'Slovak Television', code: 'stv1', country: 'Slovakia', category: 'General' },
        { name: 'TVN', code: 'tvn-pl', country: 'Poland', category: 'General' },
        { name: 'TVP2', code: 'tvp2', country: 'Poland', category: 'General' },

        // Additional USA Channels
        { name: 'ABC', code: 'abc', country: 'USA', category: 'General' },
        { name: 'CBS', code: 'cbs', country: 'USA', category: 'General' },
        { name: 'ESPN', code: 'espn', country: 'USA', category: 'Sports' },
        { name: 'FOX', code: 'fox', country: 'USA', category: 'General' },
        { name: 'Fox News', code: 'fox-news', country: 'USA', category: 'News' },
        { name: 'HBO', code: 'hbo', country: 'USA', category: 'Premium' },
        { name: 'MSNBC', code: 'msnbc', country: 'USA', category: 'News' },
        { name: 'NBC', code: 'nbc', country: 'USA', category: 'General' },
        { name: 'Showtime', code: 'showtime', country: 'USA', category: 'Premium' },

        // Additional International Specialty Channels
        { name: 'Adult Swim', code: 'adult-swim', country: 'International', category: 'Entertainment' },
        { name: 'Comedy Central', code: 'comedy-central', country: 'International', category: 'Entertainment' },
        { name: 'MTV', code: 'mtv', country: 'International', category: 'Music' },
        { name: 'Nickelodeon', code: 'nickelodeon', country: 'International', category: 'Kids' },
        { name: 'Paramount Network', code: 'paramount', country: 'International', category: 'Entertainment' },
        { name: 'VH1', code: 'vh1', country: 'International', category: 'Music' }
    ];

    // Get unique countries and categories for filters
    const countries = [...new Set(epgCodes.map(item => item.country))].sort();
    const categories = [...new Set(epgCodes.map(item => item.category))].sort();

    let title = 'EPG Channel Codes Database - 848+ Professional Channel Identifiers | FlixTV';
    let keyword = 'EPG codes, electronic program guide, channel codes, TV guide codes, channel identifiers, EPG integration, electronic TV guide, program guide codes, TV listing codes, streaming EPG, EPG XML codes, digital TV guide, EPG configuration, channel mapping, broadcast guide, television programming guide, EPG data source, streaming guide codes, EPG provider, channel guide integration, digital broadcasting EPG, smart TV EPG, set top box EPG, cable TV EPG, satellite TV EPG, terrestrial TV EPG, OTT streaming EPG, media player EPG, entertainment platform EPG, broadcasting solution EPG, professional TV guide, channel lineup codes, programming schedule codes, broadcast schedule integration, TV channel database, electronic guide system, digital program guide, streaming service EPG, media streaming guide, entertainment guide codes, television guide integration, broadcast data codes, channel information system, program data integration, streaming platform guide, digital entertainment EPG, media platform codes, broadcasting platform EPG, content delivery EPG, streaming technology EPG, digital media guide, entertainment technology EPG, broadcast technology codes, streaming application EPG, media application guide, entertainment software EPG, digital broadcasting codes, streaming infrastructure EPG, media infrastructure guide, broadcast infrastructure codes, entertainment infrastructure EPG, digital platform guide, streaming ecosystem EPG, media ecosystem guide, broadcast ecosystem codes, entertainment ecosystem EPG, Germany EPG codes, France EPG codes, UK EPG codes, Austria EPG codes, Italy EPG codes, Spain EPG codes, USA EPG codes, Russia EPG codes, international EPG codes, worldwide EPG codes, European EPG codes, Nordic EPG codes, complete EPG database, comprehensive EPG collection, professional EPG directory';
    let description = 'Comprehensive EPG (Electronic Program Guide) codes database with 848+ professional channel identifiers from 40+ countries. Complete collection includes Germany (56 channels), France (40 channels), UK (32 channels), Austria (7 channels), Italy (18 channels), and worldwide coverage for seamless streaming integration and broadcasting solutions.';

    res.render('frontend/pages/codes',
        {
            menu:'codes',
            title:title, 
            keyword:keyword,
            description:description,
            epgCodes: epgCodes,
            countries: countries,
            categories: categories,
            pageType: 'epg-directory',
            canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/codes` : 'https://flixapp.net/codes'
        }
    );
}

exports.countryEpgCodes=(req,res)=>{
    const countryParam = req.params.country.toLowerCase();
    
    // Complete EPG codes database with ALL available codes from reference site
    const allEpgCodes = [
        // International News & Entertainment
        { name: 'BBC Entertainment', code: 'bbc-entertainment', country: 'UK', category: 'Entertainment' },
        { name: 'BBC News', code: 'bbc-world', country: 'UK', category: 'News' },
        { name: 'BBC', code: 'bbc', country: 'UK', category: 'General' },
        { name: 'CNN', code: 'cnn', country: 'USA', category: 'News' },
        { name: 'Bloomberg', code: 'bloomberg', country: 'USA', category: 'News' },
        { name: 'CNBC Europe', code: 'cnbc', country: 'Europe', category: 'News' },
        
        // Kids & Animation
        { name: 'Cartoon Network', code: 'cartoon', country: 'International', category: 'Kids' },
        { name: 'Cartoonito', code: 'boomerang', country: 'International', category: 'Kids' },
        { name: 'BabyTV', code: 'baby-tv', country: 'International', category: 'Kids' },
        { name: 'Cartoons 90', code: 'cartoons-90', country: 'International', category: 'Kids' },
        { name: 'Cartoons Big', code: 'cartoons-big', country: 'International', category: 'Kids' },
        { name: 'Cartoons Short', code: 'cartoons-short', country: 'International', category: 'Kids' },
        
        // Documentary & Educational
        { name: 'Animal Planet', code: 'animal_rus', country: 'Russia', category: 'Documentary' },
        { name: 'Animal Planet Europe', code: 'animal_ukr', country: 'Europe', category: 'Documentary' },
        { name: 'Animal Planet HD', code: 'animal-hd', country: 'International', category: 'Documentary' },
        { name: 'Da Vinci Learning Россия', code: 'da_vinci-rus', country: 'Russia', category: 'Documentary' },
        { name: 'Curiosity Stream', code: 'curiosity-stream', country: 'International', category: 'Documentary' },
        { name: 'CBS Reality', code: 'CBSReality.ru', country: 'Russia', category: 'Documentary' },
        
        // Movies & Cinema
        { name: 'Cinema', code: 'park-razvlecheniy', country: 'Russia', category: 'Movies' },
        { name: 'Cinema (Космос ТВ)', code: 'Cinema.ru', country: 'Russia', category: 'Movies' },
        { name: 'CineMan', code: 'cineman', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Action', code: 'cineman-action', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Marvel', code: 'cineman-marvel', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Thriller', code: 'cineman-thriller', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Comedy', code: 'cineman-comedy', country: 'Russia', category: 'Movies' },
        { name: 'AMC Украина и Прибалтика', code: 'mgm-int', country: 'Ukraine', category: 'Movies' },
        
        // Premium Movie Channels
        { name: 'BCU Cinema HD', code: 'bcu-cinema', country: 'Russia', category: 'Movies' },
        { name: 'BCU Action HD', code: 'bcu-action', country: 'Russia', category: 'Movies' },
        { name: 'BCU Comedy HD', code: 'bcu-comedy', country: 'Russia', category: 'Movies' },
        { name: 'BCU Marvel HD', code: 'bcu-marvel', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere HD', code: 'bcu-premiere', country: 'Russia', category: 'Movies' },
        { name: 'BCU Fantastic HD', code: 'bcu-fantastic', country: 'Russia', category: 'Movies' },
        { name: 'BCU History HD', code: 'bcu-history', country: 'Russia', category: 'Documentary' },
        
        // Box Premium Channels
        { name: 'BOX Oscar HD', code: 'box-oscar', country: 'Russia', category: 'Movies' },
        { name: 'BOX Gangster HD', code: 'box-gangster', country: 'Russia', category: 'Movies' },
        { name: 'BOX Western HD', code: 'box-western', country: 'Russia', category: 'Movies' },
        { name: 'BOX Fantasy HD', code: 'box-fantasy', country: 'Russia', category: 'Movies' },
        { name: 'BOX Horror HD', code: 'box-zombie', country: 'Russia', category: 'Movies' },
        { name: 'BOX Spy HD', code: 'box-spy', country: 'Russia', category: 'Movies' },
        
        // Sports
        { name: 'BOX SportCast HD', code: 'box-sportcast', country: 'Russia', category: 'Sports' },
        { name: 'Adjarasport 1', code: 'Adjarasport1.ge', country: 'Georgia', category: 'Sports' },
        
        // Music & Entertainment
        { name: 'Bridge TV', code: 'bridge', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Deluxe', code: 'bridge-hd', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Hits', code: 'dange', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Rock', code: 'bridge-tv-rock', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Classic', code: 'topsong', country: 'Russia', category: 'Music' },
        { name: 'Clubbing TV', code: 'clubbing-tv', country: 'International', category: 'Music' },
        { name: '4Ever Music HD', code: '4evermusic', country: 'International', category: 'Music' },
        
        // Ukrainian Channels
        { name: '1+1 Международный', code: '1p1_int', country: 'Ukraine', category: 'General' },
        { name: '2+2', code: '2p2', country: 'Ukraine', category: 'General' },
        { name: '1+1 Марафон', code: '1p1', country: 'Ukraine', category: 'General' },
        { name: '8 канал (Украина)', code: 'pro-vse', country: 'Ukraine', category: 'General' },
        { name: '7 канал (Одесса)', code: '7-kanal-od', country: 'Ukraine', category: 'Regional' },
        
        // Russian Channels
        { name: '5 канал', code: '5kanal', country: 'Russia', category: 'General' },
        { name: '8 канал (Россия)', code: '8-kanal', country: 'Russia', category: 'General' },
        { name: '12 канал Омск', code: '12-omsk', country: 'Russia', category: 'Regional' },
        { name: '49 канал (Новосибирск)', code: '49kanal', country: 'Russia', category: 'Regional' },
        { name: '360° Новости', code: '360-news', country: 'Russia', category: 'News' },
        { name: '24 (Телеканал новостей 24)', code: 'news24', country: 'Russia', category: 'News' },
        { name: '2х2', code: '2x2', country: 'Russia', category: 'Entertainment' },
        { name: 'Bolt Россия', code: 'bolt', country: 'Russia', category: 'Entertainment' },
        
        // Comedy & Entertainment
        { name: 'Comedy Central Russian', code: 'paramount-comedy', country: 'Russia', category: 'Entertainment' },
        { name: 'Candy', code: 'candy', country: 'Russia', category: 'Entertainment' },
        
        // Georgian Channels
        { name: '1 TV GE', code: 'FirstChannel.ge', country: 'Georgia', category: 'General' },
        { name: '2 TV GE', code: '2TV.ge', country: 'Georgia', category: 'General' },
        { name: 'Ajara TV', code: 'AjaraTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Comedy TV GE', code: 'ComedyTV.ge', country: 'Georgia', category: 'Entertainment' },
        
        // Armenian Channels
        { name: '21TV AM', code: '21TV.am', country: 'Armenia', category: 'General' },
        { name: 'Armenia TV', code: 'ArmeniaTV.am', country: 'Armenia', category: 'General' },
        { name: 'ArmNews', code: 'ArmNews.am', country: 'Armenia', category: 'News' },
        { name: 'AR AM', code: 'AR.am', country: 'Armenia', category: 'General' },
        { name: 'Ararat', code: 'Ararat.am', country: 'Armenia', category: 'General' },
        { name: 'ATV Армения', code: 'ATV.am', country: 'Armenia', category: 'General' },
        { name: 'Armcinema', code: 'Armcinema.am', country: 'Armenia', category: 'Movies' },
        { name: 'Comedy AM', code: 'Comedy.am', country: 'Armenia', category: 'Entertainment' },
        { name: 'Cineman AM', code: 'Cineman.am', country: 'Armenia', category: 'Movies' },
        
        // Belarusian Channels
        { name: '8 канал (Беларусь)', code: '8channel', country: 'Belarus', category: 'General' },
        
        // French Channels
        { name: 'Cine+', code: 'cine+', country: 'France', category: 'Movies' },
        { name: 'Cine+ HD', code: 'cine+hd', country: 'France', category: 'Movies' },
        { name: 'Cine+ Hit HD', code: 'cine+hit-hd', country: 'France', category: 'Movies' },
        { name: 'Cine+ Kids', code: 'cine+kids', country: 'France', category: 'Kids' },
        { name: 'Cine+ Legend', code: 'cine+legend', country: 'France', category: 'Movies' },
        
        // Bulgarian Channels
        { name: 'Box Music TV BG', code: 'box-music-tv-bg', country: 'Bulgaria', category: 'Music' },
        
        // International Premium
        { name: 'Bollywood HD', code: 'bollywood-hd', country: 'India', category: 'Movies' },
        { name: 'Arirang', code: 'arirang-en', country: 'Korea', category: 'General' },
        { name: 'CGTN Русский', code: 'cctv', country: 'China', category: 'News' },
        
        // Adult Content
        { name: 'Blue Hustler', code: 'hustler-blue', country: 'International', category: 'Adult' },
        
        // Regional & Specialty
        { name: 'ATR', code: 'atr', country: 'Crimea', category: 'Regional' },
        { name: 'AzTV', code: 'aztv', country: 'Azerbaijan', category: 'General' },
        { name: 'CNL Украина', code: 'cnl-ukraine', country: 'Ukraine', category: 'General' },
        { name: 'DetectiveJam', code: 'detectivejam', country: 'Russia', category: 'Entertainment' },
        
        // Clarity4K Premium Channels
        { name: 'Clarity4K Anime', code: 'clarity4k-anime', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Netflix', code: 'clarity4k-netflix', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K HBO series', code: 'clarity4k-hboseries', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Walt Disney', code: 'clarity4k-waltdisney', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Боевик', code: 'clarity4k-boevik', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Комедия', code: 'clarity4k-komedia', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Фантастика', code: 'clarity4k-fantastik', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Ужасы', code: 'clarity4k-uzasy', country: 'Russia', category: 'Movies' },
        
        // Turkish Channels - Comprehensive List
        { name: 'TRT 1', code: 'trt1', country: 'Turkey', category: 'General' },
        { name: 'TRT Haber', code: 'trt-haber', country: 'Turkey', category: 'News' },
        { name: 'TRT Spor', code: 'trt-spor', country: 'Turkey', category: 'Sports' },
        { name: 'TRT Çocuk', code: 'trt-cocuk', country: 'Turkey', category: 'Kids' },
        { name: 'TRT Müzik', code: 'trt-muzik', country: 'Turkey', category: 'Music' },
        { name: 'TRT Belgesel', code: 'trt-belgesel', country: 'Turkey', category: 'Documentary' },
        { name: 'TRT Türk', code: 'trt-turk', country: 'Turkey', category: 'General' },
        { name: 'TRT Avaz', code: 'trt-avaz', country: 'Turkey', category: 'General' },
        { name: 'TRT World', code: 'trt-world', country: 'Turkey', category: 'News' },
        { name: 'ATV Türkiye', code: 'atv-tr', country: 'Turkey', category: 'General' },
        { name: 'Kanal D', code: 'kanal-d', country: 'Turkey', category: 'General' },
        { name: 'Show TV', code: 'show-tv', country: 'Turkey', category: 'General' },
        { name: 'Star TV', code: 'star-tv', country: 'Turkey', category: 'General' },
        { name: 'Fox TV', code: 'fox-tv-tr', country: 'Turkey', category: 'General' },
        { name: 'TV8', code: 'tv8-tr', country: 'Turkey', category: 'Entertainment' },
        { name: 'NTV', code: 'ntv-tr', country: 'Turkey', category: 'News' },
        { name: 'Habertürk TV', code: 'haberturk', country: 'Turkey', category: 'News' },
        { name: 'CNN Türk', code: 'cnn-turk', country: 'Turkey', category: 'News' },
        { name: 'A Haber', code: 'a-haber', country: 'Turkey', category: 'News' },
        { name: 'Haber Global', code: 'haber-global', country: 'Turkey', category: 'News' },
        { name: 'Halk TV', code: 'halk-tv', country: 'Turkey', category: 'News' },
        { name: 'TGRT Haber', code: 'tgrt-haber', country: 'Turkey', category: 'News' },
        { name: 'TV100', code: 'tv100', country: 'Turkey', category: 'News' },
        { name: 'Ulusal Kanal', code: 'ulusal-kanal', country: 'Turkey', category: 'News' },
        { name: 'Kanal 7', code: 'kanal7', country: 'Turkey', category: 'General' },
        { name: 'Beyaz TV', code: 'beyaz-tv', country: 'Turkey', category: 'General' },
        { name: 'NOW TV', code: 'now-tv-tr', country: 'Turkey', category: 'General' },
        { name: 'TV8.5', code: 'tv8-5', country: 'Turkey', category: 'Entertainment' },
        { name: 'Teve2', code: 'teve2', country: 'Turkey', category: 'General' },
        { name: 'Flash TV', code: 'flash-tv', country: 'Turkey', category: 'General' },
        { name: 'Number1 TV', code: 'number1-tv', country: 'Turkey', category: 'Music' },
        { name: 'Kral TV', code: 'kral-tv', country: 'Turkey', category: 'Music' },
        { name: 'Power TV', code: 'power-tv', country: 'Turkey', category: 'Music' },
        { name: 'Dream TV', code: 'dream-tv', country: 'Turkey', category: 'Music' },
        { name: 'FashionTV Turkey', code: 'fashion-tv-tr', country: 'Turkey', category: 'Entertainment' },
        { name: 'Dmax Türkiye', code: 'dmax-tr', country: 'Turkey', category: 'Documentary' },
        { name: 'National Geographic Turkey', code: 'natgeo-tr', country: 'Turkey', category: 'Documentary' },
        { name: 'Discovery Channel Turkey', code: 'discovery-tr', country: 'Turkey', category: 'Documentary' },
        { name: 'TLC Turkey', code: 'tlc-tr', country: 'Turkey', category: 'Entertainment' },
        { name: 'Minika Çocuk', code: 'minika-cocuk', country: 'Turkey', category: 'Kids' },
        { name: 'Minika GO', code: 'minika-go', country: 'Turkey', category: 'Kids' },
        { name: 'Cartoon Network Turkey', code: 'cartoon-tr', country: 'Turkey', category: 'Kids' },
        { name: 'Disney Channel Turkey', code: 'disney-tr', country: 'Turkey', category: 'Kids' },
        { name: 'Nickelodeon Turkey', code: 'nick-tr', country: 'Turkey', category: 'Kids' },
        { name: 'CNBC-e', code: 'cnbc-e', country: 'Turkey', category: 'News' },
        { name: 'Bloomberg HT', code: 'bloomberg-ht', country: 'Turkey', category: 'News' },
        { name: 'Akit TV', code: 'akit-tv', country: 'Turkey', category: 'News' },
        { name: 'Ülke TV', code: 'ulke-tv', country: 'Turkey', category: 'News' },
        { name: 'Yeni Şafak', code: 'yeni-safak', country: 'Turkey', category: 'News' },
        { name: 'Meltem TV', code: 'meltem-tv', country: 'Turkey', category: 'General' },
        { name: 'Kanal Firat', code: 'kanal-firat', country: 'Turkey', category: 'Regional' },
        { name: 'GRT', code: 'grt', country: 'Turkey', category: 'Regional' },
        { name: 'Diyalog TV', code: 'diyalog-tv', country: 'Turkey', category: 'Regional' },
        
        // German/Austrian/Swiss Channels (DE/AT/CH)
        { name: 'Das Erste', code: 'das-erste', country: 'Germany', category: 'General' },
        { name: 'ZDF', code: 'zdf', country: 'Germany', category: 'General' },
        { name: 'RTL', code: 'rtl-de', country: 'Germany', category: 'General' },
        { name: 'SAT.1', code: 'sat1', country: 'Germany', category: 'General' },
        { name: 'ProSieben', code: 'pro7', country: 'Germany', category: 'General' },
        { name: 'VOX', code: 'vox-de', country: 'Germany', category: 'General' },
        { name: 'RTL2', code: 'rtl2', country: 'Germany', category: 'General' },
        { name: 'Kabel Eins', code: 'kabel1', country: 'Germany', category: 'General' },
        { name: 'N-TV', code: 'ntv-de', country: 'Germany', category: 'News' },
        { name: 'N24 DOKU', code: 'n24-doku', country: 'Germany', category: 'Documentary' },
        { name: 'ORF 1', code: 'orf1', country: 'Austria', category: 'General' },
        { name: 'ORF 2', code: 'orf2', country: 'Austria', category: 'General' },
        { name: 'SRF 1', code: 'srf1', country: 'Switzerland', category: 'General' },
        { name: 'SRF zwei', code: 'srf2', country: 'Switzerland', category: 'General' },
        
        // Spanish Channels
        { name: 'La 1', code: 'la1', country: 'Spain', category: 'General' },
        { name: 'La 2', code: 'la2', country: 'Spain', category: 'General' },
        { name: 'Antena 3', code: 'antena3', country: 'Spain', category: 'General' },
        { name: 'Cuatro', code: 'cuatro', country: 'Spain', category: 'General' },
        { name: 'Telecinco', code: 'telecinco', country: 'Spain', category: 'General' },
        { name: 'La Sexta', code: 'lasexta', country: 'Spain', category: 'General' },
        { name: 'Canal+ España', code: 'canal-plus-es', country: 'Spain', category: 'Movies' },
        { name: 'Movistar+', code: 'movistar-plus', country: 'Spain', category: 'Movies' },
        
        // Italian Channels
        { name: 'Rai 1', code: 'rai1', country: 'Italy', category: 'General' },
        { name: 'Rai 2', code: 'rai2', country: 'Italy', category: 'General' },
        { name: 'Rai 3', code: 'rai3', country: 'Italy', category: 'General' },
        { name: 'Canale 5', code: 'canale5', country: 'Italy', category: 'General' },
        { name: 'Italia 1', code: 'italia1', country: 'Italy', category: 'General' },
        { name: 'Rete 4', code: 'rete4', country: 'Italy', category: 'General' },
        { name: 'La7', code: 'la7', country: 'Italy', category: 'General' },
        { name: 'Sky Cinema Uno', code: 'sky-cinema-uno', country: 'Italy', category: 'Movies' },
        
        // Polish Channels
        { name: 'TVP 1', code: 'tvp1', country: 'Poland', category: 'General' },
        { name: 'TVP 2', code: 'tvp2', country: 'Poland', category: 'General' },
        { name: 'Polsat', code: 'polsat', country: 'Poland', category: 'General' },
        { name: 'TVN', code: 'tvn', country: 'Poland', category: 'General' },
        { name: 'TVP Info', code: 'tvp-info', country: 'Poland', category: 'News' },
        { name: 'TVN24', code: 'tvn24', country: 'Poland', category: 'News' },
        { name: 'Polsat News', code: 'polsat-news', country: 'Poland', category: 'News' },
        
        // Nordic Channels
        { name: 'SVT1', code: 'svt1', country: 'Sweden', category: 'General' },
        { name: 'SVT2', code: 'svt2', country: 'Sweden', category: 'General' },
        { name: 'TV4', code: 'tv4-se', country: 'Sweden', category: 'General' },
        { name: 'NRK1', code: 'nrk1', country: 'Norway', category: 'General' },
        { name: 'NRK2', code: 'nrk2', country: 'Norway', category: 'General' },
        { name: 'TV 2 Norge', code: 'tv2-no', country: 'Norway', category: 'General' },
        { name: 'DR1', code: 'dr1', country: 'Denmark', category: 'General' },
        { name: 'DR2', code: 'dr2', country: 'Denmark', category: 'General' },
        { name: 'TV 2 Danmark', code: 'tv2-dk', country: 'Denmark', category: 'General' },
        { name: 'YLE TV1', code: 'yle1', country: 'Finland', category: 'General' },
        { name: 'YLE TV2', code: 'yle2', country: 'Finland', category: 'General' },
        
        // Portuguese/Brazilian Channels
        { name: 'RTP 1', code: 'rtp1', country: 'Portugal', category: 'General' },
        { name: 'RTP 2', code: 'rtp2', country: 'Portugal', category: 'General' },
        { name: 'SIC', code: 'sic', country: 'Portugal', category: 'General' },
        { name: 'TVI', code: 'tvi', country: 'Portugal', category: 'General' },
        { name: 'Globo', code: 'globo', country: 'Brazil', category: 'General' },
        { name: 'SBT', code: 'sbt', country: 'Brazil', category: 'General' },
        { name: 'Record TV', code: 'record', country: 'Brazil', category: 'General' },
        { name: 'Band', code: 'band', country: 'Brazil', category: 'General' },
        
        // Greek Channels
        { name: 'ERT1', code: 'ert1', country: 'Greece', category: 'General' },
        { name: 'ERT2', code: 'ert2', country: 'Greece', category: 'General' },
        { name: 'Mega Channel', code: 'mega-gr', country: 'Greece', category: 'General' },
        { name: 'ANT1', code: 'ant1-gr', country: 'Greece', category: 'General' },
        { name: 'Alpha TV', code: 'alpha-tv', country: 'Greece', category: 'General' },
        { name: 'Star Channel', code: 'star-gr', country: 'Greece', category: 'General' },
        
        // Middle East Channels
        { name: 'Al Jazeera', code: 'aljazeera', country: 'Qatar', category: 'News' },
        { name: 'Al Arabiya', code: 'alarabiya', country: 'UAE', category: 'News' },
        { name: 'MBC 1', code: 'mbc1', country: 'UAE', category: 'General' },
        { name: 'MBC 2', code: 'mbc2', country: 'UAE', category: 'Movies' },
        { name: 'Dubai TV', code: 'dubai-tv', country: 'UAE', category: 'General' },
        
        // Canadian Channels
        { name: 'CBC', code: 'cbc', country: 'Canada', category: 'General' },
        { name: 'CTV', code: 'ctv', country: 'Canada', category: 'General' },
        { name: 'Global TV', code: 'global-tv', country: 'Canada', category: 'General' },
        { name: 'TVA', code: 'tva', country: 'Canada', category: 'General' },
        { name: 'Radio-Canada', code: 'radio-canada', country: 'Canada', category: 'General' },
        
        // Romanian & Hungarian Channels
        { name: 'TVR 1', code: 'tvr1', country: 'Romania', category: 'General' },
        { name: 'Pro TV', code: 'pro-tv-ro', country: 'Romania', category: 'General' },
        { name: 'Antena 1', code: 'antena1-ro', country: 'Romania', category: 'General' },
        { name: 'M1', code: 'm1-hu', country: 'Hungary', category: 'General' },
        { name: 'M2', code: 'm2-hu', country: 'Hungary', category: 'General' },
        { name: 'RTL Klub', code: 'rtl-klub', country: 'Hungary', category: 'General' },
        
        // Czech/Slovak Channels
        { name: 'ČT1', code: 'ct1', country: 'Czech Republic', category: 'General' },
        { name: 'ČT2', code: 'ct2', country: 'Czech Republic', category: 'General' },
        { name: 'Nova', code: 'nova-cz', country: 'Czech Republic', category: 'General' },
        { name: 'Prima', code: 'prima-cz', country: 'Czech Republic', category: 'General' },
        { name: 'JOJ', code: 'joj', country: 'Slovakia', category: 'General' },
        { name: 'Markíza', code: 'markiza', country: 'Slovakia', category: 'General' },
        
        // Israeli Channels
        { name: 'Channel 11', code: 'channel11-il', country: 'Israel', category: 'General' },
        { name: 'Channel 12', code: 'channel12-il', country: 'Israel', category: 'General' },
        { name: 'Channel 13', code: 'channel13-il', country: 'Israel', category: 'General' },
        { name: 'Channel 14', code: 'channel14-il', country: 'Israel', category: 'General' },
        
        // Mexican & Latin American
        { name: 'Las Estrellas', code: 'las-estrellas', country: 'Mexico', category: 'General' },
        { name: 'Canal 5', code: 'canal5-mx', country: 'Mexico', category: 'General' },
        { name: 'Azteca Uno', code: 'azteca-uno', country: 'Mexico', category: 'General' },
        { name: 'Televisa', code: 'televisa', country: 'Mexico', category: 'General' },
        
        // Chilean & Argentinian
        { name: 'TVN Chile', code: 'tvn-cl', country: 'Chile', category: 'General' },
        { name: 'Canal 13 Chile', code: 'canal13-cl', country: 'Chile', category: 'General' },
        { name: 'Mega Chile', code: 'mega-cl', country: 'Chile', category: 'General' },
        { name: 'Telefe', code: 'telefe', country: 'Argentina', category: 'General' },
        { name: 'Canal 13 Argentina', code: 'canal13-ar', country: 'Argentina', category: 'General' },
        { name: 'América TV', code: 'america-tv-ar', country: 'Argentina', category: 'General' },
        
        // Baltic States
        { name: 'LTV1', code: 'ltv1', country: 'Latvia', category: 'General' },
        { name: 'TV3 Latvia', code: 'tv3-lv', country: 'Latvia', category: 'General' },
        { name: 'LRT', code: 'lrt', country: 'Lithuania', category: 'General' },
        { name: 'TV3 Lithuania', code: 'tv3-lt', country: 'Lithuania', category: 'General' },
        { name: 'ETV', code: 'etv', country: 'Estonia', category: 'General' },
        { name: 'Kanal 2', code: 'kanal2-ee', country: 'Estonia', category: 'General' },
        
        // Benelux
        { name: 'NPO 1', code: 'npo1', country: 'Netherlands', category: 'General' },
        { name: 'NPO 2', code: 'npo2', country: 'Netherlands', category: 'General' },
        { name: 'RTL 4', code: 'rtl4', country: 'Netherlands', category: 'General' },
        { name: 'SBS6', code: 'sbs6', country: 'Netherlands', category: 'General' },
        { name: 'VRT 1', code: 'vrt1', country: 'Belgium', category: 'General' },
        { name: 'Vtm', code: 'vtm', country: 'Belgium', category: 'General' },
        { name: 'RTL-TVI', code: 'rtl-tvi', country: 'Belgium', category: 'General' },
        
        // Additional Major European Channels
        { name: 'Eurosport 1', code: 'eurosport1', country: 'Europe', category: 'Sports' },
        { name: 'Eurosport 2', code: 'eurosport2', country: 'Europe', category: 'Sports' },
        { name: 'MTV Europe', code: 'mtv-eu', country: 'Europe', category: 'Music' },
        { name: 'VH1 Europe', code: 'vh1-eu', country: 'Europe', category: 'Music' },
        { name: 'Comedy Central Europe', code: 'comedy-central-eu', country: 'Europe', category: 'Entertainment' },
        { name: 'Nickelodeon Europe', code: 'nick-eu', country: 'Europe', category: 'Kids' },
        { name: 'Discovery Europe', code: 'discovery-eu', country: 'Europe', category: 'Documentary' },
        { name: 'History Europe', code: 'history-eu', country: 'Europe', category: 'Documentary' },
        { name: 'National Geographic Europe', code: 'natgeo-eu', country: 'Europe', category: 'Documentary' },
        
        // Albanian Channels
        { name: 'RTSH 1', code: 'rtsh1', country: 'Albania', category: 'General' },
        { name: 'RTSH 2', code: 'rtsh2', country: 'Albania', category: 'General' },
        { name: 'Top Channel', code: 'top-channel', country: 'Albania', category: 'General' },
        { name: 'Klan TV', code: 'klan-tv', country: 'Albania', category: 'General' },
        { name: 'TV Klan', code: 'tv-klan', country: 'Albania', category: 'General' },
        { name: 'Vizion Plus', code: 'vizion-plus', country: 'Albania', category: 'General' },
        { name: 'News 24', code: 'news24-al', country: 'Albania', category: 'News' },
        { name: 'Report TV', code: 'report-tv', country: 'Albania', category: 'News' },
        { name: 'ABC News', code: 'abc-news-al', country: 'Albania', category: 'News' },
        { name: 'Ora News', code: 'ora-news', country: 'Albania', category: 'News' },
        
        // Macedonian Channels
        { name: 'MRT 1', code: 'mrt1', country: 'Macedonia', category: 'General' },
        { name: 'MRT 2', code: 'mrt2', country: 'Macedonia', category: 'General' },
        { name: 'Sitel TV', code: 'sitel', country: 'Macedonia', category: 'General' },
        { name: 'Kanal 5', code: 'kanal5-mk', country: 'Macedonia', category: 'General' },
        { name: 'Alfa TV', code: 'alfa-tv-mk', country: 'Macedonia', category: 'General' },
        { name: 'Telma', code: 'telma', country: 'Macedonia', category: 'General' },
        { name: '24 Vesti', code: '24vesti', country: 'Macedonia', category: 'News' },
        
        // Serbian Channels (ExYu)
        { name: 'RTS 1', code: 'rts1', country: 'Serbia', category: 'General' },
        { name: 'RTS 2', code: 'rts2', country: 'Serbia', category: 'General' },
        { name: 'Pink', code: 'pink', country: 'Serbia', category: 'General' },
        { name: 'B92', code: 'b92', country: 'Serbia', category: 'General' },
        { name: 'Nova S', code: 'nova-s', country: 'Serbia', category: 'General' },
        { name: 'N1 Srbija', code: 'n1-srbija', country: 'Serbia', category: 'News' },
        { name: 'Happy TV', code: 'happy-tv', country: 'Serbia', category: 'General' },
        { name: 'Studio B', code: 'studio-b', country: 'Serbia', category: 'General' },
        { name: 'TV Prva', code: 'tv-prva', country: 'Serbia', category: 'General' },
        
        // Croatian Channels (ExYu)
        { name: 'HRT 1', code: 'hrt1', country: 'Croatia', category: 'General' },
        { name: 'HRT 2', code: 'hrt2', country: 'Croatia', category: 'General' },
        { name: 'Nova TV', code: 'nova-tv-hr', country: 'Croatia', category: 'General' },
        { name: 'RTL Hrvatska', code: 'rtl-hr', country: 'Croatia', category: 'General' },
        { name: 'N1 Hrvatska', code: 'n1-hrvatska', country: 'Croatia', category: 'News' },
        { name: 'Doma TV', code: 'doma-tv', country: 'Croatia', category: 'General' },
        
        // Bosnian Channels (ExYu)
        { name: 'BHRT', code: 'bhrt', country: 'Bosnia', category: 'General' },
        { name: 'FTV', code: 'ftv', country: 'Bosnia', category: 'General' },
        { name: 'OBN', code: 'obn', country: 'Bosnia', category: 'General' },
        { name: 'N1 BiH', code: 'n1-bih', country: 'Bosnia', category: 'News' },
        { name: 'Al Jazeera Balkans', code: 'aj-balkans', country: 'Bosnia', category: 'News' },
        
        // Slovenian Channels (ExYu)
        { name: 'RTV SLO 1', code: 'rtvslo1', country: 'Slovenia', category: 'General' },
        { name: 'RTV SLO 2', code: 'rtvslo2', country: 'Slovenia', category: 'General' },
        { name: 'POP TV', code: 'pop-tv', country: 'Slovenia', category: 'General' },
        { name: 'Kanal A', code: 'kanal-a', country: 'Slovenia', category: 'General' },
        { name: 'TV3 Slovenia', code: 'tv3-si', country: 'Slovenia', category: 'General' },
        
        // Bulgarian Channels
        { name: 'BNT 1', code: 'bnt1', country: 'Bulgaria', category: 'General' },
        { name: 'BNT 2', code: 'bnt2', country: 'Bulgaria', category: 'General' },
        { name: 'bTV', code: 'btv', country: 'Bulgaria', category: 'General' },
        { name: 'Nova TV Bulgaria', code: 'nova-bg', country: 'Bulgaria', category: 'General' },
        { name: 'Bulgaria ON AIR', code: 'bg-onair', country: 'Bulgaria', category: 'News' },
        { name: 'TV7 Bulgaria', code: 'tv7-bg', country: 'Bulgaria', category: 'General' },
        { name: 'BG Music', code: 'bg-music', country: 'Bulgaria', category: 'Music' },
        { name: 'Folklor TV', code: 'folklor-tv', country: 'Bulgaria', category: 'Music' },
        
        // Indian Channels
        { name: 'Star Plus', code: 'star-plus', country: 'India', category: 'General' },
        { name: 'Colors TV', code: 'colors', country: 'India', category: 'General' },
        { name: 'Sony TV', code: 'sony-tv', country: 'India', category: 'General' },
        { name: 'Zee TV', code: 'zee-tv', country: 'India', category: 'General' },
        { name: 'Star Gold', code: 'star-gold', country: 'India', category: 'Movies' },
        { name: 'Zee Cinema', code: 'zee-cinema', country: 'India', category: 'Movies' },
        { name: 'Sony Max', code: 'sony-max', country: 'India', category: 'Movies' },
        { name: 'Colors Cineplex', code: 'colors-cineplex', country: 'India', category: 'Movies' },
        { name: 'NDTV 24x7', code: 'ndtv-24x7', country: 'India', category: 'News' },
        { name: 'Times Now', code: 'times-now', country: 'India', category: 'News' },
        { name: 'India Today', code: 'india-today', country: 'India', category: 'News' },
        { name: 'Republic TV', code: 'republic-tv', country: 'India', category: 'News' },
        { name: 'Star Sports 1', code: 'star-sports1', country: 'India', category: 'Sports' },
        { name: 'Sony Six', code: 'sony-six', country: 'India', category: 'Sports' },
        { name: 'Pogo', code: 'pogo', country: 'India', category: 'Kids' },
        { name: 'Nick India', code: 'nick-india', country: 'India', category: 'Kids' },
        { name: 'Disney India', code: 'disney-india', country: 'India', category: 'Kids' },
        
        // Additional Premium Movie Channels from Reference Site
        { name: '1HD', code: '1hdru', country: 'Russia', category: 'Movies' },
        { name: '1+2', code: '1-2', country: 'Russia', category: 'General' },
        { name: '34 канал (Днепр)', code: '34kanal', country: 'Ukraine', category: 'Regional' },
        { name: '36,6 TV', code: '36-6-tv', country: 'Russia', category: 'General' },
        { name: '360TuneBox', code: '360-tunebox', country: 'Russia', category: 'Music' },
        { name: '365 дней ТВ', code: '365dney', country: 'Russia', category: 'General' },
        { name: '78', code: '78kanal', country: 'Russia', category: 'Regional' },
        { name: '8 канал - Красноярский край', code: 'ya1pm', country: 'Russia', category: 'Regional' },
        { name: '4ever Cinema', code: '4ever-cinema', country: 'International', category: 'Movies' },
        { name: '4ever Drama', code: '4ever-drama', country: 'International', category: 'Movies' },
        { name: '4ever Music', code: '4ever-music', country: 'International', category: 'Music' },
        { name: '4ever Theater', code: '4ever-theater', country: 'International', category: 'Movies' },
        { name: '9 волна', code: '9volna', country: 'Russia', category: 'Regional' },
        { name: 'A1', code: 'amedia1', country: 'Russia', category: 'Movies' },
        { name: 'A2', code: 'amedia2', country: 'Russia', category: 'Movies' },
        { name: 'Adjarasport 2', code: 'Adjarasport2.ge', country: 'Georgia', category: 'Sports' },
        { name: 'AIVA', code: 'aiva', country: 'Russia', category: 'General' },
        { name: 'Amedia Hit', code: 'amedia-hit', country: 'Russia', category: 'Movies' },
        { name: 'Amedia Premium HD', code: 'amedia-hd', country: 'Russia', category: 'Movies' },
        { name: 'Bazmots TV', code: 'BazmotsTV.am', country: 'Armenia', category: 'General' },
        
        // Complete BCU Premium Movie Collection
        { name: 'BCU Catastrophe HD', code: 'bcu-catastrophe', country: 'Russia', category: 'Movies' },
        { name: 'BCU Charm HD', code: 'bcu-charm', country: 'Russia', category: 'Movies' },
        { name: 'BCU Cinema+ HD', code: 'bcu-cinema-plus', country: 'Russia', category: 'Movies' },
        { name: 'BCU Cosmo HD', code: 'bcu-cosmo', country: 'Russia', category: 'Movies' },
        { name: 'BCU Cosmo HDR', code: 'bcu-cosmo-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Criminal HD', code: 'bcu-criminal', country: 'Russia', category: 'Movies' },
        { name: 'BCU FilMystic HD', code: 'bcu-filmystic', country: 'Russia', category: 'Movies' },
        { name: 'BCU Kids 4K', code: 'bcu-kids-4k', country: 'Russia', category: 'Kids' },
        { name: 'BCU Kids HD', code: 'bcu-kids', country: 'Russia', category: 'Kids' },
        { name: 'BCU Kids+ HD', code: 'bcu-kids-plus', country: 'Russia', category: 'Kids' },
        { name: 'BCU Kinorating HD', code: 'bcu-kinorating', country: 'Russia', category: 'Movies' },
        { name: 'BCU Kinozakaz 4K', code: 'bcu-kinozakaz-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Kinozakaz Premiere 4K', code: 'bcu-kinozakaz-priemiere-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Little HD', code: 'bcu-little', country: 'Russia', category: 'Kids' },
        { name: 'BCU Marvel 4K', code: 'bcu-marvel-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Multserial HD', code: 'bcu-multserial', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere 1 HD', code: 'bcu-kinozal-prem1', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere 2 HD', code: 'bcu-kinozal-prem2', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere 3 HD', code: 'bcu-kinozal-prem3', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere Ultra 4K', code: 'bcu-premiere-ultra-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premiere Ultra 4K', code: 'bcu-premiere-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium 80 лет Победы 4K HDR', code: 'bcu-premium-pobed', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Action 4K HDR', code: 'bcu-premium-action-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Crime 4K HDR', code: 'bcu-premium-crime-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Fantastic 4K HDR', code: 'bcu-premium-fantstic-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium Franchise 4K HDR', code: 'bcu-premium-franshise-4k-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCU Premium History 4K HDR', code: 'bcu-premium-history-4k-hdr', country: 'Russia', category: 'Documentary' },
        { name: 'BCU Reality HD', code: 'bcu-reality', country: 'Russia', category: 'Documentary' },
        { name: 'BCU Romantic HD', code: 'bcu-romantic', country: 'Russia', category: 'Movies' },
        { name: 'BCU RUSerial HD', code: 'bcu-ruserial', country: 'Russia', category: 'Movies' },
        { name: 'BCU Russia 90s HD', code: 'bcu-russia-90s', country: 'Russia', category: 'Movies' },
        { name: 'BCU Russian HD', code: 'bcu-russian', country: 'Russia', category: 'Movies' },
        { name: 'BCU Stars HD', code: 'bcu-stars', country: 'Russia', category: 'Movies' },
        { name: 'BCU Survival HD', code: 'bcu-survival', country: 'Russia', category: 'Documentary' },
        { name: 'BCU TruMotion HD', code: 'bcu-trumotion', country: 'Russia', category: 'Movies' },
        { name: 'BCU Ultra 4K', code: 'bcu-ultra-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU VHS HD', code: 'bcu-vhs', country: 'Russia', category: 'Movies' },
        { name: 'BCU Сваты 4K', code: 'bcu-svaty-4k', country: 'Russia', category: 'Movies' },
        { name: 'BCU Сваты HD', code: 'bcu-svaty', country: 'Russia', category: 'Movies' },
        { name: 'BCU СССР HD', code: 'bcu-ussr', country: 'Russia', category: 'Movies' },
        { name: 'BCU СССР HDR', code: 'bcu-ussr-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BCUMedia HD', code: 'bcu-media', country: 'Russia', category: 'Movies' },
        
        // Complete BOX Premium Movie Collection
        { name: 'BOX Anime HD', code: 'box-anime', country: 'Russia', category: 'Kids' },
        { name: 'BOX Be ON Edge 1 live HD', code: 'box-beonedge-1-live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 1 Live HD', code: 'box-beonedge1live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 2 Live HD', code: 'box-beonedge2live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 2 live HD', code: 'box-beonedge-2-live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge 3 Live HD', code: 'box-beonedge3live', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Be ON Edge HD', code: 'box-beonedge', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Cyber HD', code: 'box-cyber', country: 'Russia', category: 'Movies' },
        { name: 'BOX Docu. HD', code: 'box-docu', country: 'Russia', category: 'Documentary' },
        { name: 'BOX Franchise HD', code: 'box-franchise', country: 'Russia', category: 'Movies' },
        { name: 'BOX Franchise HDR', code: 'box-franchise-hdr', country: 'Russia', category: 'Movies' },
        { name: 'BOX Game HD', code: 'box-game', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Ghost HD', code: 'box-ghost', country: 'Russia', category: 'Movies' },
        { name: 'BOX Gurman HD', code: 'box-gurman', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX History 4K', code: 'box-history-4k', country: 'Russia', category: 'Documentary' },
        { name: 'BOX Hybrid HD', code: 'box-hybrid', country: 'Russia', category: 'Movies' },
        { name: 'BOX Kosmo 4K', code: 'box-kosmo-4k', country: 'Russia', category: 'Documentary' },
        { name: 'BOX LoFi HD', code: 'box-lofi', country: 'Russia', category: 'Music' },
        { name: 'BOX M.Serial HD', code: 'box-m-serial', country: 'Russia', category: 'Movies' },
        { name: 'BOX M.Serial HD', code: 'box-mserial', country: 'Russia', category: 'Movies' },
        { name: 'BOX Mayday HD', code: 'box-myday', country: 'Russia', category: 'Documentary' },
        { name: 'BOX Memory HD', code: 'box-memory', country: 'Russia', category: 'Movies' },
        { name: 'BOX Metall HD', code: 'box-metall', country: 'Russia', category: 'Music' },
        { name: 'BOX Music 4K', code: 'box-music-4k', country: 'Russia', category: 'Music' },
        { name: 'BOX Music 4K', code: 'box-music4k', country: 'Russia', category: 'Music' },
        { name: 'BOX Premiere+ 4K HDR', code: 'box-premiere-plus-4khdr', country: 'Russia', category: 'Movies' },
        { name: 'BOX Relax 4K', code: 'box-relax', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Relax 4K', code: 'box-relax4k', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX Remast 4K', code: 'box-remast-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Remast+ 4K', code: 'box-remast-plus-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX RU.RAP HD', code: 'box-ru-rap', country: 'Russia', category: 'Music' },
        { name: 'BOX Russian 4K', code: 'box-russian-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Serial 4K', code: 'box-serial4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Serial HD', code: 'box-serial', country: 'Russia', category: 'Movies' },
        { name: 'BOX Serial Premiere 4K', code: 'box-serial-premiere-4k', country: 'Russia', category: 'Movies' },
        { name: 'BOX Sitcom HD', code: 'box-sitcom', country: 'Russia', category: 'Entertainment' },
        { name: 'BOX SportCast Live 1 HD', code: 'box-sportcast-live1', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 2 HD', code: 'box-sportcast-live2', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 3 HD', code: 'box-sportcast-live3', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 4 HD', code: 'box-sportcast-live4', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 5 HD', code: 'box-sportcast-live5', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 6 HD', code: 'box-sportcast-live6', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 7 HD', code: 'box-sportcast-live7', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 8 HD', code: 'box-sportcast-live8', country: 'Russia', category: 'Sports' },
        { name: 'BOX SportCast Live 9 HD', code: 'box-sportcast-live9', country: 'Russia', category: 'Sports' },
        { name: 'BOX Travel HD', code: 'box-travel', country: 'Russia', category: 'Documentary' },
        
        // Additional Music Channels
        { name: 'Bridge Rock', code: 'bridge-fresh', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Русский хит', code: 'rusong', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Фрэш', code: 'bridge-tv-fresh', country: 'Russia', category: 'Music' },
        { name: 'Bridge TV Шлягер', code: 'shlyager', country: 'Russia', category: 'Music' },
        
        // Complete Georgian Premium Channels Collection
        { name: 'Beyonce+ HD', code: 'BeyoncePlusHD.ge', country: 'Georgia', category: 'Music' },
        { name: 'Christmas + HD', code: 'ChristmasPlusHD.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Chveni Magti', code: 'ChveniMagti.ge', country: 'Georgia', category: 'General' },
        { name: 'CINE+ Classic', code: 'CINEPlusClassic.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Emotion', code: 'CINEPlusEmotion.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Family', code: 'CINEPlusFamily.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Festival', code: 'CINEPlusFestival.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Frisson', code: 'CINEPlusFrisson.ge', country: 'Georgia', category: 'Movies' },
        { name: 'CINE+ Ocs', code: 'CINEPlusOcs.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Comedie+ HD', code: 'ComediePlusHD.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Dardimandi', code: 'Dardimandi.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi + 4K Ultra HD', code: 'DigiPlus4KUltraHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Action HD', code: 'DigiPlusActionHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Cinema HD', code: 'DigiPlusCinemaHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Comedy HD', code: 'DigiPlusComedyHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Documentary HD', code: 'DigiPlusDocumentaryHD.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Digi + Drama HD', code: 'DigiPlusDramaHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Family HD', code: 'DigiPlusFamilyHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + HD', code: 'DigiPlusHD.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi + Horror HD', code: 'DigiPlusHorrorHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi + Idol HD', code: 'DigiPlusIdolHD.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Digi + Kids HD', code: 'DigiPlusKidsHD.ge', country: 'Georgia', category: 'Kids' },
        { name: 'Digi + Music HD', code: 'DigiPlusMusicHD.ge', country: 'Georgia', category: 'Music' },
        { name: 'Digi + Premiere HD', code: 'DigiPlusPremiereHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Digi+ City HD', code: 'DigiPlusCityHD.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi+ Georgian HD', code: 'DigiPlusGeorgianHD.ge', country: 'Georgia', category: 'General' },
        { name: 'Digi+ Hits HD', code: 'DigiPlusHitsHD.ge', country: 'Georgia', category: 'Music' },
        { name: 'DIGI+ MUSIC 4K', code: 'DIGIPlusMUSIC4K.ge', country: 'Georgia', category: 'Music' },
        { name: 'DIGI+ Play 1', code: 'DIGIPlusPlay1.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Play 2', code: 'DIGIPlusPlay2.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Play 3', code: 'DIGIPlusPlay3.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Play 4', code: 'DIGIPlusPlay4.ge', country: 'Georgia', category: 'General' },
        { name: 'DIGI+ Series HD', code: 'DIGIPlusSeriesHD.ge', country: 'Georgia', category: 'Movies' },
        { name: 'DIGI+ Stars', code: 'DIGIPlusStars.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'DIGI+4K 2', code: 'DIGIPlus4K2.ge', country: 'Georgia', category: 'Movies' },
        
        // Complete Clarity4K Premium Collection
        { name: 'Clarity4K Asia', code: 'clarity4k-asia', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Concert', code: 'clarity4k-concert', country: 'Russia', category: 'Music' },
        { name: 'Clarity4K Gamefilm', code: 'clarity4k-gamefilm', country: 'Russia', category: 'Entertainment' },
        { name: 'Clarity4K Kинодети CССР', code: 'clarity4k-kinidetisssr', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Travel Blog', code: 'clarity4k-puteshestvie', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K Авто Блог', code: 'clarity4k-avtomaster', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K Боевик VHS', code: 'clarity4k-boevikvhs', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Драмы', code: 'clarity4k-dramy', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Единоборства', code: 'clarity4k-edinoborstva', country: 'Russia', category: 'Sports' },
        { name: 'Clarity4K Запал', code: 'clarity4k-zapal', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Звериный мир', code: 'clarity4k-zwerinmir', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K КиноНовинки', code: 'clarity4k-kinonowinki', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K КиноСССР', code: 'clarity4k-sdelanowsssr', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K КиноФраншизы', code: 'clarity4k-kinofranshizy', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K КиноШарм', code: 'clarity4k-kinoszarm', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Классика кино', code: 'clarity4k-western', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Комедия СССР 1', code: 'clarity4k-komediasssr1', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Комедия СССР 2', code: 'clarity4k-komediasssr2', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Космомир', code: 'clarity4k-kosmomir', country: 'Russia', category: 'Documentary' },
        { name: 'Clarity4K Мультимир', code: 'clarity4k-multimir', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Мультляндия', code: 'clarity4k-multlandia', country: 'Russia', category: 'Kids' },
        { name: 'Clarity4K Мюзикл', code: 'clarity4k-muzikl', country: 'Russia', category: 'Music' },
        { name: 'Clarity4K Первый женский', code: 'clarity4k-pervyzenski', country: 'Russia', category: 'Entertainment' },
        { name: 'Clarity4K Приключения', code: 'clarity4k-prikluchenia', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Семейный', code: 'clarity4k-semejny', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Сумеречный Эфир', code: 'clarity4k-sumerefir', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Ужасы VHS', code: 'clarity4k-istoriivrema', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4K Фэнтези', code: 'clarity4k-fentezy', country: 'Russia', category: 'Movies' },
        { name: 'Clarity4К Города', code: 'clarity4k-relaxkamin', country: 'Russia', category: 'Documentary' },
        
        // Additional CineMan Premium Collection
        { name: 'CineMan Melodrama', code: 'cineman-melodrama', country: 'Russia', category: 'Movies' },
        { name: 'CineMan MiniSeries', code: 'cineman-miniseries', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Premium', code: 'cineman-premium', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Top', code: 'cineman-top', country: 'Russia', category: 'Movies' },
        { name: 'CineMan VHS', code: 'cineman-vhs', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Военные Сериалы', code: 'cineman-vovserials', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Катастрофы', code: 'cineman-disasters', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Комедийные сериалы', code: 'cineman-komseri', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Криминальные Сериалы', code: 'cineman-gluhar', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Лесник', code: 'cineman-forester', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Ментовские Войны', code: 'cineman-MW', country: 'Russia', category: 'Movies' },
        { name: 'CineMan ПёС + Лихач', code: 'cineman-PES', country: 'Russia', category: 'Movies' },
        { name: 'CineMan РуКино', code: 'cineman-rukino', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Сваты', code: 'cineman-svaty', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Симпсоны', code: 'cineman-thesimps', country: 'Russia', category: 'Entertainment' },
        { name: 'CineMan Скорая помощь', code: 'cineman-ER', country: 'Russia', category: 'Movies' },
        { name: 'CineMan Ужасы', code: 'cineman-uzhasy', country: 'Russia', category: 'Movies' },
        
        // Additional Premium International Channels
        { name: '.black', code: 'sony-turbo', country: 'International', category: 'Entertainment' },
        { name: '.red', code: 'set', country: 'International', category: 'Entertainment' },
        { name: '.red HD', code: 'set-hd', country: 'International', category: 'Entertainment' },
        { name: '.sci-fi', code: 'axn', country: 'International', category: 'Entertainment' },
        { name: '+TV', code: '+tv', country: 'International', category: 'General' },
        { name: 'CandyMan', code: 'candyman', country: 'International', category: 'Entertainment' },
        { name: 'Detektiv.tv', code: 'detektiv', country: 'Russia', category: 'Entertainment' },
        { name: 'Brodilo TV', code: 'brodilo', country: 'International', category: 'Entertainment' },
        
        // Additional Kids Channels
        { name: 'Ani', code: 'ani', country: 'International', category: 'Kids' },
        { name: 'C-Cartoon', code: 'c-cartoon', country: 'International', category: 'Kids' },
        { name: 'C-Comedy', code: 'c-comedy', country: 'International', category: 'Kids' },
        { name: 'C-History', code: 'c-history', country: 'International', category: 'Kids' },
        { name: 'C-Inquest', code: 'c-inquest', country: 'International', category: 'Kids' },
        { name: 'C-Marvel', code: 'c-marvel', country: 'International', category: 'Kids' },
        
        // Complete Georgian Channel Collection from Reference Site
        { name: '1 TV GE', code: 'FirstChannel.ge', country: 'Georgia', category: 'General' },
        { name: '2 TV GE', code: '2TV.ge', country: 'Georgia', category: 'General' },
        { name: 'Ajara TV', code: 'AjaraTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Comedy TV GE', code: 'ComedyTV.ge', country: 'Georgia', category: 'Entertainment' },
        { name: 'Discovery Channel GE', code: 'DiscoveryChannel.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Discovery Science GE', code: 'DiscoveryScience.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Euronews GE', code: 'Euronews.ge', country: 'Georgia', category: 'News' },
        { name: 'First TV GE', code: 'FirstTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Fox Movies GE', code: 'FoxMovies.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Fox Series GE', code: 'FoxSeries.ge', country: 'Georgia', category: 'Movies' },
        { name: 'Georgian Public Broadcasting GE', code: 'GPB.ge', country: 'Georgia', category: 'General' },
        { name: 'History Channel GE', code: 'HistoryChannel.ge', country: 'Georgia', category: 'Documentary' },
        { name: 'Imedi TV GE', code: 'ImediTV.ge', country: 'Georgia', category: 'General' },
        { name: 'Mtavari Arkhi GE', code: 'MtavariArkhi.ge', country: 'Georgia', category: 'News' },
        { name: 'Rustavi 2 GE', code: 'Rustavi2.ge', country: 'Georgia', category: 'General' },
        { name: 'TV Pirveli GE', code: 'TVPirveli.ge', country: 'Georgia', category: 'General' },
        
        // Complete Armenian Channel Collection
        { name: '21TV AM', code: '21TV.am', country: 'Armenia', category: 'General' },
        { name: 'AR AM', code: 'AR.am', country: 'Armenia', category: 'General' },
        { name: 'Ararat', code: 'Ararat.am', country: 'Armenia', category: 'General' },
        { name: 'Armcinema', code: 'Armcinema.am', country: 'Armenia', category: 'Movies' },
        { name: 'Armenia TV', code: 'ArmeniaTV.am', country: 'Armenia', category: 'General' },
        { name: 'ArmNews', code: 'ArmNews.am', country: 'Armenia', category: 'News' },
        { name: 'ATV Армения', code: 'ATV.am', country: 'Armenia', category: 'General' },
        { name: 'Cineman AM', code: 'Cineman.am', country: 'Armenia', category: 'Movies' },
        { name: 'Comedy AM', code: 'Comedy.am', country: 'Armenia', category: 'Entertainment' },
        
        // Additional Russian Regional and Specialty Channels
        { name: '12 канал Омск', code: '12-omsk', country: 'Russia', category: 'Regional' },
        { name: '24 (Телеканал новостей 24)', code: 'news24', country: 'Russia', category: 'News' },
        { name: '2х2', code: '2x2', country: 'Russia', category: 'Entertainment' },
        { name: '2х2 (+2)', code: '2x2+2', country: 'Russia', category: 'Entertainment' },
        { name: '2х2 (+4)', code: '2x2+4', country: 'Russia', category: 'Entertainment' },
        { name: '2х2 (+7)', code: '2x2+7', country: 'Russia', category: 'Entertainment' },
        { name: '360° Новости', code: '360-news', country: 'Russia', category: 'News' },
        { name: '49 канал (Новосибирск)', code: '49kanal', country: 'Russia', category: 'Regional' },
        { name: '5 канал (Россия) (+6)', code: 'piter+6', country: 'Russia', category: 'General' },
        { name: '5 канал (Россия) (+8)', code: 'piter+8', country: 'Russia', category: 'General' },
        { name: '8 канал (Беларусь)', code: '8channel', country: 'Belarus', category: 'General' },
        { name: '8 канал (Россия)', code: '8-kanal', country: 'Russia', category: 'General' },
        { name: 'Bolt Россия', code: 'bolt', country: 'Russia', category: 'Entertainment' },
        
        // Additional Premium Movie Collections
        { name: 'Box Music TV BG', code: 'box-music-tv-bg', country: 'Bulgaria', category: 'Music' },
        { name: 'BOX Zombie HD', code: 'box-zombie', country: 'Russia', category: 'Movies' },
        { name: 'Candy', code: 'candy', country: 'Russia', category: 'Entertainment' },
        { name: 'Cine+', code: 'cine+', country: 'International', category: 'Movies' },
        { name: 'Cine+ HD', code: 'cine+hd', country: 'International', category: 'Movies' },
        { name: 'Cine+ Hit HD', code: 'cine+hit-hd', country: 'International', category: 'Movies' },
        { name: 'Cine+ Kids', code: 'cine+kids', country: 'International', category: 'Kids' },
        { name: 'Cine+ Legend', code: 'cine+legend', country: 'International', category: 'Movies' },
        { name: 'Comedy Central Russian', code: 'paramount-comedy', country: 'Russia', category: 'Entertainment' },
        
        // Complete Discovery Channel Collection
        { name: 'Discovery Channel Россия', code: 'discovery-ru', country: 'Russia', category: 'Documentary' },
        { name: 'Discovery Science', code: 'discovery-science', country: 'International', category: 'Documentary' },
        { name: 'Discovery Turbo', code: 'turbo', country: 'International', category: 'Documentary' },
        { name: 'Discovery World', code: 'discovery-world', country: 'International', category: 'Documentary' },
        { name: 'Discovery БВ', code: 'discovery-bv', country: 'Russia', category: 'Documentary' },
        { name: 'DTX', code: 'dtx', country: 'International', category: 'Documentary' },
        { name: 'Duna TV', code: 'duna-tv', country: 'Hungary', category: 'General' },
        { name: 'Duna World', code: 'duna-world', country: 'Hungary', category: 'General' },
        
        // French Channel Collection
        { name: 'Euronews Français', code: 'euronews-fr', country: 'France', category: 'News' },
        { name: 'Europe 1', code: 'europe1', country: 'France', category: 'News' },
        { name: 'France 2', code: 'france2', country: 'France', category: 'General' },
        { name: 'France 3', code: 'france3', country: 'France', category: 'General' },
        { name: 'France 4', code: 'france4', country: 'France', category: 'General' },
        { name: 'France 5', code: 'france5', country: 'France', category: 'General' },
        { name: 'France 24', code: 'france24', country: 'France', category: 'News' },
        { name: 'France Info', code: 'france-info', country: 'France', category: 'News' },
        
        // German Channel Collection
        { name: 'Euronews Deutsch', code: 'euronews-de', country: 'Germany', category: 'News' },
        { name: 'Eurosport 1 Deutschland', code: 'eurosport1-de', country: 'Germany', category: 'Sports' },
        { name: 'Eurosport 2 Deutschland', code: 'eurosport2-de', country: 'Germany', category: 'Sports' },
        { name: 'ProSieben', code: 'pro7', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL II', code: 'rtl2', country: 'Germany', category: 'Entertainment' },
        { name: 'SAT.1', code: 'sat1', country: 'Germany', category: 'Entertainment' },
        { name: 'VOX', code: 'vox-de', country: 'Germany', category: 'Entertainment' },
        { name: 'WDR', code: 'wdr', country: 'Germany', category: 'Regional' },
        
        // UK Channel Collection
        { name: 'Channel 4', code: 'channel4', country: 'UK', category: 'General' },
        { name: 'Channel 5', code: 'channel5', country: 'UK', category: 'General' },
        { name: 'ITV', code: 'itv', country: 'UK', category: 'General' },
        { name: 'ITV2', code: 'itv2', country: 'UK', category: 'Entertainment' },
        { name: 'Sky News', code: 'sky-news', country: 'UK', category: 'News' },
        { name: 'Sky Sports', code: 'sky-sports', country: 'UK', category: 'Sports' },
        
        // Italian Channel Collection
        { name: 'Canale 5', code: 'canale5', country: 'Italy', category: 'General' },
        { name: 'Italia 1', code: 'italia1', country: 'Italy', category: 'Entertainment' },
        { name: 'La7', code: 'la7', country: 'Italy', category: 'News' },
        { name: 'Rai 1', code: 'rai1', country: 'Italy', category: 'General' },
        { name: 'Rai 2', code: 'rai2', country: 'Italy', category: 'General' },
        { name: 'Rai 3', code: 'rai3', country: 'Italy', category: 'General' },
        { name: 'Rete 4', code: 'rete4', country: 'Italy', category: 'General' },
        
        // Spanish Channel Collection
        { name: 'Antena 3', code: 'antena3', country: 'Spain', category: 'General' },
        { name: 'Cuatro', code: 'cuatro', country: 'Spain', category: 'Entertainment' },
        { name: 'La 1', code: 'la1', country: 'Spain', category: 'General' },
        { name: 'La 2', code: 'la2', country: 'Spain', category: 'General' },
        { name: 'Telecinco', code: 'telecinco', country: 'Spain', category: 'General' },
        { name: 'Telemadrid', code: 'telemadrid', country: 'Spain', category: 'Regional' },
        
        // Nordic Channel Collection  
        { name: 'DR1', code: 'dr1', country: 'Denmark', category: 'General' },
        { name: 'NRK1', code: 'nrk1', country: 'Norway', category: 'General' },
        { name: 'SVT1', code: 'svt1', country: 'Sweden', category: 'General' },
        { name: 'TV 2 Danmark', code: 'tv2-dk', country: 'Denmark', category: 'General' },
        { name: 'TV 2 Norge', code: 'tv2-no', country: 'Norway', category: 'General' },
        { name: 'TV4 Sverige', code: 'tv4-se', country: 'Sweden', category: 'General' },
        { name: 'Yle TV1', code: 'yle-tv1', country: 'Finland', category: 'General' },
        
        // Eastern European Collection
        { name: 'Czech Television', code: 'ct1', country: 'Czech Republic', category: 'General' },
        { name: 'Markíza', code: 'markiza', country: 'Slovakia', category: 'General' },
        { name: 'Nova TV', code: 'nova-cz', country: 'Czech Republic', category: 'General' },
        { name: 'Polish Television', code: 'tvp1', country: 'Poland', category: 'General' },
        { name: 'Prima TV', code: 'prima-tv', country: 'Czech Republic', category: 'General' },
        { name: 'Slovak Television', code: 'stv1', country: 'Slovakia', category: 'General' },
        
        // Balkan Collection (ExYu region)
        { name: 'B92', code: 'b92', country: 'Serbia', category: 'News' },
        { name: 'BN TV', code: 'bn-tv', country: 'Bosnia', category: 'General' },
        { name: 'Face TV', code: 'face-tv', country: 'Bosnia', category: 'General' },
        { name: 'HRT 1', code: 'hrt1', country: 'Croatia', category: 'General' },
        { name: 'Nova S', code: 'nova-s', country: 'Serbia', category: 'General' },
        { name: 'OBN', code: 'obn', country: 'Bosnia', category: 'General' },
        { name: 'Pink', code: 'pink', country: 'Serbia', category: 'Entertainment' },
        { name: 'RTS 1', code: 'rts1', country: 'Serbia', category: 'General' },
        { name: 'RTL Croatia', code: 'rtl-hr', country: 'Croatia', category: 'General' },
        
        // Additional International Premium Channels
        { name: 'History Channel', code: 'history', country: 'International', category: 'Documentary' },
        { name: 'Nat Geo Wild', code: 'natgeo-wild', country: 'International', category: 'Documentary' },
        { name: 'National Geographic', code: 'natgeo', country: 'International', category: 'Documentary' },
        { name: 'Travel Channel', code: 'travel', country: 'International', category: 'Documentary' },
        { name: 'Viasat Explore', code: 'viasat-explore', country: 'International', category: 'Documentary' },
        { name: 'Viasat History', code: 'viasat-history', country: 'International', category: 'Documentary' },
        { name: 'Viasat Nature', code: 'viasat-nature', country: 'International', category: 'Documentary' },

        // MISSING CHANNELS FROM REFERENCE SITE - MASSIVE EXPANSION

        // Complete Discovery Channel Family
        { name: 'Discovery Channel', code: 'discovery', country: 'International', category: 'Documentary' },
        { name: 'Discovery Channel Россия', code: 'discovery-ru', country: 'Russia', category: 'Documentary' },
        { name: 'Discovery Historia', code: 'discovery-historia', country: 'International', category: 'Documentary' },
        { name: 'Discovery ID', code: 'discovery-id', country: 'International', category: 'Documentary' },
        { name: 'Discovery Life', code: 'discovery-life', country: 'International', category: 'Documentary' },
        { name: 'Discovery Science Россия', code: 'discovery-science-ru', country: 'Russia', category: 'Documentary' },
        { name: 'Discovery Showcase', code: 'discovery-showcase', country: 'International', category: 'Documentary' },
        { name: 'Discovery Turbo', code: 'discovery-turbo', country: 'International', category: 'Documentary' },
        { name: 'Discovery World', code: 'discovery-world', country: 'International', category: 'Documentary' },
        { name: 'Discovery БВ', code: 'discovery-bv', country: 'Russia', category: 'Documentary' },

        // German/Austrian/Swiss Channels (DE/AT/CH) - COMPLETE COLLECTION
        { name: '3sat', code: '3sat', country: 'Germany', category: 'General' },
        { name: 'ARD', code: 'ard', country: 'Germany', category: 'General' },
        { name: 'Arte', code: 'arte', country: 'Germany', category: 'Culture' },
        { name: 'Arte Français', code: 'arte-fr', country: 'France', category: 'Culture' },
        { name: 'BR', code: 'br', country: 'Germany', category: 'Regional' },
        { name: 'DMAX Deutschland', code: 'dmax-de', country: 'Germany', category: 'Documentary' },
        { name: 'Euronews Deutsch', code: 'euronews-de', country: 'Germany', category: 'News' },
        { name: 'Eurosport 1 Deutschland', code: 'eurosport1-de', country: 'Germany', category: 'Sports' },
        { name: 'Eurosport 2 Deutschland', code: 'eurosport2-de', country: 'Germany', category: 'Sports' },
        { name: 'HSE24', code: 'hse24', country: 'Germany', category: 'Shopping' },
        { name: 'Kabel 1', code: 'kabel1', country: 'Germany', category: 'Entertainment' },
        { name: 'KiKA', code: 'kika', country: 'Germany', category: 'Kids' },
        { name: 'n-tv', code: 'n-tv', country: 'Germany', category: 'News' },
        { name: 'NDR', code: 'ndr', country: 'Germany', category: 'Regional' },
        { name: 'ORF 1', code: 'orf1', country: 'Austria', category: 'General' },
        { name: 'ORF 2', code: 'orf2', country: 'Austria', category: 'General' },
        { name: 'ORF III', code: 'orf3', country: 'Austria', category: 'Culture' },
        { name: 'ORF Sport +', code: 'orf-sport', country: 'Austria', category: 'Sports' },
        { name: 'Phoenix', code: 'phoenix', country: 'Germany', category: 'News' },
        { name: 'ProSieben', code: 'pro7', country: 'Germany', category: 'Entertainment' },
        { name: 'ProSieben Maxx', code: 'pro7maxx', country: 'Germany', category: 'Entertainment' },
        { name: 'QVC Deutschland', code: 'qvc-de', country: 'Germany', category: 'Shopping' },
        { name: 'RTL', code: 'rtl-de', country: 'Germany', category: 'General' },
        { name: 'RTL 2', code: 'rtl2', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL Crime', code: 'rtl-crime', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL Living', code: 'rtl-living', country: 'Germany', category: 'Lifestyle' },
        { name: 'RTL Nitro', code: 'rtl-nitro', country: 'Germany', category: 'Entertainment' },
        { name: 'RTL Passion', code: 'rtl-passion', country: 'Germany', category: 'Entertainment' },
        { name: 'SAT.1', code: 'sat1', country: 'Germany', category: 'Entertainment' },
        { name: 'SAT.1 Gold', code: 'sat1-gold', country: 'Germany', category: 'Entertainment' },
        { name: 'ServusTV', code: 'servus-tv', country: 'Austria', category: 'General' },
        { name: 'Sixx', code: 'sixx', country: 'Germany', category: 'Entertainment' },
        { name: 'Sky Deutschland', code: 'sky-de', country: 'Germany', category: 'Premium' },
        { name: 'Sport1', code: 'sport1', country: 'Germany', category: 'Sports' },
        { name: 'SRF 1', code: 'srf1', country: 'Switzerland', category: 'General' },
        { name: 'SRF 2', code: 'srf2', country: 'Switzerland', category: 'General' },
        { name: 'Super RTL', code: 'super-rtl', country: 'Germany', category: 'Kids' },
        { name: 'SWR', code: 'swr', country: 'Germany', category: 'Regional' },
        { name: 'Tele 5', code: 'tele5', country: 'Germany', category: 'Entertainment' },
        { name: 'TLC Deutschland', code: 'tlc-de', country: 'Germany', category: 'Entertainment' },
        { name: 'VOX', code: 'vox-de', country: 'Germany', category: 'Entertainment' },
        { name: 'VOXUP', code: 'voxup', country: 'Germany', category: 'Entertainment' },
        { name: 'WDR', code: 'wdr', country: 'Germany', category: 'Regional' },
        { name: 'ZDF', code: 'zdf', country: 'Germany', category: 'General' },
        { name: 'ZDFinfo', code: 'zdfinfo', country: 'Germany', category: 'Documentary' },
        { name: 'ZDFneo', code: 'zdfneo', country: 'Germany', category: 'Entertainment' },

        // Complete French Channel Collection  
        { name: 'BFM TV', code: 'bfm-tv', country: 'France', category: 'News' },
        { name: 'Canal+', code: 'canal-plus', country: 'France', category: 'Premium' },
        { name: 'Canal+ Cinéma', code: 'canal-cinema', country: 'France', category: 'Movies' },
        { name: 'Canal+ Décalé', code: 'canal-decale', country: 'France', category: 'Entertainment' },
        { name: 'Canal+ Family', code: 'canal-family', country: 'France', category: 'Family' },
        { name: 'Canal+ Sport', code: 'canal-sport', country: 'France', category: 'Sports' },
        { name: 'Chérie 25', code: 'cherie25', country: 'France', category: 'Entertainment' },
        { name: 'Euronews Français', code: 'euronews-fr', country: 'France', category: 'News' },
        { name: 'Eurosport 1 France', code: 'eurosport1-fr', country: 'France', category: 'Sports' },
        { name: 'Eurosport 2 France', code: 'eurosport2-fr', country: 'France', category: 'Sports' },
        { name: 'France 2', code: 'france2', country: 'France', category: 'General' },
        { name: 'France 3', code: 'france3', country: 'France', category: 'General' },
        { name: 'France 4', code: 'france4', country: 'France', category: 'General' },
        { name: 'France 5', code: 'france5', country: 'France', category: 'General' },
        { name: 'France 24', code: 'france24', country: 'France', category: 'News' },
        { name: 'France Info', code: 'france-info', country: 'France', category: 'News' },
        { name: 'LCI', code: 'lci', country: 'France', category: 'News' },
        { name: 'M6', code: 'm6', country: 'France', category: 'General' },
        { name: 'NRJ 12', code: 'nrj12', country: 'France', category: 'Music' },
        { name: 'RMC Découverte', code: 'rmc-decouverte', country: 'France', category: 'Documentary' },
        { name: 'RMC Story', code: 'rmc-story', country: 'France', category: 'Entertainment' },
        { name: 'TF1', code: 'tf1', country: 'France', category: 'General' },
        { name: 'TFX', code: 'tfx', country: 'France', category: 'Entertainment' },
        { name: 'TMC', code: 'tmc', country: 'France', category: 'Entertainment' },
        { name: 'TV5 Monde', code: 'tv5monde', country: 'France', category: 'International' },
        { name: 'W9', code: 'w9', country: 'France', category: 'Entertainment' },

        // Complete UK Channel Collection
        { name: 'BBC Four', code: 'bbc4', country: 'UK', category: 'Culture' },
        { name: 'BBC iPlayer', code: 'bbc-iplayer', country: 'UK', category: 'Streaming' },
        { name: 'BBC One', code: 'bbc1', country: 'UK', category: 'General' },
        { name: 'BBC Three', code: 'bbc3', country: 'UK', category: 'Entertainment' },
        { name: 'BBC Two', code: 'bbc2', country: 'UK', category: 'General' },
        { name: 'Channel 4', code: 'channel4', country: 'UK', category: 'General' },
        { name: 'Channel 5', code: 'channel5', country: 'UK', category: 'General' },
        { name: 'Dave', code: 'dave', country: 'UK', category: 'Entertainment' },
        { name: 'Drama', code: 'drama-uk', country: 'UK', category: 'Drama' },
        { name: 'E4', code: 'e4', country: 'UK', category: 'Entertainment' },
        { name: 'Film4', code: 'film4', country: 'UK', category: 'Movies' },
        { name: 'Gold', code: 'gold-uk', country: 'UK', category: 'Entertainment' },
        { name: 'ITV', code: 'itv', country: 'UK', category: 'General' },
        { name: 'ITV2', code: 'itv2', country: 'UK', category: 'Entertainment' },
        { name: 'ITV3', code: 'itv3', country: 'UK', category: 'Entertainment' },
        { name: 'ITV4', code: 'itv4', country: 'UK', category: 'Entertainment' },
        { name: 'ITVBe', code: 'itvbe', country: 'UK', category: 'Lifestyle' },
        { name: 'More4', code: 'more4', country: 'UK', category: 'Entertainment' },
        { name: 'Sky Atlantic', code: 'sky-atlantic', country: 'UK', category: 'Premium' },
        { name: 'Sky Cinema', code: 'sky-cinema', country: 'UK', category: 'Movies' },
        { name: 'Sky News', code: 'sky-news', country: 'UK', category: 'News' },
        { name: 'Sky Sports', code: 'sky-sports', country: 'UK', category: 'Sports' },
        { name: 'Sky Sports News', code: 'sky-sports-news', country: 'UK', category: 'Sports' },

        // Complete Italian Channel Collection
        { name: 'Canale 5', code: 'canale5', country: 'Italy', category: 'General' },
        { name: 'Iris', code: 'iris-it', country: 'Italy', category: 'Movies' },
        { name: 'Italia 1', code: 'italia1', country: 'Italy', category: 'Entertainment' },
        { name: 'La7', code: 'la7', country: 'Italy', category: 'News' },
        { name: 'La7d', code: 'la7d', country: 'Italy', category: 'Documentary' },
        { name: 'Mediaset Extra', code: 'mediaset-extra', country: 'Italy', category: 'Entertainment' },
        { name: 'Premium Cinema', code: 'premium-cinema-it', country: 'Italy', category: 'Movies' },
        { name: 'Rai 1', code: 'rai1', country: 'Italy', category: 'General' },
        { name: 'Rai 2', code: 'rai2', country: 'Italy', category: 'General' },
        { name: 'Rai 3', code: 'rai3', country: 'Italy', category: 'General' },
        { name: 'Rai 4', code: 'rai4', country: 'Italy', category: 'Entertainment' },
        { name: 'Rai 5', code: 'rai5', country: 'Italy', category: 'Culture' },
        { name: 'Rai Movie', code: 'rai-movie', country: 'Italy', category: 'Movies' },
        { name: 'Rai News 24', code: 'rai-news24', country: 'Italy', category: 'News' },
        { name: 'Rai Sport', code: 'rai-sport', country: 'Italy', category: 'Sports' },
        { name: 'Rete 4', code: 'rete4', country: 'Italy', category: 'General' },
        { name: 'Sky Italia', code: 'sky-it', country: 'Italy', category: 'Premium' },
        { name: 'TV8', code: 'tv8-it', country: 'Italy', category: 'Entertainment' },

        // Complete Spanish Channel Collection
        { name: 'Antena 3', code: 'antena3', country: 'Spain', category: 'General' },
        { name: 'Atreseries', code: 'atreseries', country: 'Spain', category: 'Entertainment' },
        { name: 'Canal Sur', code: 'canal-sur', country: 'Spain', category: 'Regional' },
        { name: 'Cuatro', code: 'cuatro', country: 'Spain', category: 'Entertainment' },
        { name: 'Energy', code: 'energy-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Eurosport España', code: 'eurosport-es', country: 'Spain', category: 'Sports' },
        { name: 'FDF', code: 'fdf', country: 'Spain', category: 'Entertainment' },
        { name: 'La 1', code: 'la1', country: 'Spain', category: 'General' },
        { name: 'La 2', code: 'la2', country: 'Spain', category: 'General' },
        { name: 'LaSexta', code: 'lasexta', country: 'Spain', category: 'Entertainment' },
        { name: 'Mega', code: 'mega-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Movistar+', code: 'movistar-plus', country: 'Spain', category: 'Premium' },
        { name: 'Neox', code: 'neox', country: 'Spain', category: 'Entertainment' },
        { name: 'Nova', code: 'nova-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Paramount Network España', code: 'paramount-es', country: 'Spain', category: 'Entertainment' },
        { name: 'Telecinco', code: 'telecinco', country: 'Spain', category: 'General' },
        { name: 'Telemadrid', code: 'telemadrid', country: 'Spain', category: 'Regional' },
        { name: 'TV3', code: 'tv3-es', country: 'Spain', category: 'Regional' },

        // Complete Nordic Collection
        { name: 'DR1', code: 'dr1', country: 'Denmark', category: 'General' },
        { name: 'DR2', code: 'dr2', country: 'Denmark', category: 'Culture' },
        { name: 'DR3', code: 'dr3', country: 'Denmark', category: 'Entertainment' },
        { name: 'MTV3', code: 'mtv3', country: 'Finland', category: 'Entertainment' },
        { name: 'Nelonen', code: 'nelonen', country: 'Finland', category: 'Entertainment' },
        { name: 'NRK1', code: 'nrk1', country: 'Norway', category: 'General' },
        { name: 'NRK2', code: 'nrk2', country: 'Norway', category: 'Culture' },
        { name: 'NRK3', code: 'nrk3', country: 'Norway', category: 'Entertainment' },
        { name: 'SVT1', code: 'svt1', country: 'Sweden', category: 'General' },
        { name: 'SVT2', code: 'svt2', country: 'Sweden', category: 'Culture' },
        { name: 'TV 2 Danmark', code: 'tv2-dk', country: 'Denmark', category: 'General' },
        { name: 'TV 2 Norge', code: 'tv2-no', country: 'Norway', category: 'General' },
        { name: 'TV4 Sverige', code: 'tv4-se', country: 'Sweden', category: 'General' },
        { name: 'Viasat 4', code: 'viasat4', country: 'Nordic', category: 'Entertainment' },
        { name: 'Yle TV1', code: 'yle-tv1', country: 'Finland', category: 'General' },
        { name: 'Yle TV2', code: 'yle-tv2', country: 'Finland', category: 'General' },

        // Complete Eastern European Collection 
        { name: 'Czech Television', code: 'ct1', country: 'Czech Republic', category: 'General' },
        { name: 'CT2', code: 'ct2', country: 'Czech Republic', category: 'Culture' },
        { name: 'CT24', code: 'ct24', country: 'Czech Republic', category: 'News' },
        { name: 'JOJ', code: 'joj', country: 'Slovakia', category: 'General' },
        { name: 'Markíza', code: 'markiza', country: 'Slovakia', category: 'General' },
        { name: 'Nova TV', code: 'nova-cz', country: 'Czech Republic', category: 'General' },
        { name: 'Polish Television', code: 'tvp1', country: 'Poland', category: 'General' },
        { name: 'Prima TV', code: 'prima-tv', country: 'Czech Republic', category: 'General' },
        { name: 'Slovak Television', code: 'stv1', country: 'Slovakia', category: 'General' },
        { name: 'TVN', code: 'tvn-pl', country: 'Poland', category: 'General' },
        { name: 'TVP2', code: 'tvp2', country: 'Poland', category: 'General' },

        // Additional USA Channels
        { name: 'ABC', code: 'abc', country: 'USA', category: 'General' },
        { name: 'CBS', code: 'cbs', country: 'USA', category: 'General' },
        { name: 'ESPN', code: 'espn', country: 'USA', category: 'Sports' },
        { name: 'FOX', code: 'fox', country: 'USA', category: 'General' },
        { name: 'Fox News', code: 'fox-news', country: 'USA', category: 'News' },
        { name: 'HBO', code: 'hbo', country: 'USA', category: 'Premium' },
        { name: 'MSNBC', code: 'msnbc', country: 'USA', category: 'News' },
        { name: 'NBC', code: 'nbc', country: 'USA', category: 'General' },
        { name: 'Showtime', code: 'showtime', country: 'USA', category: 'Premium' },

        // Additional International Specialty Channels
        { name: 'Adult Swim', code: 'adult-swim', country: 'International', category: 'Entertainment' },
        { name: 'Comedy Central', code: 'comedy-central', country: 'International', category: 'Entertainment' },
        { name: 'MTV', code: 'mtv', country: 'International', category: 'Music' },
        { name: 'Nickelodeon', code: 'nickelodeon', country: 'International', category: 'Kids' },
        { name: 'Paramount Network', code: 'paramount', country: 'International', category: 'Entertainment' },
        { name: 'VH1', code: 'vh1', country: 'International', category: 'Music' }
    ];
    
    // Country mapping for URL normalization
    const countryMapping = {
        'turkey': 'Turkey',
        'germany': 'Germany', 
        'spain': 'Spain',
        'italy': 'Italy',
        'france': 'France',
        'uk': 'UK',
        'usa': 'USA',
        'russia': 'Russia',
        'ukraine': 'Ukraine',
        'poland': 'Poland',
        'greece': 'Greece',
        'armenia': 'Armenia',
        'georgia': 'Georgia',
        'bulgaria': 'Bulgaria',
        'romania': 'Romania',
        'hungary': 'Hungary',
        'czech-republic': 'Czech Republic',
        'slovakia': 'Slovakia',
        'netherlands': 'Netherlands',
        'belgium': 'Belgium',
        'sweden': 'Sweden',
        'norway': 'Norway',
        'denmark': 'Denmark',
        'finland': 'Finland',
        'portugal': 'Portugal',
        'brazil': 'Brazil',
        'canada': 'Canada',
        'albania': 'Albania',
        'macedonia': 'Macedonia',
        'serbia': 'Serbia',
        'croatia': 'Croatia',
        'bosnia': 'Bosnia',
        'slovenia': 'Slovenia',
        'india': 'India',
        'israel': 'Israel',
        'mexico': 'Mexico',
        'argentina': 'Argentina',
        'chile': 'Chile',
        'latvia': 'Latvia',
        'lithuania': 'Lithuania',
        'estonia': 'Estonia',
        'austria': 'Austria',
        'switzerland': 'Switzerland',
        'belarus': 'Belarus',
        'korea': 'Korea',
        'china': 'China',
        'qatar': 'Qatar',
        'uae': 'UAE',
        'crimea': 'Crimea',
        'azerbaijan': 'Azerbaijan',
        'international': 'International',
        'europe': 'Europe'
    };
    
    const targetCountry = countryMapping[countryParam];
    
    if (!targetCountry) {
        return res.status(404).render('frontend/pages/404', {
            title: 'Country Not Found - FlixTV',
            keyword: 'country not found, EPG codes, 404 error',
            description: 'The requested country EPG codes page was not found.'
        });
    }
    
    // Filter EPG codes for the specific country
    const countryEpgCodes = allEpgCodes.filter(channel => 
        channel.country.toLowerCase() === targetCountry.toLowerCase()
    );
    
    if (countryEpgCodes.length === 0) {
        return res.status(404).render('frontend/pages/404', {
            title: `${targetCountry} EPG Codes Not Found - FlixTV`,
            keyword: `${targetCountry} EPG codes, country channels, 404 error`,
            description: `No EPG codes found for ${targetCountry}. Please check back later for updates.`
        });
    }
    
    // Get unique categories for this country
    const categories = [...new Set(countryEpgCodes.map(item => item.category))].sort();
    
    // Country-specific SEO metadata
    const countryKeywords = {
        'Turkey': 'Turkish EPG codes, TRT channels, Turkish TV codes, Turkey television guide, Turkish streaming codes, TRT 1 EPG, Kanal D EPG, Show TV EPG, ATV Turkey EPG, Turkish broadcasting codes, Turkey TV guide integration, Turkish channel identifiers, Turkey EPG XML, Turkish television EPG, Turkey streaming EPG, Turkish digital TV codes, Turkey cable TV EPG, Turkish satellite TV codes, Turkey terrestrial TV EPG, Turkish OTT streaming codes',
        'Germany': 'German EPG codes, ARD Das Erste EPG, ZDF EPG, RTL Germany EPG, German TV codes, Germany television guide, German streaming codes, German broadcasting codes, Germany TV guide integration, German channel identifiers, Germany EPG XML, German television EPG, Germany streaming EPG, German digital TV codes, Germany cable TV EPG, German satellite TV codes, Germany terrestrial TV EPG, German OTT streaming codes',
        'Spain': 'Spanish EPG codes, La 1 EPG, Antena 3 EPG, Telecinco EPG, Spanish TV codes, Spain television guide, Spanish streaming codes, Spanish broadcasting codes, Spain TV guide integration, Spanish channel identifiers, Spain EPG XML, Spanish television EPG, Spain streaming EPG, Spanish digital TV codes, Spain cable TV EPG, Spanish satellite TV codes, Spain terrestrial TV EPG, Spanish OTT streaming codes',
        'Italy': 'Italian EPG codes, Rai 1 EPG, Canale 5 EPG, Italia 1 EPG, Italian TV codes, Italy television guide, Italian streaming codes, Italian broadcasting codes, Italy TV guide integration, Italian channel identifiers, Italy EPG XML, Italian television EPG, Italy streaming EPG, Italian digital TV codes, Italy cable TV EPG, Italian satellite TV codes, Italy terrestrial TV EPG, Italian OTT streaming codes',
        'France': 'French EPG codes, Cine+ EPG, French TV codes, France television guide, French streaming codes, French broadcasting codes, France TV guide integration, French channel identifiers, France EPG XML, French television EPG, France streaming EPG, French digital TV codes, France cable TV EPG, French satellite TV codes, France terrestrial TV EPG, French OTT streaming codes',
        'UK': 'UK EPG codes, BBC EPG, British TV codes, UK television guide, British streaming codes, UK broadcasting codes, Britain TV guide integration, UK channel identifiers, UK EPG XML, British television EPG, UK streaming EPG, British digital TV codes, UK cable TV EPG, British satellite TV codes, UK terrestrial TV EPG, British OTT streaming codes',
        'USA': 'US EPG codes, CNN EPG, American TV codes, USA television guide, American streaming codes, US broadcasting codes, America TV guide integration, US channel identifiers, USA EPG XML, American television EPG, US streaming EPG, American digital TV codes, USA cable TV EPG, American satellite TV codes, US terrestrial TV EPG, American OTT streaming codes',
        'Russia': 'Russian EPG codes, Russia TV codes, Russian television guide, Russian streaming codes, Russian broadcasting codes, Russia TV guide integration, Russian channel identifiers, Russia EPG XML, Russian television EPG, Russia streaming EPG, Russian digital TV codes, Russia cable TV EPG, Russian satellite TV codes, Russia terrestrial TV EPG, Russian OTT streaming codes'
    };
    
    const defaultKeywords = `${targetCountry} EPG codes, ${targetCountry} TV codes, ${targetCountry} television guide, ${targetCountry} streaming codes, ${targetCountry} broadcasting codes, ${targetCountry} TV guide integration, ${targetCountry} channel identifiers, ${targetCountry} EPG XML, ${targetCountry} television EPG, ${targetCountry} streaming EPG, ${targetCountry} digital TV codes, ${targetCountry} cable TV EPG, ${targetCountry} satellite TV codes, ${targetCountry} terrestrial TV EPG, ${targetCountry} OTT streaming codes`;
    
    let title = `${targetCountry} EPG Codes - ${countryEpgCodes.length}+ TV Channel Identifiers | FlixTV`;
    let keyword = countryKeywords[targetCountry] || defaultKeywords;
    let description = `Complete ${targetCountry} EPG (Electronic Program Guide) codes database with ${countryEpgCodes.length}+ channels. Professional TV channel identifiers for ${targetCountry} streaming integration, broadcasting solutions, and digital TV guide implementation.`;

    res.render('frontend/pages/country-codes',
        {
            menu:'codes',
            title:title, 
            keyword:keyword,
            description:description,
            epgCodes: countryEpgCodes,
            categories: categories,
            country: targetCountry,
            countryParam: countryParam,
            pageType: 'country-epg-codes',
            canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/codes/${countryParam}` : `https://flixapp.net/codes/${countryParam}`
        }
    );
}

exports.contact=(req,res)=>{
    let meta_data = {
        title: 'Contact Flix IPTV Support - Expert Customer Service & Technical Help 24/7',
        keyword: 'contact Flix IPTV, IPTV support, customer service, technical support, contact streaming support, help desk, support email, IPTV assistance, contact us, customer care, streaming customer service, IPTV help center, technical help, device setup support, playlist support, activation support, payment support, billing support, account support, troubleshooting help, installation help, configuration support, streaming issues, buffering help, connection problems, app support, multi device support, android IPTV support, ios IPTV support, apple tv support, samsung tv support, lg tv support, fire stick support, windows support, smart tv support, ibo player support, ibo iptv support, net iptv support, set iptv support, smart iptv support, iptv player support, m3u support, smart iptv help, iptv smarters support, perfect player support, kodi iptv support, vlc iptv support, mx player support, iptv extreme support, duplex iptv support, ottplayer support, lazy iptv support, iptv pro support, ss iptv support, iptv ultimate support, xciptv support, implayer support, televizo support, streaming support center, iptv customer service, tv streaming help, live tv support, on demand support, catch up tv support, m3u8 support, playlist troubleshooting, EPG support, channel list support, subscription support, activation issues, trial support, premium support, reseller support, white label support, api support, server support, cdn support, bandwidth issues, quality issues, audio sync issues, subtitle support, recording support, timeshift support, parental control support, multi room support, concurrent streams support, geo blocking support, vpn support, proxy support, firewall support, router support, network support, wifi support, ethernet support, 4g support, 5g support, satellite support, cable support, fiber support',
        description: 'Get professional support from Flix IPTV experts. We provide 24/7 customer service for device setup, technical troubleshooting, billing inquiries, account management, and streaming issues. Contact our dedicated support team for immediate assistance with your IPTV service across all devices and platforms.',
        pageType: 'contact',
        canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/contact` : 'https://flixapp.net/contact'
    }
    
    res.render('frontend/pages/contact', {menu: 'contact', ...meta_data});
}

exports.home=async(req,res)=>{
    let keys=['home_meta_title','home_meta_keyword','home_meta_content']

    let data={
        title: 'Flix IPTV - Premium IPTV Streaming Platform',
        keyword: 'IPTV streaming, Flix IPTV, premium streaming, IPTV player, streaming platform, IPTV service, digital streaming, live TV streaming, IPTV solution, media streaming platform, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, smart iptv, iptv smarters, perfect player, tivimate, gse smart iptv, kodi iptv, vlc iptv, mx player iptv, iptv extreme, duplex iptv, ottplayer, lazy iptv, iptv pro, ss iptv, iptv ultimate, xciptv, implayer, televizo, free iptv, iptv channels, iptv playlist, m3u8 streaming, tv streaming, online tv, internet tv, cord cutting, streaming apps, firestick iptv, android tv iptv, roku iptv, smart tv streaming, iptv server, iptv provider, iptv subscription, iptv box',
        description: 'Flix IPTV - Professional IPTV streaming platform offering premium streaming experience with 7-day free trial. Multi-device support for Android, iOS, Smart TV, and Windows.',
        pageType: 'service',
        canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/home` : 'https://flixapp.net/home'
    }

    // Override with settings if available
    keys.map(key => {
        if(settings[key]) {
            let settingKey = key.replace('home_', '');
            data[settingKey.replace('_', '')] = settings[key];
        }
    })

    let meta_data = {
        title: data.title, 
        keyword: data.keyword, 
        description: data.description,
        pageType: data.pageType,
        canonicalUrl: data.canonicalUrl
    }

    let mylist_content=await MyListContent.findOne();

    res.render('frontend/pages/home', {menu: 'home',...meta_data,mylist_content:mylist_content});
}

exports.mylist=async(req,res)=>{
    let keys=['mylist_meta_title','mylist_meta_keyword','mylist_meta_content']
    let data={}
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    let title = data.mylist_meta_title;
    let keyword = data.mylist_meta_keyword;
    let description = data.mylist_meta_content;
    let meta_data = {
        title: title, keyword: keyword, description: description
    }

    let mylist_content=await MyListContent.findOne();

    let host_name = req.hostname;

    res.render('frontend/pages/mylist', {menu: 'mylist',...meta_data,mylist_content:mylist_content, host_name});
}

exports.savePlaylists=async(req,res)=>{
    let {
        urls,
        mac_address
    }=req.body;

    try {
        mac_address = mac_address.toLowerCase();
        let device = await Device.findOne({mac_address:mac_address});

        if(!device) {
            req.flash('error','Sorry, Device Not Found');
            return res.redirect('/mylist');
        }

        // If device is locked then don't allow to add playlists
        if(device.lock==1){
            req.flash('error','Sorry, your device is locked now. <br> Please contact support to unlock your device');
            return res.redirect('/mylist');
        }

        // If device trial period is expired then don't allow to add playlists
        if(device.is_trial==1 && device.expire_date<moment().format('YYYY-MM-DD')){
            req.flash('error','Sorry, your device trial period is expired. Please activate your device to continue.');
            return res.redirect('/mylist');
        }

        let device_id = device._id;

        // Validate URLs before saving
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        const validUrls = [];
        const invalidUrls = [];

        urls.forEach(url => {
            const trimmedUrl = url.trim();
            if (trimmedUrl && urlRegex.test(trimmedUrl)) {
                validUrls.push(trimmedUrl);
            } else if (trimmedUrl) {
                invalidUrls.push(trimmedUrl);
            }
        });

        // If there are invalid URLs, show error and don't save
        if (invalidUrls.length > 0) {
            req.flash('error', `Invalid playlist URL format detected: ${invalidUrls.join(', ')}<br>Please enter valid playlist URLs starting with http:// or https:// (e.g., https://example.com/playlist.m3u)`);
            return res.redirect('/mylist');
        }

        // If no valid URLs provided
        if (validUrls.length === 0) {
            req.flash('error', 'No valid URLs provided. Please enter at least one valid playlist URL.');
            return res.redirect('/mylist');
        }

        // Save playlists for both trial and activated devices
        await PlayList.deleteMany({device_id:device_id});
        let records = [];
        validUrls.map(item=>{
            records.push({
                device_id:device_id,
                url:item,
                created_time:moment().format('Y-MM-DD')
            })
        });

        await PlayList.insertMany(records);

        // Check device activation status after saving playlists
        if(device.is_trial == 1) {
            // Device is in trial mode - show success with trial message
            req.flash('success','The MAC address (' + mac_address + ') is currently in trial mode. You can activate it before the trial period ends on ' + device.expire_date + '. Your playlist has been uploaded successfully.');
            return res.redirect('/activation');
        } else if(device.is_trial == 0) {
            // Device is not activated - redirect to activation
            req.flash('error','Your app is not activated. You can activate it now.');
            return res.redirect('/activation');
        } else {
            // Activated device (is_trial == 2)
            req.flash('success','Playlists uploaded successfully');
            return res.redirect('/mylist');
        }

    } catch(error) {
        console.log('Save playlist error:', error);
        req.flash('error','Sorry, something went wrong while saving playlists. Please try later.');
        return res.redirect('/mylist');
    }
}
exports.deletePlayList=(req,res)=>{
    let {delete_mac_address}=req.body;
    let mac_address=delete_mac_address.toLowerCase();
    Device.findOne({mac_address:mac_address}).then(
        device=>{
            if(!device){
                req.flash('error','Sorry. Device does not exist');
                return res.redirect('/mylist');
            }
            PlayList.deleteMany({device_id:device._id}).then(()=>{
                req.flash('success','Your playlists removed successfully');
                return res.redirect('/mylist');
            })
        }
    )
}
exports.updatePinCode=async (req,res)=>{
    let {mac_address,pin_code}=req.body;
    try {
        mac_address=mac_address.toLowerCase();
        let device=await Device.findOne({mac_address:mac_address})
        if(!device){
            req.flash('error','Sorry, device does not exist');
            return res.redirect('/mylist');
        }
        if(device.lock==1){
            req.flash('error','Sorry, your device is locked now. <br> Please unlock your device in app settings');
            return res.redirect('/mylist');
        }

        // Check device activation status
        if(device.is_trial==1){
            req.flash('success','This MAC address (' + mac_address + ') is in trial mode. You can activate it now before the trial ends on ' + device.expire_date + '.');
            return res.redirect('/activation');
        } else if(device.is_trial==0){
            req.flash('error','Your app is not activated. You can activate it now.');
            return res.redirect('/activation');
        }

        device.parent_pin=pin_code || '0000';
        await device.save();
        req.flash('success','Parent pin code updated successfully');
        return res.redirect('/mylist');
    } catch(error) {
        req.flash('error','Sorry, something went wrong. Please try again.');
        return res.redirect('/mylist');
    }
}

exports.showYoutubeList=async(req,res)=>{
    let keys=['youtubelist_meta_title','youtubelist_meta_keyword','youtubelist_meta_content']
    let data={
        youtubelist_meta_title: 'YouTube Playlist Upload - Flix IPTV',
        youtubelist_meta_keyword: 'YouTube playlist, streaming service, YouTube streaming, playlist upload, YouTube integration, video streaming, YouTube channels, streaming playlists, media player, streaming app, media streaming, streaming platform, video player, streaming video, online video player, ibo player, ibo iptv, net iptv, set iptv, smart iptv player, iptv player, m3u player, smart iptv, iptv smarters, perfect player, kodi iptv, vlc iptv, mx player iptv, iptv extreme, duplex iptv, ottplayer, lazy iptv',
        youtubelist_meta_content: 'Upload your YouTube playlists to Flix IPTV streaming service. Integrate YouTube content with your IPTV experience and enjoy seamless streaming across devices.'
    }
    
    keys.map(key => {
        if(settings[key]) {
            data[key] = settings[key];
        }
    })
    
    let title = data.youtubelist_meta_title || 'YouTube Playlist Upload - Flix IPTV';
    let keyword = data.youtubelist_meta_keyword || 'YouTube playlist, IPTV YouTube, YouTube streaming';
    let description = data.youtubelist_meta_content || 'Upload your YouTube playlists to Flix IPTV streaming service.';
    
    let meta_data = {
        title: title, 
        keyword: keyword, 
        description: description,
        pageType: 'youtube-service',
        canonicalUrl: process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/youtube-list` : 'https://flixapp.net/youtube-list'
    }
    
    let mylist_content=await YoutubeListContent.findOne();
    res.render('frontend/pages/youtube_list', {menu: 'youtube-list',...meta_data,mylist_content:mylist_content});
}
exports.saveYoutubeLists=(req,res)=>{
    let {
        names,
        playlist_ids,
        mac_address
    }=req.body;
    mac_address=mac_address.toLowerCase();
    Device.findOne({mac_address:mac_address}).then(device=>{
        if(!device) {
            req.flash('error','Sorry, Device Not Found');
            return res.redirect('/mylist');
        }
        let device_id=device._id;
        YoutubeList.deleteMany({device_id:device_id}).then(()=>{
            let insert_records=[];
            playlist_ids.map((item,index)=>{
                insert_records.push({
                    device_id:device_id,
                    playlist_id:playlist_ids[index],
                    playlist_name:names[index]
                })
            })
            YoutubeList.insertMany(insert_records).then(()=>{
                req.flash('success','Your youtube playlists saved successfully');
                return res.redirect('/youtube-list');
            })
        })
    })
}


exports.checkMacValid=(req,res)=>{
    let mac_address=req.body.mac_address;
    mac_address=mac_address.toLowerCase();
    Device.findOne({mac_address:mac_address}).then(
        data=>{
            // console.log(data);
            if(data==null){
                res.json({status:'error',msg:'Sorry, mac address does not exist'})
            }else{
                if(data.is_trial==2){ // if it is already registered
                    res.json({status:'error',msg:'Sorry, your device is already activated'});
                }else{
                    res.json({status:'success'});
                }
            }
        }
    )
}
exports.createPaypalOrder=(req,res)=>{
    let {mac_address}=req.body;
    mac_address=mac_address.toLowerCase();
    let keys=['paypal_client_id','paypal_secret','paypal_mode','price'];
    let data={};
    keys.map(key=>{
        data[key]=settings[key] ? settings[key] : '';
    })
    let paypal_url=data.paypal_mode=="sandbox" ? "https://api.sandbox.paypal.com" : "https://api.paypal.com";
    paypal_url+='/v2/checkout/orders';
    let authorization=data.paypal_client_id+":"+data.paypal_secret;
    let buff = Buffer.from(authorization);
    authorization = buff.toString('base64');
    authorization="Basic "+authorization;
    let price=data.price ? data.price : 7.49;
    let description=`FLIX APP Activation, Price=${price}, Mac Address=${mac_address}`
    axios(
        {
            method:'post',
            url:paypal_url,
            data:{
                intent:"CAPTURE",
                purchase_units:[
                    {
                        amount:{
                            currency_code:"EUR",
                            value:price
                        },
                        description:description
                    }
                ]
            },
            headers:{
                "Content-Type":'application/json',
                "Authorization":authorization,
                "Prefer":"return=representation"
            }
        }
    ).then(
        res1=>{
            return res.json(res1.data);
        },
        err1=>{
            res.json({status:'error',error:err1});
        }
    )
}
exports.capturePaypalOrder=(req,res)=>{
    let {mac_address, email}=req.body;
    mac_address=mac_address.toLowerCase();
    let order_id=req.params.order_id;
    let keys=['paypal_client_id','paypal_secret','paypal_mode','price'];
    let data_keys={}
    keys.map(key=>{
        data_keys[key]=settings[key] ? settings[key] : '';
    })
    let paypal_url=data_keys.paypal_mode=="sandbox" ? "https://api.sandbox.paypal.com" : "https://api.paypal.com";
    paypal_url+='/v2/checkout/orders/'+order_id+'/capture';
    let authorization=data_keys.paypal_client_id+":"+data_keys.paypal_secret;
    let buff = Buffer.from(authorization);
    authorization = buff.toString('base64');
    authorization="Basic "+authorization;
    let price=data_keys.price ? data_keys.price : 7.49;
    axios(
        {
            method:'post',
            url:paypal_url,
            headers:{
                "Content-Type":'application/json',
                "Authorization":authorization,
                "Prefer":"return=representation"
            }
        }
    ).then(
        res1=>{
            // console.log('paypal order capture api response',res1.data);
            if(res1.data.status!=='COMPLETED')
                return res.json({
                    status:'error',
                    msg:"Sorry, payment not completed"
                })
            let today=moment();
            let expire_date=today.add(5000,'M').format('Y-MM-DD');
            let update_data={
                expire_date:expire_date,
                is_trial:2
            }
            Device.findOne({mac_address:mac_address}).then(res2=>{
                let device_id=res2._id;
                Device.updateOne({mac_address:mac_address},update_data).then(()=>{
                    Transaction.create(
                        {
                            device_id:device_id,
                            amount:price,
                            pay_time:moment().utc().format('Y-MM-DD HH:mm'),
                            status:'success',
                            payment_type:'paypal',
                            payment_id:order_id,
                            ip:getClientIPAddress(req),
                            user_agent:getUserAgent(req.useragent),
                            mac_address:mac_address,
                            app_type:res2.app_type,
                            email:email
                        }
                    ).then(async transaction=>
                        {
                            let transaction_time=moment().utc().format('MMMM DD, YYYY hh:mm A');
                            let json_body={
                                mac_address:mac_address,
                                transaction_id:transaction._id,
                                email:email,
                                price:price,
                                transaction_time:transaction_time,
                                expire_date:expire_date,
                                payment_type:'paypal'
                            }
                            try {
                                await sendEmail(json_body);
                            }catch (e) {
                                console.log("paypal send receipt email issue", e);
                            }
                            return res.json(res1.data);
                        }
                    )
                })
            })
        },
        err1=>{
            console.log('paypal order capture api error', err1);
        }
    )
}
exports.saveActivation=async (req,res)=>{
    let input=req.body;
    let {mac_address,payment_type,email, coin_type}=input;
    if(typeof payment_type=='object')
        payment_type=payment_type[0];
    mac_address=mac_address.toLowerCase();
    let promises=[];
    let price=settings.price;
    promises.push(new Promise((resolve, reject)=>{
        Device.findOne({mac_address:mac_address}).then(data=>{
            resolve(data);
        })
    }))
    let host_name=req.headers.host;
    Promise.all(promises).then(values=>{
        if (values.length === 0) {
            req.flash('error', 'Failed to find your device. Make sure you entered the exact mac address.')

            return res.redirect('/activation');
        }

        let device=values[0];
        let transaction=new Transaction({
            device_id:device._id,
            amount:price,
            pay_time:moment().utc().format('Y-MM-DD HH:mm:ss'),
            status:'pending',
            email:email,
            payment_type:payment_type,
            mac_address:mac_address,
            app_type:device.app_type
        })
        transaction.save().then(
            async (transaction_record)=>{
                switch (payment_type) {
                    case "crypto":
                        transaction_record.coin_type=coin_type;
                        transaction_record.save();
                        let crypto_public_key=settings.crypto_public_key;
                        let crypto_private_key=settings.crypto_private_key;
                        let CoinpaymentsCredentials= {
                            key: crypto_public_key,
                            secret: crypto_private_key
                        }
                        const client = new Coinpayments( CoinpaymentsCredentials);
                        let success_url="https://"+host_name+"/activation/crypto/redirect?transaction_id="+transaction_record._id;
                        let cancel_url="https://"+host_name+"/activation/crypto/cancel?transaction_id="+transaction_record._id;
                        let CoinpaymentsCreateTransactionOpts={
                            currency1: 'EUR',
                            currency2: coin_type,
                            amount: parseFloat(price),
                            buyer_email: email,
                            item_name:'FLIX APP Activation, Mac Address:'+mac_address,
                            success_url: success_url,
                            cancel_url: cancel_url,
                            ipn_url:"https://"+host_name+'/api/crypto-ipn-url/'+transaction_record._id
                        }
                        client.createTransaction(CoinpaymentsCreateTransactionOpts).then(crypto_result=>{
                            transaction.payment_id=crypto_result['txn_id'];
                            transaction.status_url=crypto_result['status_url'];
                            transaction.save().then(()=>{
                                return res.redirect(crypto_result.checkout_url);
                            });
                        })

                        break;
                    case 'stripe':
                        let stripe_secret_key=settings.stripe_secret_key;
                        let stripe1=stripe(stripe_secret_key, {
                            apiVersion: '2020-08-27',
                        });
                        
                        // Check if this is Apple Pay/Google Pay (payment_method_id provided)
                        if(input.payment_method_id) {
                            // Handle Apple Pay/Google Pay
                            try {
                                const paymentIntent = await stripe1.paymentIntents.create({
                                    amount: price * 100, // Convert to cents
                                    currency: 'eur',
                                    payment_method: input.payment_method_id,
                                    confirm: true,
                                    description: `FLIX APP Activation, mac_address:${mac_address}`,
                                    metadata: {
                                        mac_address: mac_address,
                                        email: email,
                                        transaction_id: transaction._id.toString()
                                    }
                                });

                                if (paymentIntent.status === 'succeeded') {
                                    // Payment successful - activate device
                                    let expire_date = moment().add(5000, 'M').format('Y-MM-DD');
                                    
                                    await Device.findByIdAndUpdate(device._id, {
                                        expire_date: expire_date,
                                        is_trial: 2,
                                    });

                                    transaction.status = 'success';
                                    transaction.payment_id = paymentIntent.id;
                                    transaction.ip = getClientIPAddress(req);
                                    transaction.user_agent = getUserAgent(req.useragent);
                                    await transaction.save();

                                    // Send confirmation email
                                    let transaction_time = moment().utc().format('MMMM DD, YYYY hh:mm A');
                                    let json_body = {
                                        mac_address: mac_address,
                                        transaction_id: transaction._id,
                                        email: email,
                                        price: price,
                                        transaction_time: transaction_time,
                                        expire_date: expire_date,
                                        payment_type: 'stripe'
                                    };
                                    
                                    try {
                                        await sendEmail(json_body);
                                    } catch (e) {
                                        console.log("Apple Pay send receipt email issue", e);
                                    }

                                    return res.json({
                                        status: 'success',
                                        message: 'Payment successful! Your device is now activated.'
                                    });
                                } else {
                                    return res.json({
                                        status: 'error',
                                        message: 'Payment failed. Please try again.'
                                    });
                                }
                            } catch (error) {
                                console.log("Apple Pay/Google Pay error:", error);
                                return res.json({
                                    status: 'error',
                                    message: 'Payment failed. Please try again.'
                                });
                            }
                        } else {
                            // Regular Stripe checkout session
                            stripe1.checkout.sessions.create({
                                success_url: 'https://'+host_name+'/stripe/success?transaction_id='+transaction._id+'&session_id={CHECKOUT_SESSION_ID}',
                                cancel_url: 'https://'+host_name+'/stripe/cancel?transaction_id='+transaction._id,
                                payment_method_types: ['card'],
                                line_items: [
                                    {
                                        name:'FLIX APP Activation, mac_address:'+mac_address,
                                        quantity:1,
                                        amount:price*100,
                                        currency:'EUR'
                                    }
                                ],
                            }).then(
                                response=>{
                                    return res.json({
                                        status:'success',
                                        session_id:response.id
                                    })
                                },
                                error=>{
                                    console.log("stripe error", error);
                                    return res.json({
                                        status:'error'
                                    })
                                }
                            );
                        }
                        break;
                }
            }
        )
    })
}
exports.cryptoPaymentRedirect=(req,res)=>{
    console.log("here crypto payment redirect");
    console.log("params=",req.params);
    console.log("body=",req.body);
    req.flash('success','Thanks for your payment<br>Your account will be activated once confirmed payment, it will take some time to verify payment.')
    return res.redirect('/activation');
}
exports.cryptoPaymentCancel=(req,res)=>{
    let transaction_id=req.query.transaction_id;
    Transaction.findById(transaction_id).then(transaction=>{
        transaction.status='canceled';
        transaction.save().then(()=>{
            req.flash('error','You canceled your payment');
            return res.redirect('/activation');
        })
    })
}
exports.paymentStatus=(req,res)=>{
    req.flash('success','Thanks for your payment<br>Your account will be activated once confirmed payment')
    return res.redirect('/activation');
}

exports.stripeSuccess=async(req,res)=>{
    let session_id=req.query.session_id;
    if(session_id){
        let stripe_secret_key=settings.stripe_secret_key;
        let stripe1 =stripe(stripe_secret_key, {
            apiVersion: '2020-08-27',
        });
        const session = await stripe1.checkout.sessions.retrieve(session_id);
        if(session.status==='complete') {
            let transaction_id = req.query.transaction_id;
            Transaction.findById(transaction_id).then(async transaction => {
                let device_id = transaction.device_id;
                let expire_date = moment().add(5000, 'M').format('Y-MM-DD');
                let promises = [];
                promises.push(new Promise((resolve, reject) => {
                    Device.findByIdAndUpdate(device_id, {
                        expire_date: expire_date,
                        is_trial: 2,
                    })
                    .then(() => resolve())
                }))
                promises.push(new Promise((resolve, reject) => {
                    transaction.status = 'success';
                    transaction.payment_id = session.payment_intent; // Store Stripe payment intent ID
                    transaction.ip = getClientIPAddress(req);
                    transaction.user_agent = getUserAgent(req.useragent);
                    transaction.save()
                        .then(() => resolve());
                }))
                Promise.all(promises).then(async () => {
                    let transaction_time=moment().utc().format('MMMM DD, YYYY hh:mm A');
                    let json_body={
                        mac_address:transaction.mac_address,
                        transaction_id:transaction._id,
                        email:transaction.email,
                        price:transaction.amount,
                        transaction_time:transaction_time,
                        expire_date: expire_date,
                        payment_type:'stripe'
                    }
                    try {
                        await sendEmail(json_body);
                    }catch (e) {
                        console.log("paypal send receipt email issue", e);
                    }
                    req.flash('success', 'Thanks for your payment<br>Your account is activated now.')
                    return res.redirect('/activation');
                })
            })
        }
        else {
            req.flash('error',"Sorry, you did not finish payment");
            return res.redirect('/activation');
        }
    }
}
exports.showTermsAndConditions=(req,res)=>{
    let promises=[];
    let keys=['terms_meta_title','terms_meta_keyword'];
    let data={};
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    promises.push(new Promise((resolve, reject)=>{
        TermsContent.find().then((contents)=>{
            resolve(contents);
        })
    }))
    Promise.all(promises).then(data=>{
        let title=data.terms_meta_title;
        let keyword=data.terms_meta_content;
        let contents=data[0];
        res.render('frontend/pages/terms',
            {menu:'terms',title:title, keyword:keyword,contents:contents}
        );
    });
}
exports.showPrivacyAndPolicy=(req,res)=>{
    let promises=[];
    let keys=['privacy_meta_title','privacy_meta_keyword'];
    let data={};
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    promises.push(new Promise((resolve, reject)=>{
        PrivacyContent.find().then((contents)=>{
            resolve(contents);
        })
    }))
    Promise.all(promises).then(data=>{
        let title=data.privacy_meta_title;
        let keyword=data.privacy_meta_keyword;
        let contents=data[0];
        res.render('frontend/pages/privacy',
            {menu:'terms',title:title, keyword:keyword, contents:contents}
        );
    });
}