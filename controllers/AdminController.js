let Admin=require('../models/Admin.model');
let Device=require('../models/Device.model');
let PlayList=require('../models/PlayList.model');
let Transaction=require('../models/Transaction.model');
let News=require('../models/News.model');
let Faq=require('../models/Faq.model');
let Language=require('../models/Language.model');
let LanguageWord=require('../models/LanguageWord.model');
let Word=require('../models/Word.model');
let Setting=require('../models/Setting.model')
let CoinList=require('../models/CoinList.model');
let ActivationContent=require('../models/ActivationContent.model');
let MyListContent=require('../models/MyListContent.model');
let YoutubeListContent=require('../models/YoutubeListContent.model');
let Instruction=require('../models/Instruction.model');
let CreditPackage=require('../models/CreditPackage.model');
let Reseller=require('../models/Reseller.model');
let ResellerActivity=require('../models/ResellerActivity.model');
let CreditHistory=require('../models/CreditHistory.model');
let saveFiles=require('../utils/save-file');
const moment=require('moment');

const bcrypt = require('bcrypt');
const saltRounds = 10;

let TermsContent=require('../models/TermsContent.model');
let PrivacyContent=require('../models/PrivacyContent.model');

let ResellerContent=require('../models/ResellerContent.model');

// let mysql=require('mysql');
// const mysql_connection=mysql.createConnection(
//     {
//         host:'flix-db-new.cxmpxlq6ixwj.eu-central-1.rds.amazonaws.com',
//         user:'flixappo_us',
//         password:'Muhammed5858!',
//         database:'flixappo_flixiptv'
//     }
// )
// mysql_connection.connect(function (err){
//     if(err){
//         return console.error('error'+err.message);
//     }
//     console.log('connected to the mysql server')
// })


const helpers=require('../utils/helpers');
const axios = require('axios');
let ObjectID = require('mongodb').ObjectID;

const path = require("path");

const passport=require('passport');
const initializePassport=require('../passport-config');
initializePassport(
    passport,
    async email => {
        var user=await Admin.findOne({email: email});
        return user;
    },
    async id =>{
        var user=await Admin.findById(id);
        return user;
    }
)
exports.login=async (req,res)=>{
    // const hashedPassword=await bcrypt.hash('123456',10)
    //     console.log(hashedPassword);
    res.render('admin/pages/login',{menu:'login',layout: false })
}
exports.index=(req,res)=>{
    res.render('admin/pages/index',{menu:'news',layout: './admin/partials/layout' })
}
exports.news=(req,res)=>{
    News.find().then(data=>{
        res.render('admin/pages/news/index',{menu:'news',layout: './admin/partials/layout',news:data})
    })
}
exports.createNews=(req,res)=>{
    var id=req.params.id;
    if(id==null || id==''){
        res.render('admin/pages/news/create',
            {menu:'news-create',layout: './admin/partials/layout',section:null,id:null }
        )
    }else{
        News.findById(id).then(function (data) {
            var section=data;
            res.render('admin/pages/news/create',
                {menu:'news-create',layout: './admin/partials/layout',section:section,id:id }
            )
        })
    }

}
exports.saveNews=(req,res)=>{
    let params=req.body;
    let title=params.section_name;
    let content=params.section_content;
    let id=params.id;
    let update={
        title:title, content:content
    }
    if(id==null || id==''){
        var news=new News(update);
        news.save().then(function (data) {
            return res.redirect('/admin/news');
        })
    }else{
        News.findByIdAndUpdate(id,update).then(data=>{
            return res.redirect('/admin/news');
        })
    }
}
exports.deleteNews=(req,res)=>{
    var id=req.params.id;
    News.findByIdAndRemove(id,(error,task)=>{
        console.log(error, task)
        if(error)
            return res.json({status:'error'})
        res.json({
            status:'success'
        })
    })
}
exports.faq=(req,res)=>{
    Faq.find().then(data=>{
        res.render('admin/pages/faq/index',{menu:'faq',layout: './admin/partials/layout',faqs:data})
    })
}
exports.createFaq=(req,res)=>{
    var id=req.params.id;
    if(id==null || id==''){
        res.render('admin/pages/faq/create',
            {menu:'faq-create',layout: './admin/partials/layout',section:null,id:null }
        )
    }else{
        Faq.findById(id).then(function (data) {
            var section=data;
            res.render('admin/pages/faq/create',
                {menu:'faq-create',layout: './admin/partials/layout',section:section,id:id }
            )
        })
    }
}
exports.saveFaq=(req,res)=>{
    let params=req.body;
    let title=params.question;
    let content=params.answer;
    let id=params.id;
    let update={
        title:title, content:content
    }
    if(id==null || id==''){
        var news=new Faq(update);
        news.save().then(function (data) {
            return res.redirect('/admin/faq');
        })
    }else{
        Faq.findByIdAndUpdate(id,update).then(data=>{
            return res.redirect('/admin/faq');
        })
    }
}
exports.deleteFaq=(req,res)=>{
    var id=req.params.id;
    Faq.findByIdAndRemove(id,(error,task)=>{
        console.log(error, task)
        if(error)
            return res.json({status:'error'})
        res.json({
            status:'success'
        })
    })
}


exports.showInstruction=(req,res)=>{
    let kind=req.params.kind;
    Instruction.findOne({kind:kind}).then(contents=>{
        res.render(
            'admin/pages/instruction_content',
            {
                menu:'instruction_'+kind,layout: './admin/partials/layout',contents:contents, kind:kind
            }
        )
    })
}

exports.saveInstruction=(req,res)=> {
    let kind=req.params.kind;
    let detail = req.body['section-content'];
    Instruction.findOne({kind:kind}).then(reseller_content => {
        if (reseller_content) {
            reseller_content.update({
                content: detail
            }).then(() => {
                return res.redirect('/admin/instruction/'+kind);
            })
        } else {
            Instruction.create({
                content: detail,
                kind:kind
            }).then(() => {
                return res.redirect('/admin/instruction/'+kind);
            })
        }
    })
}

exports.showActivationPageContent=(req,res)=>{
    ActivationContent.findOne().then(contents=>{
        res.render(
            'admin/pages/activation_content',
            {
                menu:'activation',layout: './admin/partials/layout',contents:contents
            }
        )
    })
}
exports.saveActivationContent=(req,res)=> {
    let detail = req.body['section-content'];
    ActivationContent.findOne().then(reseller_content => {
        if (reseller_content) {
            reseller_content.update({
                contents: detail
            }).then(() => {
                return res.redirect('/admin/activation');
            })
        } else {
            ActivationContent.create({
                contents: detail
            }).then(() => {
                return res.redirect('/admin/activation');
            })
        }
    })
}

exports.showMyListContent=(req,res)=>{
    MyListContent.findOne().then(contents=>{
        res.render(
            'admin/pages/mylist_content',
            {
                menu:'mylist',layout: './admin/partials/layout',contents:contents
            }
        )
    })
}
exports.saveMyListContent=(req,res)=> {
    let detail = req.body['section-content'];
    MyListContent.findOne().then(reseller_content => {
        if (reseller_content) {
            reseller_content.update({
                contents: detail
            }).then(() => {
                return res.redirect('/admin/mylist');
            })
        } else {
            MyListContent.create({
                contents: detail
            }).then(() => {
                return res.redirect('/admin/mylist');
            })
        }
    })
}

exports.showYoutubeListContent=(req,res)=>{
    YoutubeListContent.findOne().then(contents=>{
        res.render(
            'admin/pages/youtubelist_content',
            {
                menu:'youtube-list',layout: './admin/partials/layout',contents:contents
            }
        )
    })
}
exports.saveYoutubeListContent=(req,res)=> {
    let detail = req.body['section-content'];
    YoutubeListContent.findOne().then(reseller_content => {
        if (reseller_content) {
            reseller_content.update({
                contents: detail
            }).then(() => {
                return res.redirect('/admin/youtube-list');
            })
        } else {
            YoutubeListContent.create({
                contents: detail
            }).then(() => {
                return res.redirect('/admin/youtube-list');
            })
        }
    })
}

exports.showTransaction=(req,res)=>{
    res.render('admin/pages/transaction',
        {
            menu:'transactions',layout: './admin/partials/layout',
        }
    )
}

