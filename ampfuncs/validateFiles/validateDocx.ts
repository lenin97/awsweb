//const max_pdf_pages=Number(process.env.MAX_PDF_PAGES)
import {readBytes,MAX_DOCX_BYTES} from './readBytes'

export async function validateDocx(
  bucket: string,
  key: string,
  contentLength: number
) {
  console.log("[validator:docx] validating", {
    bucket,
    key,
    contentLength,
  });

  const sig = await readBytes(bucket, key, "bytes=0-3");
  const hex = Buffer.from(sig).toString("hex");

  if (hex !== "504b0304") {
    throw new Error("Invalid DOCX ZIP signature");
  }

  if (contentLength > MAX_DOCX_BYTES) {
    throw new Error(
      `DOCX size exceeded (${contentLength}/${MAX_DOCX_BYTES})`
    );
  }
}

