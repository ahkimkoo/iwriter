const nodemailer = require('nodemailer')
const util = require('util')

const poolConfig = {
    pool: true,
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true, // use TLS
    auth: {
        user: 'support@mail.com',
        pass: 'passwd'
    }
}

const send = async (address, subject, text, html, config={}, sender) => {
    let mailConf = Object.assign(poolConfig, config);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport(mailConf);

    // setup email data with unicode symbols
    let mailOptions = {
        from: sender || mailConf['auth']['user'], // sender address
        to: util.isArray(address) ? address.join(',') : address, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html // html body
    };

    // send mail with defined transport object
    return new Promise((resolve, reject)=>{
        transporter.sendMail(mailOptions, (error, info) => {
            if(error)reject(info);
            else resolve(info);
        });
    }); 
}

if(module.parent){
	exports.send = send
}else{
	send(
			['test@mail.com'],
			'这是一封测试邮件',
			'纯文本',
			'<h1>HTML内容</h1>'
		).then(msg=>{
            console.log(msg)
        }).catch(msg=>{
            console.error(msg);
        });
}