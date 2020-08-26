const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log(process.env.SENDGRID_API_KEY)
const msg = {
	to: 'test@example.com',
	from: 'taiwo@skrypt.com.ng',
	subject: 'Sending with Twilio SendGrid is Fun',
	text: 'and easy to do anywhere, even with Node.js',
	html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
// sgMail.send(msg).then(res => {
// 	console.log("res =>")
// 	console.log(res)
// })
// 	.catch(err => {
// 		console.log("error")
// 		console.log(err.response.body.errors)
// 	})
