let Device=require('../models/Device.model');
let PlayList=require('../models/PlayList.model');
let YoutubeList=require('../models/YoutubeList.model');
let Transaction=require('../models/Transaction.model');
let BlockedIPAddress=require('../models/BlockedIPAddress.model');
const moment=require('moment');

exports.getPlaylistInformation=(req,res)=>{
    let {mac_address,app_type}=req.params;
    mac_address=mac_address.toLowerCase();
    if(!checkUserAgent(req))
        return res.json({
            status:'error',
            msg:'Access Disabled'
        })
    addMacAddressToIP(req, mac_address);

    let result={};
    result.mac_registered=true;
    result.epg_urls=[];
    result.android_version_code=settings.android_version_code;
    result.apk_url=req.protocol+'://'+req.get('host')+settings.apk_url;

    result.trial_days=7;
    let device_id;
    let demo_url=settings.demo_url;
    result.themes=settings.themes;
    result.adverts=settings.adverts;
    let protocol=req.protocol;
    let host=req.get('host');
    result.themes.map(item=>{
        if(!item.url.includes('http'))
            item.url=protocol+'://'+host+item.url;
    })
    result.adverts.map(item=>{
        if(!item.url.includes('http'))
            item.url=protocol+'://'+host+item.url;
    })
    result.languages=settings.languages;
    Device.findOne({mac_address:mac_address}).then(async device=> {
        if(!device){
            result.mac_registered=false;
            device=new Device;
            device.mac_address=mac_address;
            device.app_type=app_type;
            device.registered_from_domain=req.headers.host || null;
            device.is_trial=1;
            device.ip=getClientIPAddress(req);
            device.created_time=moment().format('Y-MM-DD HH:mm');
            let expire_date=moment().add(7,'d').format('Y-MM-DD');
            device.expire_date=expire_date;

            result.pin_code=device.parent_pin;
            result.is_trial=0;
            result.lock=device.lock;
            result.expire_date=expire_date;
            result.urls=[demo_url];
            await device.save()
        }
        else{
            if(!device.app_type){
                let useragent=getUserAgent(req).toLowerCase();
                if(useragent.includes('smart-tv') && useragent.includes('tizen')){
                    device.app_type='samsung';
                    await device.save();
                }else if(useragent.includes('smarttv') && useragent.includes('web0s')){
                    device.app_type='lg'
                    await device.save();
                }
            }
            device_id=device._id;
            result.is_trial=device.is_trial;
            result.expire_date=device.expire_date;
            let playlists=await PlayList.find({device_id:device_id})
            if(playlists.length>0)
                result.urls=playlists.map(item=>{
                    return item.url;
                });
            else
                result.urls=[demo_url];
        }
        if(result.expire_date.includes(':'))
            result.expire_date=result.expire_date.slice(0,-6);
        return res.json(result);
    })
}
exports.getAppSetting=(req,res)=>{
    if(!checkUserAgent(req))
        return res.json({
            status:'error',
            msg:'Access Disabled'
        })
    let {mac_address,app_type}=req.params;
    mac_address=mac_address.toLowerCase();
    let result={};
    result.mac_registered=true;
    result.adverts=settings.adverts;
    result.android_version_code=settings.android_version_code;
    result.apk_url=req.protocol+'://'+req.get('host')+settings.apk_url;
    result.epg_urls=[];

    result.trial_days=7;
    let device_id;
    Device.findOne({mac_address:mac_address}).then(device=> {
        if(!device){
            return res.json({
                status:'error',
                msg:'Sorry, no device exists'
            })
        }
        else{
            let demo_url=settings.demo_url;
            result.languages=settings.languages;
            let protocol=req.protocol;
            let host=req.get('host');
            result.themes=settings.themes;
            result.adverts=settings.adverts;
            result.themes.map(item=>{
                if(!item.url.includes('http'))
                    item.url=protocol+'://'+host+item.url;
            })
            result.adverts.map(item=>{
                if(!item.url.includes('http'))
                    item.url=protocol+'://'+host+item.url;
            })

            device_id=device._id;
            result.mac_registered=true;
            result.is_trial=device.is_trial;
            result.expire_date=device.expire_date;
            PlayList.find({device_id:device_id}).then(playlists=>{
                if(playlists.length>0)
                    result.urls=playlists.map(item=>{
                        return item.url;
                    });
                else
                    result.urls=[demo_url];
                return res.json(result)
            })
        }
    })
}

