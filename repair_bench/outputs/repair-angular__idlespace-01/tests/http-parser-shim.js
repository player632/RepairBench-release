// Shim for process.binding('http_parser') removed in Node 18+.
// Used by legacy spdy/http-deceiver (webpack-dev-server v3 era) so that
// old Angular CLIs can at least load their module graph under modern Node.
const methods = ['DELETE','GET','HEAD','POST','PUT','CONNECT','OPTIONS','TRACE','COPY','LOCK','MKCOL','MOVE','PROPFIND','PROPPATCH','SEARCH','UNLOCK','BIND','REBIND','UNBIND','ACL','REPORT','MKACTIVITY','CHECKOUT','MERGE','M-SEARCH','NOTIFY','SUBSCRIBE','UNSUBSCRIBE','PATCH','PURGE','MKCALENDAR','LINK','UNLINK','SOURCEQUERY'];
function HTTPParser() {}
HTTPParser.kOnHeaders = 1;
HTTPParser.kOnHeadersComplete = 2;
HTTPParser.kOnBody = 3;
HTTPParser.kOnMessageComplete = 4;
HTTPParser.REQUEST = 1;
HTTPParser.RESPONSE = 2;
HTTPParser.methods = methods;
const origBinding = process.binding ? process.binding.bind(process) : null;
process.binding = function (name) {
  if (name === 'http_parser') return { HTTPParser, methods, parsers: { get: () => new HTTPParser() } };
  if (origBinding) return origBinding(name);
  throw new Error('process.binding(' + name + ') is not supported');
};
