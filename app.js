"use strict";

const express = require('express');
const crypto = require('crypto');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const { cookie } = require('express/lib/response');
const { listenerCount } = require('process');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const mysqlStore = require('express-mysql-session')(expressSession);
const morgan = require('morgan');
const fs = require('fs');
const ejs = require('ejs');
const { compileQueryParser } = require('express/lib/utils');
const { start } = require('repl');
//const Connection = require('mysql/lib/Connection');
const app = express();
const router = express.Router();

const port = 3000;

app.use(morgan('short'));
app.use(bodyParser());
app.use(express.static('public'));
app.use(cookieParser());



let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1q2w3e4r5t!',
    database: 'test'
});
connection.connect();



app.set('view engine', 'ejs');
app.set('views', './views');


app.get('/', (req, res) => {
    // if(req.headers.cookie !== undefined) res.render('loginedIndex.ejs');
    // else res.render('index.ejs');


    if(req.headers.cookie !== undefined) {
        let queryString = 'select permission from members where id="'+req.cookies.user+'" and permission="A"';
        connection.query(queryString, (err, rows)=>{
            if(err) throw err;
            else{
                if(rows.length === 0) {
                    res.render('loginedIndex.ejs');
                }else {
                    res.redirect('/admin');
                }
            }
        });
        
    }else {
        res.render('index.ejs');
    }
    
    
});

app.get('/signUp', (req, res) => {
    if(req.headers.cookie !== undefined) {
        res.redirect('/');
    } else {
        res.render('signUp.ejs');
    }
    //console.log(req.headers.cookie);
    
})

app.post('/signUp', (req, res) => { //파라미터에 next있었음
    
    let id = req.body.id;
    //var email = req.body.email;
    let password = req.body.pw;
    let name = req.body.name;
    let birth = req.body.birth;
    let phoneNum = req.body.phoneNum;

    const hashPassword = crypto.createHash('sha512').update(password).digest('hex');
    let query = "SELECT id FROM members where id='"+id+"';"; //중복 처리 위한 쿼리
    connection.query(query, (err, rows) => {
        if(rows.length == 0) {
            let sql = {
                id: id,
                pw: hashPassword,
                name: name,
                birth: birth,
                phoneNum: phoneNum
                //salt: salt
            };

            //create query
            let query = connection.query('insert into members set ?', sql, (err, rows) => {
                if( err ) throw err;
                else  res.send("성공");
                
            });
        }
        else res.send("중복 ID");
    });

});

app.get('/login', (req, res)=>{
    if(req.headers.cookie !== undefined) {
        res.redirect('/');
    } else {
        res.render('login.ejs');
    }
    
});

app.post('/login', (req, res) => {
    let id=req.body.id;
    let pw=req.body.pw;

    let query = 'select pw from members where id="'+id+'";';
    console.log(query);
    connection.query(query, (err, rows) => {
        if(err) throw err;
        else {
            if(rows.length == 0) {
                console.log('아이디틀림');
                res.redirect('/login');
            }
            else {
                let password = rows[0].pw;

                const hashPassword = crypto.createHash('sha512').update(pw).digest('hex');
                //const hashPassword = crypto.createHash('sha512').update(password).digest('hex');


                if(password === hashPassword) {
                    console.log('로그인 성공');
                    res.cookie('user', id, {
                        expires: new Date(Date.now() + 900000),
                        httpOnly: true
                    });
                    
                    res.redirect("/");
                }else {
                    console.log('로그인 실패');
                    res.redirect('/login');
                }
            }
        }
    });
});



app.get("/notice", (req, res) => {
    //res.render('notice.ejs', { title: "title"});
    let queryString = 'select * from noticeTest order by uploadDate desc';
    connection.query(queryString, (err, result, fields) => {
        if(err) throw err;
        else {
            res.render(('notice.ejs'), {
                data: result
            });
        }
        
        
        
     });
    //res.redirect('/noticePasing/'+1);
});

// app.get('/mypage', (req, res) => {
//     let
// });











app.get('/adminNotice', (req, res)=> {
    if(req.headers.cookie !== undefined) {
        let queryString = 'select permission from members where id="'+req.cookies.user+'" and permission="A"';
        connection.query(queryString, (err, rows)=>{
            if(err) throw err;
            else{
                if(rows.length === 0) {
                    res.redirect('/');
                }else {
                    res.render('adminNotice.ejs');
                }
            }
        });
        
    }else {
        res.redirect('/');
    }

    //res.render('adminNotice.ejs');
});

app.post('/adminNotice', (req, res) => {
    let title = req.body.title;
    let content = req.body.content;

    console.log(title + content);
    let query = `select content from noticeTest where title="${title}";`;

    connection.query(query, (err, rows) => {
        if(rows.length == 0) {
            let sql = {
                title: title,
                content: content
            };

            //create query
            let query = connection.query('insert into noticeTest set ?', sql, (err, rows) => {
                if( err ) throw err;
                else  res.send("upload success");
                
            });
        }
        else res.send('already has'); //res.send("중복 공지");
    });




});

app.get('/adminMember', (req, res) => {
    if(req.headers.cookie !== undefined) {
        let queryString = 'select permission from members where id="'+req.cookies.user+'" and permission="A"';
        connection.query(queryString, (err, rows)=>{
            if(err) throw err;
            else{
                if(rows.length === 0) {
                    res.redirect('/');
                }else {
                    let queryString = 'select * from members';
                    connection.query(queryString, (err, result) => {
                        if(err) throw err;
                        else {
                            res.render(('adminMember.ejs'), {
                                data: result
                            });
                        }
                    });



                    
                }
            }
        });
        
    }else {
        res.redirect('/');
    }
})



// app.get('adminNoticeEdit', (req, res) => {
//     if(req.headers.cookie !== undefined) {
//         let queryString = 'select permission from members where id="'+req.cookies.user+'" and permission="A"';
//         console.log('adminNoticeEdit 쿼리 실행 전');
//         connection.query(queryString, (err, rows)=>{
//             if(err) throw err;
//             else{
//                 if(rows.length === 0) {
//                     res.redirect('/');
//                 }else {
//                     let queryString = 'select * from noticeTest order by uploadDate desc';
//                     connection.query(queryString, (err, result, fields) => {
//                         if(err) throw err;
//                         else {
//                             console.log('쿼리까지 성공하고 res.render 직전');
//                             res.render(('adminNoticeEdit.ejs'), {
//                                 data: result
//                             });
//                         }
//                     });
//                 }
//             }
//         });
        
//     }else {
//         res.redirect('/');
//     }
// });



app.get('/admin', (req, res) => {
    if(req.headers.cookie !== undefined) {
        let queryString = 'select permission from members where id="'+req.cookies.user+'" and permission="A"';
        connection.query(queryString, (err, rows)=>{
            if(err) throw err;
            else{
                if(rows.length === 0) {
                    res.redirect('/');
                }else {
                    res.render('admin.ejs')
                }
            }
        });
        
    }else {
        res.redirect('/');
    }
});




app.get("/logout", (req, res)=> {
    res.clearCookie('user').redirect('/');
});

app.get('*', (req, res) => {
    res.status(404).render('error404.ejs');
});

app.listen(port, () => {
    console.log(`${port}번 포트 온!!!`);
});

