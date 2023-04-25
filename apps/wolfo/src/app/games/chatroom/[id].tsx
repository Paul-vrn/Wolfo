import { Button, Text } from "@ui-kitten/components";
import { useRouter, useSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { SafeAreaProvider } from "react-native-safe-area-context";
import io, { Socket } from "socket.io-client";
import { Message, NewMessage } from "types";
import { getMessages } from "../../../utils/api/chat";

const IP = process.env.IP || "localhost";
const PORT = process.env.PORT || 3000;
const socketEndpoint = `http://${IP}:${PORT}`;

const ChatRoomView = () => {
  const [messagesList, setMessagesList] = useState<IMessage[]>([]);
  const router = useRouter();
  const { id, userId, gameId } = useSearchParams();

  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    const newSocket = io(socketEndpoint);
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messages: Message[] = await getMessages(Number(id));
        const convertedMessages: IMessage[] = messages.map(msg => ({
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.authorId,
            name: msg.authorId,
          },
        }));
        setMessagesList(convertedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    if (socket) {
      socket.on("connect", () => {
        console.log("Connected to socket server");
        socket.emit("joinChatRoom", { chatRoomId: id, userId });
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from socket server");
      });

      const handleNewMessage = (msg: Message) => {
        const convertedMessage: IMessage = {
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.authorId,
            name: msg.authorId,
          },
        };
        setMessagesList(prevMessages => [...prevMessages, convertedMessage]);
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
        socket.disconnect();
      };
    }
  }, [id, userId, socket]);

  const onSend = (msgList: IMessage[] = []) => {
    msgList.forEach(msg => {
      const newMessage: NewMessage = {
        chatRoomId: Number(id),
        content: msg.text,
        authorId: userId,
        gameId: Number(gameId),
      };
      socket?.emit("messagePosted", newMessage);
    });
  };

  return (
    <SafeAreaProvider>
      <Text>ChatRoom | {Number(id)}</Text>
      <GiftedChat
        messages={messagesList}
        onSend={messages => onSend(messages)}
        user={{ _id: userId }}
        renderUsernameOnMessage={true}
      />
      <Button onPress={() => router.back()}>Go Back</Button>
    </SafeAreaProvider>
  );
};

export default ChatRoomView;