1:1 Mapping: Every input name in the React code must match a column_name in the DB exactly.

Auto-Slugs: Slugs must be auto-generated from titles, sanitized (lowercase, no spaces), and checked for uniqueness before saving.

Save State: Every Save button must have a "Loading" and "Success/Error" toast notification so the user knows the data is safe.

## Rule 24: SEO & Slug Integrity
- **Slug Uniqueness**: A slug must be unique within its table to prevent URL collisions.
- **Meta-Data Fallback**: If SEO fields are left blank in the Admin, the Backend must dynamically generate them from the content before serving to the frontend.
- **No Indexing Drafts**: Any page with `status: 'draft'` must automatically include a `noindex` meta-tag in the header.

## Rule 29: The Two-Way Sync Check
This will prevent "Ghost Field" issues in the next project:
For every field, the agent must verify both the Outbound (Save) and Inbound (Load) data paths.

- **Inbound**: Data from `res.json()` must be explicitly mapped to the UI state variable using the exact Database Column Name.
- **Outbound**: The UI state variable must be sanitized before the POST/PUT request.

## Rule 31: Component Symmetry
If an Admin Form contains multiple similar fields (e.g., Title and Subtitle, or Content and Narrative):
1. **Consistency**: The developer must use the exact same State Handling and Change Handler for both fields.
2. **Batch Loading**: The `GET` request must fetch all text fields in a single database query. Splitting them into multiple requests is prohibited.
3. **Avoid Browser Loops**: If a field is not displaying data, the developer must inspect the API response in the code first, not "click around" to debug.