exports.getTransactions=async (req,res)=>{
    let {
        show_samsung,
        show_ios,
        show_tvos,
        show_android,
        show_lg,
        show_macos,
        draw,
        length,
        start,
        order,
        columns,
        search,
        mac_address,
        transaction_date,
        ip,
        user_agent,
        payment_type,
        payment_status,
        date_filter,
        date_from,
        date_to
    } = req.body;
    start = parseInt(start);
    length = parseInt(length);
    let columnIndex = order[0].column;
    let columnName = columns[columnIndex].data;
    let columnSortOrder = order[0].dir;
    let searchValue = search.value; // Search value

    let start_time=new Date().getTime();
    let filter_condition={status:'success'};
    if(show_android==false || show_android=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'android'}});
    if(show_samsung==false || show_samsung=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'samsung'}});
    if(show_ios==false || show_ios=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'iOS'}});
    if(show_lg==false || show_lg=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'lg'}});
    if(show_tvos==false || show_tvos=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'tvOS'}});
    if(show_macos==false || show_macos=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'macOS'}});

    if(mac_address)
    {
        mac_address=mac_address.toLowerCase();
        filter_condition=combineFilterCondition(filter_condition,{mac_address:{$regex: mac_address,$options: "i"}});
    }
    if(transaction_date)
        filter_condition=combineFilterCondition(filter_condition,{pay_time:{$regex: transaction_date,$options: "i"}});
    if(ip)
        filter_condition=combineFilterCondition(filter_condition,{ip:{$regex: ip,$options: "i"}});
    if(user_agent)
        filter_condition=combineFilterCondition(filter_condition,{user_agent:{$regex: user_agent,$options: "i"}});
    if(payment_type!='all')
        filter_condition=combineFilterCondition(filter_condition,{payment_type:payment_type});
    if(payment_status && payment_status!='all')
        filter_condition=combineFilterCondition(filter_condition,{status:payment_status});

    // Date filtering
    if(date_filter && date_filter !== 'all') {
        let dateCondition = {};
        const today = moment().format('YYYY-MM-DD');
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        const lastWeek = moment().subtract(7, 'days').format('YYYY-MM-DD');
        const lastMonth = moment().subtract(30, 'days').format('YYYY-MM-DD');

        switch(date_filter) {
            case 'today':
                dateCondition = {
                    pay_time: {
                        $gte: today + ' 00:00',
                        $lte: today + ' 23:59'
                    }
                };
                break;
            case 'yesterday':
                dateCondition = {
                    pay_time: {
                        $gte: yesterday + ' 00:00',
                        $lte: yesterday + ' 23:59'
                    }
                };
                break;
            case 'last_week':
                dateCondition = {
                    pay_time: {
                        $gte: lastWeek + ' 00:00'
                    }
                };
                break;
            case 'last_month':
                dateCondition = {
                    pay_time: {
                        $gte: lastMonth + ' 00:00'
                    }
                };
                break;
            case 'custom':
                if(date_from && date_to) {
                    dateCondition = {
                        pay_time: {
                            $gte: date_from + ' 00:00',
                            $lte: date_to + ' 23:59'
                        }
                    };
                } else if(date_from) {
                    dateCondition = {
                        pay_time: {
                            $gte: date_from + ' 00:00'
                        }
                    };
                } else if(date_to) {
                    dateCondition = {
                        pay_time: {
                            $lte: date_to + ' 23:59'
                        }
                    };
                }
                break;
        }

        if(Object.keys(dateCondition).length > 0) {
            filter_condition = combineFilterCondition(filter_condition, dateCondition);
        }
    }

    let sort_filter={}
    if(columnName=='mac_address')
        sort_filter={mac_address:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='app_type')
        sort_filter={app_type:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='pay_time')
        sort_filter={pay_time:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='ip')
        sort_filter={ip:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='amount')
        sort_filter={amount:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='user_agent')
        sort_filter={user_agent:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='payment_type')
        sort_filter={payment_type:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='payment_id')
        sort_filter={payment_id:columnSortOrder==='asc' ? 1 : -1}

    let totalRecords=await Transaction.countDocuments(filter_condition);
    let transactions=await Transaction.find(filter_condition).skip(start).limit(length).sort(sort_filter);



    let result_data=transactions;
    let obj_keys=['mac_address','ip','user_agent','app_type','pay_time','payment_type','amount','payment_id'];
    for(let i=0;i<result_data.length;i++){
        let item=result_data[i];
        obj_keys.map(key=>{
            if(!item[key])
                item[key]='';
        })
    }

    let end_time=new Date().getTime();
    let execution_time=(end_time-start_time)/1000;
    res.json({data:result_data,draw :draw,iTotalDisplayRecords:totalRecords,
        iTotalRecords:totalRecords,execution_time:execution_time});
}

exports.language=(req,res)=>{
    Language.find().then(data=>{
        res.render('admin/pages/language',
            {menu:'language-code',layout: './admin/partials/layout',languages:data }
        )
    })
}
exports.createLanguage=(req,res)=>{
    let input=req.body;
    let {language_code,language_name,id}=input;
    let update={
        code:language_code,
        name:language_name
    }
    if(id==null|| id==''){
        let language=new Language(update);
        language.save().then(()=>{
            getSettings();
            return res.json({status:'success'});
        })
    }else{
        Language.findByIdAndUpdate(id,update).then(()=>{
            getSettings();
            return res.json({status:'success'});
        })
    }
}
exports.deleteLanguage=(req,res)=>{
    var id=req.params.id;
    Language.findByIdAndRemove(id,(error,task)=>{
        if(error)
            return res.json({status:'error'})
        getSettings();
        res.json({
            status:'success'
        })
    })
}
exports.word=(req,res)=>{
    Word.find().then(data=>{
        res.render('admin/pages/word',
            {menu:'language-word',layout: './admin/partials/layout',words:data }
        )
    })
}
exports.createWord=(req,res)=>{
    let input=req.body;
    let {word_name,id}=input;
    let update={
        name:word_name,
    }
    if(id==null|| id==''){
        let word=new Word(update);
        word.save().then(()=>{
            getSettings();
            return res.json({status:'success'});
        })
    }else{
        Word.findByIdAndUpdate(id,update).then(()=>{
            getSettings();
            return res.json({status:'success'});
        })
    }
}
exports.deleteWord=(req,res)=>{
    var id=req.params.id;
    Word.findByIdAndRemove(id,(error,task)=>{
        if(error)
            return res.json({status:'error'})
        getSettings();
        res.json({
            status:'success'
        })
    })
}

exports.languageWord=(req,res)=>{
    let id=req.params.id;
    Language.findById(id).then(language=>{
        LanguageWord.find({language_id:id}).then(language_words=>{
            Word.find().then(words=>{
                let language_words_map={};
                language_words.map(item=>{
                    language_words_map[item.word_id]=item;
                })
                res.render('admin/pages/language_word',
                    {
                        menu:'language-code',layout: './admin/partials/layout',
                        words:words,
                        language:language,language_words:language_words,
                        language_words_map:language_words_map
                    }
                )
            })
        })
    });
}
exports.saveLanguageWord=(req,res)=>{
    let input=req.body;
    let language_id=req.params.language_id
    LanguageWord.deleteMany({language_id:language_id}).then(()=>{
        let records=[];
        Object.keys(input).map(key=>{
            let item=input[key];
            if(key.includes('language_word')){
                let word_id=key.replace('language_word-','');
                if(item!=null && item!=''){
                    records.push({
                        word_id:word_id,
                        language_id:language_id,
                        value:item
                    })
                }
            }
        })
        LanguageWord.insertMany(records).then(()=>{
            getSettings();
            return res.redirect('/admin/language-word/'+language_id)
        })
    })
}

exports.showDemoUrl=(req,res)=>{
    Setting.findOne({key:'demo_url'}).then(data=>{
        let demo_url=data!=null ? data.value : '';
        res.render('admin/pages/demo_url',
            {
                menu:'demo_url-setting',layout: './admin/partials/layout',
                demo_url:demo_url
            }
        )
    })
}
exports.saveDemoUrl=(req,res)=>{
    var demo_url=req.body.demo_url;
    Setting.deleteMany({key:'demo_url'}).then(()=>{
        let setting=new Setting({key:'demo_url',value:demo_url});
        setting.save().then(()=>{
            settings.demo_url=demo_url;
            return res.redirect('/admin/showDemoUrl');
        })
    })
}

exports.showPriceSetting=(req,res)=>{
    Setting.findOne({key:'price'}).then(data=>{
        let price=data!=null ? data.value : 7.49;
        res.render('admin/pages/price_setting',
            {
                menu:'price-setting',layout: './admin/partials/layout',
                price:price
            }
        )
    })
}
exports.savePrice=(req,res)=>{
    let price=req.body.price;
    Setting.deleteMany({key:'price'}).then(()=>{
        Setting.insertMany([
            {
                key:'price',
                value:price
            }
        ]).then(res1=>{
            settings.price=price;
            return res.redirect('/admin/price-setting');
        })
    })
}

exports.showPaymentVisibility=(req,res)=>{
    let promises=[];
    var keys=['show_paypal','show_stripe','show_coin','show_mollie'];
    keys.map(key=>{
        promises.push(helpers.getSetting(key));
    })
    Promise.all(promises).then(
        values=>{
            let data={};
            keys.map((key,index)=>{
                data[key]=values[index]!=null ? values[index].value : 0
            })
            res.render('admin/pages/payment_visibility',
                {
                    menu:'payment-visibility-setting',layout: './admin/partials/layout',
                    ...data
                }
            )
        }
    );
}
exports.savePaymentVisibility=(req,res)=>{
    let input=req.body;
    let {show_paypal, show_coin,show_stripe}=input;
    settings={
        ...settings,
        show_paypal:show_paypal,
        show_coin:show_coin,
        show_stripe:show_stripe
    }
    Setting.deleteMany({key:{$in:['show_paypal','show_coin','show_stripe']}}).then(()=>{
        Setting.insertMany([
            {
                key:'show_paypal',
                value:show_paypal
            },
            {
                key:'show_coin',
                value:show_coin
            },
            {
                key:'show_stripe',
                value:show_stripe
            }
        ]).then(()=>{
            return res.redirect('/admin/showPaymentVisibility');
        })
    })
}

