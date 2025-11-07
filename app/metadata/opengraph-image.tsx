// File: app/opengraph-image.tsx//a file-based metadata route
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ——— Metadata exports (file-based metadata route) ———
export const runtime = 'nodejs';        // allow fs.readFile
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

// ensure this route is not statically prerendered without params
export const dynamic = 'force-dynamic'

// ——— Load & cache font once per cold start ———
const fontDataPromise = readFile(
  join(process.cwd(), 'public', 'fonts', 'Inter-Bold.woff2')
);

type SearchParams = Record<string, string>

export default async function Image({
  searchParams = {},
}: {
  searchParams?: SearchParams
}) {
  // wait for our cached font
  const fontData = await fontDataPromise;

  // parse query
  const {
    title = 'ResumeGenAI',
    subtitle,
    image,
    theme,
  } = searchParams;

  //imageUrl//const url = new URL(process.env.TCV_OPENGRAPH_META_ROUTE!, base)
  const imageUrl=new URL(image, process.env.TCV_BASE_DOMAIN).toString()
  const isDark = theme === 'dark';

  // theme styles
  const backgroundColor = isDark ? '#111827' : '#f9fafb';
  const textColor       = isDark ? '#f3f4f6' : '#0f172a';
  const subtitleColor   = isDark ? '#94a3b8' : '#475569';

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor,
          fontFamily: 'Inter, sans-serif',
          width: '100%',
          height: '100%',
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Visual"
            width={144}
            height={144}
            style={{
              borderRadius: 12,
              marginBottom: 32,
              objectFit: 'cover',
            }}
          />
        )}

        <div
          style={{
            color: textColor,
            fontSize: 'clamp(48px, 5vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: 'center',
            paddingInline: 32,
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              color: subtitleColor,
              fontSize: 'clamp(24px, 3vw, 32px)',
              marginTop: 16,
              textAlign: 'center',
              paddingInline: 24,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
