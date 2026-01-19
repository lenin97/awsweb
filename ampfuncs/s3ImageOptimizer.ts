// amplify/functions/s3ImageOptimizer/handler.ts
import { S3Handler } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  GetObjectCommandOutput
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Readable } from 'stream';

const s3 = new S3Client({});

type Variant = { width: number; suffix: string };

export const handler: S3Handler = async (event) => {
  try {
    if (!event.Records || event.Records.length === 0) {
      console.error('[s3ImageOptimizer]::No S3 records in event');
      return;
    }

    await Promise.all(
      event.Records.map(async (record) => {
        const BUCKET_NAME = record.s3.bucket.name;
        const keyName = decodeURIComponent(record.s3.object.key);

        const lower = keyName.toLowerCase();
        const isImage =
          lower.endsWith('.jpg') ||
          lower.endsWith('.jpeg') ||
          lower.endsWith('.png');

        if (!isImage) {
          console.log(`[s3ImageOptimizer]::Skipped non-image file: ${keyName}`);
          return;
        }

        const baseDir = keyName.substring(0, keyName.lastIndexOf('/') + 1);

        console.log(`[s3ImageOptimizer]::Triggered by ${keyName}`);
        console.log(`[s3ImageOptimizer]::Scoped to prefix: ${baseDir}`);

        const variants = await loadVariantsConfig(BUCKET_NAME, baseDir);
        await processImage(BUCKET_NAME, keyName, variants);
      })
    );

    console.log('[s3ImageOptimizer]::[Done] Handler execution completed');
  } catch (err) {
    console.error('[s3ImageOptimizer]::[Fatal] Unexpected handler failure:', err);
  }
};

// --- Helpers ---

async function loadVariantsConfig(bucket: string, prefix: string): Promise<Variant[]> {
  const defaultVariants: Variant[] = [
    { width: 640, suffix: '_sm' },
    { width: 1280, suffix: '_md' },
    { width: 1920, suffix: '_lg' },
  ];

  const configKey = `${prefix}config.txt`;
  try {
    const config = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: configKey })
    );

    if (!(config.Body instanceof Readable)) {
      throw new Error('config.Body is not a Readable stream');
    }

    const content = (await streamToBuffer(config.Body)).toString('utf-8').trim();
    if (!content) return defaultVariants;

    const variants = content
      .split('|')
      .map((item) => {
        const [w, suf] = item.split(',').map((s) => s.trim());
        const width = parseInt(w, 10);
        if (!width || !suf) return null;
        return { width, suffix: suf };
      })
      .filter((v): v is Variant => v !== null);

    if (variants.length > 0) {
      console.log(
        `[s3ImageOptimizer]::Loaded config.txt → ${variants
          .map((v) => `${v.width}${v.suffix}`)
          .join(', ')}`
      );
      return variants;
    }

    return defaultVariants;
  } catch (err: unknown) {
    const statusCode = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (statusCode === 404) {
      console.log('[s3ImageOptimizer]::No config.txt found, using defaults');
    } else {
      console.error('[s3ImageOptimizer]::Error reading config.txt:', err);
    }
    return defaultVariants;
  }
}

async function processImage(bucket: string, key: string, variants: Variant[]) {
  try {
    console.log(`[s3ImageOptimizer]::Processing ${key}`);

    const original = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    if (!(original.Body instanceof Readable)) {
      throw new Error('original.Body is not a Readable stream');
    }

    const buffer = await streamToBuffer(original.Body);

    const image = sharp(buffer);
    const metadata = await image.metadata();
    const maxWidth = variants[variants.length - 1].width;

    if (!metadata.width || metadata.width < maxWidth) {
      const msg = `Skipped ${key} (width=${metadata.width}px < ${maxWidth}px)`;
      console.log(`[s3ImageOptimizer]::${msg}`);
      await appendSummaryLog(bucket, key.substring(0, key.lastIndexOf('/') + 1), msg);
      return;
    }

    const baseKey = key.replace(/\.[^.]+$/, ''); // remove extension
    let inputBuffer = buffer;

    if (key.toLowerCase().endsWith('.png')) {
      inputBuffer = await sharp(buffer)
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // transparent → white
        .jpeg()
        .toBuffer();
    }

    const baseDir = baseKey.substring(0, baseKey.lastIndexOf('/') + 1);

    await Promise.all(
      variants.map((v) =>
        saveVariant(inputBuffer, bucket, baseKey, baseDir, v.suffix, v.width)
      )
    );

    console.log(`[s3ImageOptimizer]::✅ Variants generated for ${key}`);
  } catch (err) {
    console.error(`[s3ImageOptimizer]::❌ Error processing file ${key}:`, err);
  }
}

async function saveVariant(
  buffer: Buffer,
  bucket: string,
  baseKey: string,
  baseDir: string,
  suffix: string,
  width: number
) {
  // Guard: do nothing if already inside imagesoptimised/
  if (baseDir.includes("mediaApp/public/imagesoptimised/")) {
    console.log(`[s3ImageOptimizer]:: Skipping save for ${baseKey} (already optimized)`);
    return;
  }

  const resized = await sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .jpeg({
      progressive: true,
      quality: 75,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer();

  const filename = baseKey.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'image';

  // Replace the root "mediaApp/public/images" with "mediaApp/public/imagesoptimised"
  const optimizedDir = baseDir.replace(
    /^mediaApp\/public\/images/,
    'mediaApp/public/imagesoptimised'
  );

  const destKey = `${optimizedDir}${filename}${suffix}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: destKey,
      Body: resized,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const msg = `Saved ${suffix} -> /${destKey}`;
  console.log(`[s3ImageOptimizer]:: ${msg}`);
  await appendSummaryLog(bucket, baseDir, msg);
}

const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

// --- New Helper ---
async function appendSummaryLog(bucket: string, dir: string, message: string) {
  const timestamp = new Date().toISOString().substring(11, 19); // HH:MM:SS
  const logLine = `${message} --- ${timestamp}\n`;

  const summaryKey = `${dir}summary.txt`;

  let existing = '';
  try {
    const obj: GetObjectCommandOutput = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: summaryKey })
    );
    if (obj.Body instanceof Readable) {
      existing = (await streamToBuffer(obj.Body)).toString('utf-8');
      if (!existing.endsWith('\n')) {
        existing += '\n'; // ensure trailing newline
      }
    }
  } catch (err) {
    const statusCode =
      (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
    if (statusCode !== 404) {
      console.error('[s3ImageOptimizer]::Error reading summary.txt', err);
    }
    // if 404 → no existing file, start fresh
  }

  const newContent = existing + logLine;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: summaryKey,
      Body: newContent,
      ContentType: 'text/plain; charset=utf-8',
      CacheControl: 'no-cache',
    })
  );
}