exports.showAppBackground=(req,res)=>{
    Setting.findOne({key:'themes'}).then(data=>{
        let themes;
        if(data){
            themes=JSON.parse(data.value);
            for(i=0;i<themes.length;i++){
                if(!themes[i].url){
                    themes[i].url='https://dummyimage.com/1920x1080/fff/aaa';
                }
                themes[i].origin_url=themes[i].url;
            }
        }
        else{
            themes=[
                {
                    theme_name: '',
                    url: 'https://dummyimage.com/1920x1080/fff/aaa',
                    origin_url: 'https://dummyimage.com/1920x1080/fff/aaa'
                }
            ];
        }
        res.render('admin/pages/app_background',
            {
                menu:'app_background-setting',layout: './admin/partials/layout',
                themes:themes
            }
        )
    })
}
exports.saveThemes=(req,res)=>{
    let {theme_count}=req.body;
    let theme_contents=[];
    let files=req.files;
    if(!files)
        files=[];
    for(let i=0;i<theme_count;i++){
        let temp={};
        temp.name=req.body['theme-name-'+i];
        temp.url=req.body['theme-origin_url-'+i];
        if(files['theme-image-'+i]){
            let file=files['theme-image-'+i];
            let file_name=saveFiles.getRandomFileName(file);
            saveFiles.saveFile(file, file_name)
            temp.url='/images/upload/'+file_name;
        }
        theme_contents.push(temp);
    }
    Setting.deleteMany(({key:'themes'})).then(()=>{
        Setting.create({
            key:'themes',
            value:JSON.stringify(theme_contents)
        }).then(()=>{
            getSettings();
            res.redirect('/admin/showAppBackground')
        })
    })
}

exports.showAdverts=(req,res)=>{
    Setting.findOne({key:'adverts'}).then(data=>{
        let adverts;
        if(data){
            adverts=JSON.parse(data.value);
            for(let i=0;i<adverts.length;i++){
                if(!adverts[i].url){
                    adverts[i].url='https://dummyimage.com/1920x1080/fff/aaa';
                }
                adverts[i].origin_url=adverts[i].url;
            }
        }
        else{
            adverts=[
                {
                    title: '',
                    description:'',
                    url: 'https://dummyimage.com/500x300/fff/aaa',
                    origin_url: 'https://dummyimage.com/500x300/fff/aaa'
                }
            ];
        }
        res.render('admin/pages/advert',
            {
                menu:'advert-setting',layout: './admin/partials/layout',
                adverts:adverts
            }
        )
    })
}
exports.saveAdverts=(req,res)=>{
    let {advert_count}=req.body;
    let theme_contents=[];
    let files=req.files;
    if(!files)
        files=[];
    for(let i=0;i<advert_count;i++){
        let temp={};
        temp.title=req.body['advert_titles_'+i];
        temp.description=req.body['advert_descriptions_'+i];
        temp.url=req.body['advert_origin_urls_'+i];
        if(files['advert_images-'+i]){
            let file=files['advert_images-'+i];
            let file_name=saveFiles.getRandomFileName(file);
            saveFiles.saveFile(file, file_name)
            temp.url='/images/upload/'+file_name;
        }
        theme_contents.push(temp);
    }
    Setting.deleteMany(({key:'adverts'})).then(()=>{
        Setting.create({
            key:'adverts',
            value:JSON.stringify(theme_contents)
        }).then(()=>{
            getSettings();
            res.redirect('/admin/showAdverts')
        })
    })
}

exports.showStripeSetting=(req,res)=>{
    let promises=[];
    promises.push(helpers.getSetting('stripe_public_key'));
    promises.push(helpers.getSetting('stripe_secret_key'));
    Promise.all(promises).then(
        values=> {
            let stripe_public_key = values[0] != null ? values[0].value : '';
            let stripe_secret_key = values[1] != null ? values[1].value : '';
            res.render('admin/pages/stripe_setting',
                {
                    menu:'stripe-setting',layout: './admin/partials/layout',
                    stripe_public_key:stripe_public_key,
                    stripe_secret_key:stripe_secret_key,
                }
            )
        }
    );
}
exports.saveStripeSetting=(req,res)=>{
    let input=req.body;
    let {public_key, secret_key}=input;
    Setting.deleteMany({key:{$in:['stripe_public_key','stripe_secret_key']}}).then(()=>{
        Setting.insertMany([
            {
                key:'stripe_public_key',
                value:public_key
            },
            {
                key:'stripe_secret_key',
                value:secret_key
            },
        ]).then(()=>{
            settings.stripe_public_key=public_key;
            settings.stripe_secret_key=secret_key;
            return res.redirect('/admin/showStripeSetting');
        })
    })
}

exports.showPaypalSetting=(req,res)=>{
    let promises=[];
    promises.push(helpers.getSetting('paypal_client_id'));
    promises.push(helpers.getSetting('paypal_secret'));
    promises.push(helpers.getSetting('paypal_mode'));

    Promise.all(promises).then(
        values=> {
            let paypal_client_id = values[0] != null ? values[0].value : '';
            let paypal_secret = values[1] != null ? values[1].value : '';
            let paypal_mode = values[2] != null ? values[2].value : '';
            res.render('admin/pages/paypal_setting',
                {
                    menu:'paypal-setting',layout: './admin/partials/layout',
                    paypal_client_id:paypal_client_id,
                    paypal_secret:paypal_secret,
                    paypal_mode:paypal_mode
                }
            )
        }
    );
}
exports.savePaypalSetting=(req,res)=>{
    let input=req.body;
    let {paypal_client_id, paypal_secret, paypal_mode}=input;
    settings.paypal_client_id=paypal_client_id;
    settings.paypal_secret=paypal_secret;
    settings.paypal_mode=paypal_mode;
    Setting.deleteMany({key:{$in:['paypal_client_id','paypal_secret','paypal_mode']}}).then(()=>{
        Setting.insertMany([
            {
                key:'paypal_client_id',
                value:paypal_client_id
            },
            {
                key:'paypal_secret',
                value:paypal_secret
            },
            {
                key:'paypal_mode',
                value:paypal_mode
            }
        ]).then(()=>{
            return res.redirect('/admin/showPaypalSetting');
        })
    })
}

exports.showSendGridSetting=(req,res)=>{
    let keys=['sendgrid_template_id','sendgrid_email_from','sendgrid_api_key'];
    let data={};
    keys.map(key=>{
        data[key]=settings[key] ? settings[key] : ''
    })
    res.render('admin/pages/sendgrid_setting',
        {
            menu:'sendgrid-setting',layout: './admin/partials/layout',
            ...data
        }
    );
}
exports.saveSendGridSetting=(req,res)=>{
    let input=req.body;
    let keys=['sendgrid_template_id','sendgrid_email_from','sendgrid_api_key'];
    let insert_data=[];
    keys.map(key=>{
        insert_data.push({
            key:key,
            value:input[key]
        })
        settings[key]=input[key];
    })

    Setting.deleteMany({key:{$in:keys}}).then(()=>{
        Setting.insertMany(insert_data).then(()=>{
            return res.redirect('/admin/showSendGridSetting');
        })
    })
}


exports.showValidAgentKeys=(req,res)=>{
    let promises=[];
    promises.push(helpers.getSetting('valid_user_agent_keys'));
    Promise.all(promises).then(
        values=> {
           let user_agent_keys=values[0] ? values[0].value : '';
            res.render('admin/pages/user_agent_keys',
                {
                    menu:'vaild-agent-keys',layout: './admin/partials/layout',
                    user_agent_keys:user_agent_keys
                }
            )
        }
    );
}
exports.saveValidAgentKeys=(req,res)=>{
    let input=req.body;
    let {user_agent_keys}=input;
    user_agent_keys=user_agent_keys.trim();
    settings.valid_user_agent_keys=user_agent_keys.split('\r\n');
    console.log(settings.valid_user_agent_keys);
    Setting.deleteMany({key:{$in:['valid_user_agent_keys']}}).then(()=>{
        Setting.insertMany([
            {
                key:'valid_user_agent_keys',
                value:user_agent_keys
            }
        ]).then(()=>{
            return res.redirect('/admin/valid-agent-keys');
        })
    })
}