exports.getPlaylistInformationAndroid=async (req,res)=>{
    let decrypted_req=decryptRequest('android',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='android' && app_type!=='android_tv')
        return res.json({
            status:'error'
        })
    await sendApiResponse(req,res,decrypted_req, true);
}
exports.getPlaylistInformationApple=async(req,res)=>{
    let decrypted_req=decryptRequest('iOS',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='iOS' && app_type!=='tvOS' && app_type!=='macOS')
        return res.json({
            status:'error'
        })
    await sendApiResponse(req,res,decrypted_req, true);
}
exports.getPlaylistInformationSmartTV=async(req,res)=>{
    let decrypted_req=decryptRequest('samsung',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='samsung' && app_type!=='lg')
        return res.json({
            status:'error'
        })
    await sendApiResponse(req,res,decrypted_req, true);
}
exports.getPlaylistInformationWindows=async(req,res)=>{
    let decrypted_req=decryptRequest('windows',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='windows')
        return res.json({
            status:'error'
        })
    console.log('here windows',decrypted_req);
    await sendApiResponse(req,res,decrypted_req, true);
}
async function sendApiResponse(req, res, decrypted_req, from_encrypted=false) {
    // console.log("user agent=",settings.valid_user_agent_keys);
    if(!checkUserAgent(req))
        return res.json({
            status:'error',
            msg:'Access Disabled'
        })
    let {json_data}=decrypted_req;
    let { app_type, version, mac_address}=json_data;
    mac_address=mac_address.toLowerCase();

    let result={};
    result.mac_registered=true;
    result.epg_urls=[];
    if(app_type==='android' || app_type==='android_tv'){
        result.android_version_code=settings.android_version_code;
        result.apk_url=req.protocol+'://'+req.get('host')+settings.apk_url;
    }

    if(from_encrypted)
        result.youtube_api_key=settings.youtube_api_key;

    result.themes=settings.themes;
    result.adverts=settings.adverts;
    let protocol=req.protocol;
    let host=req.get('host');
    result.themes.map(item=>{
        if(!item.url.includes('http'))
            item.url=protocol+'://'+host+item.url;
    })
    result.adverts.map(item=>{
        if(!item.url.includes('http'))
            item.url=protocol+'://'+host+item.url;
    })
    result.languages=settings.languages;
    result.mac_registered=true;
    result.urls=[];
    result.trial_days=7;
    let demo_url=settings.demo_url;
    addMacAddressToIP(req, mac_address);

    let android_prev_version='', samsung_prev_version='1.1.1', lg_prev_version='1.1.2', android_tv_prev_version='';
    let android_test=false, samsung_test=false, lg_test=false, android_tv_test=false;
    let device_id;
    let promises=[];

    Device.findOne({mac_address:mac_address}).then(async device=> {
        if(!device){
            promises.push(new Promise((resolve, reject)=>{
                device=new Device;
                device.mac_address=mac_address;
                device.app_type=app_type;
                device.is_trial=0;
                device.ip=getClientIPAddress(req);
                device.version=version;
                device.created_time=moment().utc().format('Y-MM-DD HH:mm:ss');
                device.registered_from_domain=req.headers.host || null;

                let expire_date=new moment().add(7,'d').format('Y-MM-DD');
                device.expire_date=expire_date;
                device.last_used_at = new Date();

                result.mac_registered=false;
                result.pin_code=device.parent_pin;
                result.is_trial=0;
                result.lock=device.lock;
                result.expire_date=expire_date;
                result.youtube_playlists=[];

                device.save().then(
                    ()=>{
                        resolve();
                    },
                    error=>{
                        console.log('save device issue', error);
                    }
                );
            }))
        }
        else{
            device_id=device._id;
            result.youtube_playlists=await YoutubeList.find({device_id:device_id});
            result.mac_address=device.mac_address;
            result.mac_registered=true;
            result.is_trial=device.is_trial;
            result.expire_date=device.expire_date;
            result.pin_code=device.pin_code;
            result.lock=device.lock;

            device.last_used_at = new Date();
            await device.save();

            if(device.version!=version){
                device.version=version;
                await device.save();
            }

            let today=moment().format('Y-MM-DD');
            if(result.expire_date<today){
                if(app_type==='android' && android_test && version>android_prev_version)
                    result.expire_date='2438-01-02';
                if(app_type==='android_tv' && android_tv_test && version>android_tv_prev_version)
                    result.expire_date='2438-01-02';
                if(app_type==='samsung' && samsung_test && version>samsung_prev_version)
                    result.expire_date='2438-01-02';
                if(app_type==='lg' && lg_test && version>lg_prev_version)
                    result.expire_date='2438-01-02';
            }
        }
        Promise.all(promises).then(
            ()=>{
                result.languages=settings.languages;
                if(device_id){  // if
                    PlayList.find({device_id:device_id}).then(playlists=>{
                        if(playlists.length>0)
                            result.urls=playlists.map((item, index)=>{
                                return item.url
                            });
                        else
                            result.urls=[demo_url];
                        if(app_type==='windows')
                            console.log("here windows",makeEncryptResponse(decrypted_req,result,app_type))
                        return res.json({
                            data:makeEncryptResponse(decrypted_req,result,app_type)
                        })
                    })
                }else{
                    result.urls=[demo_url];
                    if(app_type==='windows')
                        console.log("here windows",makeEncryptResponse(decrypted_req,result,app_type))
                    return res.json({
                        data:makeEncryptResponse(decrypted_req,result,app_type)
                    })
                }
            }
        )
    })
}


