// 引入db模块
const {
    requestQuery,
    connection
} = require("../database/db")
const stringRandom = require("string-random") //随机生成昵称
const moment = require("moment") // 格式化时间模块
const bcrypt = require('bcryptjs'); // 加密模块
const salt = bcrypt.genSaltSync(10);
const JWT = require("./token")
const {
    iHuyi
} = require("./HUAQIAN")
const svgCaptcha = require('svg-captcha'); //图片验证码


// 定义一个变量来临时存储手机号
var tempPhone = null
// 定义一个遍历来存储临时验证码
var tempCode = null
// 定义一个变量存储图片验证码
var tempCaptcha = null




// 用户列表
exports.UserList = async (req, res) => {
    const userSql = "SELECT *FROM hg_users WHERE is_show=1"
    const userlist = await requestQuery(userSql)
    res.json({
        data: userlist
    })

}

// 用户注册
exports.UserRegister = (req, res) => {
    // 需要post发送数据
    console.log(req.body);
    let user_name = req.body.user_name
    let login_password = req.body.login_password
    let phone = req.body.phone
    let sql_name = "SELECT user_name FROM hg_users WHERE user_name=? AND is_show=1"
    // 获取当前时间
    let nowDate = moment().format('YYYY-MM-DD HH:mm:ss')
    // console.log(nowDate);
    connection.query(sql_name, user_name, (err, result_name) => {
        if (err) {
            return res.json({
                msg: "用户注册失败",
                status: 1001,
                data: err
            })
        }
        // 用户名存在不能注册,用户名不存在.手机号不存在也不能给你注册
        // 如果result_name为空,说明该用户不存在,说明用户名可以使用
        if (result_name == "") { //条件成立说明用户名不存在
            // 验证一下手机号是否存在
            let sql_phone = `SELECT phone from hg_users WHERE phone=? AND is_show=1`
            connection.query(sql_phone, phone, (err, result_phone) => {
                if (err) {
                    return res.json({
                        msg: "用户注册失败",
                        status: 1002,
                        data: err
                    })
                }
                if (result_phone == "") { //说明手机号可用
                    let sql_register = `INSERT INTO hg_users SET user_name=?,login_password=?,phone=?,is_show=1,create_time="${nowDate}"`
                    const hashpassword = bcrypt.hashSync(login_password, salt)
                    connection.query(sql_register, [user_name, hashpassword, phone], (err, result) => {
                        if (err) {
                            return res.json({
                                msg: "用户注册失败",
                                status: 1003,
                                data: err
                            })
                        }
                        // console.log(result);
                        if (result.affectedRows == 1) {
                            return res.json({
                                msg: "恭喜您注册成功,可以去登录了",
                                status: 400,
                                data: result
                            })
                        } else {
                            return res.json({
                                msg: "用户注册失败",
                                status: 1004,
                                data: err
                            })
                        }
                    })
                } else {
                    return res.json({
                        msg: "该手机号已经存在,请更换手机号",
                        status: 500,
                    })
                }
            })
        } else {
            return res.json({
                msg: "该用户名已经存在，请更换用户名注册",
                status: 600
            })
        }
    })
}

// 用户登录
exports.UserLogin = async (req, res) => {
    // 需要post发送数据
    console.log(req.body);
    const user_name = req.body.user_name
    const captcha = req.body.captcha.toLowerCase();
    if (captcha != tempCaptcha) {
        return res.json({
            msg: "验证码不正确",
            status: 2005
        })

    }
    // 先判断用户名是否存在
    const sql = `SELECT user_name,login_password from hg_users WHERE user_name=? AND is_show=1`
    connection.query(sql, [user_name], (err, result) => {
        if (err) {
            return res.json({
                msg: "数据库查询失败",
                status: 500
            })
        }
        if (result == "") {
            return res.json({
                msg: "该用户不存在，快去注册一个吧",
                status: 1005
            })
        } else {
            // console.log(result);
            const login_password = bcrypt.compareSync(req.body.login_password, result[0].login_password)
            // console.log(login_password);
            if (login_password !== true) {
                return res.status(500).json({
                    msg: "密码错误,请重新输入"
                })
            } else {
                let token = JWT.createToken({
                    login: true,
                    user_name: user_name
                })
                return res.json({
                    status: 600,
                    msg: "登录成功",
                    data: result,
                    token: token
                })
            }
        }
    })
}

