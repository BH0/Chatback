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
});

http.listen(3000, () => { 
    console.log("Listening on port 3000"); 
}); 
