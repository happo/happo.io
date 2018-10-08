// This is the default, no-op, render wrapper. If you're looking to provide your
// own, it might look something like this:
// ```
// /* In React */
// export default (component) => <Wrapper>{component}</Wrapper>
// ```
// ```
// /* In a plain-js project */
// export default (html) => '<div>' + html + '</div>';
// ```
export default (result) => result;
