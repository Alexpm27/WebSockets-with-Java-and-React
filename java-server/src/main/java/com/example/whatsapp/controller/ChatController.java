package com.example.whatsapp.controller;

import com.example.whatsapp.model.Message;
import com.example.whatsapp.model.Status;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;

@Controller
public class ChatController {
    ArrayList<String> arrayUsernames = new ArrayList<>();

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/message")
    @SendTo("/chatroom/public")
    private Message receivedPublicMessage(@Payload Message message){
        return message;
    }

    @MessageMapping("private-message")
    public Message receivedPrivateMessage(@Payload Message message){

            simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private", message);
            arrayUsernames.add(message.getReceiverName());
            return message;


    }



}
