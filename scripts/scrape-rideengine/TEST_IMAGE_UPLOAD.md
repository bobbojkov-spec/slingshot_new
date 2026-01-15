# 🎯 READY TO TEST - Image Upload

## ✅ What's Ready

Test script creates **4 versions** of each image:
- **Original** - Full resolution
- **Large** - 1920px max (fit inside)
- **Medium** - 500px short side (fit inside)  
- **Thumb** - 300x300px (cover crop)

Following your `processor-railway.ts` pattern exactly!

---

## 🚀 Run the Test

### Install Dependencies

```bash
cd scripts/scrape-rideengine

# Install Sharp for image processing
npm install sharp
```

### Run Test (2 Images Only)

```bash
node test_upload_2_images.js
```

This will:
1. Upload **first 2 images** only
2. Create **4 versions** of each (original, large, medium, thumb)
3. Upload all to Railway S3 under `ride-engine/{product}/original|large|medium|thumb/`
4. Save all paths to `test-upload-results.json`
5. Show you exactly what will be stored in database

---

## 📝 What Gets Saved

For each image, you'll get:

```json
{
  "productHandle": "hyperlock-design-upgrade-kit",
  "filename": "image.jpg",
  "original": "ride-engine/product/original/image.jpg",  
  "large": "ride-engine/product/large/image_large.jpg",
  "medium": "ride-engine/product/medium/image_medium.jpg",
  "thumb": "ride-engine/product/thumb/image_thumb.jpg",
  "dimensions": { "width": 2400, "height": 1600 }
}
```

**Store `original` path in `ProductImage.url`** (following IMAGE_HANDLING_GUIDE.md)

API will use `getPresignedUrl()` to sign it.

---

## ✅ Verify Test

1. Check Railway dashboard - do you see all 4 versions uploaded?
2. Try accessing one URL
3. Check `test-upload-results.json` for paths

---

## 📊 After Test Works

**Full upload** (all 789 images):
```bash
node upload_images_to_s3.js  # ~15-20 min
```

Then import to database using the generated SQL.

---

**Ready? Run:** `npm install sharp && node test_upload_2_images.js`
