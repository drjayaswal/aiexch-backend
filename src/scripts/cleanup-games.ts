import "dotenv/config";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { db } from "../db";
import { casino_games } from "../db/schema";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

async function deleteS3Folder(prefix: string) {
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    if (objects.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: objects.map((obj) => ({ Key: obj.Key! })),
        },
      });

      await s3Client.send(deleteCommand);
      deleted += objects.length;
      console.log(`Deleted ${objects.length} objects (Total: ${deleted})`);
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);

  return deleted;
}

async function cleanup() {
  try {
    console.log("Starting cleanup...\n");

    console.log("1. Deleting casino_games table records...");
    const result = await db.delete(casino_games);
    console.log(`✓ Deleted all records from casino_games table\n`);

    console.log("2. Deleting S3 casino-assets/games folder...");
    const deletedCount = await deleteS3Folder("casino-assets/games/");
    console.log(`✓ Deleted ${deletedCount} files from S3\n`);

    console.log("=== CLEANUP COMPLETE ===");
  } catch (error) {
    console.error(
      "Cleanup failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

cleanup();
