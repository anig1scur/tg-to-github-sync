import React, { useState, useEffect, useCallback } from 'react';
import MediaContainer from "@/components/threadsStyleMediaContainer";
import InfiniteScroll from 'react-infinite-scroll-component';
import { Message } from '@/type';

const AUTHOR = import.meta.env.VITE_AUTHOR;
const BASE = import.meta.env.VITE_BASE;

const months = ['2024-09', '2024-08', '2024-07']

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [curMonth, setCurMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchMessages = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${ BASE }/assets/channel/${ curMonth }/data.json`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setMessages(prev => [...prev, ...data]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    }
  }, [curMonth]);

  useEffect(() => {
    fetchMessages();

  }, [curMonth]);

  const loadNextMonth = useCallback(() => {
    if (!hasMore || isLoading) {
      return;
    }

    let curIdx = months.indexOf(curMonth);
    if (curIdx === -1) {
      setHasMore(false);
      return;
    }

    let nextIdx = curIdx + 1;
    if (nextIdx >= months.length) {
      setHasMore(false);
      return;
    }

    setCurMonth(months[nextIdx]);
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleMonthChange = (month: string) => {
    setMessages([]);
    setCurMonth(month);
    setIsDropdownOpen(false);
  };

  const filteredMessages = messages.filter(message =>
    message.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const MessageItem: React.FC<{ message: Message, index: number }> = ({ message, index }) => {
    const { photos, created_at, text, date: date_, tags, quoted_message } = message;
    const date = date_ || created_at.slice(0, 10);
    const month = date.slice(0, 7);

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
              prefix={ `${ BASE }/assets/channel/${ month }/${ date }` }
              photos={ photos }
            />
            { tags && tags.length > 0 && (
              <div className="mt-2">
                { tags.map((tag, index) => (
                  <span
                    key={ index }
                    onClick={ () => setSearchTerm(tag) }
                    className="py-1 mr-2 cursor-pointer text-sm font-semibold text-card-bg before:bg-card before:content-['#'] before:mr-1 before:rounded"
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
    <div className="h-dvh bg-bg overflow-auto w-full max-w-lg mx-auto scrollbar scrollbar-thumb-card-bg scrollbar-track-bg-secondary">
      <div className="flex font-wireone items-center w-full max-w-lg  mb-2 px-5 py-2 text-card-bg bg-bg fixed top-0 z-10">
        <div className="flex-0">
          <div
            className="flex items-center cursor-pointer text-5xl"
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
            <div className="absolute top-full text-4xl left-4 bg-white border-[2.5px] border-card-bg rounded shadow-lg z-10">
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
        <div className="flex-1 ml-10">
          <input
            type="text"
            placeholder="Search..."
            value={ searchTerm }
            onChange={ handleSearch }
            className="w-full font-mono px-3 py-2 text-base placeholder-bg-secondary text-card-bg border-[2.5px] rounded-lg focus:outline-none border-card-bg focus:border-dashed"
          />
        </div>
      </div>
      <InfiniteScroll
        className='mt-20'
        dataLength={ filteredMessages.length }
        next={ loadNextMonth }
        hasMore={ hasMore }
        loader={ <h4 className="text-center py-4 mt-4 text-card-bg">加载中...</h4> }
        endMessage={ <p className="text-center pb-4 text-card-bg">没有更多了...</p> }
      >
        { filteredMessages.map((message, index) => (
          <MessageItem key={ `${ index }_${ message.id }` } message={ message } index={ index } />
        )) }
      </InfiniteScroll>
    </div>
  );
};

export default MessageList;
