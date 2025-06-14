import type { NextApiRequest, NextApiResponse } from 'next';


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract headers into a plain object
  const headers = req.headers;

  const requestData = {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    headers: headers,
    httpVersion: req.httpVersion,
    socket: {
      remoteAddress: req.socket.remoteAddress,
      remotePort: req.socket.remotePort
    }
  };

  console.log('=== REQUEST DATA ===');
  console.log(JSON.stringify(requestData, null, 2));
  console.log('=== END REQUEST ===');

  res.status(200).json(requestData);
}
