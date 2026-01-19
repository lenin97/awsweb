import {readBytes,MAX_PDF_PAGES} from './readBytes'

export async function validatePdf(
  bucket: string,
  key: string,
  metadata: Record<string, string>
) {
  console.log("[validator:pdf] validating", { bucket, key });

  const header = await readBytes(bucket, key, "bytes=0-4");
  if (!header.startsWith("%PDF")) {
    throw new Error("Invalid PDF signature");
  }

}