exports.showCryptoApiKey=(req,res)=>{
    let keys=['crypto_public_key','crypto_private_key','crypto_merchant_id','crypto_ipn_secret'];
    let data={};
    keys.map(key=>{
        data[key]=settings[key];
    })
    res.render('admin/pages/crypto_key',
        {
            menu:'crypto-api-setting',layout: './admin/partials/layout',
            ...data
        }
    )
}
exports.saveCryptoApiKey=(req,res)=>{
    let input=req.body;
    let {crypto_public_key, crypto_private_key,crypto_merchant_id,crypto_ipn_secret}=input;
    settings={
        ...settings,
        crypto_public_key:crypto_public_key,
        crypto_private_key:crypto_private_key,
        crypto_merchant_id:crypto_merchant_id,
        crypto_ipn_secret:crypto_ipn_secret
    }
    Setting.deleteMany({key:{$in:['crypto_public_key','crypto_private_key','crypto_merchant_id','crypto_ipn_secret']}}).then(()=>{
        Setting.insertMany([
            {
                key:'crypto_public_key',
                value:crypto_public_key
            },
            {
                key:'crypto_private_key',
                value:crypto_private_key
            },
            {
                key:'crypto_merchant_id',
                value:crypto_merchant_id
            },
            {
                key:'crypto_ipn_secret',
                value:crypto_ipn_secret
            }
        ]).then(()=>{
            return res.redirect('/admin/showCryptoApiKey');
        })
    })
}

exports.showOtherAppIpAddress=(req,res)=>{
    let keys=['quzu_ip'];
    let data={};
    keys.map(key=>{
        data[key]=settings[key];
    })
    res.render('admin/pages/server_ips',
        {
            menu:'server-ips',layout: './admin/partials/layout',
            ...data
        }
    )
}
exports.saveOtherAppIpAddress=(req,res)=>{
    let input=req.body;
    let {quzu_ip}=input;
    settings={
        ...settings,
        quzu_ip:quzu_ip
    }
    Setting.deleteMany({key:{$in:['quzu_ip']}}).then(()=>{
        Setting.insertMany([
            {
                key:'quzu_ip',
                value:quzu_ip
            }
        ]).then(()=>{
            return res.redirect('/admin/showOtherAppIpAddress');
        })
    })
}

exports.showCoinList=(req,res)=>{
    CoinList.find().then(data=>{
        let coin_list=data;
        res.render('admin/pages/coinlist',
            {
                menu:'crypto-coin-list-setting',layout: './admin/partials/layout',
                coin_list:coin_list
            }
        )
    })
}
exports.saveCoinList=(req,res)=>{
    let input=req.body;
    let {codes, names}=input;
    let update=[];
    CoinList.deleteMany({}).then(()=> {
        for (let i = 0; i < codes.length; i++) {
            update.push({
                code:codes[i],
                name:names[i]
            })
        }
        CoinList.insertMany(update).then(()=>{
            return res.redirect('/admin/showCoinList');
        })
    })
}

exports.showSeoSetting=(req,res)=>{
    var keys=[
        'news_meta_content',
        'support_meta_content',
        'instruction_meta_content',
        'mylist_meta_content',
        'youtubelist_meta_content',
        'activation_meta_content',
        'terms_meta_content',
        'privacy_meta_content',
        'news_meta_title',
        'support_meta_title',
        'instruction_meta_title',
        'mylist_meta_title',
        'youtubelist_meta_title',
        'activation_meta_title',
        'terms_meta_title',
        'privacy_meta_title',
        'news_meta_keyword',
        'support_meta_keyword',
        'instruction_meta_keyword',
        'mylist_meta_keyword',
        'youtubelist_meta_keyword',
        'activation_meta_keyword',
        'terms_meta_keyword',
        'privacy_meta_keyword'
    ]
    let promises=[];
    keys.map(function (item) {
        promises.push(helpers.getSetting(item));
    })
    Promise.all(promises).then(
        values=> {
            let data={};
            keys.map(function (item,index) {
                let value=values[index]!=null ? values[index].value : '';
                data[item]=value;
            })
            res.render('admin/pages/seo_setting',
                {
                    menu:'seo-setting',layout: './admin/partials/layout',
                    ...data
                }
            )
        }
    );
}
exports.saveSeoSetting=(req,res)=>{
    let input=req.body;
    let delete_key_array=Object.keys(input);
    let update_array=[];
    Object.keys(input).map(key=>{
        update_array.push({
            key:key,
            value:input[key]
        })
        settings[key]=input[key];
    })
    Setting.deleteMany(
    {
            key:
                {
                    $in:delete_key_array
                }
        }
        ).then(()=>{
            Setting.insertMany(update_array).then(()=>{
                return res.redirect('/admin/seo_setting');
            })
    })
}

exports.showCreditPackages=(req,res)=>{
    CreditPackage.find().then(credit_packages=>{
        res.render('admin/pages/credit_package',
            {
                menu:'credit_packages',layout: './admin/partials/layout',
                credit_packages:credit_packages
            }
        )
    })
}
exports.createCreditPackage=(req,res)=>{
    let {
        package_id,
        package_name,
        package_price,
        max_connections
    }=req.body;
    let update_data={
        name:package_name,
        duration:package_price,
        credit_count:max_connections
    }
    if(package_id==-1){
        CreditPackage.create(update_data).then(reseller_package=>{
            res.json({
                status:'success',
                _id:reseller_package._id
            })
        })
    }else{
        CreditPackage.findByIdAndUpdate(package_id,update_data).then(
            reseller_package=>{
                res.json({
                    status:'success',
                    _id:reseller_package._id
                })
            }
        )
    }
}
exports.deleteCreditPackage=(req,res)=>{
    let {package_id}=req.body;
    CreditPackage.findByIdAndDelete(package_id).then(()=>{
        res.json({status:'success'});
    })
}

exports.showResellers=(req,res)=>{
    let promises=[];
    promises.push(new Promise((resolve, reject)=>{
        Reseller.find({hidden:{$ne:1}}).then(resellers=>{
            resolve(resellers);
        })
    }))
    Promise.all(promises).then(result=>{
        let resellers=result[0], reseller_map={}
        resellers.map(item=>{
            reseller_map[item._id]=item.email;
        })
        resellers.map(item=>{
            if(item.created_by){
                if(reseller_map[item.created_by])
                    item.created_by=reseller_map[item.created_by];
                else
                    item.created_by='Parent Reseller Does not exist'
            }else
                item.created_by='Admin';
        })
        res.render('admin/pages/reseller',{
                menu:'resellers',layout: './admin/partials/layout',
                resellers:resellers
            }
        )
    })
}
exports.showResellerDetail=async(req,res)=>{
    let reseller_id=req.params.id;
    let promises=[];
    promises.push(new Promise((resolve, reject)=>{
        Reseller.findById(reseller_id).then(reseller=>resolve(reseller))
    }))
    promises.push(new Promise((resolve, reject)=>{
        Reseller.find({created_by:reseller_id,deleted:{$in:[0,null]}}).then(live_resellers=>resolve(live_resellers))
    }))
    promises.push(new Promise((resolve, reject)=>{
        Reseller.find({created_by:reseller_id,deleted:1}).then(deleted_resellers=>resolve(deleted_resellers))
    }))
    promises.push(new Promise((resolve, reject)=>{
        ResellerActivity.find({reseller_id:reseller_id}).then(activities=>resolve(activities))
    }))
    promises.push(new Promise((resolve, reject)=>{
        CreditHistory.find({to:reseller_id}).then(credits_receive_history=>resolve(credits_receive_history))
    }))
    promises.push(new Promise((resolve, reject)=>{
        CreditHistory.find({from:reseller_id}).then(credits_give_history=>resolve(credits_give_history))
    }))

    Promise.all(promises).then(async values=>{
        let reseller=values[0],live_resellers=values[1],deleted_resellers=values[2];
        let activities=values[3],credits_receive_history=values[4], credit_give_history=values[5];

        let credit_reseller_ids=[];  //Finding the resellers that gave this reseller credits, or got credits from this reseller
        credits_receive_history.map(item=>{
            if(item.from!=0)
                credit_reseller_ids.push(item.from)
        })
        credit_give_history.map(item=>{
            credit_reseller_ids.push(item.to)
        })

        let credit_reseller_map={};
        if(credit_reseller_ids.length>0){
            let credit_resellers=await Reseller.find({_id:{$in:credit_reseller_ids}});
            credit_reseller_map=getObjectFromArray(credit_resellers,'_id','single','email')
        }
        for(let i=0; i<credits_receive_history.length; i++){
            let from=credits_receive_history[i].from
            if(from==0)
                credits_receive_history[i].created_by='Admin'
            else {
                if(credit_reseller_map[from])
                    credits_receive_history[i].created_by=credit_reseller_map[from];
                else
                    credits_receive_history[i].created_by="Reseller Does not exist";
            }
        }
        for(let i=0; i<credit_give_history.length; i++){
            let to=credit_give_history[i].to
            if(credit_reseller_map[to])
                credit_give_history[i].give_to=credit_reseller_map[to];
            else
                credit_give_history[i].give_to="Reseller Does not exist";
        }

        res.render('admin/pages/activity_log',
            {
                menu:'reseller-devices',layout: './admin/partials/layout',
                activities:activities,
                reseller:reseller,
                live_resellers: live_resellers,
                deleted_resellers:deleted_resellers,
                credits_receive_history: credits_receive_history,
                credit_give_history:credit_give_history
            }
        )
    })
}
exports.createReseller=async (req,res)=>{
    let {credits,email,reseller_id,password, note, credit_note}=req.body;
    let temp=await Reseller.findOne({email:email});
    let max_connections=0;
    let user=await req.user;
    if(temp){
        if(reseller_id==-1){
            res.json({
                status:'error',
                msg:'Sorry, the email of reseller already exist'
            })
            return;
        }
        else {
            if (temp._id != reseller_id) {
                res.json({
                    status: 'error',
                    msg: 'Sorry, the email of reseller already exist'
                });
                return;
            }
        }
        max_connections=temp.max_connections;
    }
    if(!credits){
        if(reseller_id==-1){
            return res.json({
                status:'error',
                msg:'Sorry, credits required for new resellers'
            })
        }
        credits=0;
    }
    if(isNaN(credits))
        credits=0;
    else
        credits=parseInt(credits);
    max_connections+=credits;
    let update_data={
        email:email,
        max_connections:max_connections,
        is_admin:0,
        note:note
    }
    let password_hash;
    let reseller;
    if(reseller_id==-1){
        password_hash=await bcrypt.hash(password,saltRounds);
        update_data.password=password_hash;
        update_data.created_time=moment().utc().format('Y-MM-DD HH:mm')
        reseller=await Reseller.create(update_data)
    }
    else{
        if(password!=''){
            password_hash=await bcrypt.hash(password,saltRounds);
            update_data.password=password_hash;
        }
        reseller=await Reseller.findById(reseller_id);
        reseller.max_connections=max_connections;
        await reseller.update(update_data);
    }
    if(credits!=0){
        await CreditHistory.create({
            from:0, // from admin
            to:reseller._id,
            note: credit_note,
            activity_time:moment().utc().format('Y-MM-DD HH:mm'),
            credits:credits
        })
    }
    return res.json({
        status: 'success',
        id: reseller._id,
        max_connections:reseller.max_connections,
        used_count: reseller.used_count,
        remaining_count:reseller.max_connections-reseller.used_count,
        created_time:reseller.created_time,
        blocked:reseller.blocked
    });
}
exports.deleteReseller=async(req,res)=>{
    let reseller_id=req.body.reseller_id;
    await Reseller.findByIdAndDelete(reseller_id);
    res.json({status:'success'})
}
exports.blockReseller=async(req,res)=>{
    let {reseller_id, action}=req.body;
    await Reseller.findByIdAndUpdate(reseller_id,{
        blocked:action
    });
    res.json({status:'success'})
}

