# Log Changed Properties in a React Component

This HOC (High Order Component) will wrap an existing class or
function component and track properties that changed.

This is useful if you're building a memoized component but it keeps
rendering and you want to know the property that is causing that.

It's meant to be used during development, production builds should
remove it.

## Example

```typescript
import withPropsChangeLogger from '@profusion/with-props-change-logger';

function MyComponent(props: { a: number[] }) {
  return (
    <div>{JSON.stringify(a)}</div>
  );
}

const LoggedComponent = withPropsChangeLogger(MyComponent);

function OtherComponent() {
  return (
    <LoggedComponent a={[1, 2, 3, 4, 5, 6, 7, 8]}>
  );
}
```

When changed (say from `[1234]` to `[1,2,3,4,5,6,7,8]`), produces:

```
PROP CHANGED: SimpleComponent a from:
	[1234]
to:
	[1,2,3,4,5,6,7,8]
PROP RE-RENDERED DUE PROPS: SimpleComponent
```

**NOTE:** objects (including arrays) and functions are compared just
like React does, using a _shallow comparison_! It doesn't matter if
the properties, array elements or the function body are the same, if
the instance is different, they will be logged.
Be sure to keep it stable (ie: using the old instances) with
`useMemo()`, `useRef()` or `useCallback()`.

### Verbosity

If you find the amount of information too verbose, you may want to
provide `verbose: false` and it will show only the `typeof` result, such
as:

```typescript
const LoggedComponent = withPropsChangeLogger(MyComponent, {
  verbose: false,
});
```

Produces:

```
PROP CHANGED: SimpleComponent a from: object to: object
PROP RE-RENDERED DUE PROPS: SimpleComponent
```
