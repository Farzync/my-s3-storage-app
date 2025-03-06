import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME!,
    });

    const { Contents } = await s3.send(command);
    if (!Contents) return NextResponse.json([]);

    const files = await Promise.all(
      Contents.map(async (file) => {
        const signedUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: file.Key!,
          }),
          { expiresIn: 60 * 60 } // Expired dalam 1 jam
        );

        return {
          key: file.Key!,
          url: signedUrl,
        };
      })
    );

    return NextResponse.json(files);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil file" },
      { status: 500 }
    );
  }
}
