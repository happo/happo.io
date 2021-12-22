const isFunction = (value) => typeof value === 'function';

export default (defaultOptions, customOptions = {}) => {
  const result = { ...defaultOptions };

  Object.entries(customOptions).forEach(([customOptionKey, customOptionValue]) => {
    const defaultOptionValue = result[customOptionKey];
    const areBothFunctions = [defaultOptionValue, customOptionValue].every(
      isFunction,
    );

    result[customOptionKey] = areBothFunctions
      ? (...args) => {
          defaultOptionValue(...args);
          customOptionValue(...args);
        }
      : customOptionValue;
  });

  return result;
};
