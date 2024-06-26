const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))
let clients = 0

io.on('connection', function(socket){
    console.log('A user connected');
    socket.on("NewClient", function(){
        if(clients < 2){
            if(clients == 1){
                socket.emit('CreatePeer')
            }
        }
        else {
            this.emit('SessionActive')
        }
        clients++;
    })
    socket.on('Offer', SendOffer)
    socket.on('Answer', SendAnswer)
    socket.on('disconnect', Disconnect)
})

function Disconnect(){
    if(clients > 0) {
        clients--;
        this.broadcast.emit("RemoveVideo")
    }
}

function SendOffer(offer){
    this.broadcast.emit("BackOffer", offer)
}

function SendAnswer(data){
    this.broadcast.emit("BackAnswer", data)
}

http.listen(port, ()=> console.log(`Active on ${port} port`))