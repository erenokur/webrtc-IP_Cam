import { useParams } from "react-router-dom";
import React, { useRef, useEffect } from "react";
import socketio from "socket.io-client";
import "./CallScreen.css";

function CallScreen() {
  const params = useParams();
  const streamingServer = params.streamingServer;
  const IPCameraStream = params.IPCameraStream;
  const localUsername = params.username;
  const roomName = params.room;
  const localVideoRef = useRef(null);
  const localVideoCanvasRef = useRef(null);

  const remoteVideoRef = useRef(null);
  const normalMode = false;
  const socket = socketio(streamingServer, {
    transports: ["websocket", "polling", "flashsocket"],
    autoConnect: false,
  });

  let streamFromCanvas;
  let pc; // For RTCPeerConnection Object
  let img = new Image();
  let ctx;

  const sendData = (data) => {
    socket.emit("data", {
      username: localUsername,
      room: roomName,
      data: data,
    });
  };

  useEffect(() => {
    img.src = IPCameraStream;
    img.crossOrigin = "Anonymous";
    const handleInterval = setInterval(() => {
      img.onload = function () {
        ctx = localVideoCanvasRef.current.getContext("2d");

        let ctx_off = localVideoCanvasRef.current.cloneNode().getContext("2d");
        ctx_off.drawImage(img, 0, 0);
        ctx.drawImage(ctx_off.canvas, 0, 0, 300, 300);

        ctx.drawImage(img, 0, 0, 300, 300);
      };
      img.src = IPCameraStream;
    }, 100);
    startConnection();
    return function cleanup() {
      pc?.close();
      clearInterval(handleInterval);
    };
  }, []);

  function timeout(delay) {
    return new Promise((res) => setTimeout(res, delay));
  }

  const startConnection = async () => {
    if (normalMode) {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            height: 350,
            width: 350,
          },
        })
        .then((stream) => {
          console.log("Local Stream found");
          localVideoRef.current.srcObject = stream;
          socket.connect();
          socket.emit("join", { username: localUsername, room: roomName });
        })
        .catch((error) => {
          console.error("Stream not found: ", error);
        });
    } else {
      ctx = localVideoCanvasRef.current.getContext("2d");
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      img.src = IPCameraStream;
      await timeout(1000);
      streamFromCanvas = localVideoCanvasRef.current.captureStream(25);
      socket.connect();
      socket.emit("join", { username: localUsername, room: roomName });
    }
  };

  const onIceCandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate");
      sendData({
        type: "candidate",
        candidate: event.candidate,
      });
    }
  };

  const onTrack = (event) => {
    console.log("Adding remote track");
    remoteVideoRef.current.srcObject = event.streams[0];
  };

  const createPeerConnection = () => {
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:openrelay.metered.ca:80",
          },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      });
      pc.onicecandidate = onIceCandidate;
      pc.ontrack = onTrack;
      if (normalMode) {
        const localStream = localVideoRef.current.srcObject;
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      } else {
        for (const track of streamFromCanvas.getTracks()) {
          pc.addTrack(track, streamFromCanvas);
        }
        console.log("PeerConnection created");
      }
    } catch (error) {
      console.error("PeerConnection failed: ", error);
    }
  };

  const setAndSendLocalDescription = (sessionDescription) => {
    pc.setLocalDescription(sessionDescription);
    console.log("Local description set");
    sendData(sessionDescription);
  };

  const sendOffer = () => {
    console.log("Sending offer");
    pc.createOffer().then(setAndSendLocalDescription, (error) => {
      console.error("Send offer failed: ", error);
    });
  };

  const sendAnswer = () => {
    console.log("Sending answer");
    pc.createAnswer().then(setAndSendLocalDescription, (error) => {
      console.error("Send answer failed: ", error);
    });
  };

  const signalingDataHandler = (data) => {
    if (data.type === "offer") {
      createPeerConnection();
      pc.setRemoteDescription(new RTCSessionDescription(data));
      sendAnswer();
    } else if (data.type === "answer") {
      pc.setRemoteDescription(new RTCSessionDescription(data));
    } else if (data.type === "candidate") {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      console.log("Unknown Data");
    }
  };

  socket.on("ready", () => {
    console.log("Ready to Connect!");
    createPeerConnection();
    sendOffer();
  });

  socket.on("data", (data) => {
    console.log("Data received: ", data);
    signalingDataHandler(data);
  });

  return (
    <div>
      <label>{"Username: " + localUsername}</label>
      <label>{"Room Id: " + roomName}</label>
      <canvas
        autoPlay
        ref={localVideoCanvasRef}
        width={300}
        height={300}
        crossOrigin="Anonymous"
      ></canvas>

      <video autoPlay muted playsInline ref={remoteVideoRef} />
    </div>
  );
}

export default CallScreen;