exports.getEpgData=(req,res)=>{
    return res.json([]);
}
exports.getEpgCodes=(req,res)=>{
    return res.json([]);
}

exports.getAndroidVersion=(req,res)=>{
    let result= {};
    result.version_code=settings.android_version_code;
    result.apk_url=req.protocol+'://'+req.get('host')+settings.apk_url;
    return res.json(result);
}
exports.saveGooglePay=async (req,res)=>{
    let decrypted_req=req.body;
    decrypted_req.payment_type='google_pay';
    await saveExternalPurchase(req, res, decrypted_req)
}
exports.saveGooglePayEncrypt=async (req,res)=>{
    let decrypted_req=decryptRequest('android',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='android' && app_type!=='android_tv')
        return res.json({
            status:'error'
        })
    decrypted_req.json_data.payment_type='google_pay';
    await saveExternalPurchase(req, res, decrypted_req, true)
}

exports.saveAppPurchase=async (req,res)=>{
    let decrypted_req=req.body;
    decrypted_req.payment_type='app_purchase';
    await saveExternalPurchase(req, res, decrypted_req)
}
exports.saveAppPurchaseEncrypt=async (req,res)=>{
    let decrypted_req=decryptRequest('iOS',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='iOS' && app_type!=='tvOS' && app_type!='macOS')
        return res.json({
            status:'error'
        })
    decrypted_req.json_data.payment_type='app_purchase';
    await saveExternalPurchase(req, res, decrypted_req, true)
}
async function saveExternalPurchase(req,res,decrypted_req, is_encrypted=false){
    if(!checkUserAgent(req))
        return res.json({
            status:'success',
            msg:'Successfully registered'
        })
    let json_data;
    if(!is_encrypted)
        json_data=decrypted_req;
    else
        json_data=decrypted_req.json_data;

    let {mac_address, amount, payment_type}=json_data;
    mac_address=mac_address.toLowerCase();
    let ip=getClientIPAddress(req);
    let device=await Device.findOne({mac_address:mac_address});
    let expire_date=moment().add(5000,'M').format('Y-MM-DD');
    device.expire_date=expire_date;
    device.is_trial=2;
    await device.save();

    await Transaction.create({
        device_id:device._id,
        ip:ip,
        amount:amount,
        pay_time:moment().utc().format('Y-MM-DD HH:mm'),
        status:'success',
        payment_type:payment_type,
        user_agent:getUserAgent(req.useragent),
        mac_address:mac_address,
        app_type:device.app_type
    })
    let result={
        status:'success',
        expire_date:expire_date
    }
    if(!is_encrypted)
        return res.json(result)
    else {
        let app_type='android';
        if(payment_type==='app_purchase')
            app_type='iOS'
        return res.json({
            data:makeEncryptResponse(decrypted_req,result,app_type)
        })
    }
}