exports.showResellerActivations=(req,res)=>{
    res.render('admin/pages/reseller_activation',
        {
            menu:'reseller-activations',layout: './admin/partials/layout',
        }
    )
}

exports.getResellerActivations=async (req,res)=>{
    let {
        show_samsung,
        show_ios,
        show_tvos,
        show_android,
        show_lg,
        show_macos,
        draw,
        length,
        start,
        order,
        columns,
        search,
        mac_address,
        activity_time,
        reseller_email,
        app_name
    } = req.body;
    start = parseInt(start);
    length = parseInt(length);
    let columnIndex = order[0].column;
    let columnName = columns[columnIndex].data;
    let columnSortOrder = order[0].dir;
    let searchValue = search.value; // Search value

    let start_time=new Date().getTime();
    let filter_condition={status:'success'};
    if(show_android==false || show_android=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'android'}});
    if(show_samsung==false || show_samsung=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'samsung'}});
    if(show_ios==false || show_ios=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'iOS'}});
    if(show_lg==false || show_lg=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'lg'}});
    if(show_tvos==false || show_tvos=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'tvOS'}});
    if(show_macos==false || show_macos=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'macOS'}});

    if(mac_address)
    {
        mac_address=mac_address.toLowerCase();
        filter_condition=combineFilterCondition(filter_condition,{mac_address:{$regex: mac_address,$options: "i"}});
    }
    if(activity_time)
        filter_condition=combineFilterCondition(filter_condition,{activity_time:{$regex: activity_time,$options: "i"}});
    if(app_name!='all')
        filter_condition=combineFilterCondition(filter_condition,{app_name:app_name});
    if(reseller_email)
        filter_condition=combineFilterCondition(filter_condition,{reseller_email:reseller_email});


    let sort_filter={}
    if(columnName=='mac_address')
        sort_filter={mac_address:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='app_type')
        sort_filter={app_type:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='activity_time')
        sort_filter={activity_time:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='app_name')
        sort_filter={app_name:columnSortOrder==='asc' ? 1 : -1}


    let totalRecords=await ResellerActivity.countDocuments(filter_condition);
    let transactions=await ResellerActivity.find(filter_condition).skip(start).limit(length).sort(sort_filter);



    let result_data=transactions;
    let obj_keys=['mac_address','app_type','activity_time','app_name','reseller_email'];
    for(let i=0;i<result_data.length;i++){
        let item=result_data[i];
        obj_keys.map(key=>{
            if(!item[key])
                item[key]='';
        })
    }

    let end_time=new Date().getTime();
    let execution_time=(end_time-start_time)/1000;
    res.json({data:result_data,draw :draw,iTotalDisplayRecords:totalRecords,
        iTotalRecords:totalRecords,execution_time:execution_time});
}

exports.showTermsContent=(req,res)=>{
    TermsContent.findOne().then(contents=>{
        res.render(
            'admin/pages/terms_content',
            {
                menu:'terms',layout: './admin/partials/layout',reseller_content:contents
            }
        )
    })
}
exports.saveTermsContent=(req,res)=>{
    let detail=req.body['section-content'];
    TermsContent.findOne().then(reseller_content=>{
        if(reseller_content){
            reseller_content.update({
                contents:detail
            }).then(()=>{
                return res.redirect('/admin/terms');
            })
        }else{
            TermsContent.create({
                contents:detail
            }).then(()=>{
                return res.redirect('/admin/terms');
            })
        }
    })
}
exports.showPrivacyContent=(req,res)=>{
    PrivacyContent.findOne().then(contents=>{
        res.render(
            'admin/pages/privacy_content',
            {
                menu:'privacy',layout: './admin/partials/layout',reseller_content:contents
            }
        )
    })
}
exports.savePrivacyContent=(req,res)=>{
    let detail=req.body['section-content'];
    PrivacyContent.findOne().then(reseller_content=>{
        if(reseller_content){
            reseller_content.update({
                contents:detail
            }).then(()=>{
                return res.redirect('/admin/privacy');
            })
        }else{
            PrivacyContent.create({
                contents:detail
            }).then(()=>{
                return res.redirect('/admin/privacy');
            })
        }
    })
}

exports.showResellerContent=(req,res)=>{
    ResellerContent.findOne().then(contents=>{
        res.render(
            'admin/pages/reseller_content',
            {
                menu:'reseller-content',layout: './admin/partials/layout',reseller_content:contents
            }
        )
    })
}
exports.saveResellerContent=(req,res)=>{
    let detail=req.body['section-content'];
    ResellerContent.findOne().then(reseller_content=>{
        if(reseller_content){
            reseller_content.update({
                contents:detail
            }).then(()=>{
                return res.redirect('/admin/reseller-content');
            })
        }else{
            ResellerContent.create({
                contents:detail
            }).then(()=>{
                return res.redirect('/admin/reseller-content');
            })
        }
    })
}

exports.showSupportEmailSetting=(req,res)=>{
    let support_email=settings.support_email;
    res.render('admin/pages/support_email_setting',
        {
            menu:'support_email-setting',layout: './admin/partials/layout',
            support_email:support_email
        }
    )
}
exports.saveSupportEmailSetting=(req,res)=>{
    let input=req.body;
    let {support_email}=input;
    settings.support_email=support_email;
    Setting.deleteMany({key:{$in:['support_email']}}).then(()=>{
        Setting.insertMany([
            {
                key:'support_email',
                value:support_email
            }
        ]).then(()=>{
            return res.redirect('/admin/showSupportEmailSetting');
        })
    })
}

exports.showYoutubeApiKey=(req,res)=>{
    let youtube_api_key=settings.youtube_api_key;
    res.render('admin/pages/youtube_api_key_setting',
        {
            menu:'youtube_api_key_setting',layout: './admin/partials/layout',
            youtube_api_key:youtube_api_key
        }
    )
}
exports.saveYoutubeApiKey=(req,res)=>{
    let input=req.body;
    let {youtube_api_key}=input;
    settings.youtube_api_key=youtube_api_key;
    Setting.deleteMany({key:{$in:['youtube_api_key']}}).then(()=>{
        Setting.insertMany([
            {
                key:'youtube_api_key',
                value:youtube_api_key
            }
        ]).then(()=>{
            return res.redirect('/admin/showYoutubeApiKey');
        })
    })
}

exports.showProfile=async (req,res)=>{
    if(process.env.MAINTANCE_MODE==1)
        return res.render('maintance',{layout:false});

    let user=await req.user;
    res.render('admin/pages/profile',
        {
            menu:'profile',layout: './admin/partials/layout',
            user:user
        }
    )
}
exports.updateProfile=async (req,res)=>{
    let {name,email,password}=req.body
    let user=await req.user;
    user.name=name;
    user.email=email;
    if(password!=''){
        user.password=await bcrypt.hash(password,saltRounds);
    }
    user.save().then(()=>{
        return res.redirect('/admin/profile');
    });
}

