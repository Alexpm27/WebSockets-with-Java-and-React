import React, { useEffect, useState, useRef } from "react";
import { HiOutlineCamera } from "react-icons/hi2";

import { BiSend } from "react-icons/bi";
import { over } from "stompjs";
import SockJS from "sockjs-client";

var stompClient = null;
const ChatRoom = () => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const inputFile = useRef(null);
  var usersConections = [];
  var activeMe = false;
  var subscription;
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
    file: "",
  });
  useEffect(() => {
    console.log(userData);
  }, [userData]);

  const connect = () => {
    let Sock = new SockJS("http://192.168.89.242:8080/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    subscription = stompClient.subscribe("/chatroom/public", onMessageReceived);
    subscription = stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessage
    );
    userJoin();
  };

  const findUserName = () => {
    usersConections = privateChats.keys();
    let i = 0;

    for (const key of usersConections) {
      if (i > 0) {
        if (key == userData.username) {
          break;
        } else setUserData({ ...userData, connected: true });
      }
      i++;
      console.log(key);
    }
  };

  const userJoin = () => {
    var chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        
          if (!privateChats.get(payloadData.senderName)) {
            privateChats.set(payloadData.senderName, []);
            setPrivateChats(new Map(privateChats));
            userJoin();
            
              setUserData({ ...userData, connected: true });
          }
        

        break;
      case "MESSAGE":
        publicChats.push(payloadData);
        setPublicChats([...publicChats]);
        break;
    }
  };

  const onPrivateMessage = (payload) => {
    console.log(payload);
    var payloadData = JSON.parse(payload.body);
    if (privateChats.get(payloadData.senderName)) {
      privateChats.get(payloadData.senderName).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.senderName, list);
      setPrivateChats(new Map(privateChats));
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, message: value });
  };
  const sendValue = () => {
    if (stompClient) {
      var chatMessage = {
        senderName: userData.username,
        message: userData.message,
        file: userData.file,
        status: "MESSAGE",
      };
      console.log(chatMessage);
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "", file: "" });
      inputFile.current.value = null;
    }
  };

  const handleFile = (event) => {
    var files = event.target.files;
    Array.from(files).forEach((files) => {
      var reader = new FileReader();
      reader.readAsDataURL(files);
      reader.onload = function () {
        var fileConverted = reader.result.split(",");
        console.log(fileConverted);
        setUserData({ ...userData, file: fileConverted[1] });
      };
    });
  };

  const sendPrivateValue = () => {
    if (stompClient) {
      var chatMessage = {
        senderName: userData.username,
        receiverName: tab,
        file: userData.file,
        message: userData.message,
        status: "MESSAGE",
      };

      if (userData.username !== tab) {
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "", file: "" });
      inputFile.current.value = null;
    }
  };

  const handleUsername = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
  };

  const registerUser = () => {
    connect();
  };
  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                Group
              </li>
              {[...privateChats.keys()].map((name, index) => (
                <div>
                  {userData.username !== name && (
                    <li
                      onClick={() => {
                        setTab(name);
                      }}
                      className={`member ${tab === name && "active"}`}
                      key={index}
                    >
                      {name}
                    </li>
                  )}
                </div>
              ))}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {publicChats.map((chat, index) => (
                  <li
                    className={`message ${
                      chat.senderName === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">
                      {chat.file !== "" ? (
                        <img
                          src={`data:image/jpeg;base64,${chat.file}`}
                          width="100vh"
                          height="100vh"
                        ></img>
                      ) : (
                        chat.message
                      )}
                    </div>

                    {chat.senderName === userData.username && (
                      <div className="avatar self">me</div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="enter the message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <input
                  type="file"
                  className="inputfile"
                  ref={inputFile}
                  onChange={handleFile}
                  id="buttonFile"
                  accept=".jpg,.jpeg"
                  style={{ display: "none" }}
                />
                <label htmlFor="buttonFile">
                  <HiOutlineCamera />
                </label>
                <button
                  type="button"
                  className="send-button"
                  onClick={sendValue}
                >
                  <BiSend />
                </button>
              </div>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {[...privateChats.get(tab)].map((chat, index) => (
                  <li
                    className={`message ${
                      chat.senderName === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">
                      {chat.file !== "" ? (
                        <img
                          src={`data:image/jpeg;base64,${chat.file}`}
                          width="100vh"
                          height="100vh"
                        ></img>
                      ) : (
                        chat.message
                      )}
                    </div>
                    {chat.senderName === userData.username && (
                      <div className="avatar self">me</div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="enter the message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <input
                  type="file"
                  className="inputfile"
                  ref={inputFile}
                  accept=".jpg,.jpeg"
                  onChange={handleFile}
                  id="buttonFile"
                  style={{ display: "none" }}
                />
                <label htmlFor="buttonFile">
                  <HiOutlineCamera color="white" />
                </label>
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateValue}
                >
                  <BiSend />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter your name"
            name="userName"
            value={userData.username}
            onChange={handleUsername}
            margin="normal"
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
