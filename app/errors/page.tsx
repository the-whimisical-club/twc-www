import { requireAuth } from '@/app/utils/auth'
import Navbar from '@/app/components/navbar'

export default async function ErrorsPage() {
  const { user } = await requireAuth()

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex justify-center align-middle text-4xl md:text-8xl text-foreground font-dark-london px-8 py-16 md:p-20 md:py-40">errors</div>
      
      <div className="flex flex-col text-lg md:text-xl p-8 md:p-25 gap-8 text-foreground font-stack-sans-notch">
        <p>if you're seeing an error code, look it up below to understand what went wrong.</p>
        
        <div className="flex flex-col gap-12 mt-8">
          {/* Server-Side Error Codes */}
          <section>
            <h2 className="text-2xl md:text-3xl font-stack-sans-notch mb-4 font-bold">Server-Side Errors (UPLOAD_XXX)</h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_001 - Unauthorized</h3>
                <p className="text-base opacity-90">You're not logged in or your session expired. Try logging out and back in.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_002 - User Not Approved</h3>
                <p className="text-base opacity-90">Your account is pending approval. Wait for admin approval or check /waitlist.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_003 - File Required</h3>
                <p className="text-base opacity-90">No file was provided. Make sure you selected a file before uploading.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_004 - Worker Upload Failed</h3>
                <p className="text-base opacity-90">Failed to upload to storage. Check file size (must be under 100MB) and try again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_005 - User Record Creation Failed</h3>
                <p className="text-base opacity-90">Database error creating user record. Try again or contact support.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_006 - Database Insert Failed</h3>
                <p className="text-base opacity-90">Image uploaded but failed to save URL. Try uploading again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_007 - Unexpected Server Error</h3>
                <p className="text-base opacity-90">Unexpected server error. Try again or contact support.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_008 - File Too Large</h3>
                <p className="text-base opacity-90">File exceeds 100MB limit. Use a smaller image file.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">UPLOAD_009 - Request Processing Failed</h3>
                <p className="text-base opacity-90">Server failed to process request. Try a smaller file or refresh the page.</p>
              </div>
            </div>
          </section>

          {/* Client-Side Error Codes */}
          <section>
            <h2 className="text-2xl md:text-3xl font-stack-sans-notch mb-4 font-bold">Client-Side Errors (CLIENT_XXX)</h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_001 - Image Conversion Failed</h3>
                <p className="text-base opacity-90">Failed to convert image to JPEG. Try a different image format (JPEG or PNG).</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_002 - Image Processing Failed</h3>
                <p className="text-base opacity-90">Error processing image. Try a different image or ensure it's not corrupted.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_003 - Image Load Failed</h3>
                <p className="text-base opacity-90">Browser failed to load image. Try a different image file.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_004 - File Read Failed</h3>
                <p className="text-base opacity-90">Failed to read file. Try selecting the file again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_005 - Response Parse Failed</h3>
                <p className="text-base opacity-90">Failed to parse server response. Check connection and try again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_006 - Upload Request Failed</h3>
                <p className="text-base opacity-90">Upload request failed. Check your internet connection and try again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_007 - Network Error</h3>
                <p className="text-base opacity-90">Network error occurred. Check your connection and try again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_008 - Upload Timeout</h3>
                <p className="text-base opacity-90">Upload timed out after 60 seconds. File may be too large or connection too slow.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_009 - File Too Large (Client)</h3>
                <p className="text-base opacity-90">File exceeds 100MB limit. Use a smaller image.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">CLIENT_010 - Converted Image Too Large</h3>
                <p className="text-base opacity-90">Converted image exceeds size limit. Try a smaller or lower resolution image.</p>
              </div>
            </div>
          </section>

          {/* Worker Error Codes */}
          <section>
            <h2 className="text-2xl md:text-3xl font-stack-sans-notch mb-4 font-bold">Worker Errors (WORKER_XXX)</h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">WORKER_001 - Invalid Content Type</h3>
                <p className="text-base opacity-90">File type not supported. Use JPEG, PNG, GIF, or WebP.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">WORKER_002 - File Too Large</h3>
                <p className="text-base opacity-90">File exceeds 100MB limit. Use a smaller image.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">WORKER_003 - R2 Storage Upload Failed</h3>
                <p className="text-base opacity-90">Failed to upload to storage. Try again or contact support.</p>
              </div>
            </div>
          </section>

          {/* Safari/iOS Error Codes */}
          <section>
            <h2 className="text-2xl md:text-3xl font-stack-sans-notch mb-4 font-bold">Safari/iOS Errors (SAFARI_XXX)</h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_001 - CORS Error</h3>
                <p className="text-base opacity-90">Safari blocked request. Refresh page and log in again. Check Safari privacy settings.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_002 - Session/Authentication Error</h3>
                <p className="text-base opacity-90">Safari failed to send authentication. Refresh page and log in again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_003 - Network Error</h3>
                <p className="text-base opacity-90">Safari network error. Check connection or try again.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_004 - Upload Cancelled</h3>
                <p className="text-base opacity-90">Safari cancelled upload. Keep Safari in foreground during upload.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_005 - Upload Timeout</h3>
                <p className="text-base opacity-90">Safari upload timeout. File may be too large. Try a smaller image.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_006 - Memory Error</h3>
                <p className="text-base opacity-90">Safari ran out of memory. Use a smaller or lower resolution image.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_007 - FormData Error</h3>
                <p className="text-base opacity-90">Safari failed to process file. Try a different image format.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_008 - Generic Safari Error</h3>
                <p className="text-base opacity-90">Safari-specific error occurred. Check error message for details.</p>
              </div>
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">SAFARI_009 - Body Locked Error</h3>
                <p className="text-base opacity-90">Safari body locked error. File may be too large or corrupted. Try a smaller image.</p>
              </div>
            </div>
          </section>

          {/* Resolution Error */}
          <section>
            <h2 className="text-2xl md:text-3xl font-stack-sans-notch mb-4 font-bold">Resolution Errors</h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-stack-sans-notch font-semibold">RESOLUTION_TOO_LOW</h3>
                <p className="text-base opacity-90">Image resolution is less than 1080p. Upload an image with at least 1920x1080 resolution.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