exports.showAndroidUpdate=(req,res)=>{
    let promises=[];
    promises.push(helpers.getSetting('android_version_code'))
    promises.push(helpers.getSetting('apk_url'))
    Promise.all(promises).then(values=>{
        res.render('admin/pages/android_update',
            {
                menu:'android-update',
                layout: './admin/partials/layout',
                apk_url:values[1] ? values[1].value : '',
                android_version_code:values[0] ? values[0].value : ''
            }
        )
    })
}
exports.saveAndroidUpdate=(req,res)=>{
    let {android_version_code}=req.body;
    let file=req.files['apk_file'];
    let PATH = path.resolve(__dirname, "../public/upload");
    let file_name='android_'+android_version_code+'.apk';
    file.mv(PATH+'/'+file_name,function(err) {
        if (err)
            console.log('upload error',err);
    });
    Setting.deleteMany({key:{$in:['android_version_code','apk_url']}}).then(()=>{
        Setting.insertMany([
            {
                key:'android_version_code',
                value:android_version_code
            },
            {
                key:'apk_url',
                value:'/upload/'+file_name
            }
        ]).then(()=>{
            settings.android_version_code=android_version_code;
            settings.apk_url='/upload/'+file_name;
            return res.redirect('/admin/android-update')
        })
    })
}

exports.showPlayLists=(req,res)=>{
    res.render('admin/pages/playlist',{menu:'devices',layout: './admin/partials/layout' })
}

exports.showIpSummary = (req, res) => {
    res.render('admin/pages/ip-summary', {menu: 'devices-ip-summary', layout: './admin/partials/layout'})
}

exports.showPlaylistSummary = (req, res) => {
    res.render('admin/pages/playlist-summary', {menu: 'devices-playlist-summary', layout: './admin/partials/layout'})
}

function combineFilterCondition(prev_condition, new_condition){
    prev_condition=JSON.parse(JSON.stringify(prev_condition));
    let result={};
    if(Object.keys(prev_condition).length>0){
        if(prev_condition['$and']){
            prev_condition['$and'].push(new_condition);
            result=prev_condition;
        }else{
            result={
                $and:[prev_condition,new_condition]
            }
        }
    }else
        result=new_condition;
    return result;
}
exports.getPlaylists=async (req,res)=>{
    let {
        show_samsung,
        show_ios,
        show_android,
        show_lg,
        show_tvos,
        show_macos,
        show_activated,
        show_trial,
        date_filter,
        date_from,
        date_to,
        draw,
        length,
        start,
        order,
        columns,
        search,
    }=req.body;
    start=parseInt(start);
    length=parseInt(length);
    let columnIndex=order[0].column;
    let columnName=columns[columnIndex].data;
    let columnSortOrder=order[0].dir;
    let searchValue = search.value; // Search value
    let filter_condition={};
    if(show_android==false || show_android=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'android'}});
    if(show_samsung==false || show_samsung=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'samsung'}});
    if(show_ios==false || show_ios=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'iOS'}});
    if(show_lg==false || show_lg=='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'lg'}});
    if(!show_tvos || show_tvos==='false')
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'tvOS'}});
    if(!show_macos || show_macos==='false'){
        filter_condition=combineFilterCondition(filter_condition,{app_type:{$ne:'macOS'}});
    }
    if(show_activated==false || show_activated=='false'){
        filter_condition=combineFilterCondition(filter_condition,
            {
                is_trial:{$ne:2}
            }
        );
    }
    if(show_trial==false || show_trial=='false'){
        filter_condition=combineFilterCondition(filter_condition,
            {
                is_trial:2
            }
        )
    }
    if(searchValue!=null && searchValue!=='') {
        filter_condition = combineFilterCondition(filter_condition,
            {
                $or:[
                    {mac_address: {$regex: searchValue, $options: "i"}},
                    {ip: {$regex: searchValue, $options: "i"}},
                    {app_type: {$regex: searchValue, $options: "i"}}
                ]
            }
        );
    }

    // Date filtering
    if(date_filter && date_filter !== 'all') {
        let dateCondition = {};
        const today = moment().format('YYYY-MM-DD');
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        const lastWeek = moment().subtract(7, 'days').format('YYYY-MM-DD');
        const lastMonth = moment().subtract(30, 'days').format('YYYY-MM-DD');

        switch(date_filter) {
            case 'today':
                dateCondition = {
                    created_time: {
                        $gte: today + ' 00:00',
                        $lte: today + ' 23:59'
                    }
                };
                break;
            case 'yesterday':
                dateCondition = {
                    created_time: {
                        $gte: yesterday + ' 00:00',
                        $lte: yesterday + ' 23:59'
                    }
                };
                break;
            case 'last_week':
                dateCondition = {
                    created_time: {
                        $gte: lastWeek + ' 00:00'
                    }
                };
                break;
            case 'last_month':
                dateCondition = {
                    created_time: {
                        $gte: lastMonth + ' 00:00'
                    }
                };
                break;
            case 'custom':
                if(date_from && date_to) {
                    dateCondition = {
                        created_time: {
                            $gte: date_from + ' 00:00',
                            $lte: date_to + ' 23:59'
                        }
                    };
                } else if(date_from) {
                    dateCondition = {
                        created_time: {
                            $gte: date_from + ' 00:00'
                        }
                    };
                } else if(date_to) {
                    dateCondition = {
                        created_time: {
                            $lte: date_to + ' 23:59'
                        }
                    };
                }
                break;
        }

        if(Object.keys(dateCondition).length > 0) {
            filter_condition = combineFilterCondition(filter_condition, dateCondition);
        }
    }
    let select_field={_id:1,mac_address:1,app_type:1,is_trial:1,created_time:1,expire_date:1, ip: 1};
    let totalRecords=await Device.countDocuments(filter_condition);
    let playlists,sort_filter={};
    if(columnName=='app_type')
        sort_filter={app_type:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='ip')
        sort_filter={ip:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='expire_date')
        sort_filter={expire_date:columnSortOrder==='asc' ? 1 : -1}
    if(columnName=='created_time')
        sort_filter={created_time:columnSortOrder==='asc' ? 1 : -1}
    playlists=await Device.find(filter_condition,select_field).skip(start).limit(length).sort(sort_filter);
    let result_data=[];
    playlists.map(item=>{
        let action='<button class="btn btn-sm btn-danger btn-deactivate" data-playlist_id="'+item._id+'">Deactivate</button>';
        if(item.is_trial!=2){
            action='<button class="btn btn-sm btn-success btn-activate" data-playlist_id="'+item.id+'">Activate</button>';
        }
        let temp={
            _id:item._id,
            mac_address:item.mac_address,
            ip:item.ip || '',
            app_type:item.app_type ? item.app_type: '',
            expire_date:item.expire_date,
            created_time:item.created_time,
            action:action
        }
        result_data.push(temp);
    })
    result_data.map(item=>{
        item.action+='<a href="'+'/admin/playlist/'+item._id+'" target="_blank" style="margin:0 5px">'+
            '<button class="btn btn-sm btn-primary">'+
            '<i class="fa fa-eye"></i>'+
            '</button>'+
            '</a>';
    })
    res.json({data:result_data,draw :draw,iTotalDisplayRecords:totalRecords,iTotalRecords:totalRecords});
}

