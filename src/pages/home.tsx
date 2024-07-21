import React, { useState, useEffect, useRef } from 'react';
import MediaContainer from "@/components/threadsStyleMediaContainer";
import InfiniteScroll from 'react-infinite-scroll-component';
import { LinkItUrl } from 'react-linkify-it';

interface Photo {
  path: string;
  width: number;
  height: number;
}
interface Message {
  id: string;
  text: string;
  photos: Photo[];
  tags?: string[];
  quoted_message: Message | null;
  created_at: string;
  date: string;
}

const AUTHOR = "Eunice";

const AVATARS = [
  'angry.png',
  'awkward.png',
  'die.png',
  'laugh.png',
  'money.png',
  'noface.png',
  'none.png',
  'sad.png',
  'shy.png',
];


const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [curMonth, setCurMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetchMessages = async (): Promise<void> => {
    try {
      const response = await fetch(`./assets/channel/${ curMonth }/data.json`);
      const newMessages: Message[] = await response.json();
      const newMessages_ = newMessages.filter((message) => message.text || message.photos.length);

      if (newMessages.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prevMessages => [...prevMessages, ...newMessages_]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const MessageItem: React.FC<{ message: Message, index: number }> = ({ message, index }) => {
    const { photos, created_at, text, date, tags, quoted_message } = message;

    return (
      <div className="whitespace-pre-line pb-4 border-b mt-3 mx-3 border-card-bg border-opacity-30" id={ message.id }>
        <div className="flex overflow-x-hidden">
          <img
            src={ `./assets/avatars/${ AVATARS[index % AVATARS.length] }` }
            alt={ AUTHOR }
            className="w-10 h-10 rounded-full mr-2 mt-1 scale-105 flex-shrink-0"
          />
          <div className="flex flex-col flex-grow-0 max-w-[85%]">
            <p className="font-semibold text-lg text-gray-900">{ AUTHOR }</p>
            <p className="text-xs text-zinc-600"> { (date || '').slice(6,) + " " + new Date(created_at).toLocaleTimeString() }</p>
            <LinkItUrl><p className="mt-2 text-gray-900 w-full break-all">
              {
                text.split('\n').map((line, index) => (
                  line && <span key={ index }>
                    { line }
                    { index !== text.split('\n').length - 1 && <div className="h-3" /> }
                  </span>
                ))
              }
            </p></LinkItUrl>
            <MediaContainer
              className="mt-2"
              images={ photos.map(photo => `./assets/channel/${ curMonth }/${ date }/${ photo.path }`) }
            />
            { tags && tags.length > 0 && (
              <div className="mt-2">
                { tags.map((tag, index) => (
                  <span
                    key={ index }
                    className="px-2 py-1 mr-2 text-sm text-white bg-blue-500 rounded-full"
                  >
                    { tag }
                  </span>
                )) }
              </div>
            ) }
            { quoted_message && (
              <div className="mt-5 mx-2 p-2 bg-opacity-10 bg-gray-600 border-l-2 border-black" onClick={ (e) => {
                const ele = document.getElementById(quoted_message.id);
                if (ele) {
                  ele.scrollIntoView({ behavior: 'smooth' });
                }
              } }>
                <p className="text-gray-700">{ quoted_message.text }</p>
              </div>
            ) }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-bg overflow-auto w-full max-w-lg mx-auto">
      <InfiniteScroll
        dataLength={ messages.length }
        next={ fetchMessages }
        hasMore={ hasMore }
        loader={ <h4 className="text-center py-4">Loading...</h4> }
        endMessage={ <p className="text-center py-4">No more messages</p> }
      >
        <div className="flex font-wireone items-start px-5 pt-2 text-card-bg text-[50px]">
          { curMonth }
        </div>
        { messages.map((message, index) => (
          <MessageItem key={ `${ index }_${ message.id }` } message={ message } index={ index } />
        )) }
      </InfiniteScroll>
    </div>
  );
};

export default MessageList;
