var express = require('express');
var router = express.Router();
const ApiController=require('../controllers/ApiController');
const { rateLimiter } = require('../middlewares/rate-limiter');

router.get('/playlist_information/:mac_address/:app_type?',rateLimiter, ApiController.getPlaylistInformation);
router.get('/playlist_information/:mac_address/:app_type?',ApiController.getAppSetting);

router.post('/playlist_information',rateLimiter, ApiController.getPlaylistInformationAndroid); // for android
router.post('/playlist_info',rateLimiter, ApiController.getPlaylistInformationApple); // for ios
router.post('/device_info',rateLimiter, ApiController.getPlaylistInformationSmartTV); // for smart tv
router.post('/Ya6qrVdbcxy69CI',rateLimiter, ApiController.getPlaylistInformationWindows); // for smart tv



router.get('/get_epg_data/:offset_minute?',ApiController.getEpgData);
router.get('/get_epg_codes',ApiController.getEpgCodes);
router.get('/get_android_version',ApiController.getAndroidVersion);

// router.post('/google_pay',ApiController.saveGooglePay);
router.post('/google_pay_encrypt',ApiController.saveGooglePayEncrypt);

router.post('/app_purchase',ApiController.saveAppPurchase);
router.post('/app_purchase_encrypt',ApiController.saveAppPurchaseEncrypt);

router.post('/saveLockState',ApiController.saveLockState);
router.post('/saveLockStateEncryptAndroid',ApiController.saveLockStateEncryptAndroid);
router.post('/saveLockStateEncryptIOS',ApiController.saveLockStateEncryptIOS);

router.post('/updateParentAccountPassword',ApiController.updateParentAccountPassword);
router.post('/updateParentAccountPasswordAndroid',ApiController.updateParentAccountPasswordAndroid);
router.post('/updateParentAccountPasswordIOS',ApiController.updateParentAccountPasswordIOS);

router.post('/crypto-ipn-url/:transaction_id',ApiController.cryptoIpnCallBack);
router.post('/activate-from-external',ApiController.activateFromExternal)

module.exports = router;
