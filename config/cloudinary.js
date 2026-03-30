import cloudinary from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

/*cloudinary.v2.api.ping((error, result) => {
  if (error) console.error("Cloudinary connection FAILED:", error);
  else console.log("Cloudinary connected", result);
});*/

export const upload = multer({ storage: multer.memoryStorage() });

export function uploadToCloudinary(buffer, folder, resourceType = "image") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        format: resourceType === "raw" ? undefined : undefined,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export { cloudinary };
