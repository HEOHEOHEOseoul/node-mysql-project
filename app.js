"use strict";

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
// const path = require('path');
const bodyParser = require('body-parser');
//안써도 되는지 테스트 const { cookie } = require('express/lib/response');
const { listenerCount } = require('process');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const MomeryStore = require('memorystore')(expressSession);
const nunjucks = require('nunjucks');
// const mysqlStore = require('express-mysql-session')(expressSession);
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const ejs = require('ejs');
const { compileQueryParser } = require('express/lib/utils');
require('dotenv').config();
const dotenv = require('dotenv');




const { TelegramClient, Api, client } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm i input

//텔레그램 api
const apiId = Number(process.env.apiId);
const apiHash = process.env.apiHash;
const BOT_TOKEN = process.env.BOT_TOKEN;
const stringSession = new StringSession("");


const { start } = require('repl');
const session = require('express-session');
const app = express();
const router = express.Router();
const PORT = process.env.PORT;
const maxAge = 1000 * 60 * 60;
const sessionUser = {
    secret: 'heo',
    resave: false,
    saveUninitalized: true,
    store: new MomeryStore({ checkPeriod: maxAge }),
    cookie: {
        maxAge,
    },
};


app.use(morgan('short'));
app.use(bodyParser());
app.use(express.static('public'));
app.use(cookieParser());
app.use(expressSession(sessionUser));

//nunjucks.configure( { express : app });
app.use(express.urlencoded('views', { extended: true })); //써야하나?



let dateTimeNow = new Date();


let connection = mysql.createConnection({
    host: process.env.mysqlHOST,
    user: process.env.mysqlUSER,
    password: process.env.mysqlPASSWORD,
    database: process.env.mysqlDATABASE
});
connection.connect();
console.log(`[${dateTimeNow.toLocaleString()}] --- MySql 연결 완료`);


(async () => {
    console.log(`[${dateTimeNow.toLocaleString()}] --- gram JS 텔레그램 클라이언트 불러오는 중...`);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input.text("전화번호 입력 : "),
        password: async () => await input.text("비밀번호 입력: "),
        phoneCode: async () =>
        await input.text("인증번호 입력 : "),
        onError: (err) => console.log(err),
    });
    console.log(`[${dateTimeNow.toLocaleString()}] ---텔레그램 연결이 완료되었습니다.`);
    await client.sendMessage("me", { message: "nodeJS 봇 서버 가동, 계정 연결 완료" });
    app.post('/serviceTw', (req, res) => {
        
        console.log(req.body.telId);
        let teleId=req.body.telId;

        async function run(_telId) {
            await client.connect(); // This assumes you have already authenticated with .start()
            console.log(2)
            const result = await client.invoke(
                
                new Api.channels.InviteToChannel({
                channel: process.env.TELEGRAM_CHANNEL,
                users: [_telId],
                })
            );
            console.log(result); // prints the result
        }
        run(teleId);
        
    })
})();



app.set('view engine', 'ejs');
app.set('views', './views');


app.get('/', (req, res) => {
    if(req.session.user !== undefined) {
        const queryString = process.env.SQL_USER_PERMISSION_1 + req.session.user.id + process.env.SQL_USER_PERMISSION_2;
        connection.query(queryString, (err, rows)=>{
            if(err) console.log(err);
            else{
                if(rows.length === 0) {
                    res.render('index.ejs', { isLogin: true });
                }else {
                    res.redirect('/admin');
                }
            }
        });
    }else {
        res.render('index.ejs', { isLogin: false });
    }
});


app.get('/signUp', (req, res) => {
    if(req.session.user !== undefined) res.redirect('/');
    else res.render('signUp.ejs');
});


app.post('/signUp', (req, res) => {
    const USER = {};
    const randomSalt = Math.floor((Math.random()*12)+3);

    USER[process.env.DB_USER_ID] = req.body.id;
    USER[process.env.DB_USER_PASSWORD] = bcrypt.hashSync(req.body.pw, randomSalt);
    USER[process.env.DB_USER_NAME] = req.body.name;
    USER[process.env.DB_USER_BIRTH] = req.body.birth;
    USER[process.env.DB_USER_PHONE] = req.body.phoneNum;
    
    const SQL_ID_CHECK = process.env.SQL_ID_CHECK + req.body.id + "';";

    connection.query(SQL_ID_CHECK, (err, rows) => {
        if(err) console.log(err);
        else {
            if(rows.length == 0) {
                connection.query(process.env.SQL_REGIST, USER, (err, rows) => {
                    if( err ) console.log(err);
                    else  res.send("registDone");
                });
            }else res.send("alreadyHasId");
        }
    });
});


app.get('/login', (req, res) => {
    if(req.session.user !== undefined) res.redirect('/');
    else res.render('login.ejs');
});


app.post('/login', (req, res) => {
    const userId = req.body.id;
    const userPw = req.body.pw;
    const SQL_LOGIN_CHECK = process.env.SQL_LOGIN_CHECK + userId + '";';
    const dbPw = process.env.DB_USER_PASSWORD;
    
    connection.query(SQL_LOGIN_CHECK, (err, rows) => {
        if(err) throw err;
        else {
            if(rows.length == 0) {
                console.log('해당 유저 ID 없음');
                res.redirect('/login');
            }
            else {
                if(bcrypt.compareSync(userPw, rows[0][dbPw])) {
                    console.log(`${userId} 계정으로 로그인 성공`);
                    req.session.user = {
                        id: userId,
                    }
                    res.redirect('/');
                }else {
                    console.log('유저 비밀번호 틀림');
                    res.redirect('/login');
                }
            }
        }
    });
});


