const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (USE_CLOUDINARY) console.log('[Uploader] Using Cloudinary storage');
else console.log('[Uploader] Cloudinary not configured, using local disk');

async function upload(filePath, folder = '') {
  if (USE_CLOUDINARY) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `occasionetgarantie/${folder}`,
        resource_type: 'image',
      });
      try { fs.unlinkSync(filePath); } catch {}
      console.log(`[Uploader] Cloudinary success: ${result.secure_url}`);
      return { url: result.secure_url, public_id: result.public_id };
    } catch (cloudErr) {
      console.error(`[Uploader] Cloudinary failed, falling back to local: ${cloudErr.message}`);
    }
  }
  const filename = path.basename(filePath);
  console.log(`[Uploader] Local save: ${filename}`);
  return { url: filename, public_id: null };
}

async function uploadBuffer(buffer, filename, folder = '') {
  if (USE_CLOUDINARY) {
    try {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `occasionetgarantie/${folder}`, resource_type: 'image' },
          (err, result) => {
            if (err) return reject(err);
            resolve({ url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(buffer);
      });
    } catch (cloudErr) {
      console.error(`[Uploader] Cloudinary stream failed, falling back to local: ${cloudErr.message}`);
    }
  }
  const filePath = path.join(__dirname, '..', 'uploads', folder, filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return { url: filename, public_id: null };
}

async function uploadAudio(filePath, folder = 'chat') {
  if (USE_CLOUDINARY) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `occasionetgarantie/${folder}`,
        resource_type: 'video',
      });
      try { fs.unlinkSync(filePath); } catch {}
      console.log(`[Uploader] Cloudinary audio success: ${result.secure_url}`);
      return { url: result.secure_url, public_id: result.public_id };
    } catch (cloudErr) {
      console.error(`[Uploader] Cloudinary audio failed, falling back to local: ${cloudErr.message}`);
    }
  }
  const filename = path.basename(filePath);
  console.log(`[Uploader] Local audio save: ${filename}`);
  return { url: `chat/${filename}`, public_id: null };
}

async function destroy(publicId) {
  if (USE_CLOUDINARY && publicId) {
    try { await cloudinary.uploader.destroy(publicId); } catch {}
  }
}

module.exports = { upload, uploadBuffer, uploadAudio, destroy, USE_CLOUDINARY };
