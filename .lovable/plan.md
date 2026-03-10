

## Plan: Fix dekodowanie PDF preview

### Problem
The DecodingTemplates page uses `URL.createObjectURL()` to create a blob URL for the iframe src. Blob URLs don't render in the sandboxed preview iframe. The existing `PDFPreview` component correctly uses `FileReader.readAsDataURL()` (base64 data URI) which works.

### Fix

**`src/pages/AdminPanel/DecodingTemplates.tsx`**:
- Replace `pdfUrl` (blob URL) with `pdfDataUri` (base64 data URI)
- In `generatePreview`: after getting the blob, use `FileReader.readAsDataURL()` to convert to data URI, then set it as the iframe src
- Remove `URL.createObjectURL` / `URL.revokeObjectURL` cleanup logic
- Keep download using blob approach (that's fine for download links)

Key change in `generatePreview`:
```typescript
const blob = await generateDecodingPDF(decoded);
const reader = new FileReader();
reader.onload = () => setPdfDataUri(reader.result as string);
reader.readAsDataURL(blob);
```

### Files
- `src/pages/AdminPanel/DecodingTemplates.tsx` — switch from blob URL to data URI for iframe

