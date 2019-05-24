var express = require('express') // เรียกใช้ Express
var mysql = require('mysql') // เรียกใช้ mysql
var app = express() // สร้าง Object เก็บไว้ในตัวแปร app เพื่อนำไปใช้งาน
var bodyParser = require("body-parser")

var db = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'delta'
})
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs")

db.connect() // เชื่อมต่อฐานข้อมูล
// Select Data
app.get('/', (req, res) => {   // Router เวลาเรียกใช้งาน
    let sql = 'SELECT * FROM book'  // คำสั่ง sql
    let query = db.query(sql, (err, results) => { // สั่ง Query คำสั่ง sql
        if (err) throw err  // ดัก error
        console.log(results) // แสดงผล บน Console 
        res.render("index",{
            drinks:results
        })
    })
})
app.listen('3000', () => {     // 
    console.log('start port 3000')
})