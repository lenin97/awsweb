import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

const s3 = new S3Client({});

export const MAX_DOCX_BYTES = 50_000; // heuristic ~3 pages
export const MAX_PDF_PAGES = 3;

export async function readBytes(
  bucket: string,
  key: string,
  range: string
): Promise<string> {
  const obj = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range,
    })
  );

  if (!obj.Body) {
    throw new Error("S3 object body is empty");
  }

  return streamToString(obj.Body);
}

function streamToString(
  body: Readable | ReadableStream | Blob
): Promise<string> {
  // Node.js (Lambda, local dev)
  if (body instanceof Readable) {
    return readableToString(body);
  }

  // Web ReadableStream (edge / future runtimes)
  if (body instanceof ReadableStream) {
    return webStreamToString(body);
  }

  // Blob (rare in Node but included for completeness)
  return body.text();
}

function readableToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });

    stream.on("error", reject);
  });
}

async function webStreamToString(
  stream: ReadableStream
): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return new TextDecoder("utf-8").decode(
    concatUint8Arrays(chunks)
  );
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
