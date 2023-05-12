import React, { useRef } from 'react';

const simpleFormatValue = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }
  return typeof value;
};

const jsonFormatValue = (value: unknown): string => {
  /* istanbul ignore if */
  if (value === undefined) {
    return 'undefined';
  }
  return JSON.stringify(value);
};

const createFormatValue = (
  valueMaxDisplayLength: number | undefined,
): ((value: unknown) => string) => {
  if (valueMaxDisplayLength) {
    return (value: unknown): string => {
      const str = jsonFormatValue(value);
      if (str.length > valueMaxDisplayLength) {
        return `${str.slice(0, valueMaxDisplayLength)}...`;
      }
      return str;
    };
  }
  return jsonFormatValue;
};

const renderComponent = <T>(
  component: React.ComponentType<T>,
  props: Record<string, unknown>,
): JSX.Element => {
  if ('children' in props) {
    const { children, ...regularProps } = props;
    return React.createElement(
      component as React.ComponentType<{}>,
      regularProps,
      children as React.ReactNode[],
    );
  }

  return React.createElement(component as React.ComponentType<{}>, props);
};

// required so can match, see React.memo()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default <T>(
  Component: React.ComponentType<T>,
  config?: {
    displayName?: string;
    valueMaxDisplayLength?: number;
    verbose?: boolean;
    prefix?: string;
    log?: typeof console.log;
  },
): React.ComponentType<
  typeof Component extends React.ComponentType<infer P> ? P : never
> => {
  const {
    displayName: givenDisplayName,
    prefix = 'PROP',
    valueMaxDisplayLength,
    verbose = true,
    /* eslint-disable-next-line no-console */
    log = console.log,
  } = config || {};
  const displayName =
    givenDisplayName ||
    Component.displayName ||
    (typeof Component === 'function'
      ? Component.name
      : /* istanbul ignore next */ '?');

  const formatValue = verbose
    ? createFormatValue(valueMaxDisplayLength)
    : simpleFormatValue;

  const printChanged = verbose
    ? (key: string, previousValue: unknown, nextValue: unknown): void => {
        log(
          `${prefix} CHANGED: ${displayName} ${key} from:\n\t${formatValue(
            previousValue,
          )}\nto:\n\t${formatValue(nextValue)}`,
        );
      }
    : (key: string, previousValue: unknown, nextValue: unknown): void => {
        log(
          `${prefix} CHANGED: ${displayName} ${key} from: ${formatValue(
            previousValue,
          )} to: ${formatValue(nextValue)}`,
        );
      };

  const printAdded = verbose
    ? (key: string, nextValue: unknown): void => {
        log(
          `${prefix} ADDED: ${displayName} ${key}:\n\t${formatValue(
            nextValue,
          )}`,
        );
      }
    : (key: string, nextValue: unknown): void => {
        log(
          `${prefix} ADDED: ${displayName} ${key}: ${formatValue(nextValue)}`,
        );
      };

  const printRemoved = verbose
    ? (key: string, previousValue: unknown): void => {
        log(
          `${prefix} REMOVED: ${displayName} ${key}:\n\t${formatValue(
            previousValue,
          )}`,
        );
      }
    : (key: string, previousValue: unknown): void => {
        log(
          `${prefix} REMOVED: ${displayName} ${key}: ${formatValue(
            previousValue,
          )}`,
        );
      };

  const Wrapper = (
    givenProps: typeof Component extends React.ComponentType<infer P>
      ? P
      : never,
  ): JSX.Element => {
    const props = givenProps as Record<string, unknown>;
    const previousPropsRef = useRef(props as Record<string, unknown>);

    if (
      (typeof __DEV__ === 'boolean' && !__DEV__) ||
      process.env.NODE_ENV === 'production'
    ) {
      return renderComponent(Component, props);
    }

    if (previousPropsRef.current !== props) {
      const previousProps = previousPropsRef.current;
      const previousPropsKeys = new Set(Object.keys(previousProps));
      const propsChanged = Object.entries(props)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [key, newValue]) => {
          const previousValue = previousProps[key];
          const exists = previousPropsKeys.delete(key);
          if (previousValue !== newValue) {
            if (exists) {
              printChanged(key, previousValue, newValue);
            } else {
              printAdded(key, newValue);
            }
            return true;
          }
          return acc;
        }, false);
      Array.from(previousPropsKeys)
        .sort()
        .forEach(key => {
          printRemoved(key, previousProps[key]);
        });
      if (propsChanged || previousPropsKeys.size) {
        log(`${prefix} RE-RENDERED DUE PROPS: ${displayName}`);
      }
      previousPropsRef.current = props;
    }

    return renderComponent(Component, props);
  };
  Wrapper.displayName = `withPropsChangeLogger(${displayName})`;
  return Wrapper;
};
