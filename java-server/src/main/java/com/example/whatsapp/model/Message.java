package com.example.whatsapp.model;

import lombok.*;

@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString

public class Message {

    String senderName;
    String receiverName;
    String message;
    String file;
    String date;
    Status status;


}
