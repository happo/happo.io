// import { createServer } from 'http-server';

// export default function debugCommand({ port = 4430 }, config) {
  // const server = createServer({ root: config.tmpdir, cache: -1 });
  // server.listen({ port }, (err) => {
  //   if (err) {
  //     console.error(err);
  //     process.exit(1);
  //     return;
  //   }
  //   console.log(`Debug server running at http://localhost:${port}/`);
  // });
// }
export default function debugCommand() {
  throw new Error('The debug command is temporarily disabled. See https://github.com/happo/happo.io/issues/73 for context');
}
