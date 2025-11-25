import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary environment variables are not fully configured.');
  console.warn('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}

export interface CloudinaryDeleteResult {
  result: string;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'image' | 'raw' | 'video' | 'auto';
  transformation?: object;
  tags?: string[];
}

export async function uploadFile(
  file: string | Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not configured. Please set environment variables.');
    }

    const defaultOptions = {
      folder: options.folder || 'patient-documents',
      resource_type: options.resource_type || 'auto',
      ...options
    };

    let uploadResult;

    if (Buffer.isBuffer(file)) {
      const base64File = `data:application/octet-stream;base64,${file.toString('base64')}`;
      uploadResult = await cloudinary.uploader.upload(base64File, defaultOptions);
    } else {
      uploadResult = await cloudinary.uploader.upload(file, defaultOptions);
    }

    return {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      url: uploadResult.url,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      created_at: uploadResult.created_at
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(
      `Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function uploadPatientDocument(
  file: string | Buffer,
  patientId: string,
  documentType: string
): Promise<CloudinaryUploadResult> {
  try {
    const folder = `patient-documents/${patientId}`;
    const tags = ['patient-document', documentType, patientId];
    
    return await uploadFile(file, {
      folder,
      tags,
      resource_type: 'auto'
    });
  } catch (error) {
    console.error('Patient document upload error:', error);
    throw error;
  }
}

export async function uploadPatientImage(
  file: string | Buffer,
  patientId: string
): Promise<CloudinaryUploadResult> {
  try {
    const folder = `patient-images/${patientId}`;
    const tags = ['patient-image', patientId];
    
    return await uploadFile(file, {
      folder,
      tags,
      resource_type: 'image',
      transformation: {
        width: 1000,
        height: 1000,
        crop: 'limit',
        quality: 'auto:good'
      }
    });
  } catch (error) {
    console.error('Patient image upload error:', error);
    throw error;
  }
}

export async function deleteFile(publicId: string): Promise<CloudinaryDeleteResult> {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not configured. Please set environment variables.');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Failed to delete file: ${result.result}`);
    }

    return { result: result.result };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(
      `Failed to delete file from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteMultipleFiles(publicIds: string[]): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];

  for (const publicId of publicIds) {
    try {
      await deleteFile(publicId);
      deleted.push(publicId);
    } catch (error) {
      errors.push(publicId);
      console.error(`Failed to delete ${publicId}:`, error);
    }
  }

  return { deleted, errors };
}

export function getFileUrl(
  publicId: string,
  options: {
    transformation?: object;
    format?: string;
    secure?: boolean;
  } = {}
): string {
  try {
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary cloud name is not configured.');
    }

    const { transformation, format, secure = true } = options;

    return cloudinary.url(publicId, {
      transformation,
      format,
      secure
    });
  } catch (error) {
    console.error('Error generating Cloudinary URL:', error);
    throw new Error(
      `Failed to generate file URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return getFileUrl(publicId, {
    transformation: {
      width,
      height,
      crop: 'limit',
      quality: 'auto:best',
      fetch_format: 'auto'
    },
    secure: true
  });
}

export const cloudinaryService = {
  uploadFile,
  uploadPatientDocument,
  uploadPatientImage,
  deleteFile,
  deleteMultipleFiles,
  getFileUrl,
  getOptimizedImageUrl
};

export default cloudinaryService;
