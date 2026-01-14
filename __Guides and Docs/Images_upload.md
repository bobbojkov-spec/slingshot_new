Single Image Upload with Crop Tool

(Admin – Based on slingshot_new logic)

1. Core Philosophy

The crop tool is optional, client-side, and applies only to single image uploads.
	•	Users may upload without cropping
	•	Users may choose a crop ratio before upload
	•	Multiple uploads NEVER use the crop tool
	•	The backend never guesses — it only processes what it receives

This keeps uploads:
	•	Predictable
	•	Reversible
	•	Easy to migrate
	•	Safe for future formats

⸻

2. When the Crop Tool Is Used

Crop Tool appears only if:
	•	Upload mode = Single image
	•	Image is uploaded via a dedicated uploader (e.g. Product main image, Category image, Brand image)

Crop Tool does NOT appear:
	•	Multiple image uploads (gallery, variants, bulk upload)
	•	Drag-and-drop batch uploads
	•	Any automated import or migration

⸻

3. Crop Tool UX Flow (Frontend)

Step 1: User selects image
	•	Image loads locally in the browser
	•	Original file is never modified

Step 2: Optional crop activation

User may:
	•	Skip cropping → upload original
	•	Enable crop → choose ratio from dropdown

Supported crop ratios (dropdown)
	•	Original
	•	1:1 (Square)
	•	3:4 (Portrait)
	•	4:3 (Landscape)
	•	16:9 (Wide)
	•	Free crop

Ratio choice is intentional — no auto-crop is applied.

Step 3: Crop preview
	•	User adjusts crop box
	•	Live preview shown
	•	No resizing yet — only crop coordinates

Step 4: Confirm & Upload

On confirm:
	•	Frontend creates a new cropped image file
	•	Both files are sent:
	•	original_file
	•	cropped_file
	•	Crop metadata is attached

⸻

4. What the Frontend Sends to Backend

Payload

{
  "originalImage": File,
  "croppedImage": File | null,
  "cropData": {
    "x": number,
    "y": number,
    "width": number,
    "height": number,
    "ratio": "1:1 | 3:4 | 16:9 | free"
  } | null
}

Rules
	•	If no crop was used → croppedImage = null
	•	Backend never recalculates crop
	•	Backend never infers ratio

⸻

5. Backend Processing Logic

Step 1: Store original image
	•	Always stored
	•	Never resized
	•	Never compressed
	•	Acts as the source of truth

Step 2: Determine working image


Rules
	•	If no crop was used → croppedImage = null
	•	Backend never recalculates crop
	•	Backend never infers ratio

⸻

5. Backend Processing Logic

	Step 1: Store original image
	•	Always stored
	•	Never resized
	•	Never compressed
	•	Acts as the source of truth
	
	Step 2: Determine working image

			const sourceImage = croppedImage ?? originalImage

	Step 3: Generate derived sizes

From sourceImage, generate:
Variant
Purpose
thumb
Lists, tables, selects
middle
Cards, previews
full
Product pages / detail views
We always resize: (long side, other side stays in proportions)
	- thumb - 250 px
- middle - 500 px
- full - 1000px

All resized images inherit the crop if used.

6. Storage Structure (Bucket)
Rules:
	•	original.jpg = untouched upload
	•	Other sizes are derived once
	•	No regeneration unless explicitly requested

7. Database Columns (Minimal & Clean)

images table
id UUID PK
entity_type VARCHAR        -- product, category, brand
entity_id UUID
path_original VARCHAR
path_thumb VARCHAR
path_middle VARCHAR
path_full VARCHAR
width INT
height INT
crop_ratio VARCHAR NULL
created_at TIMESTAMP

Notes
	•	crop_ratio is informational only
	•	Crop coordinates do not need to be stored
	•	Regeneration always starts from original

8. Multiple Image Uploads (Explicitly Different)

Rules
	•	No crop tool
	•	Upload as-is
	•	Backend auto-resizes from original
	•	User may reorder images only

This avoids:
	•	UI complexity
	•	Batch crop disasters
	•	Inconsistent ratios in galleries

⸻

9. Why This Logic Works

✔ Predictable
✔ Migration-safe
✔ User-controlled
✔ No magic
✔ No destructive edits
✔ Easy to explain to future devs

This is exactly the logic we converged to in slingshot_new once things stabilized.