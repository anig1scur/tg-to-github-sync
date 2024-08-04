import React, { useState, useEffect } from 'react';
import MediaContainer from "@/components/threadsStyleMediaContainer";
import InfiniteScroll from 'react-infinite-scroll-component';
import { Message } from '@/type';

const AUTHOR = import.meta.env.VITE_AUTHOR;
const BASE = import.meta.env.VITE_BASE;

const months = ['2024-07', '2024-08']

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
  'qiangdier.png',
  'reading.png',
  'sleep.png',
  'ye.png',
];

const replaceMarkdown = (text: string): string => {
  // __ __  -> <em> </em>
  const underline = /__(.*?)__/g;
  text = text.replace(underline, '<em>$1</em>');
  // ** **  -> <strong> </strong>
  const bold = /\*\*(.*?)\*\*/g;
  text = text.replace(bold, '<strong>$1</strong>');
  // ~~ ~~  -> <del> </del>
  const del = /~~(.*?)~~/g;
  text = text.replace(del, '<del>$1</del>');

  const link = /https?:\/\/([^\s]+)/g;
  text = text.replace(link, '<a href="$&" target="_blank">$&</a>');

  return text;
}

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [curMonth, setCurMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

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
    setMessages([]);
    setHasMore(true);
    fetchMessages();
  }, [curMonth]);

  const handleMonthChange = (month: string) => {
    setCurMonth(month);
    setIsDropdownOpen(false);
  };


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
            <div className="mt-2 text-gray-900 w-full break-all">
              {
                text.split('\n').map((line, index) => (
                  line && <span key={ index }>
                    <div dangerouslySetInnerHTML={ { __html: replaceMarkdown(line) } } />
                    { index !== text.split('\n').length - 1 && <div className="mt-2" /> }
                  </span>
                ))
              }
            </div>
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
    <div className="h-screen bg-bg overflow-auto w-full max-w-lg mx-auto scrollbar scrollbar-thumb-card-bg scrollbar-track-bg-secondary">
      <div className="flex font-wireone items-start px-5 pt-2 text-card-bg text-[60px] relative">
        <div
          className="flex items-center cursor-pointer"
          onClick={ () => setIsDropdownOpen(!isDropdownOpen) }
        >
          { curMonth }
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={ 2 }
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        { isDropdownOpen && (
          <div className="absolute top-full left-3 mt-1 bg-white border-[2.5px] border-card-bg rounded shadow-lg z-10">
            { months.map((month) => (
              <div
                key={ month }
                className={ `px-4 py-2 cursor-pointer hover:bg-bg ${ month === curMonth ? 'bg-bg font-bold' : ''
                  }` }
                onClick={ () => handleMonthChange(month) }
              >
                { month }
              </div>
            )) }
          </div>
        ) }
      </div>
      <InfiniteScroll
        dataLength={ messages.length }
        next={ fetchMessages }
        hasMore={ hasMore }
        loader={ <h4 className="text-center py-4 mt-4 text-card-bg">加载中...</h4> }
        endMessage={ <p className="text-center py-4">No more messages</p> }
      >
        { messages.map((message, index) => (
          <MessageItem key={ `${ index }_${ message.id }` } message={ message } index={ index } />
        )) }
      </InfiniteScroll>
    </div>
  );
};

export default MessageList;
