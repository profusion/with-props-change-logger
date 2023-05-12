import React from 'react';
import { render } from '@testing-library/react';

import withPropsChangeLogger from '../index';

let consoleLogMock: jest.SpyInstance<
  ReturnType<typeof console.log>,
  Parameters<typeof console.log>
>;

beforeEach(() => {
  consoleLogMock = jest.spyOn(global.console, 'log').mockImplementation();
});

afterEach(() => {
  consoleLogMock.mockRestore();
});

it.each([
  { testCaseName: 'NODE_ENV', useDevVariable: true },
  { testCaseName: '__DEV__', useDevVariable: false },
])(
  'should be disabled in prod - When $testCaseName is set',
  ({ useDevVariable }) => {
    const oldValue = process.env.NODE_ENV;
    try {
      if (!useDevVariable) process.env.NODE_ENV = 'production';
      else global.__DEV__ = false;
      const Component = ({ txt }: { txt: string }): JSX.Element => (
        <div>{txt}</div>
      );
      const TestComponent = withPropsChangeLogger(Component);
      const { container, rerender } = render(<TestComponent txt="hello" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  hello
</div>
`);
      expect(consoleLogMock).not.toBeCalled();
      rerender(<TestComponent txt="world" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  world
</div>
`);
      expect(consoleLogMock).not.toBeCalled();
    } finally {
      process.env.NODE_ENV = oldValue;
      global.__DEV__ = true;
    }
  },
);

it('detect changes in simple components (without children): verbose', async () => {
  const SimpleComponent = ({
    b,
    n,
    o,
    s,
  }: {
    b: boolean;
    n: number;
    o: Record<string, string>;
    s?: string | null;
  }): JSX.Element => (
    <div>{`b=${b}, n=${n}, o=${JSON.stringify(o)}, s=${s}`}</div>
  );
  const TestComponent = withPropsChangeLogger(SimpleComponent);
  const { container, rerender } = render(
    <TestComponent b={true} n={42} o={{ k: 'v' }} s="hello" />,
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=true, n=42, o={"k":"v"}, s=hello
</div>
`);
  // on mount it shouldn't log
  expect(consoleLogMock).not.toBeCalled();

  const newInstance = { k: 'v' };

  // note: object is the same, but a new instance (shallow comparison)
  rerender(<TestComponent b={false} n={1} o={newInstance} s="world" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=world
</div>
`);
  expect(consoleLogMock).toBeCalledTimes(5);
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: SimpleComponent b from:
	true
to:
	false`,
  );
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: SimpleComponent n from:
	42
to:
	1`,
  );
  // stringified is the same, but object instances were different:
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: SimpleComponent o from:
	{"k":"v"}
to:
	{"k":"v"}`,
  );
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: SimpleComponent s from:
	"hello"
to:
	"world"`,
  );
  expect(consoleLogMock).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: SimpleComponent',
  );

  consoleLogMock.mockClear();
  rerender(<TestComponent b={false} n={1} o={newInstance} s="world" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=world
</div>
`);
  // no updates!
  expect(consoleLogMock).not.toBeCalled();

  // removed property
  consoleLogMock.mockClear();
  rerender(<TestComponent b={false} n={1} o={newInstance} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=undefined
</div>
`);
  // no updates!
  expect(consoleLogMock).toBeCalledTimes(2);
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP REMOVED: SimpleComponent s:
	"world"`,
  );
  expect(consoleLogMock).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: SimpleComponent',
  );

  // added property
  consoleLogMock.mockClear();
  rerender(<TestComponent b={false} n={1} o={newInstance} s={null} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=null
</div>
`);
  // no updates!
  expect(consoleLogMock).toBeCalledTimes(2);
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP ADDED: SimpleComponent s:
	null`,
  );
  expect(consoleLogMock).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: SimpleComponent',
  );
});

it('detect changes in simple components (without children): quiet', async () => {
  const log = jest.fn();
  const SimpleComponent = ({
    b,
    n,
    o,
    s,
  }: {
    b: boolean;
    n: number;
    o: Record<string, string>;
    s?: string | null;
  }): JSX.Element => (
    <div>{`b=${b}, n=${n}, o=${JSON.stringify(o)}, s=${s}`}</div>
  );
  const TestComponent = withPropsChangeLogger(SimpleComponent, {
    log,
    verbose: false,
  });
  const { container, rerender } = render(
    <TestComponent b={true} n={42} o={{ k: 'v' }} s="hello" />,
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=true, n=42, o={"k":"v"}, s=hello
</div>
`);
  // on mount it shouldn't log
  expect(log).not.toBeCalled();

  const newInstance = { k: 'v' };

  // note: object is the same, but a new instance (shallow comparison)
  rerender(<TestComponent b={false} n={1} o={newInstance} s="world" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=world
</div>
`);
  expect(log).toBeCalledTimes(5);
  expect(log).toBeCalledWith(
    'PROP CHANGED: SimpleComponent b from: boolean to: boolean',
  );
  expect(log).toBeCalledWith(
    'PROP CHANGED: SimpleComponent n from: number to: number',
  );
  // stringified is the same, but object instances were different:
  expect(log).toBeCalledWith(
    'PROP CHANGED: SimpleComponent o from: object to: object',
  );
  expect(log).toBeCalledWith(
    'PROP CHANGED: SimpleComponent s from: string to: string',
  );
  expect(log).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: SimpleComponent',
  );

  log.mockClear();
  rerender(<TestComponent b={false} n={1} o={newInstance} s="world" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=world
</div>
`);
  // no updates!
  expect(log).not.toBeCalled();

  // removed property
  log.mockClear();
  rerender(<TestComponent b={false} n={1} o={newInstance} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=undefined
</div>
`);
  // no updates!
  expect(log).toBeCalledTimes(2);
  expect(log).toBeCalledWith('PROP REMOVED: SimpleComponent s: string');
  expect(log).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: SimpleComponent',
  );

  // added property
  log.mockClear();
  rerender(<TestComponent b={false} n={1} o={newInstance} s={null} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=null
</div>
`);
  // no updates!
  expect(log).toBeCalledTimes(2);
  expect(log).toBeCalledWith('PROP ADDED: SimpleComponent s: null');
  expect(log).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: SimpleComponent',
  );
});

