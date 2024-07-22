import React from 'react';
import { Photo } from '@/type';

interface MediaContainerProps {
  prefix: string;
  photos: Photo[];
  className?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({ prefix, className, photos }) => {
  if (!photos || !photos.length) {
    return null;
  }

  return (
    <div className={ `w-full ${ className }` }>
      { photos.length === 1 ? (
        <div className="w-full">
          <img
            src={ `${ prefix }/${ photos[0].path }` }
            alt="media"
            className="object-contain max-h-[350px]"
          />
        </div>
      ) : (
        <div className="w-full overflow-x-auto flex space-x-2 h-[250px]">
          { photos.map((photo, index) => (
            <div key={ index } id={ photo.id } className="flex-shrink-0 flex-grow-0 w-[180px] h-full overflow-y-hidden">
              <img
                src={ `${ prefix }/${ photo.path }` }
                alt={ `media-${ index }` }
                className="object-cover h-full w-full"
              />
            </div>
          )) }
        </div>
      ) }
    </div>
  );
};

export default MediaContainer;
