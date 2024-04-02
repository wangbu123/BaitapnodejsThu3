const nodemailer = require("nodemailer");
const config = require('../configs/config');

const transporter = nodemailer.createTransport({
    host: config.Host,
    port: config.Port,
    secure: false,
    auth: {
        user: config.Username,
        pass: config.Password,
    },
});

module.exports = async function(message, email) {
    try {
        const info = await transporter.sendMail({
            from: '"Your Name" <test@example.com>',
            to: email,
            subject: "Password Reset", 
            text: message,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};


// const nodemailer = require("nodemailer");
// const config = require('../configs/config')

// const transporter = nodemailer.createTransport({
//     host: config.Host,
//     port: config.Port,
//     secure: false, // Use `true` for port 465, `false` for all other ports
//     auth: {
//         user: config.Username,
//         pass: config.Password,
//     },
// });

// // async..await is not allowed in global scope, must use a wrapper
// module.exports = async function(message, email) {
//     // send mail with defined transport object
//     const info = await transporter.sendMail({
//         from: '"Maddison Foo Koch 👻" <testminzon@gmail.com>', // sender address
//         to: email, // list of receivers
//         subject: "Hello ✔", // Subject line
//         text: message, // plain text body
//     });

//     console.log("Message sent: %s", info.messageId);
//     // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
// }