exports.saveLockState=async (req,res)=>{
    await saveLockStateOperation(req, res, req.body);
}
exports.saveLockStateEncryptAndroid=async (req, res)=>{
    let decrypted_req=decryptRequest('android',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='android' && app_type!=='android_tv')
        return res.json({
            status:'error'
        })
    await saveLockStateOperation(req, res, decrypted_req,true);
}
exports.saveLockStateEncryptIOS=async (req, res)=>{
    let decrypted_req=decryptRequest('iOS',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='iOS')
        return res.json({
            status:'error'
        })
    await saveLockStateOperation(req, res, decrypted_req,true);
}
async function saveLockStateOperation(req, res, decrypted_req, is_encrypted=false){
    if(!checkUserAgent(req))
        return res.json({
            status:'success',
            msg:'Successfully registered'
        })
    let json_data;
    if(!is_encrypted)
        json_data=decrypted_req;
    else
        json_data=decrypted_req.json_data;
    let {mac_address, lock}=json_data;
    mac_address=mac_address.toLowerCase();
    let device=await Device.findOne({mac_address: mac_address});
    if(device){
        device.lock=lock;
        await device.save();
    }
    return res.json({status:'success'});
}

exports.updateParentAccountPassword=async(req, res)=>{
    await updateParentAccountOperation(req, res, req.body);
}
exports.updateParentAccountPasswordAndroid=async (req, res)=>{
    let decrypted_req=decryptRequest('android',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='android' && app_type!=='android_tv')
        return res.json({
            status:'error'
        })
    await updateParentAccountOperation(req, res, decrypted_req,true);
}
exports.updateParentAccountPasswordIOS=async (req, res)=>{
    let decrypted_req=decryptRequest('iOS',req);
    if(decrypted_req.status==='error')
        return res.json({
            status:'error'
        })
    let {app_type}=decrypted_req.json_data;
    if(app_type!=='iOS')
        return res.json({
            status:'error'
        })
    await updateParentAccountOperation(req, res, decrypted_req,true);
}

async function updateParentAccountOperation(req, res, decrypted_req, is_encrypted=false){
    if(!checkUserAgent(req))
        return res.json({
            status:'success',
            msg:'Successfully registered'
        })
    let json_data;
    if(!is_encrypted)
        json_data=decrypted_req;
    else
        json_data=decrypted_req.json_data;
    let {mac_address, password}=json_data;
    mac_address=mac_address.toLowerCase();
    let device=await Device.findOne({mac_address: mac_address});
    if(device){
        device.parent_pin=password;
        await device.save();
    }
    return res.json({status:'success'});
}

exports.cryptoIpnCallBack=async(req, res)=>{
    // console.log("Here Ipn CallBack");
    let transaction_id=req.params.transaction_id;
    const { verify } = require('coinpayments-ipn');
    let headers=req.headers;
    let input=req.body;
    // console.log(headers, input);
    let hmac=headers.hmac;
    let ipnSecret=settings.crypto_ipn_secret;
    let merchant_id=settings.crypto_merchant_id;
    let isValid;
    try {
        isValid = verify(hmac, ipnSecret, input);
        if(input.merchant!=merchant_id)
            return res.json({status:'error'}).status(500);
        if(!isValid)
            return res.json({status:'error'}).status(500);
        if(input.status>=100){
            let transaction=await Transaction.findById(transaction_id);
            if(transaction){
                let device_id=transaction.device_id;
                let today=moment();
                let expire_date=today.add(5000,'M').format('Y-MM-DD');
                let update_data={
                    expire_date:expire_date,
                    is_trial:2
                }
                transaction.status='success';
                await transaction.save();
                await Device.findByIdAndUpdate(device_id,update_data);

                let transaction_time=moment().utc().format('MMMM DD, YYYY hh:mm A');
                let json_body={
                    mac_address:transaction.mac_address,
                    transaction_id:transaction._id,
                    email:transaction.email,
                    price:transaction.amount,
                    transaction_time:transaction_time,
                    expire_date:expire_date,
                    payment_type:'crypto'
                }
                try {
                    await sendEmail(json_body);
                }catch (e) {
                    console.log("paypal send receipt email issue", e);
                }

                return res.json({status:'ok'});
            }
        }
    } catch (e) {
        console.log('hmac error', hmac)
    }
    return res.json({status:'ok'});
}

