let express = require("express"); 
let app = express(); 
let http = require("http").Server(app); 
let io = require("socket.io")(http); 
const mysql = require("mysql"); 
let bodyParser = require("body-parser"); 

let urlencodedParser = bodyParser.urlencoded({extended: false }); 

const db = mysql.createConnection({
    host: "db4free.net", 
    user: "chatback", 
    password: "chatback" , 
    database: "chatback"  
}); 

let usersOnline = []; 

db.connect(err => { 
    if (err) { 
        console.log(err); 
    } 
    console.log("Connected to Mysql!"); 
}); 

// app.use(bodyParser); 
app.use(express.json());


app.get("/", (req, res) => { 
    res.sendFile(`${__dirname}/index.html`); 
}); 

app.get("/api/group-chat", (req, res) => { 
    let sql = "SELECT * FROM messages"; 
    let messages = []; 
    let query = db.query(sql, (err, result) => { 
        if (err) console.log(err);  // throw err; 
        // console.log(result); 
        result.forEach(row => {
            messages.push({nickname: row.author, content: row.content});  
        }); 
        // console.log(messages); 
        res.send(JSON.stringify(messages)); 
    }); 
}); 

app.post("/signup", urlencodedParser, (req, res) => { 
    // check user does not already exist before saving to the database 
    let user = { 
        username: req.body["username-signup"],  // nickname will be replaced with username 
        password: req.body["password-signup"]
        // online: true 
    }    
    // let sql = "INSERT INTO users SET ?"; 
    let sql = "INSERT INTO users2 SET ?"; 
    let query = db.query(sql, user, (err, result) => { 
        // console.log(result); 
        res.redirect("/");     
        // `${__dirname}/index.html` 
    }); 
}); 

/* 
app.post("/signin", urlencodedParser, (req, res) => { 
    let sql = `SELECT * FROM users2 WHERE username = '${req.body["username-signin"]}' AND password = '${req.body["password-signin"]}';`; 
    let query = db.query(sql, (err, user) => { 
        if (err) console.log(err); 
        // console.log(user); 
        // update user's logged in status 
        res.send(user); 
        // res.redirect("/"); 
    }); 
}); 
*/ 
app.post("/signin", urlencodedParser, (req, res) => { 
    let sql = `SELECT * FROM users2 WHERE username = '${req.body["username"]}' AND password = '${req.body["password"]}';`; 
    let query = db.query(sql, (err, user) => { 
        if (err) console.log(err); 
        // console.log(user); 
        // update user's logged in status 
        res.send(user); 
        // res.redirect("/"); 
    }); 
}); 

/* 
app.get(`/follow-user/:user/:currentUser`, (req, res) => { 
    // check user is signed in 
    console.log(req.params); 
}); 
*/ 

app.post("/follow-user", urlencodedParser, (req, res) => { 
    let sql = `SELECT * FROM users2 WHERE users2.username = '${req.body["username"]}' `;
    let query = db.query(sql, (err, requestedUser) => { 
        if (err) console.log(err); 
        // let sql2 = `INSERT INTO following(friendName, userFollowedId, userId) VALUES ('${requestedUser[0].username}', (${requestedUser[0].id}, ${req.body["currentUser"][0].id})`; 
        // console.log(req.body["currentUser"][0].id); 
        let sql2 = `INSERT INTO following(friendName, userFollowedId, userId) VALUES ('${requestedUser[0].username}', ${requestedUser[0].id}, ${req.body["currentUser"][0].id})`; 
        let query2 = db.query(sql2, (err, result) => { 
            if (err) throw err; 
            // console.log(result); 
        });
    }); 
}); 

app.get("/user-friends/:currentUserId", (req, res) => { 
    let sql = `SELECT * FROM following where following.userId = ${req.params.currentUserId}`; 
    // console.log(req.params.currentUserId); 
    let query = db.query(sql, (err, userFriends) => { 
        if (err) console.log(err); 
        res.send(userFriends); 
    }); 
}); 

io.on('connection', socket => {
    socket.on('chat message', msg => {
        io.emit("chat message", `${msg.nickname} says ${msg.content}`); 
        // let sql = "INSERT INTO messages SET ?";
        //  let sql = `INSERT INTO messages VALUES ('${msg.nickname}', '${msg.content}')`;  
        // let sql = `INSERT INTO messages2 VALUES ('${msg.nickname}', '${msg.content}');`; // ideally username should be used instead of nickname for author field 
        /* 
        let message = { 
            content: msg.content, 
            author: msg.nickname
        }    
        // let sql = "INSERT INTO users SET ?"; 
        */ 
        let sql = `INSERT INTO messages VALUES ('${msg.nickname}', '${msg.content}')`;  
        // let sql = "INSERT INTO messages2 SET ?"; 
            let query = db.query(sql, (err, result) => { 
            if (err) throw err; 
        }); 
    });
    socket.on("nickname", nickname => { 
        io.emit("nickname", nickname);
        usersOnline.push(nickname); 
        io.emit("user online", usersOnline); 
    });
    socket.on("user is typing", nickname => { 
        io.emit("user is typing", nickname); 
    }); 

    socket.on("user disconnected", userNickname => { 
        // remove userNickname from usersOnline array 
        // sconsole.log(userNickname); 
        usersOnline = usersOnline.filter(user => user != userNickname); 
        io.emit("user online", usersOnline); 
    }); 
});

http.listen(3000, () => { 
    console.log("Listening on port 3000"); 
}); 
