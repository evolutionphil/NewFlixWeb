var express = require('express');
var router = express.Router();
const frontendController=require('../controllers/FrontendController');


router.get('/',(req,res)=>{
    res.redirect('/mylist');
});
router.get('/home',frontendController.home);
router.get('/news',frontendController.news);
router.get('/news/:id',frontendController.showNewsDetail);
router.get('/faq',frontendController.faq);
router.get('/instructions',frontendController.instructions);
router.get('/instructions/:kind',frontendController.showInstructionDetail);
router.get('/activation',frontendController.activation);
router.get('/contact',frontendController.contact);

router.get('/mylist',frontendController.mylist);
router.post('/savePlaylists',frontendController.savePlaylists);
router.post('/deletePlaylist',frontendController.deletePlayList);
router.post('/updatePinCode',frontendController.updatePinCode);

router.get('/youtube-list',frontendController.showYoutubeList);
router.post('/saveYoutubeLists',frontendController.saveYoutubeLists);



router.get('/news-support',frontendController.news);
router.post('/checkMacValid',frontendController.checkMacValid);
router.post('/paypal/order/create',frontendController.createPaypalOrder);
router.post('/paypal/order/capture/:order_id',frontendController.capturePaypalOrder);

router.post('/saveActivation',frontendController.saveActivation)
router.all('/activation/crypto/redirect',frontendController.cryptoPaymentRedirect);
router.get('/activation/crypto/cancel',frontendController.cryptoPaymentCancel);
router.get('/payment/status',frontendController.paymentStatus);
router.get('/stripe/success',frontendController.stripeSuccess);
router.get('/stripe/cancel',frontendController.cryptoPaymentCancel);

router.get('/terms&conditions',frontendController.showTermsAndConditions);
router.get('/privacy-policy',frontendController.showPrivacyAndPolicy);

router.get('/get-ip-count',(req,res)=>{
    let temps=[];
    Object.keys(ip_req_count).map(key=>{
        temps.push({
            ip:key,
            ...ip_req_count[key]
        })
    })
    let sorted_result=[];
    sorted_result = temps.sort( (a,b) => a.count < b.count ? 1:-1 );
    let final_result=sorted_result.filter(item=>{
        if(item.count>=2)
            return true;
    })
    return res.json(final_result);
})

module.exports = router;
