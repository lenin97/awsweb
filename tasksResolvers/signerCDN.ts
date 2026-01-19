import type { Schema } from '../data/resource'; // Adjust as needed
/////////////////////////////////////////////////
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/signerCDN"
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const MAX_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// Decode once, cache across invocations
let cachedPrivateKeyPem: string | undefined;
// Constants
const PREFIX = "mediaApp/public/imgs/";


export const handler: Schema['signerCDN']['functionHandler'] = async (event, context) => {

  console.log("signerCDN handler invoked");
  console.log("Received event:", JSON.stringify(event));
  
  const arg = event.arguments?.urlCDN;
  const filename = arg?.filename;
  const ttlMs = Math.min(arg?.ttlMs ?? 60 * 60 * 1000, MAX_TTL_MS);

  console.log("Parsed arguments:", { filename, ttlMs });

  // 1) Validate key pattern: must start with "homepage/" and no traversal
  // 1) Validate filename: must not contain slashes or traversal
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    console.warn("Invalid filename received:", filename);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid filename. Must not contain slashes." }),
    };
  }

 // 2) Construct full key from trusted prefix and only encode filename
  const safeFilename = encodeURIComponent(filename);
  const key = `${PREFIX}${safeFilename}`;
  console.log("Constructed S3 key:", key);

  // 3) Lazy‑load and cache private key
  if (!cachedPrivateKeyPem) {
    console.log("Private key not cached. Loading from env...");
    const b64 = env.PRIVATE_KEY_B64;
    if (!b64) {
      console.error("Missing PRIVATE_KEY_B64 env var");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Configuration error" }),
      };
    }
    cachedPrivateKeyPem = Buffer.from(b64, "base64").toString("utf-8");
    console.log("Private key successfully loaded and cached");
  } else {
    console.log("Using cached private key");
  }

  // 4) Build and validate URL without double protocol
  const domain = env.CF_DOMAIN?.replace(/^https?:\/\//, "");
  const unsignedUrl = `https://${domain}/${key}`;
  console.log("Unsigned URL to be signed:", unsignedUrl);

  try {
    // 5) Generate signed URL with clamped TTL
    const signedUrl = getSignedUrl({
      url: unsignedUrl,
      keyPairId: env.KEY_PAIR_ID!,
      privateKey: cachedPrivateKeyPem,
      dateLessThan: new Date(Date.now() + ttlMs),
    });

    console.log("Signed URL generated successfully:", signedUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: signedUrl }),
    };
  } catch (err: unknown) {
    console.error("Error generating signed URL", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

/*
/** Returns the decoded PEM string with full headers */
/*
function getPrivateKeyPem(): string {
  return Buffer.from(PRIVATE_KEY_B64, "base64").toString("utf-8");
}
  */

/**
 * Generate a signed URL for a private CloudFront object.
 * Uses a 1-hour "canned policy" expiration by default.
 */
/*
export function generateSignedUrl(objectKey: string) {
  const resource = `${CF_DOMAIN}/${encodeURIComponent(objectKey)}`;

  return getSignedUrl({
    url: resource,
    keyPairId: KEY_PAIR_ID,
    privateKey: getPrivateKeyPem(), // full PEM with headers
    dateLessThan: new Date(Date.now() + 60 * 60 * 1000),
  });
}
*/
