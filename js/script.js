var config = {
  apiKey: "AIzaSyA8updu_VB_yZwnbDcs2OKOcP5KeBExkwU",
    authDomain: "webrtc1-8ba8c.firebaseapp.com",
    databaseURL: "https://webrtc1-8ba8c.firebaseio.com",
    projectId: "webrtc1-8ba8c",
    storageBucket: "webrtc1-8ba8c.appspot.com",
    messagingSenderId: "229575003926"
};
firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var patientVideo = document.getElementById("patientVideo");
var yourId = Math.floor(Math.random()*1000000000);
var servers = {'iceServers': [ {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:182.65.197.19:3478','credential': 'admin','username': 'admin'}]};
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
pc.onaddstream = (event => patientVideo.srcObject = event.stream);

function sendMessage(senderId, data) {
    var msg = database.push({ sender: senderId, message: data });
    msg.remove();
}

function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    if (sender != yourId) {
        if (msg.ice != undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
        else if (msg.sdp.type == "answer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
};

database.on('child_added', readMessage);

function showMyFace() {
  navigator.mediaDevices.getUserMedia({audio:true, video:true})
    .then(stream => yourVideo.srcObject = stream)
    .then(stream => pc.addStream(stream));
}

function showFriendsFace() {
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer) )
    .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})) );
}
