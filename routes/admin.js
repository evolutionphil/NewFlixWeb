var express = require('express');
var router = express.Router();
const adminController=require('../controllers/AdminController');
const dashboardController=require('../controllers/DashboardController');
const passport=require('passport');
const blockListController = require('../controllers/BlockListController');
const deviceController = require('../controllers/DeviceController');

router.get('/login',checkNotAuthenticated,adminController.login);
router.post('/login',checkNotAuthenticated,passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/admin/login',
    failureFlash: true
}))

router.get('/youtube-list',adminController.showYoutubeListContent);
router.post('/youtube-list/save',adminController.saveYoutubeListContent);

router.use(checkAuthenticated);
router.get('/',adminController.news);
router.get('/dashboard',dashboardController.dashboard);

router.post('/block-ips',blockListController.blockIps);
router.post('/unblock-ips',blockListController.unblockIps);

router.post('/remove-devices-of-ips',blockListController.removeDevicesOfIps);

router.post('/remove-devices',deviceController.deleteDevices);

router.get('/news/create/:id?',adminController.createNews);
router.post('/news/delete/:id',adminController.deleteNews);
router.post('/news/save',adminController.saveNews);
router.get('/news',adminController.news);

router.get('/faq',adminController.faq);
router.get('/faq/create/:id?',adminController.createFaq);
router.post('/faq/save',adminController.saveFaq);
router.post('/faq/delete/:id',adminController.deleteFaq);

router.get('/instruction/:kind',adminController.showInstruction);
router.post('/instruction/save/:kind',adminController.saveInstruction);

router.get('/activation',adminController.showActivationPageContent);
router.post('/activation/save',adminController.saveActivationContent);

router.get('/mylist',adminController.showMyListContent);
router.post('/mylist/save',adminController.saveMyListContent);

router.get('/transactions',adminController.showTransaction);
router.post('/getTransactions',adminController.getTransactions);

router.get('/language',adminController.language);
router.post('/language/delete/:id',adminController.deleteLanguage);
router.post('/language/create',adminController.createLanguage);

router.get('/word',adminController.word);
router.post('/word/create',adminController.createWord);
router.post('/word/delete/:id',adminController.deleteWord);
router.get('/language-word/:id',adminController.languageWord);
router.post('/saveLanguageWord/:language_id',adminController.saveLanguageWord);
router.post('/translateWords',adminController.translateWords);


router.get('/showAppBackground',adminController.showAppBackground);
router.post('/saveThemes',adminController.saveThemes);

router.get('/showAdverts',adminController.showAdverts);
router.post('/saveAdverts',adminController.saveAdverts);


router.get('/android-update',adminController.showAndroidUpdate);
router.post('/saveAndroidUpdate',adminController.saveAndroidUpdate);

router.get('/showDemoUrl',adminController.showDemoUrl);
router.post('/saveDemoUrl',adminController.saveDemoUrl);

router.get('/showPaymentVisibility',adminController.showPaymentVisibility);
router.post('/savePaymentVisibility',adminController.savePaymentVisibility);

router.get('/showStripeSetting',adminController.showStripeSetting);
router.post('/saveStripeSetting',adminController.saveStripeSetting);

router.get('/price-setting',adminController.showPriceSetting);
router.post('/savePrice',adminController.savePrice);

router.get('/showPaypalSetting',adminController.showPaypalSetting);
router.post('/savePaypalSetting',adminController.savePaypalSetting);

router.get('/showSendGridSetting',adminController.showSendGridSetting);
router.post('/saveSendGridSetting',adminController.saveSendGridSetting);

router.get('/valid-agent-keys',adminController.showValidAgentKeys);
router.post('/saveValidAgentKeys',adminController.saveValidAgentKeys);

router.get('/showCryptoApiKey',adminController.showCryptoApiKey);
router.post('/saveCryptoApiKey',adminController.saveCryptoApiKey);

router.get('/showOtherAppIpAddress',adminController.showOtherAppIpAddress);
router.post('/saveOtherAppIpAddress',adminController.saveOtherAppIpAddress);

router.get('/showCoinList',adminController.showCoinList);
router.post('/saveCoinList',adminController.saveCoinList);

router.get('/seo_setting',adminController.showSeoSetting);
router.post('/saveSeoSetting',adminController.saveSeoSetting);

router.get('/credit_packages',adminController.showCreditPackages);
router.post('/credit_package/create',adminController.createCreditPackage);
router.post('/credit_package/delete',adminController.deleteCreditPackage);

router.get('/resellers',adminController.showResellers);
router.get('/reseller/:id',adminController.showResellerDetail);
router.post('/reseller/create',adminController.createReseller);
router.post('/reseller/delete',adminController.deleteReseller);
router.post('/reseller/block',adminController.blockReseller);

router.get('/reseller-activations',adminController.showResellerActivations);
router.post('/getResellerActivations',adminController.getResellerActivations);


router.get('/terms',adminController.showTermsContent);
router.post('/terms/save',adminController.saveTermsContent);
router.get('/privacy',adminController.showPrivacyContent);
router.post('/privacy/save',adminController.savePrivacyContent);

router.get('/reseller-content',adminController.showResellerContent);
router.post('/reseller-content/save',adminController.saveResellerContent);

router.get('/showSupportEmailSetting',adminController.showSupportEmailSetting);
router.post('/saveSupportEmailSetting',adminController.saveSupportEmailSetting);

router.get('/showYoutubeApiKey',checkAuthenticated,adminController.showYoutubeApiKey);
router.post('/saveYoutubeApiKey',checkAuthenticated,adminController.saveYoutubeApiKey);

router.get('/showOpenSubtitlesSettings',checkAuthenticated,adminController.showOpenSubtitlesSettings);
router.post('/saveOpenSubtitlesSettings',checkAuthenticated,adminController.saveOpenSubtitlesSettings);
router.get('/showGoogleSettings',checkAuthenticated,adminController.showGoogleSettings);
router.post('/saveGoogleSettings',checkAuthenticated,adminController.saveGoogleSettings);

router.get('/profile',adminController.showProfile);
router.post('/updateProfile',adminController.updateProfile);

router.get('/playlists',adminController.showPlayLists);
router.post('/playlist/getPlaylists',adminController.getPlaylists);

router.get('/ip-summary',adminController.showIpSummary);
router.post('/get-ip-summary',adminController.getIpSummary);

router.get('/playlist-summary',adminController.showPlaylistSummary);
router.post('/get-playlist-summary',adminController.getPlaylistSummary);

router.post('/playlist/activate',adminController.activatePlaylist);
router.get('/playlist/:id',adminController.showDeviceDetail);
router.post('/logout', (req, res) => {
    req.logOut()
    res.redirect('/admin/login')
})


// router.get('/upload_flix_data',adminController.uploadFlixData)
router.get('/add_mac_to_transactions',adminController.addMacToTransaction);
router.get('/update-expire-date-format',adminController.updateExpireDateFormat)
router.get('/update-reseller-activity',adminController.updateResellerActivity)

const MonitoringController = require('../controllers/MonitoringController');

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/admin/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/admin')
    }
    next()
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/admin/login')
}

router.get('/monitoring', isAuthenticated, MonitoringController.index);
router.get('/api/monitoring-stats', isAuthenticated, MonitoringController.getMonitoringStats);
router.get('/api/monitoring-debug', MonitoringController.debugData);

module.exports = router;