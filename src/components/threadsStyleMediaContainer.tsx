import React, { useEffect, useState } from 'react';
import { Photo } from '@/type';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaContainerProps {
  prefix: string;
  photos: Photo[];
  className?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ prefix, className, photos }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!photos || !photos.length) {
    return null;
  }

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const showPrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isModalOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        showPrevImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
      case 'Escape':
        closeModal();
        break;
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <div className={ `w-full ${ className }` }>
      { photos.length === 1 ? (
        <div className="w-full">
          <img
            src={ `${ prefix }/${ photos[0].path }` }
            alt="media"
            className="object-contain max-h-[350px] cursor-pointer"
            onClick={ () => openModal(0) }
          />
        </div>
      ) : (
        <div className="w-full overflow-x-auto flex space-x-2 h-[250px]">
          { photos.map((photo, index) => (
            <div
              key={ index }
              id={ photo.id }
              className="flex-shrink-0 flex-grow-0 w-[180px] h-full overflow-y-hidden cursor-pointer"
              onClick={ () => openModal(index) }
            >
              <img
                src={ `${ prefix }/${ photo.path }` }
                alt={ `media-${ index }` }
                className="object-cover h-full w-full"
              />
            </div>
          )) }
        </div>
      ) }
      <AnimatePresence>
        { isModalOpen && (
          <motion.div
            initial={ { opacity: 0.4 } }
            animate={ { opacity: 1 } }
            exit={ { opacity: 0 } }
            transition={ { duration: 0.2 } }
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={ closeModal }
            tabIndex={ 0 }
          >
            <motion.div
              className="relative"
              initial={ { scale: 0.9, opacity: 0 } }
              animate={ { scale: 1, opacity: 1 } }
              exit={ { scale: 0.9, opacity: 0 } }
              transition={ { duration: 0.2 } }
              onClick={ (e) => e.stopPropagation() }
            >
              <img
                onClick={ closeModal }
                src={ `${ prefix }/${ photos[currentImageIndex].path }` }
                alt={ `Modal Image ${ currentImageIndex + 1 }` }
                className="max-w-full max-h-[90vh] object-contain"
              />
              { photos.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full"
                    onClick={ showPrevImage }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={ 2 }
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full"
                    onClick={ showNextImage }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={ 2 }
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              ) }
            </motion.div>
          </motion.div>
        ) }
      </AnimatePresence>
    </div>
  );
};

export default MediaContainer;
