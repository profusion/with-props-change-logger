import React from 'react';
import withPropsChangeLogger from '@profusion/with-props-change-logger';

import logo from './logo.svg';
import './App.css';

function MyComponent(props: { a: number[] }): JSX.Element {
  return (
    <div>{JSON.stringify(props)}</div>
  );
}

const LoggedComponent = withPropsChangeLogger(MyComponent);

function useGrowingArray(): [number[], () => void] {
  const [array, setArray] = React.useState<number[]>([]);

  const growArray = React.useCallback(() => {
    setArray((prev) => prev.concat(prev.length));
  }, []);
  return [array, growArray];
}

function App() {
  const [a, growA] = useGrowingArray();
  const [b, growB] = useGrowingArray();

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={growA}>
          Change Prop (should log)
        </button>
        <button onClick={growB}>
          Change something else (should NOT log)
        </button>
        <LoggedComponent a={a} />
        <div>
          prop: {JSON.stringify(a)}
        </div>
        <div>
          something else: {JSON.stringify(b)}
        </div>
      </header>
    </div>
  );
}

export default App;
