import { RouteObject } from 'react-router-dom';
import Home from '@/pages/home';


export default [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/*',
    element: <div className='flex mt-32 items-center justify-center text-[150px]'> 404 </div>
  }
] as RouteObject[];

