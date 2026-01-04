// Unified storage client - exports Railway storage as the default
// This allows easy migration from Supabase to Railway by changing imports

export {
  uploadPublicImage,
  uploadRawFile,
  getPublicImageUrl,
  downloadFile,
  deletePublicImage,
  listPublicImages,
  fileExists,
  STORAGE_BUCKETS,
} from './railway/storage';

