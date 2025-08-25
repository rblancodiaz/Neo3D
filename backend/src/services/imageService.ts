import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config, paths } from '../config/environment';
import { logError, logInfo } from '../utils/logger';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImages {
  original: string;
  processed: string;
  thumbnail: string;
  metadata: ImageMetadata;
}

class ImageService {
  private readonly maxDimension = config.MAX_IMAGE_DIMENSION;
  private readonly thumbnailSize = config.THUMBNAIL_SIZE;
  private readonly jpegQuality = config.JPEG_QUALITY;
  private readonly pngCompressionLevel = config.PNG_COMPRESSION_LEVEL;

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [paths.uploads, paths.processed, paths.thumbnails, paths.temp];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logError(error as Error, { context: 'ensureDirectories', dir });
      }
    }
  }

  /**
   * Validate image file
   */
  async validateImage(file: Express.Multer.File): Promise<void> {
    // Check file size
    if (file.size > config.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    const allowedTypes = config.ALLOWED_FILE_TYPES.split(',');
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Get image metadata using Sharp
    try {
      const metadata = await sharp(file.path).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }

      // Check minimum dimensions
      if (metadata.width < 800 || metadata.height < 600) {
        throw new Error('Image dimensions must be at least 800x600 pixels');
      }

      // Check maximum dimensions
      if (metadata.width > 10000 || metadata.height > 10000) {
        throw new Error('Image dimensions cannot exceed 10000x10000 pixels');
      }
    } catch (error) {
      throw new Error(`Invalid image file: ${(error as Error).message}`);
    }
  }

  /**
   * Process uploaded image
   */
  async processImage(file: Express.Multer.File, hotelSlug: string): Promise<ProcessedImages> {
    const startTime = Date.now();
    
    try {
      // Validate image first
      await this.validateImage(file);

      // Get original image metadata
      const metadata = await sharp(file.path).metadata();
      
      // Generate file names
      const timestamp = Date.now();
      const originalExt = path.extname(file.originalname);
      const baseName = `${hotelSlug}-${timestamp}`;
      
      const originalFileName = `${baseName}-original${originalExt}`;
      const processedFileName = `${baseName}-processed.jpg`;
      const thumbnailFileName = `${baseName}-thumb.jpg`;

      // Define file paths
      const originalPath = path.join(paths.uploads, originalFileName);
      const processedPath = path.join(paths.processed, processedFileName);
      const thumbnailPath = path.join(paths.thumbnails, thumbnailFileName);

      // Copy original file (rename doesn't work across Docker volumes)
      await fs.copyFile(file.path, originalPath);
      await fs.unlink(file.path);

      // Process main image (resize if needed, optimize)
      await this.createProcessedImage(originalPath, processedPath, metadata);

      // Create thumbnail
      await this.createThumbnail(originalPath, thumbnailPath);

      // Get file size
      const stats = await fs.stat(originalPath);

      const processingTime = Date.now() - startTime;
      
      logInfo('Image processed successfully', {
        hotelSlug,
        originalSize: stats.size,
        processingTime,
        dimensions: `${metadata.width}x${metadata.height}`,
      });

      return {
        original: `/uploads/${originalFileName}`,
        processed: `/uploads/processed/${processedFileName}`,
        thumbnail: `/uploads/thumbnails/${thumbnailFileName}`,
        metadata: {
          width: metadata.width!,
          height: metadata.height!,
          format: metadata.format!,
          size: stats.size,
        },
      };
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      logError(error as Error, { context: 'processImage', file: file.originalname });
      throw error;
    }
  }

  /**
   * Create processed/optimized version of image
   */
  private async createProcessedImage(
    inputPath: string,
    outputPath: string,
    metadata: sharp.Metadata,
  ): Promise<void> {
    const pipeline = sharp(inputPath);

    // Resize if image exceeds maximum dimensions
    if (metadata.width! > this.maxDimension || metadata.height! > this.maxDimension) {
      pipeline.resize(this.maxDimension, this.maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      });
    }

    // Optimize based on format
    if (metadata.format === 'png') {
      // Keep PNG if it has transparency
      if (metadata.channels === 4) {
        pipeline.png({
          compressionLevel: this.pngCompressionLevel,
          adaptiveFiltering: true,
        });
      } else {
        // Convert to JPEG if no transparency
        pipeline.jpeg({
          quality: this.jpegQuality,
          progressive: true,
          mozjpeg: true,
        });
      }
    } else {
      // Convert to optimized JPEG
      pipeline.jpeg({
        quality: this.jpegQuality,
        progressive: true,
        mozjpeg: true,
      });
    }

    // Auto-rotate based on EXIF orientation
    pipeline.rotate();

    // Save processed image
    await pipeline.toFile(outputPath);
  }

  /**
   * Create thumbnail image
   */
  private async createThumbnail(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath)
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
        kernel: sharp.kernel.lanczos3,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toFile(outputPath);
  }

  /**
   * Delete image files
   */
  async deleteImages(urls: { original?: string; processed?: string; thumbnail?: string }): Promise<void> {
    const filesToDelete = [];

    if (urls.original) {
      filesToDelete.push(path.join(paths.uploads, path.basename(urls.original)));
    }
    if (urls.processed) {
      filesToDelete.push(path.join(paths.processed, path.basename(urls.processed)));
    }
    if (urls.thumbnail) {
      filesToDelete.push(path.join(paths.thumbnails, path.basename(urls.thumbnail)));
    }

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logError(error as Error, { context: 'deleteImages', file: filePath });
      }
    }
  }

  /**
   * Get image dimensions from file
   */
  async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    const metadata = await sharp(filePath).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    return {
      width: metadata.width,
      height: metadata.height,
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.readdir(paths.temp);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      for (const file of files) {
        const filePath = path.join(paths.temp, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          logInfo('Cleaned up temp file', { file });
        }
      }
    } catch (error) {
      logError(error as Error, { context: 'cleanupTempFiles' });
    }
  }
}

export default new ImageService();