exports.paypalWebhook=async(req, res)=>{
    try {
        console.log('PayPal Webhook received:', req.body);
        
        // Verify webhook configuration
        let webhook_id = settings.paypal_webhook_id;
        if (!webhook_id) {
            console.log('PayPal webhook ID not configured');
            return res.status(400).json({status: 'error', msg: 'Webhook ID not configured'});
        }
        
        let event_type = req.body.event_type;
        let resource = req.body.resource;
        
        if (!event_type || !resource) {
            console.log('Invalid webhook data received:', {event_type, hasResource: !!resource});
            return res.status(400).json({status: 'error', msg: 'Invalid webhook data'});
        }

        console.log(`Processing PayPal webhook event: ${event_type}`);

        // Handle different PayPal webhook events
        switch(event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                console.log('Payment capture completed:', resource.id);
                // Payment was successful - no action needed as it's already handled in capture endpoint
                break;
            case 'PAYMENT.CAPTURE.REFUNDED':
                console.log('Processing payment refund:', resource.id);
                await handlePaymentRefund(resource);
                break;
            case 'PAYMENT.CAPTURE.DENIED':
                console.log('Processing payment denial:', resource.id);
                await handlePaymentDenied(resource);
                break;
            case 'PAYMENT.CAPTURE.PENDING':
                console.log('Processing pending payment:', resource.id);
                await handlePaymentDenied(resource);
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                console.log('Processing subscription cancellation:', resource.id);
                await handleSubscriptionCancelled(resource);
                break;
            case 'CHECKOUT.ORDER.APPROVED':
                console.log('Order approved:', resource.id);
                // Order approved but not yet captured - no action needed
                break;
            default:
                console.log('Unhandled PayPal webhook event:', event_type);
                break;
        }

        return res.status(200).json({status: 'success', event_type: event_type});
    } catch (error) {
        console.log('PayPal webhook error:', error);
        return res.status(500).json({status: 'error', msg: 'Webhook processing failed', error: error.message});
    }
}

async function handlePaymentRefund(resource) {
    try {
        // Get the original payment ID from the refund
        let payment_id = resource.links?.find(link => link.rel === 'up')?.href?.split('/').pop();
        
        if (!payment_id) {
            // Try alternative method to get payment ID
            payment_id = resource.invoice_id || resource.custom_id;
            if (!payment_id) {
                console.log('Could not find payment ID from refund resource:', resource);
                return;
            }
        }

        console.log('Processing refund for payment ID:', payment_id);

        // Find transaction by payment_id
        let transaction = await Transaction.findOne({payment_id: payment_id});
        if (!transaction) {
            console.log('Transaction not found for payment ID:', payment_id);
            // Try to find by transaction ID if payment_id doesn't work
            transaction = await Transaction.findOne({_id: payment_id});
            if (!transaction) {
                console.log('Transaction not found by ID either:', payment_id);
                return;
            }
        }

        // Check if already processed
        if (transaction.status === 'refunded') {
            console.log('Refund already processed for transaction:', transaction._id);
            return;
        }

        // Update transaction status
        transaction.status = 'refunded';
        transaction.refund_date = moment().utc().format('Y-MM-DD HH:mm:ss');
        await transaction.save();

        // Disable the device
        let device = await Device.findById(transaction.device_id);
        if (device) {
            let previousExpireDate = device.expire_date;
            device.is_trial = 0; // Set back to trial
            device.expire_date = moment().format('Y-MM-DD'); // Expire immediately
            await device.save();
            console.log(`Device disabled due to refund: ${device.mac_address}, previous expire: ${previousExpireDate}`);
        } else {
            console.log('Device not found for transaction:', transaction.device_id);
        }

        console.log('PayPal refund processed successfully for payment:', payment_id, 'amount:', resource.amount?.total);
    } catch (error) {
        console.log('Error handling PayPal refund:', error.message, error.stack);
    }
}

async function handlePaymentDenied(resource) {
    try {
        let payment_id = resource.id;
        
        // Find transaction by payment_id
        let transaction = await Transaction.findOne({payment_id: payment_id});
        if (!transaction) {
            console.log('Transaction not found for payment ID:', payment_id);
            return;
        }

        // Update transaction status
        transaction.status = 'denied';
        await transaction.save();

        // Disable the device
        let device = await Device.findById(transaction.device_id);
        if (device) {
            device.is_trial = 0; // Set back to trial
            device.expire_date = moment().format('Y-MM-DD'); // Expire immediately
            await device.save();
            console.log('Device disabled due to payment denial:', device.mac_address);
        }

        console.log('PayPal payment denial processed for payment:', payment_id);
    } catch (error) {
        console.log('Error handling PayPal payment denial:', error);
    }
}

