var express = require('express');
var router = express.Router();
var userModel = require('../schemas/user')
var ResHelper = require('../helper/ResponseHelper');
var userValidator = require('../validators/user');
var { validationResult } = require('express-validator');
var checkLogin = require('../middlewares/checklogin')
var checkAuthorize = require('../middlewares/checkauthorize');
const sendMail = require('../helper/sendMail');

router.get('/', checkLogin, checkAuthorize("admin", "modifier", "user"), async function (req, res, next) {
  let users = await userModel.find({}).exec();
  ResHelper.RenderRes(res, true, users)
});

router.get('/:id', async function (req, res, next) {
  try {
    let user = await userModel.find({ _id: req.params.id }).exec();
    ResHelper.RenderRes(res, true, user)
  } catch (error) {
    ResHelper.RenderRes(res, false, error)
  }
});

router.post('/', userValidator.checkChain(), async function (req, res, next) {
  var result = validationResult(req);
  if (result.errors.length > 0) {
    ResHelper.RenderRes(res, false, result.errors);
    return;
  }
  try {
    var newUser = new userModel({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      role: req.body.role
    })
    await newUser.save();
    ResHelper.RenderRes(res, true, newUser)
  } catch (error) {
    ResHelper.RenderRes(res, false, error)
  }
});
router.put('/:id', async function (req, res, next) {
  try {
    let user = await userModel.findById
      (req.params.id).exec()
    user.email = req.body.email;
    await user.save()
    ResHelper.RenderRes(res, true, user);
  } catch (error) {
    ResHelper.RenderRes(res, false, error)
  }
});


router.delete('/:id', async function (req, res, next) {
  try {
    let user = await userModel.findByIdAndUpdate
      (req.params.id, {
        status: false
      }, {
        new: true
      }).exec()
    ResHelper.RenderRes(res, true, user);
  } catch (error) {
    ResHelper.RenderRes(res, false, error)
  }
});

router.post('/reset-password', checkLogin, async function (req, res, next) {
  try {
      const { email } = req.body;

      // Kiểm tra xem email đã được cung cấp chưa
      if (!email) {
          throw new Error("Vui lòng nhập địa chỉ email của bạn.");
      }

      // Tìm user trong database dựa trên email
      const user = await userModel.findOne({ email }).exec();
      if (!user) {
          throw new Error("Không tìm thấy người dùng với địa chỉ email này.");
      }

      // Tạo token reset password và lưu vào user
      const resetToken = user.genTokenResetPassword();
      await user.save();

      // Gửi email chứa link reset password
      
      const resetLink = `http://localhost:3000/api/v1/users/reset-password/${resetToken}`; // Thay đổi đường dẫn của trang web của bạn
      const message = `Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu của bạn: ${resetLink}`;
      await sendMail(message, email);

      ResHelper.RenderRes(res, true, "Email đặt lại mật khẩu đã được gửi thành công.");
  } catch (error) {
      ResHelper.RenderRes(res, false, error.message);
  }
});

router.put('/reset-password/:resetToken', async function (req, res, next) {
  try {
      const { resetToken } = req.params;
      const { newPassword } = req.body;

      // Kiểm tra xem token reset password đã được cung cấp chưa
      if (!resetToken || !newPassword) {
          throw new Error("Vui lòng cung cấp token reset password và mật khẩu mới.");
      }

      // Tìm user trong database dựa trên token reset password
      const user = await userModel.findOne({ resetPasswordToken: resetToken }).exec();
      if (!user) {
          throw new Error("Token reset password không hợp lệ.");
      }

      // Kiểm tra xem token reset password đã hết hạn chưa
      if (user.resetPasswordExp < Date.now()) {
          throw new Error("Token reset password đã hết hạn.");
      }

      // Cập nhật mật khẩu mới cho user
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExp = undefined;
      await user.save();

      ResHelper.RenderRes(res, true, "Mật khẩu đã được thay đổi thành công.");
  } catch (error) {
      ResHelper.RenderRes(res, false, error.message);
  }
});


router.post('/login', async function (req, res, next) {
  try {
      const { username, password } = req.body;

      // Kiểm tra xem username và password đã được cung cấp chưa
      if (!username || !password) {
          throw new Error("Vui lòng nhập đầy đủ tên người dùng và mật khẩu.");
      }

      // Lấy thông tin user từ database
      const user = await userModel.GetCre(username, password);

      // Kiểm tra xem có lỗi không
      if (user.error) {
          throw new Error(user.error);
      }

      // Tạo JWT token và trả về cho client
      const token = user.getJWT();
      ResHelper.RenderRes(res, true, { token });
  } catch (error) {
      ResHelper.RenderRes(res, false, error.message);
  }
});


module.exports = router;