# MAP Test Management System

ระบบทดสอบ **Measures of Academic Progress (MAP)** แบบ adaptive ที่ปรับระดับความยากตามผู้ตอบเรียลไทม์ — ใช้มาตรฐาน **RIT (Rasch Unit) scale** เดียวกับ NWEA MAP Growth ของอเมริกา ผสมโจทย์ **English** และ **Mathematics** ในการทดสอบเดียว

🌐 **Live**: https://smartmaptest-999.web.app
📦 **Repo**: https://github.com/dssnslfoods/maptest

---

## สารบัญ

1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [Role และสิทธิ์ที่ทำได้](#role-และสิทธิ์ที่ทำได้)
3. [วิธีใช้สำหรับนักเรียน (Student)](#สำหรับนักเรียน-student)
4. [วิธีใช้สำหรับครู (Teacher)](#สำหรับครู-teacher)
5. [วิธีใช้สำหรับ Admin](#สำหรับ-admin)
6. [การคำนวณ RIT score](#การคำนวณ-rit-score)
7. [การติดตั้ง (Setup)](#การติดตั้ง-setup)
8. [License](#license)

---

## ภาพรวมระบบ

ระบบ MAP Test เป็น **adaptive computer test** ที่:
- **เลือกข้อถัดไปตามความสามารถจริง** — ตอบถูกได้ข้อยากขึ้น ตอบผิดได้ข้อง่ายลง
- **40 ข้อต่อ session** — สลับ Math/English ทุกข้อ (M, E, M, E, ...)
- **คะแนนเป็น RIT** — มาตรฐาน 100–350 (ปกติ 140–300)
- **มีคะแนนแยก English / Math** ในการทดสอบเดียว
- **แสดง percentile + grade-level comparison** ในรายงาน

### Tech ที่ใช้

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind v4 |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| State | TanStack Query + Zustand |
| Charts | Recharts |
| Math rendering | KaTeX |
| AI Question Gen | Google Gemini 2.5 Flash |
| Hosting | Firebase Hosting |

---

## Role และสิทธิ์ที่ทำได้

| ฟีเจอร์ | Student | Teacher | Admin |
|---|---|---|---|
| ดู Dashboard ตัวเอง | ✅ | ✅ (เห็นนักเรียนของตัวเอง) | ✅ (เห็นทั้งหมด) |
| ทำข้อสอบ MAP | ✅ | — | — |
| ดูคะแนน RIT + percentile ของตัวเอง | ✅ | — | — |
| ดู progress chart ตัวเอง | ✅ | — | — |
| สร้างนักเรียน | — | ✅ (เข้าสังกัดตัวเอง) | ✅ (เลือกครูได้) |
| สร้างครู / admin | — | — | ✅ |
| ดูผลของนักเรียน | — | ✅ (เฉพาะนักเรียนของตัวเอง) | ✅ (ทุกคน) |
| **Question Review** (ดูคำตอบนักเรียน vs เฉลย) | — | ✅ (เฉพาะนักเรียนของตัวเอง) | ✅ |
| ดู Reports / class aggregates | — | ✅ (เฉพาะนักเรียนของตัวเอง) | ✅ |
| Export CSV | — | ✅ | ✅ |
| ลบ session | — | — | ✅ |
| Reset password นักเรียน | — | ✅ (เฉพาะของตัวเอง) | ✅ |
| Manage question bank (CRUD) | — | — | ✅ |
| Import questions ผ่าน CSV | — | — | ✅ |
| AI Generate questions (Gemini) | — | — | ✅ |
| Approve / reject AI drafts | — | — | ✅ |
| Recalibrate question difficulty | — | — | ✅ |

---

## สำหรับนักเรียน (Student)

### 🔐 เข้าสู่ระบบ
1. ไปที่ https://smartmaptest-999.web.app
2. กรอก email + password ที่ครู/admin ตั้งให้
3. หากยังไม่มีบัญชี — ขอครูประจำชั้นให้สร้างให้ (นักเรียนต้องสังกัดครู)

### 📝 เริ่มทำข้อสอบ
1. หน้า Dashboard → กด **"Start new test"**
2. หน้า Setup → ยืนยัน Grade level (default = เกรดที่ระบุในโปรไฟล์)
3. กด **"Start test"** — จะเข้าโหมด full-screen

### ระหว่างทำข้อสอบ
- ดู progress bar ด้านบน — บอกว่าทำไปกี่ข้อจาก 40 ข้อ
- ตัวอักษร Subject badge (Math / English) — บอกว่าเป็นข้อวิชาอะไร
- เลือกคำตอบ A/B/C/D แล้วกด **Submit answer**
- **ไม่สามารถย้อนกลับได้** — เป็น adaptive test
- หากรีเฟรช/ออกแล้วเข้าใหม่ → ทำต่อจากข้อล่าสุดได้ (resume)

### 📊 ดูผล
หลังทำครบ 40 ข้อ → จะ redirect ไปหน้า **Results** อัตโนมัติ แสดง:
- **Final RIT score** แยก English / Math
- **SEM ±3** (ช่วงความคลาดเคลื่อน)
- **Grade-level comparison** (สูงกว่า / เท่ากับ / ต่ำกว่าค่าเฉลี่ยชั้น)
- **Approximate percentile**
- **Strand breakdown** — ถูก/ผิดในแต่ละหัวข้อย่อย
- **Time on task chart** — เวลาที่ใช้แต่ละข้อ
- **RIT trajectory** — กราฟ RIT ที่ปรับขึ้น/ลงตลอดการทดสอบ

### 📈 ดู progress ระยะยาว
เมนู **Progress** → กราฟ RIT ตามเวลา (ทุก session ที่ทำ) + Growth goal เปรียบเทียบ

---

## สำหรับครู (Teacher)

### 🔐 เข้าสู่ระบบ
1. ไปที่ login → ใส่ email + password ที่ admin สร้างให้

### 👥 สร้างนักเรียน
1. เมนู **Settings** → การ์ด **"My students"**
2. กดปุ่ม **"New student"**
3. กรอก email, password (≥6 ตัว), ชื่อ, grade level, school (optional)
4. กด **Create student** → นักเรียนสังกัดครูคนนี้อัตโนมัติ

### 📋 ดู / แก้ไข / ลบ นักเรียน
ในการ์ด "My students" ของหน้า Settings:
- ✏️ **Pencil icon** — แก้ชื่อ, grade, school
- 🔑 **Key icon** — Reset password
- 🗑 **Trash icon** — ลบนักเรียน (cascade ลบ sessions ทั้งหมด)

### 📊 ดูผลของนักเรียน

**1. Dashboard / Students / Reports**
- เมนู **Dashboard** — Recent sessions ของนักเรียนทั้งหมดที่ตัวเองดูแล (พร้อมชื่อ)
- เมนู **Students** — รายชื่อนักเรียน + คะแนนล่าสุด
- เมนู **Reports** — ภาพรวมชั้นเรียน, histogram, top performers / flagged

**2. Question Review** (ฟีเจอร์เด่นสำหรับครู)
- คลิก **"Review"** ในแถวของ session ที่ completed
- ดูได้ทุกข้อที่นักเรียนทำ พร้อม:
  - ✅ คำตอบที่ถูกต้อง (highlight สีเขียว)
  - ❌ คำตอบที่นักเรียนเลือก (highlight สีชมพูถ้าผิด)
  - 📝 Passage + คำถาม + 4 ตัวเลือก
  - 💡 Explanation อธิบายเหตุผล
  - ⏱ เวลาที่ใช้

**3. Export ข้อมูลเป็น CSV**
- หน้า Reports → ปุ่ม **Download CSV**

### 🎯 ตั้ง Growth Goal
- หน้า Students → เลือกนักเรียน → ตั้งเป้า RIT target ภายในวันที่ที่ระบุ
- จะปรากฏเป็นเส้น dashed ใน progress chart ของนักเรียน

---

## สำหรับ Admin

### 🔐 เข้าสู่ระบบ
Login เหมือนปกติ → มีเมนูเพิ่ม: **Questions**, **AI**, **Drafts**

### 👤 User Management
หน้า **Settings** → การ์ด User management
- ดูบัญชีทุกคน ทุก role
- สร้างได้ทั้ง student, teacher, admin
- ตอนสร้าง student เลือกครูที่จะให้สังกัดได้
- แก้ role, grade, school, teacher assignment ภายหลังได้
- Reset password / ลบบัญชีของใครก็ได้ (ยกเว้นตัวเอง)

### 📚 Question Bank Management
เมนู **Questions** (`/admin/questions`)

**ฟีเจอร์:**
- 🔍 Filter ตาม subject, strand, RIT range, active/inactive
- ➕ **New question** — สร้างเอง (ฟอร์ม Math/English พร้อม MathJax preview)
- 📤 **Import CSV** — Bulk import (มี template ให้ download)
- 📥 **CSV template** — Download header template
- ✏️ Edit / 🗑 Delete รายข้อ
- 👁 Preview รายข้อ
- 🔄 **Recalibrate** — ปรับ difficulty_rit ตามข้อมูลจริง (ต้องมีคนตอบ ≥30 ครั้งต่อข้อ)

### 🤖 AI Question Generator
เมนู **AI** (`/admin/generator`)

**ต้องมี Gemini API key ก่อน:**
1. ไป https://aistudio.google.com/apikey ขอ API key ฟรี
2. หน้า **Settings** → AI provider settings → paste key → Test connection → Save
3. Key ถูกเก็บแบบ AES-GCM encrypted ผูกกับ user id ของแต่ละ admin

**สร้างโจทย์:**
1. เลือก Subject, Strand, Grade band, Target RIT, Count (1–10)
2. กด **Generate** → Gemini จะสร้างโจทย์ผ่าน admin's browser
3. โจทย์ทุกข้อเข้าคิว `question_drafts` (สถานะ pending)
4. หากเจอ 503 / 429 (Gemini overload) → ระบบ retry อัตโนมัติ 3 ครั้ง

### 📋 Draft Review
เมนู **Drafts** (`/admin/drafts`)
- ดูโจทย์ที่ AI generate มา ยังไม่ approve
- Tabs: Pending / Approved / Rejected
- รายข้อ — Edit, Approve (= ส่งเข้าคลังจริง), Reject
- Bulk: Approve all / Reject all

### 🗑 ลบ Session
หน้า Dashboard → แถวของ session → กดปุ่มถังขยะ (เห็นเฉพาะ admin)
- จะ cascade ลบ test_responses ทั้งหมดของ session นั้น

---

## การคำนวณ RIT score

### Starting RIT (ตามเกรด)

| Grade | English | Math |
|---|---|---|
| K | 142 | 140 |
| 1 | 160 | 162 |
| 2 | 174 | 177 |
| 3 | 188 | 190 |
| 4 | 198 | 201 |
| 5 | 206 | 210 |
| 6 | 211 | 215 |
| 7 | 214 | 219 |
| 8 | 217 | 222 |
| 9 | 220 | 226 |
| 10 | 223 | 229 |
| 11 | 224 | 230 |
| 12 | 225 | 231 |

### Update rule per question

```
step_size = max(2, 8 − ⌊questions_answered / 7⌋)
new_RIT  = current_RIT + (correct ? +step_size : −step_size)
new_RIT  = clamp(new_RIT, 100, 350)
```

| Questions answered | Step size |
|---|---|
| 0–6 | 8 |
| 7–13 | 7 |
| 14–20 | 6 |
| 21–27 | 5 |
| 28–34 | 4 |
| 35–40 | 3 → 2 |

### Final RIT
```
Final_RIT_subject = average(difficulty_rit ของ 10 ข้อสุดท้ายในวิชานั้น)
```

### Percentile (approximate)
ใช้ normal CDF approximation:
```
percentile = Φ((RIT − grade_norm) / 15) × 100
```

### SEM ±3
Standard Error of Measurement = ±3 RIT points (~68% confidence band)

---

## การติดตั้ง (Setup)

### ความต้องการ
- Node.js 22+
- Supabase project (URL + anon key)
- Firebase project (สำหรับ hosting)
- Google AI Studio API key (สำหรับ AI generator)

### Local development

```bash
git clone https://github.com/dssnslfoods/maptest.git
cd maptest
npm install

# Configure env
cp .env.example .env.local
# แล้วแก้ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY

npm run dev    # http://localhost:5173
```

### Supabase migrations

Apply migration files ใน `supabase/migrations/` ตามลำดับผ่าน Dashboard → SQL Editor:

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Tables, enums, indexes |
| `002_rls_policies.sql` | Row-Level Security policies |
| `003_functions.sql` | Adaptive engine RPCs (submit_answer, get_next_question, etc.) |
| `004_seed_questions.sql` | 50+ Math / 50+ English starter questions |
| `005_admin_user_management.sql` | Admin: confirm / delete / reset password RPCs |
| `006_perf_get_next_question.sql` | Single-query selection (perf) |
| `007_admin_delete_session.sql` | Admin: delete session RPC |
| `008_teacher_student_link.sql` | Teacher-student membership + RLS update |
| `009_teacher_user_management.sql` | Teacher: create / delete / reset password RPCs |
| `010_grade_aware_selection.sql` | Question selection prefers near-grade items |

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting --project YOUR_PROJECT_ID
```

`.firebaserc` กำหนด default project อยู่แล้ว — ถ้าจะ deploy คนละ project แก้ที่ไฟล์นี้

### First admin account

1. Sign up ที่ `/signup` ด้วย role = admin
2. หรือสร้างผ่าน Supabase Admin API:
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/auth/v1/admin/users" \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"secret123",
          "email_confirm":true,
          "user_metadata":{"full_name":"Admin","role":"admin"}}'
   ```

---

## License

Copyright © 2026 **Arnon Arpaket**

ระบบนี้พัฒนาเพื่อการใช้งานเชิงการศึกษา การนำไปใช้ ดัดแปลง หรือเผยแพร่ในเชิงพาณิชย์ต้องได้รับอนุญาตเป็นลายลักษณ์อักษรจากผู้พัฒนาก่อน

**Developed by Arnon Arpaket** · 2026
