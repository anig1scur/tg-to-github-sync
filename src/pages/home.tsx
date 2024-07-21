import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import InfiniteScroll from 'react-infinite-scroll-component';
import MediaContainer from "@/components/threadsStyleMediaContainer";

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
  const listRef = useRef<List>(null);
  const lastTop = useRef<number>(0);

  const fetchMessages = async (): Promise<void> => {
    try {
      const response = await fetch(`./assets/channel/2024-07/data.json`);
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

  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [messages]);

  const getItemSize = useCallback((index: number) => {
    const message = messages[index];
    const {
      text,
      photos,
      tags,
      quoted_message,
    } = message;

    let height = 150;

    height += Math.ceil(text.length / 20) * 20;
    height += photos.length ? (photos.length === 1 ? 250 : 220) : 0;
    if (tags && tags.length > 0) {
      height += 30;
    }
    if (quoted_message) {
      height += Math.ceil(quoted_message.text.length / 50) * 20;
    }
    return height;
  }, [messages]);

  const MessageItem: React.FC<ListChildComponentProps> = ({ index, style }) => {
    const message = messages[index];
    const { photos, created_at, text, date, tags, quoted_message } = message;
    return (
      <div style={ style } className=" whitespace-pre-line px-3 py-5 border-b border-gray-200 hover:bg-gray-50">
        <div className="flex overflow-x-hidden">
          <img
            src={ `./assets/avatars/${ AVATARS[index % AVATARS.length] }` }
            alt={ AUTHOR }
            className="w-10 h-10 rounded-full mr-2 flex-shrink-0"
          />
          <div className="flex flex-col flex-shrink-1 max-w-[88%] overflow-auto">
            <p className="font-semibold text-gray-900">{ AUTHOR }</p>
            <p className="text-sm text-gray-500">{ new Date(created_at).toLocaleString() }</p>
            <p className="mt-2 text-gray-700 w-full break-all">{ text }</p>
            <MediaContainer
              className="mt-2"
              images={ photos.map(photo => `./assets/channel/2024-07/${ date }/${ photo.path }`) } />
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
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="mt-2 text-gray-700">{ quoted_message.text }</p>
              </div>
            ) }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-bg w-full max-w-lg mx-auto">
      <InfiniteScroll
        dataLength={ messages.length }
        next={ fetchMessages }
        hasMore={ hasMore }
        loader={ <h4 className="text-center py-4">Loading...</h4> }
        endMessage={ <p className="text-center py-4">No more messages</p> }
      >
        <List
          ref={ listRef }
          height={ window.innerHeight }
          itemCount={ messages.length }
          itemSize={ getItemSize }
          width="100%"
        >
          { MessageItem }
        </List>
      </InfiniteScroll>
    </div>
  );
};

export default MessageList;