app.get("/notice", (req, res) => {
    let queryString = process.env.SQL_NOTICE;
    connection.query(queryString, (err, result, fields) => {
        if(err) console.log(err);
        else {
            res.render(('notice.ejs'), {
                noticeData: result,
            });
        }
     });
});


app.get('/adminNotice', (req, res) => {
    if(req.session.user !== undefined) {
        const queryString = process.env.SQL_USER_PERMISSION_1 + req.cookies.user + process.env.SQL_USER_PERMISSION_2;
        connection.query(queryString, (err, rows)=>{
            if(err) console.log(err);
            else{
                if(rows.length === 0) {
                    res.status(404).render('error404.ejs');
                }else {
                    res.render('adminNotice.ejs');
                }
            }
        });
    } else res.status(404).render('error404.ejs');
});


app.post('/adminNotice', (req, res) => {
    const noticeNo = process.env.DB_NOTICE_NO;
    const NOTICE = {};
    NOTICE[process.env.DB_NOTICE_TITLE] = req.body.title;
    NOTICE[process.env.DB_NOTICE_CONTENT] = req.body.content;
    connection.query(process.env.SQL_NOTICE_MAXNO, (err, maxNo) => {
        if(err) console.log(err);
        else {
            NOTICE[noticeNo] = (maxNo[0]['max(' + noticeNo +')']) + 1;
            connection.query(process.env.SQL_NOTICE_UP, NOTICE, (err, rows) => {
                if( err ) throw err;
                else res.send("upload success");
            });
        }
    });
});


app.get('/adminMember', (req, res) => {
    if(req.session.user !== undefined) {
        const permissionCheck = process.env.SQL_USER_PERMISSION_1 + req.session.user.id + 
                            process.env.SQL_USER_PERMISSION_2;
        connection.query(permissionCheck, (err, rows)=>{
            if(err) console.log(err);
            else{
                if(rows.length === 0) {
                    res.status(404).render('error404.ejs');
                }else {
                    const queryString = process.env.SQL_USER_INFO + ';';
                    connection.query(queryString, (err, members) => {
                        if(err) throw err;
                        else {
                            res.render(('adminMember.ejs'), {
                                data: members,
                            });
                        }
                    });
                }
            }
        });
    }else {
        res.status(404).render('error404.ejs');
    }
});


app.get('/admin', (req, res) => {
    if(req.session.user !== undefined) {
        const queryString = process.env.SQL_USER_PERMISSION_1 + req.session.user.id + process.env.SQL_USER_PERMISSION_2;
        connection.query(queryString, (err, rows)=>{
            if(err) console.log(err);
            else{
                if(rows.length === 0) res.status(404).render('error404.ejs');
                else res.render('admin.ejs');
            }
        });
    }else res.status(404).render('error404.ejs');
});



app.get('/service', (req, res) => {
    if(req.session.user !== undefined) {
        const queryString = process.env.SQL_USER_TELID_1 + req.session.user.id + '";';
        connection.query(queryString, (err, rows)=>{
            if(err) console.log(err);
            else{
                if(rows.length === 0) {
                    res.render(('service.ejs'),{
                        data: 'no telId'
                    });
                }else {
                    res.render(('service.ejs'), {
                        data: 'has telId',
                        telId: rows[0].telId
                    });
                }
            }
        });
    }else {
        res.render(('service.ejs'), { data: 'no login' });
    }
});

app.get('/editMember', (req, res) => {
    if(req.session.user !== undefined) {
        const memberEdit = process.env.SQL_USER_INFO + ' where ' + process.env.DB_USER_ID + '= "' + req.session.user.id + '";';
        
        connection.query(memberEdit, (err, members) => {
            if (err) console.log(err);
            else {
                res.render('editMember.ejs', {
                    user: members,
                });
            }
        });
    }
});


app.post('/editMember', (req, res) => {
    const randomSalt = Math.floor((Math.random()*12)+3);

    let editMembeKey = [process.env.DB_USER_PASSWORD, process.env.DB_USER_SNS_ID, process.env.DB_USER_PHONE];
    let editMemberValue = [bcrypt.hashSync(req.body.password, randomSalt), req.body.telId, req.body.phoneNum];
    let editMemberObj = {};
    for ( let i = 0; i < editMembeKey.length; i++) 
        if(editMemberValue[i] !== undefined) 
            editMemberObj[editMembeKey[i]] = editMemberValue[i];
    
    connection.query('update db_bisangoo_members set ?', editMemberObj, (err, result) => {
        if(err) console.log(err);
        else {
            res.send('success');
        }
    });
});





app.get("/logout", (req, res)=> {
    req.session.destroy(() => { req.session });
    res.redirect('/');
});

app.get('*', (req, res) => {
    res.status(404).render('error404.ejs');
});

app.listen(PORT, () => {
    console.log(`[${dateTimeNow.toLocaleString()}]--- 서버 시작. 포트 번호 : ${PORT}`);
});

