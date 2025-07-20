const Setting=require('../models/Setting.model');
let helpers={
    getSetting:key=>{
        return new Promise((resolve, reject)=>{
            Setting.findOne({key:key}).then(
                function (result) {
                    resolve(result);
                },
                function (error) {
                    reject(error)
                }
            )
        })
    }
}
module.exports=helpers;