// 获取验证码的模块
exports.GetIdentifyingCode = async (req, res) => {
    // 第一步:输入正缺的手机号
    // 第二步:点击获取验证码.发送请求
    // 第三步:短信内容+随机验证码
    console.log("手机号");
    console.log(req.body);
    console.log("手机号");
    for (var phoneattr in req.body) {
        var phone = phoneattr;
        tempPhone = phoneattr; //临时手机号赋值
    }
    // console.log(req.body.phone);
    console.log(phone);
    var identCode = ("000000" + Math.floor(Math.random() * 999999)).slice(-6)
    tempCode = identCode
    console.log(111);
    console.log(tempCode);
    console.log(222);
    // let MessageContent =
    //     '您的验证码是：' + identCode + '。请不要把验证码泄露给其他人。';
    // iHuyi.send(phone, MessageContent, (err, smsId) => {
    //     if (err) {
    //         console.log(err.message);
    //     } else {
    //         res.json({
    //             msg: '发送成功',
    //             status: 200,
    //             data: identCode,
    //         });
    //         console.log('SMS sent, and smsId is ' + smsId);
    //     }
    // });
    res.json({
        msg: "发送成功",
        status: 700,
        data: identCode
    })
}


// 短信登录
exports.PhoneLogin = async (req, res) => {
    console.log(req.body.phone); //手机号
    console.log(req.body.code); //验证码
    var phone = req.body.phone;
    var code = req.body.code;
    var captcha = req.body.captcha.toLowerCase();
    // console.log(aaa.test(captcha));
    // console.log(33333);

    if (code != tempCode) {
        return res.json({
            status: 1006,
            msg: "手机验证码不正确",

        })
    } else if (phone != tempPhone) {
        return res.json({
            status: 1007,
            msg: "手机号不正确",
        })
    } else if (captcha != tempCaptcha) {
        return res.json({
            status: 4004,
            msg: "图片验证码不正确"
        })
    } else {
        // 判断手机号是否存在
        // 1.不存在,将该手机号注册成为用户
        const sql_phone = "SELECT * FROM hg_users WHERE phone=? AND is_show=1"
        const phone_result = await requestQuery(sql_phone, phone);
        console.log(phone_result); //如果手机啊存在会得到一个数组
        if (phone_result.length == 0) { //如果条件成立说明手机号不存在
            // 手机号不存在注册账号
            // 1.需要随机生成一个用户名
            const user_name = "hg_" + stringRandom(10);
            // console.log(user_name);
            let nowDate = moment().format('YYYY-MM-DD HH:mm:ss')
            let sql_register = `INSERT INTO hg_users (user_name,phone,is_show,create_time) VALUES ("${user_name}","${phone}","1","${nowDate}")`
            // 注册
            let phoneRegister = await requestQuery(sql_register)
            let result = await requestQuery(sql_phone, phone)
            console.log(11111);
            console.log(phoneRegister);
            console.log(22222);
            if (phoneRegister.affectedRows == 1) {
                let token = JWT.createToken({
                    login: true,
                    phone: result[0].phone
                })
                return res.json({
                    status: 800,
                    msg: "登录成功",
                    data: result,
                    token: token
                })
            } else {
                return res.json({
                    status: 900,
                    msg: "服务器错误",
                })
            }
        } else { // 2.如果手机号存在,直接登录
            let token = JWT.createToken({
                login: true,
                phone: phone_result[0].phone
            })
            return res.json({
                status: 800,
                msg: "登录成功",
                data: phone_result,
                token: token,
            })
        }

    }
}

// 生成图片验证码
exports.SvgCaptcha = async (req, res) => {
    var captcha = svgCaptcha.create({
        size: 4, // 长度
        ignoreChars: '0o1i', // 排除的字符串
        noise: 3, // 线条
        color: true, // 字体颜色
        background: '#cc9966', // 背景颜色
    });
    tempCaptcha = captcha.text.toLowerCase()
    res.type('svg');
    res.status(200).send(captcha.data)
    console.log(captcha.text);
}