import React, { useState, useEffect } from 'react';
import MediaContainer from "@/components/threadsStyleMediaContainer";
import InfiniteScroll from 'react-infinite-scroll-component';
import { LinkItUrl } from 'react-linkify-it';
import { Message } from '@/type';

const AUTHOR = import.meta.env.VITE_AUTHOR;
const BASE = import.meta.env.VITE_BASE;

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
      const response = await fetch(`${ BASE }/assets/channel/${ curMonth }/data.json`);
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
    const { photos, created_at, text, date: date_, tags, quoted_message } = message;
    const date = date_ || created_at.slice(0, 10);

    return (
      <div className="whitespace-pre-line pb-3 border-b mt-2 mb-4 mx-3 border-card-bg border-opacity-30 scroll-m-4" id={ message.id }>
        <div className="flex overflow-hidden">
          <img
            src={ `./assets/avatars/${ AVATARS[index % AVATARS.length] }` }
            alt={ AUTHOR }
            className="w-10 h-10 rounded-full mr-2 mt-1"
          />
          <div className="flex flex-col flex-grow-0 max-w-[85%]">
            <p className="font-semibold text-lg text-gray-800">{ AUTHOR }</p>
            <p className="text-xs text-zinc-600"> { (date || '').slice(6,) + " " + created_at.slice(10,) }</p>
            <LinkItUrl><div className="mt-2 text-gray-900 w-full break-all">
              {
                text.split('\n').map((line, index) => (
                  line && <span key={ index }>
                    { line }
                    { index !== text.split('\n').length - 1 && <div className="h-3" /> }
                  </span>
                ))
              }
            </div></LinkItUrl>
            <MediaContainer
              className="mt-2"
              prefix={ `${ BASE }/assets/channel/${ curMonth }/${ date }` }
              photos={ photos }
            />
            { tags && tags.length > 0 && (
              <div className="mt-2">
                { tags.map((tag, index) => (
                  <span
                    key={ index }
                    className="py-1 mr-2 text-sm font-semibold text-card-bg before:bg-card before:content-['#'] before:mr-1 before:rounded"
                  >
                    { tag }
                  </span>
                )) }
              </div>
            ) }
            { quoted_message && (
              <div className="cursor-pointer mt-3 mb-2 mx-2 px-2 py-1 bg-opacity-10 bg-card-bg text-text border-l-2 border-x-card-bg" onClick={ (e) => {
                const ele = document.getElementById(quoted_message.id);
                if (ele) {
                  ele.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }
              } }>
                <p>{ quoted_message.text }</p>
              </div>
            ) }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-bg overflow-auto w-full max-w-lg mx-auto scrollbar scrollbar-thumb-card-bg scrollbar-track-bg-secondary ">
      <InfiniteScroll
        dataLength={ messages.length }
        next={ fetchMessages }
        hasMore={ hasMore }
        loader={ <h4 className="text-center py-4">Loading...</h4> }
        endMessage={ <p className="text-center py-4">No more messages</p> }
      >
        <div className="flex font-wireone items-start px-5 pt-2 text-card-bg text-[60px]">
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
