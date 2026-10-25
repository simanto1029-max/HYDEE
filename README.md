# HYDEE — Premium Luxury Fashion E-commerce

Bespoke luxury fashion boutique crafted in Bangladesh. Built with React 19, TypeScript, Vite, Tailwind CSS, Supabase PostgreSQL schema, and an interactive 3D fashion hanger rack showroom.

---

## Brand Identity & Aesthetic
- **Colors**: White (`#FFFFFF`) and Signature Maroon (`#800000`).
- **Typography**: Google Font **Hind Siliguri** paired with editorial **Playfair Display**.
- **Header & Footer**: Replicated faithfully from the official HYDEE atelier reference design.

---

## Key Features

1. **Faithful Header & Footer**:
   - Replicated directly from the reference design.
   - `SHOP`, `MOVE & SLIDE` (styled in signature maroon), `LOOKBOOK`, `CRAFTSMANSHIP`, `TRACK ORDER`.
   - Cart bag counter with maroon live badge.
   - Reference footer container card with `Bespoke luxury for every occasion, crafted in Bangladesh`, social icons, navigation columns, and official concierge card.
   - Floating VIP Stylist concierge pill widget ("Dhaka Atelier Online").

2. **Interactive Fashion Hanger ("MOVE & SLIDE")**:
   - Realistic brass hanger rail with wooden HYDEE hangers.
   - Drag or touch swipe garments horizontally.
   - Integrated 360° turntable viewer supporting sequential multi-frame rotation.

3. **Cash on Delivery with Advance Delivery Payment**:
   - Genuine Bangladeshi e-commerce business model:
     - Customer enters name, 11-digit mobile number, and address.
     - System calculates required advance delivery fee based on zone:
       - **Inside Dhaka**: ৳80 (24–48 Hours)
       - **Dhaka Suburbs**: ৳120 (48–72 Hours)
       - **Outside Dhaka**: ৳150 (3–4 Days via Steadfast)
     - Customer completes advance delivery fee verification via bKash / Nagad / Card / Sandbox Test Gateway.
     - Confirmation locks in inventory only after verified TrxID callback.
     - Remaining garment amount is collected in cash upon doorstep delivery and inspection.

4. **Complete Admin Portal (`/admin`)**:
   - **Default Credentials**: `admin@hydee.com` / `hydee2026`
   - **Executive Dashboard**: Gross sales, verified advance fees, COD receivable, margin estimates, and low stock warnings.
   - **Product Manager**: Full CRUD, variant generator, 360 frames manager, slug editor with uniqueness check, and live preview.
   - **Homepage Curation**: Edit campaign slides, hanger items, and best-sellers.
   - **Order Fulfillment**: Search, advance fee verification, courier assignment (Steadfast / Pathao tracking code), and invoice print.
   - **Marketing & Meta Pixel**: Live event inspector, sandbox mode toggle, and promotional popup editor.
   - **Settings & Audit Trail**: Delivery fees, JSON database export/import, and staff audit logs.

5. **Meta Pixel & Deduplication**:
   - Standard events: `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`.
   - `Purchase` event fires strictly once upon verified advance confirmation state.

---

## Local Development & Setup

```bash
# 1. Install dependencies
npm install

# 2. Run development server (Port 3000)
npm run dev

# 3. Production build
npm run build
```

---

## Supabase PostgreSQL Backend (Optional)
A complete SQL migration script with Row Level Security (RLS) policies is included at:
`/supabase/migrations/001_initial_schema.sql`

To connect your Supabase project:
1. Run the SQL script in your Supabase project SQL Editor.
2. Add your credentials to `.env`:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```
3. If credentials are not provided, HYDEE seamlessly uses its built-in local persistence engine with JSON import/export capabilities!