it('detect changes in components with children', async () => {
  const ParentComponent = ({
    b,
    children,
    n,
    o,
    s,
  }: {
    b: boolean;
    children: React.ReactNode[];
    n: number;
    o: Record<string, string>;
    s: string;
  }): JSX.Element => (
    <div>
      {`b=${b}, n=${n}, o=${JSON.stringify(o)}, s=${s}`}
      {children}
    </div>
  );
  const TestComponent = withPropsChangeLogger(ParentComponent);
  const { container, rerender } = render(
    <TestComponent b={true} n={42} o={{ k: 'v' }} s="hello">
      <span>this is a child</span>
      <span>another child</span>
    </TestComponent>,
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=true, n=42, o={"k":"v"}, s=hello
  <span>
    this is a child
  </span>
  <span>
    another child
  </span>
</div>
`);
  // on mount it shouldn't log
  expect(consoleLogMock).not.toBeCalled();

  // simulate useMemo:
  const newInstance = { k: 'v' };
  const newChildren = [
    <span key="a">this is a child</span>,
    <span key="b">another child</span>,
  ];

  // note: object is the same, but a new instance (shallow comparison)
  rerender(
    <TestComponent b={false} n={1} o={newInstance} s="world">
      {newChildren}
    </TestComponent>,
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=world
  <span>
    this is a child
  </span>
  <span>
    another child
  </span>
</div>
`);
  expect(consoleLogMock).toBeCalledTimes(6);
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: ParentComponent b from:
	true
to:
	false`,
  );
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: ParentComponent n from:
	42
to:
	1`,
  );
  // stringified is the same, but object instances were different:
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: ParentComponent o from:
	{"k":"v"}
to:
	{"k":"v"}`,
  );
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: ParentComponent s from:
	"hello"
to:
	"world"`,
  );
  expect(consoleLogMock).toBeCalledWith(
    `\
PROP CHANGED: ParentComponent children from:
	[{"type":"span","key":null,"ref":null,"props":{"children":"this is a child"},"_owner":null,"_store":{}},{"type":"span","key":null,"ref":null,"props":{"children":"another child"},"_owner":null,"_store":{}}]
to:
	[{"type":"span","key":"a","ref":null,"props":{"children":"this is a child"},"_owner":null,"_store":{}},{"type":"span","key":"b","ref":null,"props":{"children":"another child"},"_owner":null,"_store":{}}]`,
  );
  expect(consoleLogMock).toHaveBeenLastCalledWith(
    'PROP RE-RENDERED DUE PROPS: ParentComponent',
  );

  consoleLogMock.mockClear();
  rerender(
    <TestComponent b={false} n={1} o={newInstance} s="world">
      {newChildren}
    </TestComponent>,
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  b=false, n=1, o={"k":"v"}, s=world
  <span>
    this is a child
  </span>
  <span>
    another child
  </span>
</div>
`);
  // no updates!
  expect(consoleLogMock).not.toBeCalled();
});

it('limits lengthy properties', async () => {
  const log = jest.fn();
  const SimpleComponent = ({ a }: { a: number[] }): JSX.Element => (
    <div>{JSON.stringify(a)}</div>
  );
  const TestComponent = withPropsChangeLogger(SimpleComponent, {
    log,
    prefix: '>>>',
    valueMaxDisplayLength: 10,
  });
  const a: Array<number> = [];
  for (let i = 0; i < 10; i += 1) {
    a.push(i);
  }
  const { container, rerender } = render(<TestComponent a={a} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  ${JSON.stringify(a)}
</div>
`);
  // on mount it shouldn't log
  expect(log).not.toBeCalled();

  rerender(<TestComponent a={[1234]} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
<div>
  [1234]
</div>
`);
  expect(log).toBeCalledTimes(2);
  expect(log).toBeCalledWith(
    `\
>>> CHANGED: SimpleComponent a from:
	[0,1,2,3,4...
to:
	[1234]`,
  );

  expect(log).toHaveBeenLastCalledWith(
    '>>> RE-RENDERED DUE PROPS: SimpleComponent',
  );
});
