var mongoose = require("mongoose");
var bcrypt = require('bcrypt');
var jsonwebtoken = require("jsonwebtoken");
const config = require('../configs/config');
var crypto = require('crypto');

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password: String,
    role: {
        type: [String],
        default: ["USER"]
    },
    status: {
        type: Boolean,
        default: true
    },
    email: String,
    resetPasswordToken: String,
    resetPasswordExp: String
}, { timestamps: true });

userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        this.password = bcrypt.hashSync(this.password, 10);
    }
    next();
});

userSchema.methods.genTokenResetPassword = function () {
    let token = crypto.randomBytes(30).toString('hex');
    this.resetPasswordToken = token;
    this.resetPasswordExp = Date.now() + 10 * 60 * 1000;
    return token;
};

userSchema.methods.getJWT = function () {
    var token = jsonwebtoken.sign({ id: this._id },
        config.SECRET_KEY, {
        expiresIn: config.EXPIRE_JWT
    });
    return token;
};

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.statics.GetCre = async function (username, password) {
    if (!username || !password) {
        return { error: "phai dien day du username va password" };
    }
    var user = await this.findOne({ username: username });
    if (!user) {
        return { error: "user hoac password sai" };
    }
    if (user.comparePassword(password)) {
        return user;
    } else {
        return { error: "user hoac password sai" };
    }
};

module.exports = mongoose.model('User', userSchema);
