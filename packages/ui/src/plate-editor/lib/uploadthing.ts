import { createUploadthing, type FileRouter } from 'uploadthing/server';

const f = createUploadthing();

// Mock file router for development
export const uploadRouter = {
  editorUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    video: { maxFileSize: '16MB', maxFileCount: 1 },
    audio: { maxFileSize: '8MB', maxFileCount: 1 },
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
    text: { maxFileSize: '2MB', maxFileCount: 10 },
  })
    .middleware(async () => {
      // Mock middleware - in production this would check auth
      return { userId: 'mock-user' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;