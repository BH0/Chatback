let app = require("express")(); 
let http = require("http").Server(app); 
let io = require("socket.io")(http); 
const mysql = require("mysql"); 

const db = mysql.createConnection({
    host: "db4free.net", 
    user: "chatback", 
    password: "chatback" , 
    database: "chatback"  
}); 

db.connect(err => { 
    if (err) { 
        console.log(err); 
    } 
    console.log("Connected to Mysql!"); 
}); 

app.get("/", (req, res) => { 
    res.sendFile(`${__dirname}/index.html`); 
}); 

app.get("/api/group-chat", (req, res) => { 
    let sql = "SELECT * FROM messages"; 
    let messages = []; 
    let query = db.query(sql, (err, result) => { 
        if (err) throw err; 
        // console.log(result); 
        result.forEach(row => {
            messages.push({nickname: row.author, content: row.content});  
        }); 
        console.log(messages); 
        res.send(JSON.stringify(messages)); 
    }); 
}); 

io.on('connection', socket => {
    socket.on('chat message', msg => {
        io.emit("chat message", `${msg.nickname} says ${msg.content}`); 
        // let sql = "INSERT INTO messages SET ?";
        let sql = `INSERT INTO messages VALUES ('${msg.nickname}', '${msg.content}')`;  
        let query = db.query(sql, msg, (err, result) => { 
            if (err) throw err; 
            console.log(result); 
        }); 
    });
    socket.on("nickname", nickname => { 
        io.emit("nickname", nickname);
    });
    socket.on("user is typing", nickname => { 
        io.emit("user is typing", nickname); 
    }); 
});

http.listen(3000, () => { 
    console.log("Listening on port 3000"); 
}); 