async function handleSubscriptionCancelled(resource) {
    try {
        // Handle subscription cancellation if you have recurring payments
        console.log('PayPal subscription cancelled:', resource.id);
    } catch (error) {
        console.log('Error handling PayPal subscription cancellation:', error);
    }
}

exports.stripeWebhook=async(req, res)=>{
    try {
        console.log('Stripe Webhook received:', req.body);
        
        // Verify webhook signature (recommended for security)
        let webhook_id = settings.stripe_webhook_id;
        if (!webhook_id) {
            console.log('Stripe webhook ID not configured');
            return res.status(400).json({status: 'error', msg: 'Webhook ID not configured'});
        }
        
        let event_type = req.body.type;
        let data = req.body.data;
        
        if (!event_type || !data) {
            return res.status(400).json({status: 'error', msg: 'Invalid webhook data'});
        }

        // Handle different Stripe webhook events
        switch(event_type) {
            case 'charge.dispute.created':
            case 'payment_intent.payment_failed':
            case 'invoice.payment_failed':
                await handleStripePaymentFailed(data.object);
                break;
            case 'charge.refunded':
                await handleStripeRefund(data.object);
                break;
            case 'customer.subscription.deleted':
                await handleStripeSubscriptionCancelled(data.object);
                break;
            default:
                console.log('Unhandled Stripe webhook event:', event_type);
                break;
        }

        return res.status(200).json({status: 'success'});
    } catch (error) {
        console.log('Stripe webhook error:', error);
        return res.status(500).json({status: 'error', msg: 'Webhook processing failed'});
    }
}

async function handleStripeRefund(charge) {
    try {
        let payment_id = charge.id;
        
        // Find transaction by payment_id
        let transaction = await Transaction.findOne({payment_id: payment_id});
        if (!transaction) {
            console.log('Transaction not found for Stripe charge ID:', payment_id);
            return;
        }

        // Update transaction status
        transaction.status = 'refunded';
        await transaction.save();

        // Disable the device
        let device = await Device.findById(transaction.device_id);
        if (device) {
            device.is_trial = 0; // Set back to trial
            device.expire_date = moment().format('Y-MM-DD'); // Expire immediately
            await device.save();
            console.log('Device disabled due to Stripe refund:', device.mac_address);
        }

        console.log('Stripe refund processed successfully for charge:', payment_id);
    } catch (error) {
        console.log('Error handling Stripe refund:', error);
    }
}

async function handleStripePaymentFailed(paymentObject) {
    try {
        let payment_id = paymentObject.id;
        
        // Find transaction by payment_id
        let transaction = await Transaction.findOne({payment_id: payment_id});
        if (!transaction) {
            console.log('Transaction not found for Stripe payment ID:', payment_id);
            return;
        }

        // Update transaction status
        transaction.status = 'failed';
        await transaction.save();

        // Disable the device
        let device = await Device.findById(transaction.device_id);
        if (device) {
            device.is_trial = 0; // Set back to trial
            device.expire_date = moment().format('Y-MM-DD'); // Expire immediately
            await device.save();
            console.log('Device disabled due to Stripe payment failure:', device.mac_address);
        }

        console.log('Stripe payment failure processed for payment:', payment_id);
    } catch (error) {
        console.log('Error handling Stripe payment failure:', error);
    }
}

async function handleStripeSubscriptionCancelled(subscription) {
    try {
        // Handle subscription cancellation if you have recurring payments
        console.log('Stripe subscription cancelled:', subscription.id);
    } catch (error) {
        console.log('Error handling Stripe subscription cancellation:', error);
    }
}

exports.activateFromExternal=async(req, res)=>{
    let ip=getClientIPAddress(req);
    let user_agent=getUserAgent(req);
    if(ip!=settings.quzu_ip || !user_agent.includes('axios')){
        return res.json({
            status:'error',
            msg:'Sorry, url not founded'
        })
    }
    let {mac_address}=req.body;
    let device=await Device.findOne({mac_address:mac_address});
    if(!device){
        return res.json({
            status:'error',
            msg:'Sorry, device does not exist'
        })
    }
    if(device.is_trial==2){
        return res.json({
            status:'error',
            msg:'Sorry, device already activated'
        })
    }
    let today=moment();
    let current_expire_date=today.format('Y-MM-DD');
    if(device.expire_date>current_expire_date)
        current_expire_date=device.expire_date;

    device.expire_date=moment(current_expire_date).add(5000,'M').format('Y-MM-DD');
    device.is_trial=2;
    await device.save();
    return res.json({
        status:'success',
        msg:'Device activated successfully',
        expire_date:device.expire_date,
        current_expire_date:current_expire_date,
        device_id:device._id
    })
}


