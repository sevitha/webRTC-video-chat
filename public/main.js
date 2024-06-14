let Peer = require('simple-peer') //watchify for client.js(coz no require functionality)
let socket = io() // directly connect to our host

socket.on('connect', function () {
    console.log('Connected to server');
    const video = document.querySelector('video') //reference to our own video
    let client = {} //client object will everything related to the other person

    //get stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }) //ask browser for the user permissions
        .then(stream => {
            //inform backend that user has accepted the permissions please add one client
            socket.emit('NewClient')
            video.srcObject = stream //display video, so user can see himself
            video.play() //user can see himself

            //define new peer and return it
            function InitPeer(type) {
                let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false, config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }, // Example STUN server
                        // Add more TURN servers if needed
                        // { urls: 'turn:myturnserver.com:3478?transport=udp', username: 'username', credential: 'password' }
                    ]
                }})
                peer.on('stream', function (remoteStream) {
                    CreateVideo(remoteStream)
                }) //when we get the stream from other user, we  want to create a new video
                peer.on('close', function () {
                    document.getElementById("peerVideo").remove();
                    peer.destroy();
                })
                return peer
            }

            function RemoveVideo(){
                document.getElementById("peerVideo").remove();
            }
            //    peer that send the offer
            function MakePeer() {
                client.gotAnswer = false //when we send an offer, we'll wait for an answer, till then it is set to false
                let peer = InitPeer('init')
                peer.on('signal', function (data) {
                    if (!client.gotAnswer) {
                        socket.emit('Offer', data)
                    }
                })
                client.peer = peer
            }
            //got offer from client and we send an answer, not of type init
            function FrontAnswer(offer) {
                let peer = InitPeer('notInit')
                peer.on('signal', (data) => {
                    socket.emit('Answer', data)
                })
                peer.signal(offer) // it wont call itself, so we call it
            }
            //this function will handle when answer comes from backend
            function SignalAnswer(answer) {
                client.gotAnswer = true
                let peer = client.peer
                peer.signal(answer)
            }

            function CreateVideo(stream) {
                let video = document.createElement('video')
                video.id = 'peerVideo'
                video.srcObject = stream
                // video.class = 'embed-responsive-item'
                video.className = 'embed-responsive-item';
                document.querySelector('#peerDiv').appendChild(video)
                video.play()
            }
            //two people already chatting and someone else opne ths url, we need to notify session active
            function SessionActive() {
                document.write('Session active. Please come back later')
            }

            socket.on('BackOffer', FrontAnswer)
            socket.on('BackAnswer', SignalAnswer)
            socket.on('SessionActive', SessionActive)
            socket.on('CreatePeer', MakePeer)
            socket.on('RemoveVideo', RemoveVideo)
        })
        .catch(err => document.write(err))
});