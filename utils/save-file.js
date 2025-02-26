const fs = require("fs-extra");
// const getFileExt = require("./get-file-ext");
// const errLogger = require("../utils/errorlogger");
const path = require("path");

const PATH = path.resolve(__dirname, "../public/images");

exports.saveFile = (file,saveFileName) => {
	file.mv(PATH+'/upload/'+saveFileName,function(err) {
		if (err)
			console.log('upload error',err);
	});
}

exports.saveMultipleFiles = (files,saveFileNames) => {
	let fpath=PATH;
	for(let i=0;i<files.length;i++){
		files[i].mv(fpath+'/'+saveFileNames[i],function(err) {
			if (err)
				console.log('upload error',err);
			else console.log('upload done')
		});
	}
}

exports.deleteFile = (fpath, file) => {
	fs.unlink(fpath+"/"+file,(err) => {
		if (err) {
			console.error(err)
			return
		}
	});

}
exports.getRandomFileName = (file) => {
	let extension=path.extname(file.name);
	let random_number=Math.floor(100000 + Math.random() * 900000);
	let file_name=random_number+extension;
	return file_name;
}
