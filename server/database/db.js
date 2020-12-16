const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost', //域名
    user: 'root', //mysql的用户
    password: '', //mysql的密码
    database: 'shop' //连接数据库的名字
});

// const userSql = "SELECT * FROM hg_users"
// connection.query(userSql, (err, data) => {
//     if (!err) {
//         console.log(data);
//     }
// })

// 封装查询方法,给不同的sql查询对象的数据

function requestQuery(sql, sqlArr) {
    return new Promise((resolve, reject) => {
        connection.query(sql, sqlArr, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

// 暴露
module.exports = {
    requestQuery,
    connection
}