// This is the default, render wrapper. If you're looking to provide your
// own, it might look something like this:
// ```
// /* In React */
// export default (component) => <Wrapper>{component}</Wrapper>
// ```
// ```
// /* In a plain-js project */
// export default (html) => '<div>' + html + '</div>';
//
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    const { component, variant } = this.props;
    console.error(
      `Caught error while rendering component "${component}", variant "${variant}"`,
    );
    console.error(error);
  }

  render() {
    const { error } = this.state;
    const { component, variant, children } = this.props;
    if (error) {
      return React.createElement(
        'pre',
        {
          style: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: 'small',
          },
        },
        `Error when rendering component "${component}", variant "${variant}"\n\n${error.stack}`,
      );
    }

    return children;
  }
}
export default function renderWrapperReact(result, { component, variant }) {
  return React.createElement(ErrorBoundary, { component, variant }, result);
}
