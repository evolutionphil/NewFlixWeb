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

exports.news=(req,res)=>{
    let keys=['news_meta_title','news_meta_keyword','news_meta_content']
    let data={}
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    News.find()
.sort({_id:-1})
        .exec()
        .then(news=>{
        let title=data.news_meta_title;
        let keyword=data.news_meta_keyword;
        let description=data.news_meta_content;

        res.render('frontend/pages/news/index',
            {
                menu: 'news',
                title: title,
                keyword: keyword,
                description: description,
                news: news.map(item=>({_id: item._id, title: item.title, content: convert(item.content).substring(0, 80)})),
            }
        );
    })
}

exports.showNewsDetail = (req, res) => {
    News.findOne({_id: req.params.id})
        .exec()
        .then(news => {
            let title = news.title;
            let description = news.content;

            res.render('frontend/pages/news/show',
                {
                    menu: 'news/show',
                    title: title,
                    description: description,
                    news: news
                }
            );
        })
}

exports.faq=(req,res)=>{
    let keys=['faq_meta_title','faq_meta_keyword','faq_meta_content']
    let data={}
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    Faq.find().then(faqs=>{
        let title=data.faq_meta_title;
        let keyword=data.faq_meta_keyword;
        let description=data.faq_meta_content;
        res.render('frontend/pages/faq',
            {menu:'faq',title:title, keyword:keyword,description:description,faqs:faqs}
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

    let title = data.instruction_meta_title;
    let keyword = data.instruction_meta_keyword;
    let description = data.instruction_meta_content;

    let meta_data = {
        title: title, keyword: keyword, description: description
    }

    res.render('frontend/pages/instructions/show', {menu: 'instruction', instruction: instruction, ...meta_data});
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

exports.contact=(req,res)=>{
    res.render('frontend/pages/contact', {menu: 'contact'});
}

exports.home=async(req,res)=>{
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
    let data={}
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    let title = data.youtubelist_meta_title;
    let keyword = data.youtubelist_meta_keyword;
    let description = data.youtubelist_meta_content;
    let meta_data = {
        title: title, keyword: keyword, description: description
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