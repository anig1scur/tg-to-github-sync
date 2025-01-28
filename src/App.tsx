import routes from './routes';
import { useRoutes } from 'react-router-dom';

const App = () => {
  const element = useRoutes(routes);

  return <div className='bg-bg bg-[url("/assets/memo.png")] bg-contain'>{ element }</div>;
};


export default App;