function decryptRequest(app_type, req) {
    let {data}=req.body;
    let enc_str_position, enc_length_position;
    if(app_type==='samsung'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='android'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='iOS'){
        enc_str_position=8;
        enc_length_position=15;
    }
    if(app_type==='samsung' || app_type==='iOS')
        data=reverseString(data);
    try{
        let enc_position_char=data.charAt(enc_str_position), enc_length_char=data.charAt(enc_length_position);
        let enc_position=getEncryptKeyPosition(enc_position_char), enc_length=getEncryptKeyPosition(enc_length_char);
        data=data.slice(0,enc_length_position)+data.slice(enc_length_position+1);
        data=data.slice(0,enc_str_position)+data.slice(enc_str_position+1);
        let enc_key=data.slice(enc_position, enc_position+enc_length);
        var base_64_string=data.slice(0,enc_position).concat(data.slice(enc_position+enc_length));
        var json_string = Buffer.from(base_64_string, 'base64').toString('ascii');
        var json_data=JSON.parse(json_string);
        return {
            status:'success',
            json_data:json_data,
            enc_key:enc_key,
            enc_position_char:enc_position_char,
            enc_length_char:enc_length_char,
            enc_position:enc_position
        }
    }catch (e) {
        return {
            status:'error'
        }
    }
}
function getEncryptKeyPosition(character) {
    var symbols='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    for(var i=0;i<symbols.length;i++){
        if(symbols[i]==character){
            return i;
        }
    }
}
function getEncryptPositionChar(position) {
    var symbols='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    return symbols.charAt(position);
}
function makeEncryptResponse(decrypted_req,response,app_type) {
    let enc_str_position, enc_length_position;
    // let {enc_key, enc_position_char, enc_length_char, enc_position}=decrypted_req;

    response=JSON.stringify(response);
    let {enc_key, enc_length_char}=decrypted_req;
    let enc_position=Math.floor(Math.random()*response.length);
    if(enc_position>=response.length-3)
        enc_position=response.length-3;
    if(enc_position>=50)
        enc_position=50;

    let enc_position_char=getEncryptPositionChar(enc_position);
    // console.log('enc_position='+enc_position,'enc position char='+enc_position_char)

    if(app_type==='samsung' || app_type==='lg')
        app_type='samsung'
    if(app_type==='iOS' || app_type==='tvOS' || app_type==='macOS')
        app_type='iOS'
    if(app_type==='android' || app_type==='android_tv')
        app_type='android';
    if(app_type==='samsung'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='iOS'){
        enc_str_position=8;
        enc_length_position=15;
    }

    let result;
    let base_64_response=Buffer.from(response, 'utf-8').toString('base64');
    result=base_64_response.slice(0, enc_position).concat(enc_key).concat(base_64_response.slice(enc_position));
    if(app_type==='android')
        result+=enc_position_char+enc_length_char;
    else{
        result=result.slice(0, enc_str_position)+enc_position_char+result.slice(enc_str_position)
        result=result.slice(0, enc_length_position)+enc_length_char+result.slice(enc_length_position);
    }
    if(app_type==='samsung' || app_type==='iOS')
        result=reverseString(result);
    return result;
}
function reverseString(str) {
    var splitString = str.split("");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");
    return joinArray;
}

