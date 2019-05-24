var express = require('express') // เรียกใช้ Express
var mysql = require('mysql') // เรียกใช้ mysql
var app = express() // สร้าง Object เก็บไว้ในตัวแปร app เพื่อนำไปใช้งาน
var session = require('express-session')
var bodyParser = require("body-parser")

var db = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'delta'
})
var db2 = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'regDelta'
}) 
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({secret: 'ssshhhhh'}));
app.set("view engine", "ejs")
app.use(express.static(__dirname + '/public'))

db.connect() // connect library database
db2.connect() // connect database reg
var sess; //session variable

app.get('/', function(req, res) {   // Router เวลาเรียกใช้งาน
    sess=req.session
    if(sess.user){
        res.redirect("/home") //if login
    }else{
        res.render("home")
    }
})
app.post("/login",function(req,res){
    sess=req.session
    let sql = 'SELECT password FROM student where student_id="' +req.body.username+'" ' //sql query 
    let query = db2.query(sql, function(err, results) {
        var user=results[0]
        if(user){
        if(user.password==req.body.password){
            sess.user=req.body.username
            res.redirect("/home")
        }else{
            console.log("wrong password")
            res.redirect("/")
        }
    }else{
        console.log("user not found")
            res.redirect("/")
    }
    })
})
app.get("/logout",function(req,res){
    req.session.destroy(function(err){
        if(err) console.log(err)
        else{
            res.redirect("/")
        }
    })
})
app.get('/home',function(req,res){
    sess=req.session
    if(sess.user){
    let sql = 'SELECT * FROM book'  // คำสั่ง sql
    let query = db.query(sql, function(err, results) { // สั่ง Query คำสั่ง sql
        if (err) throw err  // ดัก error
        var a=results
        res.render("index",{
            results:results
        })
    })
    }else{
        res.redirect("/")
    }
})
app.post("/search",function(req,res){
    console.log(req.body)
    let sql = 'SELECT * FROM book where '+req.body.searchOp+' LIKE "%'+req.body.keyword+'%"'  // คำสั่ง sql
    let query = db.query(sql, function(err, results) { // สั่ง Query คำสั่ง sql
        if (err) throw err  // ดัก error
        var a=results
        res.render("index",{
            results:results
        })
    })
})
app.listen('3000', () => {     // 
    console.log('start port 3000')
})