
const moment=require('moment');
let Reseller=require('../models/Reseller.model');
let Device=require('../models/Device.model');
let CreditPackage=require('../models/CreditPackage.model');
let ResellerActivity=require('../models/ResellerActivity.model');
let ResellerContent=require('../models/ResellerContent.model');
let CreditHistory=require('../models/CreditHistory.model');
let axios=require('axios');

const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.showResellerLogin=async (req,res)=>{
    let keys=['phone_number','email'];
    let data={};
    keys.map(key => {
        data[key] = settings[key] ? settings[key] : ''
    })
    let reseller_content=await ResellerContent.findOne();
    let support_email=settings.support_email;
    res.render('reseller/pages/login',
        {
            menu:'reseller-login',
            title:'Flix IPTV Reseller Login',
            keyword:'Flix IPTV Reseller Login',
            ...data,
            reseller_content:reseller_content,
            support_email: support_email
        }
    );
}
exports.postResellerLogin=(req,res)=>{
    let {email,password}=req.body;
    email=email.toLowerCase();
    Reseller.findOne({email:email}).then(async reseller=>{
        if(!reseller){
            req.flash('reseller-auth-error','Sorry, email or password is not correct');
            return res.redirect('/reseller/login');
        }else{
            if (await bcrypt.compare(password, reseller.password)) {
                req.session.reseller_id=reseller._id;
                return res.redirect('/reseller/profile')
            } else {
                req.flash('reseller-auth-error','Sorry, email or password is not correct');
                return res.redirect('/reseller/login');
            }
        }
    })
}
exports.logOut=async(req,res)=>{
    req.session.reseller_id=null;
    return res.redirect('/reseller/login');
}

exports.showProfile=async (req,res)=>{
    if(process.env.MAINTANCE_MODE==1)
        return res.render('maintance',{layout:false});
    let user=await Reseller.findById(req.session.reseller_id);
    res.render('reseller/pages/profile',
        {
            menu:'profile',layout: './reseller/partials/layout',
            user:user
        }
    )
}
exports.updateProfile=async (req,res)=>{
    let {email,password}=req.body
    let user=await Reseller.findById(req.session.reseller_id);
    // user.email=email;
    if(password!=''){
        user.password=await bcrypt.hash(password,saltRounds);
    }
    user.save().then(()=>{
        return res.redirect('/reseller/profile');
    });
}

exports.showActivate=async(req,res)=>{
    if(process.env.MAINTANCE_MODE==1)
        return res.render('maintance',{layout:false})
    let reseller_id=req.session.reseller_id;
    let user=await Reseller.findById(reseller_id);
    let credit_packages=await CreditPackage.find();
    res.render('reseller/pages/activation',
        {
            menu:'activate-device',layout: './reseller/partials/layout',
            user:user,
            credit_packages: credit_packages
        }
    )
}
exports.postActivate=async(req,res)=>{
    let {mac_address, note, credit_count, app_name}=req.body;
    credit_count=parseInt(credit_count);
    let reseller_id=req.session.reseller_id;
    mac_address=mac_address.toLowerCase();

    let promises=[];
    promises.push(new Promise((resolve, reject)=>{
        Reseller.findById(req.session.reseller_id).then(reseller=>resolve(reseller));
    }))
    promises.push(new Promise((resolve, reject)=>{
        CreditPackage.findOne({credit_count:credit_count}).then(credit_package=>resolve(credit_package));
    }))
    Promise.all(promises).then(async values=>{
        let reseller=values[0], credit_package=values[1];
        if(!reseller)
            return res.json({
                status:'error',
                msg:'Sorry, your session expired, please reload page and try again'
            })
        if(reseller.max_connections<reseller.used_count+credit_count)
            return res.json({
                status:'error',
                msg:"Sorry, you don't have enough credits for this operation"
            })
        let result;

        let duration=credit_package.duration;
        let promises1=[];
        let activity_time=moment().utc().format('Y-MM-DD HH:mm');
        let reseller_activity_data={
            reseller_id:reseller_id,
            mac_address:mac_address,
            used_credit:credit_count,
            activity_time:activity_time,
            note:note,
            app_name:app_name,
            reseller_email:reseller.email
        }

        if(app_name==='flix'){
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

            device.expire_date=moment(current_expire_date).add(duration,'M').format('Y-MM-DD');
            if(duration>=500)
                device.is_trial=2;
            else
                device.is_trial=1;
            promises1.push(new Promise((resolve, reject)=>{
                device.save().then(()=>resolve())
            }))
            promises1.push(new Promise((resolve, reject)=>{
                ResellerActivity.create({
                    ...reseller_activity_data,
                    app_type:device.app_type,
                    from_date:current_expire_date,
                    to_date:device.expire_date
                }).then(()=>resolve())
            }))
        }
        else if(app_name==='quzu'){
            let url="https://quzutv.net/api/activate-from-external";
            let result1=await axios.post(url,{
                mac_address:mac_address,
                duration:duration,
                reseller_id:reseller_id,
                reseller_email:reseller.email,
                note:note
            })
            let data=result1.data;
            if(data.status==='success'){
                promises1.push(new Promise((resolve, reject)=>{
                    ResellerActivity.create({
                        ...reseller_activity_data,
                        from_date:data.current_expire_date,
                        to_date:data.expire_date,
                        app_type:data.app_type
                    }).then(()=>resolve())
                }))
            }else{
                return res.json(data)
            }
        }
        promises1.push(new Promise((resolve, reject)=>{
            reseller.used_count=reseller.used_count+credit_count;
            reseller.save().then(()=>resolve());
        }))

        Promise.all(promises1).then(
            ()=>{
                return res.json({
                    status: 'success',
                    msg:'Device activated successfully',
                    remain_count:reseller.max_connections-reseller.used_count,
                    used_count:reseller.used_count
                })
            },
            error=>{
                console.log(error)
                return res.json({
                    status:'error',
                    msg:'Sorry, something is wrong, please try again later'
                })
            }
        )
    })
}

