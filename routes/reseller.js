var express = require('express');
var router = express.Router();
const resellerController=require('../controllers/ResellerController');
const passport=require('passport');

let Reseller=require('../models/Reseller.model');

router.get('/login',checkNotAuthenticated,resellerController.showResellerLogin);
router.post('/login',checkNotAuthenticated,resellerController.postResellerLogin);

router.get('/profile',checkAuthenticated,resellerController.showProfile);
router.post('/updateProfile',checkAuthenticated,resellerController.updateProfile);

router.post('/logout', (req, res) => {
    req.logOut()
    res.redirect('/reseller/login');
})

router.get('/logout',checkAuthenticated,resellerController.logOut);
router.get('/activate-device',checkAuthenticated,resellerController.showActivate);
router.post('/post-activate',checkAuthenticated,resellerController.postActivate);


router.get('/activity-log/:reseller_id?',checkAuthenticated,resellerController.showActivityLog)
router.get('/my-resellers',checkAuthenticated, resellerController.showMyResellers);
router.post('/my-resellers/create',checkAuthenticated, resellerController.createReseller);
router.post('/my-resellers/delete',checkAuthenticated, resellerController.deleteReseller);


async function checkAuthenticated(req, res, next) {
    let sess=req.session;
    if (sess.reseller_id) {
        let reseller=await Reseller.findById(sess.reseller_id);
        if(!reseller){
            req.session.reseller_id=null;
            return res.redirect('/reseller/login')
        }else {
            if(reseller.blocked){
                req.session.reseller_id=null;
                req.flash('error','Sorry, You are blocked, please contact admin or your parent reseller');
                return res.redirect('/reseller/login')
            }
            if(reseller.deleted){
                req.session.reseller_id=null;
                req.flash('error','Sorry, email or password is not correct');
                return res.redirect('/reseller/login')
            }
        }
        res.locals.reseller=reseller;
        return next()
    }
    res.redirect('/reseller/login')
}
function checkNotAuthenticated(req, res, next) {
    let sess=req.session;
    if (sess.reseller_id) {
        return res.redirect('/reseller/profile')
    }
    next();
}
module.exports = router;

