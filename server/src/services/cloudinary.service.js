import cloudinary from '../config/cloudinary.js'

export async function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: options.folder, resource_type: options.resource_type || 'auto' },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    stream.end(fileBuffer)
  })
}

export async function destroyCloudinaryAsset(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
