/**
 * Image Processing Utility for Railway S3 Storage
 * Processes images with Sharp and uploads to Railway S3
 */

import sharp from 'sharp';
import { IMAGE_SIZES, ImageSizeConfig } from './config';
import { uploadToRailwayS3, getPublicUrlSync } from '@/lib/railway/s3-client';
import { STORAGE_BUCKETS } from '@/lib/railway/s3-client';

export interface ProcessedImageResult {
    original: {
        path: string;
        url: string;
        width: number;
        height: number;
        size: number;
    };
    large?: {
        path: string;
        url: string;
        width: number;
        height: number;
        size: number;
    };
    medium?: {
        path: string;
        url: string;
        width: number;
        height: number;
        size: number;
    };
    thumb?: {
        path: string;
        url: string;
        width: number;
        height: number;
        size: number;
    };
}

/**
 * Process image and upload to Railway S3
 */
export async function processImageToRailwayS3(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    bucket: string = process.env.S3_BUCKET_PUBLIC || 'media-library'
): Promise<ProcessedImageResult> {
    try {
        console.log('🖼️ Processing image for Railway S3:', { filename, mimeType, bucket });

        // Get original image metadata
        let metadata;
        try {
            metadata = await sharp(buffer).metadata();
        } catch (error) {
            console.error('Error reading image metadata:', error);
            throw new Error('Failed to read image metadata');
        }

        if (!metadata) {
            throw new Error('No metadata returned from sharp');
        }

        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;

        // Process original
        const originalPath = `original/${filename}`;
        const { url: originalUrl } = await uploadToRailwayS3(
            originalPath,
            buffer,
            {
                contentType: mimeType,
                bucket,
                isPublic: true,
            }
        );

        const result: ProcessedImageResult = {
            original: {
                path: originalPath,
                url: originalUrl,
                width: originalWidth,
                height: originalHeight,
                size: buffer.length,
            },
        };

        // Process large size
        const largeWidth = IMAGE_SIZES?.large?.width || 1920;
        const largeHeight = IMAGE_SIZES?.large?.height || 1920;
        if (originalWidth > largeWidth || originalHeight > largeHeight) {
            const largeBuffer = await sharp(buffer)
                .resize(largeWidth, largeHeight, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .toBuffer();

            const largeFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, `_large.$1`);
            const largePath = `large/${largeFilename}`;
            const { url: largeUrl } = await uploadToRailwayS3(
                largePath,
                largeBuffer,
                {
                    contentType: mimeType,
                    bucket,
                    isPublic: true,
                }
            );

            result.large = {
                path: largePath,
                url: largeUrl,
                width: largeWidth,
                height: largeHeight,
                size: largeBuffer.length,
            };
        }

        // Process medium size (uses shortSide config)
        const mediumShortSide = (IMAGE_SIZES?.medium as any)?.shortSide || 500;
        if (originalWidth > mediumShortSide || originalHeight > mediumShortSide) {
            const mediumBuffer = await sharp(buffer)
                .resize(mediumShortSide, mediumShortSide, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .toBuffer();

            let mediumMetadata;
            try {
                mediumMetadata = await sharp(mediumBuffer).metadata();
            } catch (error) {
                console.error('Error reading medium metadata:', error);
                mediumMetadata = { width: mediumShortSide, height: mediumShortSide };
            }

            const mediumFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, `_medium.$1`);
            const mediumPath = `medium/${mediumFilename}`;
            const { url: mediumUrl } = await uploadToRailwayS3(
                mediumPath,
                mediumBuffer,
                {
                    contentType: mimeType,
                    bucket,
                    isPublic: true,
                }
            );

            result.medium = {
                path: mediumPath,
                url: mediumUrl,
                width: mediumMetadata.width || mediumShortSide,
                height: mediumMetadata.height || mediumShortSide,
                size: mediumBuffer.length,
            };
        }

        // Process thumbnail
        const thumbWidth = IMAGE_SIZES?.thumb?.width || 300;
        const thumbHeight = IMAGE_SIZES?.thumb?.height || 300;
        if (originalWidth > thumbWidth || originalHeight > thumbHeight) {
            const thumbBuffer = await sharp(buffer)
                .resize(thumbWidth, thumbHeight, {
                    fit: 'cover',
                    position: 'center',
                })
                .toBuffer();

            const thumbFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, `_thumb.$1`);
            const thumbPath = `thumb/${thumbFilename}`;
            const { url: thumbUrl } = await uploadToRailwayS3(
                thumbPath,
                thumbBuffer,
                {
                    contentType: mimeType,
                    bucket,
                    isPublic: true,
                }
            );

            result.thumb = {
                path: thumbPath,
                url: thumbUrl,
                width: thumbWidth,
                height: thumbHeight,
                size: thumbBuffer.length,
            };
        }

        console.log('✅ Image processing complete:', {
            original: result.original.url,
            large: result.large?.url,
            medium: result.medium?.url,
            thumb: result.thumb?.url,
        });

        return result;
    } catch (error) {
        console.error('❌ Error processing image:', error);
        throw error;
    }
}
