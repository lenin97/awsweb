import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

// These are injected by Amplify sandbox or Console
const CF_DOMAIN    = process.env.CLOUDFRONT_DOMAIN!;      // e.g. https://d111111abcdef8.cloudfront.net
const KEY_PAIR_ID  = process.env.CLOUDFRONT_KEY_PAIR_ID!; // Public key ID
const PRIVATE_KEY_B64 = process.env.CLOUDFRONT_PRIVATE_KEY!; // Base64-encoded PEM

/** Returns the decoded PEM string with full headers */
function getPrivateKeyPem(): string {
  return Buffer.from(PRIVATE_KEY_B64, "base64").toString("utf-8");
}

/**
 * Generate a signed URL for a private CloudFront object.
 * Uses a 1-hour "canned policy" expiration by default.
 */
export function generateSignedUrl(objectKey: string) {
  const resource = `${CF_DOMAIN}/${encodeURIComponent(objectKey)}`;

  return getSignedUrl({
    url: resource,
    keyPairId: KEY_PAIR_ID,
    privateKey: getPrivateKeyPem(), // full PEM with headers
    dateLessThan: new Date(Date.now() + 60 * 60 * 1000),
  });
}