exports.getIpSummary = async (req, res) => {
    let {
        show_samsung,
        show_ios,
        show_android,
        show_lg,
        show_tvos,
        show_macos,
        show_activated,
        show_trial,
        draw,
        length,
        start,
        order,
        columns,
        search,
    } = req.body;

    start = parseInt(start);
    length = parseInt(length);

    let columnIndex = order[0].column;
    let columnName = columns[columnIndex].data;
    let columnSortOrder = order[0].dir;
    let searchValue = search.value; // Search value
    let filter_condition = {
        ip: {
            $ne: '',
            $exists: true
        }
    };

    if (show_android === false || show_android === 'false') filter_condition = combineFilterCondition(filter_condition, {
        app_type: {
            $ne: 'android'
        }
    });
    if (show_samsung === false || show_samsung === 'false') filter_condition = combineFilterCondition(filter_condition, {
        app_type: {
            $ne: 'samsung'
        }
    });
    if (show_ios === false || show_ios === 'false') filter_condition = combineFilterCondition(filter_condition, {
        app_type: {
            $ne: 'iOS'
        }
    });
    if (show_lg === false || show_lg === 'false') filter_condition = combineFilterCondition(filter_condition, {
        app_type: {
            $ne: 'lg'
        }
    });

    if (!show_tvos || show_tvos === 'false') filter_condition = combineFilterCondition(filter_condition, {
        app_type: {
            $ne: 'tvOS'
        }
    });
    if (!show_macos || show_macos === 'false') {
        filter_condition = combineFilterCondition(filter_condition, {
            app_type: {
                $ne: 'macOS'
            }
        });
    }
    if (show_activated == false || show_activated == 'false') {
        filter_condition = combineFilterCondition(filter_condition, {
            is_trial: {
                $ne: 2
            }
        });
    }
    if (show_trial == false || show_trial == 'false') {
        filter_condition = combineFilterCondition(filter_condition, {
            is_trial: 2
        })
    }
    if (searchValue != null && searchValue !== '') {
        filter_condition = combineFilterCondition(filter_condition, {
            $or: [{
                mac_address: searchValue
            }, {
                ip: searchValue
            }, {
                app_type: searchValue
            }]
        });
    }

    let countResult = await Device.aggregate([
        {
            $match: filter_condition
        },
        {
            $group: {
                _id: '$ip'
            },
        },
        {
            $count: 'total_rows'
        }
    ], { allowDiskUse: true });

    let playlists, sort_filter = {};

    if (columnName === 'ip') sort_filter = {
        ip: columnSortOrder === 'asc' ? 1 : -1
    }

    if (columnName === 'total_registered_devices') sort_filter = {
        total_registered_devices: columnSortOrder === 'asc' ? 1 : -1
    }

    playlists = await Device.aggregate([
        {
            $match: filter_condition
        },
        {
            $project: {
                ip: 1
            }
        },
        {
            $group: {
                _id: '$ip',
                total_registered_devices: {
                    $sum: 1
                }
            }
        },
        {
            $sort: sort_filter
        },
        {
            $skip: start
        },
        {
            $limit: length
        },
        {
            $lookup: {
                from: "blocklists",
                localField: "_id",
                foreignField: "value",
                as: "blocklist",
                pipeline: [
                    {
                        $match: {
                            type: 'ip_address'
                        }
                    },
                    {$limit: 1}, {$project: {_id: 1}}
                ]
            }
        },
        {
            $addFields: {
                is_blocked: {
                    $toBool: { $size: "$blocklist" }
                }
            }
        },
    ], { allowDiskUse: true });

    let result_data = [];

    playlists.map(item => {
        let action = '<button class="btn btn-sm btn-danger btn-deactivate" data-playlist_id="' + item._id + '">Deactivate</button>';

        if (item.is_trial !== 2) {
            action = '<button class="btn btn-sm btn-success btn-activate" data-playlist_id="' + item.id + '">Activate</button>';
        }

        let temp = {
            ip: item._id,
            is_blocked: item.is_blocked ? 'Yes' : 'No',
            total_registered_devices: item.total_registered_devices || 0,
            action: action
        }

        result_data.push(temp);
    })

    result_data.map(item => {
        item.action += '<a href="' + '/admin/playlist/' + item._id + '" target="_blank" style="margin:0 5px">' + '<button class="btn btn-sm btn-primary">' + '<i class="fa fa-eye"></i>' + '</button>' + '</a>';
    })
    res.json({
        data: result_data,
        draw: draw,
        iTotalDisplayRecords: countResult?[0].total_rows || 0:0,
        iTotalRecords: countResult?[0].total_rows || 0:0
    });
}

exports.getPlaylistSummary = async (req, res) => {
    let {
        draw,
        length,
        start,
        order,
        columns,
        search,
    } = req.body;

    start = parseInt(start);
    length = parseInt(length);

    let columnIndex = order[0].column;
    let columnName = columns[columnIndex].data;
    let columnSortOrder = order[0].dir;
    let searchValue = search.value; // Search value
    let filter_condition = {};

    if (searchValue != null && searchValue !== '') {
        const device = await Device.findOne({
            mac_address: searchValue
        })

        if (!device) {
            return res.json({data: [], draw: draw, iTotalDisplayRecords: 0, iTotalRecords: 0});
        }

        filter_condition = combineFilterCondition(filter_condition,
            {device_id: device ? device._id.toString() : null},
        );
    }

    let sort_filter = {};

    if (columnName === 'total_urls') {
        sort_filter = {total_urls: columnSortOrder === 'asc' ? 1 : -1}
    }

    // First get total count before pagination
    const countPipeline = [
        {
            $group: {
                _id: "$device_id",
                total_urls: {
                    $sum: 1
                }
            }
        }
    ];

    if (Object.keys(filter_condition).length > 0) {
        countPipeline.unshift({
            $match: filter_condition
        });
    }

    const totalCount = await PlayList.aggregate([
        ...countPipeline,
        {
            $count: "total"
        }
    ]);

    const total_rows = totalCount.length > 0 ? totalCount[0].total : 0;

    // Now get paginated data
    const pipeline = [
        {
            $group: {
                _id: "$device_id",
                total_urls: {
                    $sum: 1
                }
            }
        },
    ]
    if (Object.keys(sort_filter).length > 0) {
        pipeline.push({
            $sort: sort_filter
        });
    }

    pipeline.push(
        {
            $skip: start
        },
        {
            $limit: length
        },
        {
            $addFields: {
                convertedId: {
                    $toObjectId: "$_id"
                }
            }
        },
        {
            $lookup: {
                from: "devices",
                localField: "convertedId",
                foreignField: "_id",
                as: "device"
            }
        },
        {
            $unwind: {
                path: "$device"
            }
        },
        {
            $project: {
                _id: 0,
                mac_address: "$device.mac_address",
                app_type: "$device.app_type",
                is_active: {
                    $cond: {
                      if: { $eq: ["$device.is_trial", 2] },
                      then: 'Yes',
                      else: '<span class="text-danger">No</span>'
                    }
                },
                total_urls: 1,
            }
        }
    );

    if (Object.keys(filter_condition).length > 0) {
        pipeline.unshift({
            $match: filter_condition
        });
    }

    const devices = await PlayList.aggregate(pipeline);

    res.json({
        data: devices,
        draw: draw,
        iTotalDisplayRecords: total_rows,
        iTotalRecords: total_rows
    });
}


