import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function uploadImage(file: File, folder = "snoware/products") {
  const bytes = Buffer.from(await file.arrayBuffer());
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(bytes);
  });
}

/**
 * Stores a file privately ("authenticated" delivery type): it can only be viewed through a signed URL
 * from `privateFileUrl`. Used for payment screenshots, which show customers' bank details.
 */
export async function uploadPrivateFile(bytes: Buffer, folder: string) {
  return new Promise<{ publicId: string; format: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image", type: "authenticated" }, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({ publicId: result.public_id, format: result.format });
      })
      .end(bytes);
  });
}

/** Signed delivery link to a private file — only admin pages render it. */
export function privateFileUrl(publicId: string, format: string) {
  return cloudinary.url(publicId, { type: "authenticated", sign_url: true, secure: true, format, resource_type: "image" });
}

export async function deletePrivateFile(publicId: string) {
  if (!cloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { type: "authenticated" }).catch(() => undefined);
}

export async function deleteImage(publicId: string) {
  if (!cloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId).catch(() => undefined);
}