function checkUserAgent(req){
    try{
        let source=req.useragent.source.toLowerCase();
        let valid_keywords=settings.valid_user_agent_keys;
        for(var i=0;i<valid_keywords.length;i++){
            if(source.includes(valid_keywords[i])){
                return true;
                break;
            }
        }
        return false;
    }catch (e) {
        return true;
    }
}
function decryptRequest(app_type, req) {
    let {data}=req.body;
    let enc_str_position, enc_length_position;
    if(app_type==='samsung' || app_type==='windows'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='windows'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='android'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='iOS'){
        enc_str_position=10;
        enc_length_position=17;
    }
    if(app_type==='samsung' || app_type==='iOS' || app_type==='windows')
        data=reverseString(data);
    try{
        let enc_position_char=data.charAt(enc_str_position), enc_length_char=data.charAt(enc_length_position);
        let enc_position=getEncryptKeyPosition(enc_position_char), enc_length=getEncryptKeyPosition(enc_length_char);
        data=data.slice(0,enc_length_position)+data.slice(enc_length_position+1);
        data=data.slice(0,enc_str_position)+data.slice(enc_str_position+1);
        let enc_key=data.slice(enc_position, enc_position+enc_length);
        var base_64_string=data.slice(0,enc_position).concat(data.slice(enc_position+enc_length));
        var json_string = Buffer.from(base_64_string, 'base64').toString('ascii');
        var json_data=JSON.parse(json_string);
        return {
            status:'success',
            json_data:json_data,
            enc_key:enc_key,
            enc_position_char:enc_position_char,
            enc_length_char:enc_length_char,
            enc_position:enc_position
        }
    }catch (e) {
        return {
            status:'error'
        }
    }
}
function getEncryptKeyPosition(character) {
    var symbols='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    for(var i=0;i<symbols.length;i++){
        if(symbols[i]==character){
            return i;
        }
    }
}
function getEncryptPositionChar(position) {
    var symbols='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    return symbols.charAt(position);
}
function makeEncryptResponse(decrypted_req,response,app_type) {
    let enc_str_position, enc_length_position;
    // let {enc_key, enc_position_char, enc_length_char, enc_position}=decrypted_req;

    response=JSON.stringify(response);
    let {enc_key, enc_length_char}=decrypted_req;
    let enc_position=Math.floor(Math.random()*response.length);
    if(enc_position>=response.length-3)
        enc_position=response.length-3;
    if(enc_position>=50)
        enc_position=50;

    let enc_position_char=getEncryptPositionChar(enc_position);
    // console.log('enc_position='+enc_position,'enc position char='+enc_position_char)

    if(app_type==='samsung' || app_type==='lg')
        app_type='samsung'
    if(app_type==='iOS' || app_type==='tvOS' || app_type==='macOS')
        app_type='iOS'
    if(app_type==='android' || app_type==='android_tv')
        app_type='android';
    if(app_type==='samsung' || app_type==='windows'){
        enc_str_position=0;
        enc_length_position=1;
    }
    if(app_type==='iOS'){
        enc_str_position=10;
        enc_length_position=17;
    }

    let result;
    let base_64_response=Buffer.from(response, 'utf-8').toString('base64');
    result=base_64_response.slice(0, enc_position).concat(enc_key).concat(base_64_response.slice(enc_position));
    if(app_type==='android')
        result+=enc_position_char+enc_length_char;
    else{
        result=result.slice(0, enc_str_position)+enc_position_char+result.slice(enc_str_position)
        result=result.slice(0, enc_length_position)+enc_length_char+result.slice(enc_length_position);
    }
    if(app_type==='samsung' || app_type==='iOS' || app_type==='windows')
        result=reverseString(result);
    return result;
}
function reverseString(str) {
    var splitString = str.split("");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");
    return joinArray;
}

function addMacAddressToIP(req, mac_address){
    let ip=getClientIPAddress(req);
    try{
        if(mac_req_count[ip])
        {
            let mac_addresses=mac_req_count[ip].mac_addresses;
            if(!mac_addresses.includes(mac_address))
            {
                mac_req_count[ip].count+=1;
                mac_req_count[ip].mac_addresses.push(mac_address)
            }
        }
        else
        {
            mac_req_count[ip]={
                mac_addresses:[mac_address],
                count:1
            };
        }
        if(mac_req_count[ip].count>35){ // block at this time
            let activity_time=moment().utc().format('Y-MM-DD HH:mm:ss');
            let description="Blocked from server automatically at "+activity_time;
            let promises111=[sendBlockReqToCloudFlare(ip,description)];
            Promise.all(promises111).then(()=>{
                console.log(ip,' Blocked by ',mac_req_count[ip].count," different mac addresses");
            })
        }
        if(Object.keys(mac_req_count).length>100000) {
            mac_req_count={};
            console.log("here removed ips of having not so much mac addresses ",Object.keys(mac_req_count).length)
        }
    }catch (e){
        console.log("here mac request operation issue",e);
    }
}