// exports.uploadFlixData=async (req,res)=>{
//     console.clear();
//     let promises=[];
//     let start_time1=new Date().getTime()/1000;
//     let created_time=moment().subtract(7,'days').format('Y-MM-DD');
//     promises.push(new Promise((resolve, reject)=>{ // getting devices first
//         let sql=`select *, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at from play_lists where is_trial=2 or (is_trial!=2 && created_at>"${created_time}")`
//         console.log(sql);
//         mysql_connection.query(sql, function (error, result, fields){
//             if(error)
//             {
//                 throw error;
//                 reject();
//             }
//             console.log('device getting finished', result.length);
//             resolve(result);
//         })
//     }))
//     promises.push(new Promise((resolve, reject)=>{
//         let sql=`select *,DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at from play_list_urls`
//         mysql_connection.query(sql, function (error, result, fields){
//             if(error)
//             {
//                 throw error;
//                 reject();
//             }
//             console.log('playlist urls getting finished', result.length);
//             resolve(result);
//         })
//     }))
//     promises.push(new Promise((resolve, reject)=>{
//         let sql=`select *,DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at from transactions`
//         mysql_connection.query(sql, function (error, result, fields){
//             if(error)
//             {
//                 throw error;
//                 reject();
//             }
//             console.log('transactions getting finished', result.length);
//             resolve(result);
//         })
//     }))
//     promises.push(new Promise((resolve, reject)=>{
//         let sql=`select * from admins`
//         mysql_connection.query(sql, function (error, result, fields){
//             if(error)
//             {
//                 throw error;
//                 reject();
//             }
//             console.log('admins getting finished', result.length);
//             console.log("admins=",result);
//             resolve(result);
//         })
//     }))
//     await Device.deleteMany({});
//     await PlayList.deleteMany({});
//     // await Admin.deleteMany({});
//     await Transaction.deleteMany({});
//
//     Promise.all(promises).then(async function (result) {
//         var end_time1=new Date().getTime()/1000;
//         console.log('Total db getting time=',(end_time1-start_time1));
//         let playlists = result[0], playlist_urls = result[1], admins = result[3], transactions = result[2];
//         let device_object_ids = {}, admin_object_ids = {};
//         let device_records = [], playlist_records = [], admin_records = [], transaction_records = [];
//         admins.map(function (admin) {
//             let object_id = new ObjectID();
//             admin_object_ids[admin.id.toString()] = object_id;
//         })
//         admins.map(function (admin, index) {
//             let temp = {
//                 _id: admin_object_ids[admin.id.toString()],
//                 ...admin,
//                 password: admin.password.replace("$2y$", "$2a$")
//             }
//             admin_records.push(temp);
//         })
//         playlists.map(function (playlist) {
//             let object_id=new ObjectID();
//             device_object_ids[playlist.id.toString()]=object_id;
//             device_records.push(
//                 {
//                     _id:object_id,
//                     ...playlist,
//                     mac_address:playlist.mac_address.toLowerCase(),
//                     created_time:playlist.created_at
//                 }
//             )
//         })
//         console.log(typeof device_records[0].created_at);
//         playlist_urls.map(function (item) {
//             let playlist_id=item.playlist_id.toString();
//             let device_object_id=device_object_ids[playlist_id];
//             if(device_object_id)
//                 playlist_records.push({
//                     device_id:device_object_id,
//                     ...item,
//                     created_time:item.created_at
//                 })
//         });
//         transactions.map(item=>{
//             let payment_type=item.payment_type;
//             if(payment_type==='Paypal Test')
//                 payment_type='paypal';
//             if(payment_type==='card')
//                 payment_type='stripe';
//             if(device_object_ids[item.playlist_id])
//                 transaction_records.push(
//                     {
//                         device_id:device_object_ids[item.playlist_id],
//                         ...item,
//                         created_time:item.created_at,
//                         payment_type: payment_type
//                     }
//                 )
//         })
//         let end_time2=new Date().getTime()/1000;
//         console.log('Total array operation time=',(end_time2-end_time1));
//         console.log("PlayList Record Length",playlist_records.length);
//         console.log("Device Record Length",device_records.length);
//         console.log("Transaction Record Length", transaction_records.length);
//         // await Admin.insertMany(admin_records);
//
//         let insert_chunk_size=5000, n_step, iteration;
//         n_step=Math.ceil(device_records.length/insert_chunk_size);
//         console.log('!!!!!!!!!!!!!!! Inserting Devices Started !!!!!!!!!!!!!!!!!!!!')
//         console.log(device_records.slice(0,5));
//         for(iteration=0;iteration<n_step;iteration++){
//             let insert_records=device_records.slice(iteration*insert_chunk_size,(iteration+1)*insert_chunk_size)
//             await Device.insertMany(insert_records)
//             console.log(iteration+' Iteration Finished Of ',n_step);
//         }
//         console.log('Inserting Device Records Finished\n\n\n\n\n\n')
//
//         console.log('!!!!!!!!!!!!!!! Inserting Playlists Started !!!!!!!!!!!!!!!!!!!!')
//         n_step=Math.ceil(playlist_records.length/insert_chunk_size);
//         for(iteration=0;iteration<n_step;iteration++){
//             let insert_records=playlist_records.slice(iteration*insert_chunk_size,(iteration+1)*insert_chunk_size)
//             await PlayList.insertMany(insert_records)
//             console.log(iteration+' Iteration Finished Of ',n_step);
//         }
//         console.log('Inserting PlayList Records Finished\n\n\n\n\n\n')
//
//         console.log('!!!!!!!!!!!!!!! Inserting Transactions Started !!!!!!!!!!!!!!!!!!!!')
//         n_step=Math.ceil(transaction_records.length/insert_chunk_size);
//         for(iteration=0;iteration<n_step;iteration++){
//             let insert_records=transaction_records.slice(iteration*insert_chunk_size,(iteration+1)*insert_chunk_size)
//             await Transaction.insertMany(insert_records)
//             console.log(iteration+' Iteration Finished Of ',n_step);
//         }
//         console.log('Inserting Transaction Records Finished\n\n\n\n\n\n')
//         console.log("\n\n\n!!!!!!!!!!!everything finished!!!!!!!!!!!!!!")
//         return res.send("OK, Everything Finished")
//     })
// }
exports.addMacToTransaction=async (req, res)=>{
    let promises=[];
    promises.push(new Promise((resolve, reject)=>{
        Transaction.find().then(transactions=>{
            console.log("transaction getting finished")
            resolve(transactions);
        })
    }))
    promises.push(new Promise((resolve, reject)=>{
        Device.find().then(devices=>{
            console.log("devices getting finished")
            resolve(devices);
        })
    }))
    Promise.all(promises).then(async values=>{
        let transactions=values[0], devices=values[1];
        let device_map={};
        devices.map(item=>{
            device_map[item._id]=item;
        })
        let transaction_records=[];
        transactions.map(item=>{
            let device_id, device, mac_address, app_type;
            device_id=item.device_id;
            device=device_map[device_id] ? device_map[device_id] : null;
            mac_address=device ? device.mac_address : '';
            app_type=device ? device.app_type : ''
            app_type=app_type ? app_type : ''
            if(mac_address){
                transaction_records.push({
                    _id:item._id,
                    mac_address: mac_address,
                    app_type: app_type
                })
            }
        })

        console.log('here all operations finished');
        console.log(transaction_records.length, transaction_records.slice(0,5));

        let chunk_size=1000, n_step;
        n_step=Math.ceil(transaction_records.length/chunk_size);
        for(let iteration=0;iteration<n_step; iteration++){
            let promises1=[];
            let sub_items=transaction_records.slice(iteration*chunk_size,(iteration+1)*chunk_size);
            sub_items.map(item=>{
                promises1.push(new Promise((resolve, reject)=>{
                    Transaction.findByIdAndUpdate(item._id, {
                        mac_address:item.mac_address,
                        app_type: item.app_type
                    }).then(()=>resolve())
                }))
            })
            await Promise.all(promises1);
            console.log((iteration+1), "Iteration finished of ",n_step);
        }
        return res.send("all are finished");
    })
}
exports.updateExpireDateFormat=async (req, res)=>{
    let devices=await Device.find({expire_date:{$regex: ":",$options: "i"}})
    let promises=[];
    devices.map(item=>{
        promises.push(new Promise((resolve, reject)=>{
            item.expire_date=item.expire_date.slice(0,-6);
            console.log(item.expire_date);
            item.save().then(()=>{
                resolve();
            })
        }))
    })
    console.log(devices.slice(0,2),devices.length)
    Promise.all(promises).then(()=>{
        return res.json(devices);
    })
}
exports.updateResellerActivity=async (req, res)=>{
    let reseller_activities=await ResellerActivity.find({$or:[{reseller_email:null},{app_type:null}]});
    let reseller_ids=[], mac_addresses=[];
    reseller_activities.map(item=>{
        if(!reseller_ids.includes(item.reseller_id))
            reseller_ids.push(item.reseller_id);
        if(!mac_addresses.includes(item.mac_address))
            mac_addresses.push(item.mac_address);
    })

    let promises=[];
    promises.push(new Promise((resolve, reject)=>{
        Reseller.find({_id:{$in:reseller_ids}}).then(resellers=>resolve(resellers));
    }))
    promises.push(new Promise((resolve, reject)=>{
        Device.find({mac_address:{$in:mac_addresses}}).then(devices=>resolve(devices));
    }))
    Promise.all(promises).then(values=>{
        let resellers_map={}, devices_map={};
        let resellers=values[0], devices=values[1];
        resellers.map(item=>{
            resellers_map[item._id]=item.email;
        })
        devices.map(item=>{
            devices_map[item.mac_address]=item.app_type;
        })
        let promises1=[];
        reseller_activities.map(item=>{
            if(resellers_map[item.reseller_id])
                item.reseller_email=resellers_map[item.reseller_id];
            if(!item.app_name)
                item.app_name='flix';
            if(item.app_name=='flix'){
                if(devices_map[item.mac_address])
                    item.app_type=devices_map[item.mac_address];
            }
            promises1.push((new Promise((resolve, reject)=>{
                item.save().then(()=>resolve())
            })))
        })
        Promise.all(promises1).then(()=>{
            return res.send('ok');
        })
    })
}

exports.activatePlaylist=async(req,res)=>{
    let {playlist_id,action}=req.body;
    Device.findById(playlist_id).then(async play_list=>{
        let today=moment();
        if(action==1){
            let current_expire_date=today.format('Y-MM-DD');
            if(play_list.expire_date>current_expire_date)
                current_expire_date=play_list.expire_date;
            let expire_date;
            play_list.is_trial=2;
            expire_date=moment(current_expire_date).add(5000,'M').format('Y-MM-DD');
            play_list.expire_date=expire_date;
            play_list.save().then(()=>{
                res.json({
                    status: 'success',
                    expire_date: play_list.expire_date
                })
            });
        }
        else{
            let expire_date=today.subtract(1,'d').format('Y-MM-DD');
            play_list.expire_date=expire_date;
            play_list.is_trial=1;
            play_list.save().then(()=>{
                res.json({
                    status: 'success',
                    expire_date: play_list.expire_date
                })
            });
        }
    })
}
exports.showDeviceDetail=async(req,res)=>{
    let id=req.params.id;
    let promises=[];
    promises.push(new Promise((resolve, reject)=>{
        Device.findById(id).then(device=>{
            resolve(device);
        })
    }))
    promises.push(new Promise((resolve, reject)=>{
        PlayList.find({device_id:id}).then(playlists=>{
            resolve(playlists);
        })
    }))
    promises.push(new Promise((resolve, reject)=>{
        Transaction.find({device_id:id}).then(transactions=>{
            resolve(transactions);
        })
    }))
    promises.push(new Promise((resolve, reject)=>{
        Reseller.find({device_id:id}).then(transactions=>{
            resolve(transactions);
        })
    }))
    Promise.all(promises).then(async result=>{
        let device=result[0];
        let playlists=result[1];
        let transactions=result[2];
        let reseller_activities=await ResellerActivity.find({mac_address:device.mac_address,app_name:'flix'})
        res.render('admin/pages/playlist_detail',
            {
                menu:'playlists',layout: './admin/partials/layout',
                device:device,
                playlists:playlists,
                transactions:transactions,
                reseller_activities:reseller_activities
            }
        )
    })
}
exports.downloadCoinList=(req,res)=>{
    CoinList.deleteMany().then(()=>{
        axios.get("https://flixapp.tv/api/getCoinList").then(result=>{
            let records=[];
            let coin_lists=result.data[0].data;
            coin_lists.map(item=>{
                records.push({
                    code:item.code,
                    name:item.name
                })
            })
            CoinList.insertMany(records).then(()=>{
                res.send('OK');
            })
        })
    })
}


