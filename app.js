var express = require('express') // เรียกใช้ Express
var mysql = require('mysql') // เรียกใช้ mysql
var app = express() // สร้าง Object เก็บไว้ในตัวแปร app เพื่อนำไปใช้งาน
var session = require('express-session')
var bodyParser = require("body-parser")

var libDB = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'delta'
})
var regDB = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'regDelta'
})
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({ secret: 'ssshhhhh' }));
app.set("view engine", "ejs")
app.use(express.static(__dirname + '/public'))

libDB.connect() // connect library database
regDB.connect() // connect database reg
var sess; //session variable

app.get('/', function (req, res) {   // Router เวลาเรียกใช้งาน
    sess = req.session
    if (sess.user) {
        res.redirect("/home") //if login
    } else {
        res.render("home")
    }
})
app.get('/home', function (req, res) {
    sess = req.session
    if (sess.user) {
        console.log(sess.cart)
        var sql = 'SELECT * FROM book where status=0'  // คำสั่ง sql
        libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
            if (err) throw err  // ดัก error
            var a = results
            res.render("index", {
                results: results,
                user: sess.user,
                cart: sess.cart.length
            })
        })
    } else {
        res.redirect("/")
    }
})
// ------------------------view borrow list-------------------------
app.get('/borrowList', function (req, res) {
    sess = req.session
    if (sess.user) {
        console.log(sess.cart)
        var sql = 'SELECT * FROM borrow_list where borrower_id="' + sess.user + '" and qty!=0' // คำสั่ง sql
        libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
            if (err) throw err  // ดัก error
            res.render("borrow_list", {
                results: results,
                user: sess.user,
                cart: sess.cart.length
            })
        })
    } else {
        res.redirect("/")
    }
})
app.get("/borrowDetail/:borrow_id", function (req, res) {
    sess = req.session
    if (sess.user) {
        var sql = "SELECT book_id,name,status from book where book_id IN (SELECT book_id FROM borrow_detail where borrow_id=" + req.params.borrow_id + " and status=0)"
        libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
            if (err) throw err  // ดัก error
            res.render("borrow_detail", {
                borrow_id: req.params.borrow_id,
                results: results,
                user: sess.user,
                cart: sess.cart.length
            })
        })
    }
})
// ----------------------------------about return-----------------------------------------------
app.get('/returnList', function (req, res) {
    sess = req.session
    if (sess.user) {
        console.log(sess.cart)
        var sql = 'SELECT * FROM return_list where borrower_id="' + sess.user+'"'// คำสั่ง sql
        libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
            console.log(results)
            if (err) throw err  // ดัก error
            res.render("return_list", {
                results: results,
                user: sess.user,
                cart: sess.cart.length
            })
        })
    } else {
        res.redirect("/")
    }
})
app.get("/returnDetail/:return_id", function (req, res) {
    sess = req.session
    if (sess.user) {
        var sql = "SELECT book_id,name,status from book where book_id IN (SELECT book_id FROM return_detail where return_id=" + req.params.borrow_id +")"
        libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
            if (err) throw err  // ดัก error
            res.render("return_detail", {
                return_id: req.params.return_id,
                results: results,
                user: sess.user,
                cart: sess.cart.length
            })
        })
    }
})
app.post("/return/:borrow_id", function (req, res) {
    console.log(req.params.borrow_id)
    var listbook = []
    if (!Array.isArray(req.body.book_id)) listbook.push(req.body.book_id)
    else listbook = req.body.book_id
    console.log(listbook)
    var sql = "INSERT INTO return_list (borrow_id,borrower_id,return_date,qty,penalty) VALUES ('" + req.params.borrow_id + "','" +sess.user+ "','" + Date + "'," + listbook.length + ",0)";
    libDB.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");

        var reSql = "INSERT INTO return_detail (return_id, book_id) VALUES ?";
        var values = []
        listbook.forEach(function (book_id) {
            values.push([result.insertId, book_id])
        })

        var booksql = "UPDATE book SET status = 0 WHERE book_id IN " + "("+listbook+")";
        libDB.query(booksql, function (err, result) {
            if (err) throw err;
        });
        var bLSsql = "UPDATE borrow_detail SET status = 1 WHERE borrow_id= " + req.params.borrow_id + " and book_id IN " + "("+listbook+")";
        libDB.query(bLSsql, function (err, result) {
            if (err) throw err;
        });

        var sql = "SELECT count(*) as count FROM borrow_detail WHERE borrow_id= " + req.params.borrow_id + " and status=0"  // คำสั่ง sql
        libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
            if (err) throw err  // ดัก error
            var count = results[0].count
            console.log("sssssssssssssssssssssssssssssssssssssss")
            console.log(count)
            var bLSsql = "UPDATE borrow_list SET qty = "+count+" WHERE borrow_id= " + req.params.borrow_id
            libDB.query(bLSsql, function (err, result) {
                if (err) throw err;
            });
        })

        libDB.query(reSql, [values], function (err, result) {
            if (err) throw err;
            console.log("Number of records inserted: " + result.affectedRows);
            res.redirect("/")
        });
    });
})
app.post("/search", function (req, res) {
    console.log(req.body)
    sess = req.session
    var sql = 'SELECT * FROM book where ' + req.body.searchOp + ' LIKE "%' + req.body.keyword + '%"'  // คำสั่ง sql
    libDB.query(sql, function (err, results) { // สั่ง Query คำสั่ง sql
        if (err) throw err  // ดัก error
        var a = results
        res.render("index", {
            results: results,
            user: sess.user,
            cart: sess.cart.length
        })
    })
})
// -------------------------------about login ------------------------------------------------------
app.post("/login", function (req, res) {
    sess = req.session
    sess.cart = []
    var sql = 'SELECT password FROM student where student_id="' + req.body.username + '" ' //sql query 
    regDB.query(sql, function (err, results) {
        var user = results[0]
        if (user) {
            if (user.password == req.body.password) {
                sess.user = req.body.username
                res.redirect("/home")
            } else {
                console.log("wrong password")
                res.redirect("/")
            }
        } else {
            console.log("user not found")
            res.redirect("/")
        }
    })
})
app.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
        if (err) console.log(err)
        else {
            res.redirect("/")
        }
    })
})
// -------------------------about cart ---------------------------------
app.get("/addCart/:book_id", function (req, res) {
    sess = req.session
    if (!sess.cart.includes(req.params.book_id)) {
        sess.cart.push(req.params.book_id)
    } else {
        console.log("duplicated")
    }
    res.redirect("/")
})
app.get("/checkOut", function (req, res) {
    sess = req.session
    var cart = sess.cart
    sess.cart = []
    console.log(sess.cart)
    // date problem
    var date = new Date();
    console.log(date)
    if (cart.length != 0) {
        var sql = "INSERT INTO borrow_list (borrower_id, date,deadline,qty,status) VALUES ('" + sess.user + "','" + date + "','" + date + "'," + cart.length + ",1)";
        libDB.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
            console.log(result.insertId)
            var sql = "INSERT INTO borrow_detail (borrow_id, book_id,status) VALUES ?";
            var values = []
            cart.forEach(function (book) {
                var booksql = "UPDATE book SET status = 1 WHERE book_id = '" + book + "'";
                libDB.query(booksql, function (err, result) {
                    if (err) throw err;
                    console.log(result.affectedRows + " record(s) updated");
                });
                // add book multivalue
                values.push([result.insertId, book, 0])
            })
            libDB.query(sql, [values], function (err, result) {
                if (err) throw err;
                console.log("Number of records inserted: " + result.affectedRows);
                // destroy session  
                console.log()
                res.redirect("/")
            });
        });
    } else {
        console.log("cart is empty ")
        res.redirect("/")
    }
})
app.get("/clearCart", function (req, res) {
    sess = req.session
    sess.cart = []
    res.redirect("/")
})
app.listen('3000', () => {     // 
    console.log('start port 3000')
})