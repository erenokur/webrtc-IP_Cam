#WEBRTC with IP Camera support

This project is designed to stream video from an IP camera to a webrtc chat room.

## Getting Started

This project is based on [coder-with-a-bushido](https://coder-with-a-bushido.github.io) webrtc server and client. But I made changes for both server and client to support IP camera.
The main change is I use IP cam stream as a source and write it to a canvas then gave this canvas stream to the webrtc.

### Prerequisites

Backend: All requirements are in the requirements.txt file. You can install them with pip.
Clients : You need to install nodejs and npm. Then you can install all requirements with npm install command.

### Installing

Bakcend:

```bash
pip install -r requirements.txt
```

Client:

```bash
npm install
```

### Usage

after installing all requirements you can run the backend then run your clients.

first client will use your webcam so just give it your name, room name and backend url. Backend url is http://localhost:5004 by default.

second client will use your IP camera so just give it your name, room name, backend url and your IP camera url. Backend url is http://localhost:5004 by default.

if frame rate is low you can change it from the client side. Change captureStream to any desired rate. Default frame rate is 10.

### Resources

You may want to familiarize yourself with the following technologies/libraries:

- [WebRTC](https://webrtc.org/)
- [Socket.io](https://socket.io/)
- [python](https://www.python.org/)
- [react](https://reactjs.org/)

### Feedback

If you have any feedback about the project, please let me know. I am always looking for ways to improve the user experience.
