import React from 'react';

interface MediaContainerProps {
  images: string[];
  className?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ className, images }) => {
  if (!images || !images.length) {
    return null;
  }
  return (
    <div className={ `w-full ${ className }` }>
      { images.length === 1 ? (
        <div className="w-full">
          <img
            src={ images[0] }
            alt="media"
            className="object-contain h-[300px]"
          />
        </div>
      ) : (
        <div className="w-full overflow-x-auto flex space-x-2 h-[250px]">
          { images.map((src, index) => (
            <div key={ index } className="flex-shrink-0 w-[180px] h-full">
              <img
                src={ src }
                alt={ `media-${ index }` }
                className="h-full object-contain"
              />
            </div>
          )) }
        </div>
      ) }
    </div>
  );
};

export default MediaContainer;