exports.showMyResellers=async (req,res)=>{
    let reseller_id=req.session.reseller_id;
    let reseller=await Reseller.findById(reseller_id);
    let resellers=await Reseller.find({created_by:reseller_id, deleted: {$in:[0,null]}});

    res.render('reseller/pages/reseller',{
            menu:'resellers',layout: './reseller/partials/layout',
            resellers:resellers
        }
    )
}
exports.createReseller=async (req,res)=>{
    let {credits,email,reseller_id,password, note, credit_note}=req.body;
    let master_reseller_id=req.session.reseller_id;
    let master_reseller=await Reseller.findById(master_reseller_id);
    let temp=await Reseller.findOne({email:email});
    let max_connections=0;
    if(temp){
        if(reseller_id==-1){
            res.json({
                status:'error',
                msg:'Sorry, the email of reseller already exist'
            })
            return;
        }
        else {
            if(master_reseller_id!=temp.created_by){
                return res.json ({
                    status:'error',
                    msg:"Sorry, you can't edit this reseller"
                })
            }
            if (temp._id != reseller_id) {
                return res.json({
                    status: 'error',
                    msg: 'Sorry, the email of reseller already exist'
                });
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
    if(credits<0)
        return res.json({
            status:'error',
            msg:'Sorry, credits should be greater than 0'
        })

    max_connections+=credits;

    let remain_credits=master_reseller.max_connections-master_reseller.used_count;
    if(remain_credits<credits) {
        return res.json({
            status:'error',
            msg:'Sorry, no enough credits'
        })
    }


    let update_data={
        max_connections:max_connections,
        created_by:master_reseller_id,
        note:note,
        hidden:master_reseller.hidden
    }
    if(reseller_id==-1)
        update_data.email=email;
    let password_hash, reseller;
    if(reseller_id==-1){
        password_hash=await bcrypt.hash(password,saltRounds);
        update_data.password=password_hash;
        update_data.created_time=moment().utc().format('Y-MM-DD HH:mm');
        reseller=await Reseller.create(update_data)
    }
    else{
        if(password!=''){
            password_hash=await bcrypt.hash(password,saltRounds);
            update_data.password=password_hash;
        }
        reseller=await Reseller.findByIdAndUpdate(reseller_id,update_data);
        reseller.max_connections=max_connections;
    }

    master_reseller.used_count=master_reseller.used_count+credits;
    await master_reseller.save();
    if(credits!=0){
        await CreditHistory.create({
            from:master_reseller_id, // from admin
            to:reseller._id,
            note: credit_note,
            activity_time:moment().utc().format('Y-MM-DD HH:mm'),
            credits:credits
        })
    }
    res.json({
        status: 'success',
        id: reseller._id,
        note:note ? note : '',
        max_connections:reseller.max_connections,
        used_count: reseller.used_count,
        remain_count:reseller.max_connections-reseller.used_count,
        created_time:reseller.created_time,
        master_used_count:master_reseller.used_count,
        master_remain_count:master_reseller.max_connections-master_reseller.used_count
    });
}
exports.deleteReseller=async(req,res)=>{
    let master_reseller_id=req.session.reseller_id;
    let master_reseller=await Reseller.findById(master_reseller_id);
    let reseller_id=req.body.reseller_id;
    let reseller=await Reseller.findById(reseller_id);
    if(reseller.created_by!=master_reseller_id){
        return res.json({
            status:'error',
            msg:"Sorry, you don't have permission for this operation"
        })
    }
    master_reseller.used_count=master_reseller.used_count-(reseller.max_connections-reseller.used_count);
    await master_reseller.save();
    reseller.deleted=1;
    reseller.deleted_time=moment().utc().format('Y-MM-DD HH:mm');
    await reseller.save();
    await ResellerActivity.deleteMany({reseller_id:reseller_id});
    res.json({
        status:'success',
        master_used_count:master_reseller.used_count,
        master_remain_count:master_reseller.max_connections-master_reseller.used_count
    })
}
exports.showActivityLog=async(req,res)=>{
    let reseller_id=req.params.reseller_id ? req.params.reseller_id : req.session.reseller_id;
    let master_reseller_id=req.session.reseller_id;
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
        let user=values[0], live_resellers=values[1], deleted_resellers=values[2];
        let activities=values[3],credits_receive_history=values[4], credit_give_history=values[5]
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
        res.render('reseller/pages/activity_log',
            {
                menu:'reseller-devices',layout: './reseller/partials/layout',
                activities:activities,
                user:user,
                from_self: master_reseller_id!=reseller_id ? 0 : 1,
                live_resellers: live_resellers,
                deleted_resellers:deleted_resellers,
                credits_receive_history: credits_receive_history,
                credit_give_history:credit_give_history
            }
        )
    })
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

