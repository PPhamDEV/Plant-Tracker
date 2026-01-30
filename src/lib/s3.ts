import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}

function getBucket(): string {
  return process.env.S3_BUCKET || "plant-tracker";
}

/** Presigned PUT URL for direct client upload */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  maxSizeBytes?: number,
  expiresIn = 600
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
    ...(maxSizeBytes ? { ContentLength: maxSizeBytes } : {}),
  });
  return getSignedUrl(client, command, { expiresIn });
}

/** Presigned GET URL for private object access */
export async function createPresignedReadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/** Delete an object from S3 */
export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

/** Check if object exists and get metadata */
export async function headObject(key: string) {
  const client = getS3Client();
  return client.send(
    new HeadObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

/** Download object as Buffer (for thumbnail generation) */
export async function downloadObject(key: string): Promise<Buffer> {
  const client = getS3Client();
  const res = await client.send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );
  const stream = res.Body;
  if (!stream) throw new Error("Leere Antwort von S3");
  return Buffer.from(await stream.transformToByteArray());
}

/** Upload a Buffer directly to S3 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}
