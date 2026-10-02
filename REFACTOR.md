# Flow การทำงาน (Architecture Flow)

## 1. App Bootstrap (main.tsx)
1. `ReactDOM.createRoot` เรียก render ด้วย `<StrictMode>`
2. Wrapping providers (จากบนลงล่าง):
   - `AuthPreventContext` – จัดการ Auth state (user, loading) + ฟังก์ชัน login/signup/logout, subscribe `onAuthStateChanged`
   - `TodoProvider` – Global cache `todosCache` (โครงสร้าง `Record<monthKey, Record<dayKey, Todolist[]>>`) ใช้แชร์ข้อมูล todo ระหว่าง Calendar/Todolist
   - `AppReadyProviderContext` + `AppGate` – รอ `document.readyState === "complete"` ก่อน render app (ป้องกัน FOUC/asset load)
   - `RouterProvider` กับ `router` (lazy-loaded pages)
3. `Suspense` fallback แสดงระหว่าง lazy load

**Flow:** Auth loads → Cache provider ready → AppGate ready → Router mounts

## 2. Routing & Guards (Router.tsx)
- `/` (Home/App): `ProtectedRoute allowAuthenticated={false} fallbackPath="/calendar"`
  - ถ้า **มี user** → redirect ไป `/calendar` (ป้องกัน login/signup หลัง auth แล้ว)
  - ถ้า **ไม่มี user** → แสดง `App.tsx` (Sign In/Sign Up)
- `/calendar`: `ProtectedRoute allowAuthenticated={true} fallbackPath="/"` (ต้อง login)
- `/to-do-list/:day`: `ProtectedRoute allowAuthenticated={true} fallbackPath="/"` (ต้อง login)
- ใช้ `lazy()` โหลด pages + `Suspense` ใน `MainLayout` + `key={location.pathname}` บน `<Outlet>`

## 3. Authentication (App.tsx + AuthPreventContext.tsx)
- `App.tsx` ใช้ `useReducer` จัดการ form state (Mode signin/signup, email/password/confirm, error, loading)
- Signup: ตรวจสอบ confirmPassword → `signup()` → ได้ `uid` → สร้าง batch set 2 docs พร้อมกัน:
  - `doc(db, "AuthUser", uid)` – ข้อมูล auth/profile
  - `doc(db, "UserData", uid)` – root ของ user data
- Login: ถ้ามี user อยู่แล้ว throw `auth/user-logining` → else `login()`
- `AuthPreventContext`: `onAuthStateChanged` ตั้ง `user` และ `loading=false` เมื่อ auth state พร้อม → Provider render children หรือ loading UI

## 4. Data Layer (services.tsx)
Path todo แต่ละวันถูกจัดกลุ่มตาม **Year/Month**:
```ts
collection(db, "UserData", uid, "Years", year, "Months", month, "Tasks")
```
- `getTodos(uid,year,month)` → map docs → return `Todolist[]` (fallback `[]` ถ้า error)
- `addTodo` → `doc(tasksColRef)` (auto ID) → `setDoc` พร้อมฝัง `id: newTaskRef.id` → return id
- `updateTodo`, `toggleComplete` → `updateDoc` โดยใช้ year/month/id
- `getQuickTodos/addQuickTodo/deleteQuickTodo` → `UserData/{uid}/quick_todos` (orderBy createdAt asc)

**ข้อสังเกต:** การแบ่ง Years/Months ช่วย query แบบ scoped ดีมาก (โหลดเฉพาะเดือนที่เปิด)

## 5. Global State (TodoProvider.tsx)
Cache รูปแบบ:
```ts
Record<string, Record<string, Todolist[]>>
        ↑ monthKey (YYYY-MM)   ↑ dayKey (YYYY-MM-DD)
```
- `setTodosCache` ใช้ functional update (`updateDayCache` helper ใน Todolist)
- Provider ครอบ Auth + Router ทำให้ Calendar/Todolist ใช้ cache ร่วมกัน ลดการ refetch ซ้ำ

## 6. Calendar Flow (Calendar.tsx)
1. **Init state**: currentDate, direction/transition (slider 5 เดือน), quickTodos, activeQuickId, pendingStamps + redoHistory, todoopen, Alert
2. **Fetch quickTodos** (useEffect on `user?.uid`) – โหลดรายการ quick สำหรับลากวาง
3. **Fetch month todos** (useEffect): ถ้า `todosCache[monthKey]` มีอยู่แล้ว → return (cache-first). Else → `services.getTodos(year,month)` → group by `datekey` → set into `todosCache[monthKey]`
4. **Calendar grid** (useMemo): สร้าง 42 cells (6 rows) แสดงวัน + todo badges
   - Sort todos ในแต่ละวัน: **todo ที่มีสีจริง (`color != #ffffff`) ขึ้นบนสุด** ก่อน (ไม่กระทบ complete order ของ Todolist)
   - แสดง `pendingStamps` แบบจาง (opacity 0.6 + dashed border) สำหรับวันที่เลือกขณะ stamp mode
5. **Stamp mode (Quick Todo)**:
   - เลือก `activeQuickId` → คลิกวัน → เพิ่ม/ถอด `pendingStamps` (toggle) บนวันนั้น (เก็บ history สำหรับ Undo/Redo)
   - Undo/Redo ย้าย item ระหว่าง `pendingStamps` ↔ `redoHistory`
   - Confirm: batch `Promise.all` สร้าง todo ทุก stamp (แยก year/month ตาม `dateKey` แต่ละอัน) → `addTodo` แต่ละรายการ → อัปเดต cache ของเดือนนั้นๆ (`targetMonthKey`) ทันที → clear pending/active
6. **Month slider**: animate next/prev (setTimeout ตาม `transitionDuration`) เพื่อให้ track กลับ center แบบ seamless

## 7. Todolist Flow (Todolist.tsx)
1. `useParams()` → `activeDay = day ?? today(YYYY-MM-DD)`
2. `monthKey/targetMonth/year/month` จาก `dayjs(activeDay)`
3. `mydataTodolist = todosCache[targetMonth]?.[activeDay] || []` (useMemo)
4. **Sort** (useMemo): 
   - Priority 1: todo ที่มี `color` จริง (`!= #ffffff` และ trim) → ขึ้นบน (`b.color` - `a.color`)
   - Priority 2: `complete` → ยังไม่เสร็จก่อนเสร็จ (`Number(a.complete)-Number(b.complete)`)
5. **Fetch** (useEffect): cache-first (`if (todosCache[monthKey]) return`) → else fetch เดือนนั้น → group → set cache
6. Modes: `null | "Add" | "Edit" | "Delete"`
   - Add: กรอก name/value + เลือกสี → เปิด Alertconfirm → `addData()` → `services.addTodo` → `updateDayCache` เพิ่มใหม่ท้าย array → reset form
   - Edit: `handleStartEdit` เซ็ต `editingId` + `editOldDataInput` + `selectedColor` → แก้ไขใน-line → Save เปิด Alertconfirm → `saveEditData` ส่ง `updates` (name/value/color) → map replace → reset
   - Delete: กด Delete → Alertconfirm → `DeleteData` → filter ออก
   - Toggle complete: `toggleComplete(id, current)` → `services.toggleComplete(..., !current)` → map update `complete`
7. ใช้ CSS Modules (`Todolist.module.css`) ผ่าน helper `css()`

## 8. UI/UX Supporting
- `MainLayout`: มี `Navber` + `NetworkBanner` + Suspense
- `NetworkBanner` (ใช้ `UseNetworkStatus`): แสดงสถานะ offline/online+wasOffline (syncing) ชั่วคราว
- `Alertconfirm`: แยก render ตาม `Page = "Calendar" | "Todolist"`, ตรวจสอบ disabled (Add ต้องมี name, Edit ต้องมีการเปลี่ยนแปลง `isEdited`), แสดง diff (ก่อน→หลัง) ตอน Edit

# จุดที่ควร Refactor (Refactor Points)

## 1. Naming & Consistency (Low–Med, Improve readability)
| File | จุด | ปัญหา | แนะนำ |
|---|---|---|---|
| `src/Context/AuthPreventContext.tsx` | ชื่อไฟล์/Component | ชื่อ `AuthPreventContext` สับสน (ดูเหมือนป้องกัน auth) แต่จริงคือ Auth Provider | เปลี่ยนชื่อ → `AuthProvider.tsx`, export `AuthProvider`, ฟังก์ชัน hook `useAuth()` (หรือคง `AuthContext()` แต่ rename file) |
| `src/Layouts/Navber.tsx` | ชื่อไฟล์/Component | `Navber` → typo (`Navbar`) | Rename → `Navbar.tsx` + อัปเดต import (`Mainlayout.tsx`) |
| `src/Pages/Calendar.tsx` | ตัวแปร | `firestDayOfMonth` (line ~87), `emtyLastDays` (line ~92–95) | `firstDayOfMonth`, `emptyLastDays` |
| `src/Context/UseNetworkStatus.tsx` | ชื่อ hook/file | `UseNetworkStatus` (PascalCase) แต่เป็น custom hook → ควร `useNetworkStatus` (camelCase) + อาจย้ายเป็น `hooks/` | Rename + update import (`NetworkBanner.tsx`) |
| `src/Context/AppReadyProviderContext.tsx` | Naming | ยาวเกินไป, สะท้อน role ไม่ชัด | `AppReadyProvider.tsx` หรือแยก hook `useAppReady` ออกไฟล์ `hooks/useAppReady.ts` |

## 2. Code Duplication (High, Maintainability)
| จุด | File(s) | Detail | แนะนำ |
|---|---|---|---|
| **ColorPicker** ซ้ำ 2 ที่ | `Calendar.tsx:27–59`, `Todolist.tsx:34–75` | Logic/UI เหมือนกันทุกประการ (defaultColors, custom color) | Extract → `src/components/ColorPicker.tsx` + props interface เดียว, import ใช้ทั้งสองหน้า |
| **QuickTodo type** ซ้ำ | `Calendar.tsx:16–21`, `services.tsx:33–38` | Type definition เหมือนกัน | ย้ายไป `src/types/todo.ts` (หรือ `types/index.ts`) → export ใช้ร่วม (Calendar, services) ลด drift |
| **Todolist interface** | มี comment เวอร์เก่าใน `Todolist.tsx:18–32` + ใช้จาก `services` แล้ว | Comment ซ้ำ/ไม่จำเป็น | ลบ comment ที่ไม่ใช้ทิ้ง |

## 3. Lint/React Hooks Dependencies (Med–High, Correctness)
| Warning | File:Line | สาเหตุ | Recommendation |
|---|---|---|---|
| `react-hooks/exhaustive-deps` | `Calendar.tsx:478` | `calendar` useMemo ขาด deps: `activeQuickId`, `daysWithColors`, `emptyfirstDays`, `emtyLastDays`, `pendingStamps`, `todosCache` | **Option 1:** เพิ่ม deps ที่ขาด (ถูกต้องตาม rule) — ระวังถ้า `daysWithColors` ถูกสร้างใหม่ทุก render (ตอนนี้เป็น const ใน component scope จะสร้างใหม่ทุก render) → ควร `useMemo` หรือย้าย `daysWithColors` ออกนอก component (static) เพื่อลด re-calc/re-render ไม่จำเป็น  
**Option 2:** ย้าย `daysWithColors` ไปนอก `Calendar()` (array คงที่) → ไม่ต้องใส่ใน deps  
**Option 3:** แยก calendar grid เป็น child component + `React.memo` หรือแยก useMemo ย่อย |
| `react-hooks/exhaustive-deps` | `Todolist.tsx:333` | `useEffect(getData)` ขาด `setTodosCache`, `todosCache` | `setTodosCache` เป็น state setter จาก `useState` → stable reference (ไม่เปลี่ยน). `todosCache` ใช้ใน condition `if (todosCache[monthKey]) return` + ใน cleanup/logic → ถ้าเพิ่มเข้า deps จะทำให้ effect re-run เมื่อ cache เปลี่ยน (อาจไม่จำเป็นหรือเกิด loop ในบางเคส)  
**แนะนำ:** อ่าน cache แบบ functional หรือใช้ `useRef`/แยก guard หรือเปลี่ยนเป็น `if (todosCache[monthKey]) return;` โดยไม่ผูกทั้ง object ถ้าอยากเลี่ยง re-run — แต่ตาม eslint best practice ควรใส่ deps ที่ใช้จริง. ทางเลือก: ใช้ `const monthBucket = todosCache[monthKey]; if (monthBucket) return;` และใส่ `todosCache, monthKey` ใน deps (ปลอดภัย) หรือ wrap fetch condition ด้วย ref. หรือใช้ `setTodosCache(prev => ...)` เท่านั้น ไม่อ่าน full object ใน deps โดยไม่จำเป็น → วิเคราะห์ให้ชัดเจนตอนแก้ไข (plan phase เท่านั้น ไม่แก้ตอนนี้) |

> **Note:** สำหรับ `setTodosCache` (React dispatch) ถือว่า stable ไม่จำเป็นต้องใส่ใน deps แต่ eslint v9 + react-hooks 7.1.1 มักแนะนำให้รวมตามที่อ่านใช้ — ปรับให้ถูกต้องตามโค้ดจริง

## 4. Type Safety & API Consistency (Med)
| File | จุด | ปัญหา | แนะนำ |
|---|---|---|---|
| `services.tsx:74` | `getTodos` return type | คืน `undefined` เมื่อ `!uid` แต่ type ฝั่งเรียกคาดว่า array หรือ handled | ทำให้ signature ชัด: `Promise<Todolist[]>` → ถ้าไม่มี uid return `[]` เสมอ (เช่นบรรทัด 75–90 ปัจจุบัน return `[]` ใน catch แต่ return `undefined` ตอน guard) → unify เป็น `[]` |
| `Calendar.tsx:71` | Alert state | `Alert` type ไม่รวม `source?: "stamp"|"quick"` ใน interface ที่ใช้กับ `SetOpenAlert` (type ใน useState ไม่ตรงกับ Props ของ Alertconfirm ที่รับได้) | Extract shared Alert type → `types/alert.ts` หรือรวม field `source` ใน type เดียวให้ใช้ทั้ง Calendar/Todolist |
| `Alertconfirm.tsx:6–24` | Props coupling | `Page` union + `pendingStampslength` optional ทำให้ logic แยก branch เยอะ | ใช้ discriminated union (`{page:'Calendar', ...} | {page:'Todolist', ...}`) เพื่อลด optional props ที่ไม่เกี่ยวข้อง |
| `services.tsx:100` | ฝัง `id` ใน doc data | `setDoc` พร้อม `id: newTaskRef.id` (dup กับ doc.id) | ไม่จำเป็นต้องเก็บ id ซ้ำใน field (มี doc.id อยู่แล้ว) — ลด redundancy (เลือกเก็บหรือไม่ตาม use case) |
| `Calendar.tsx` | `QuickTodo` vs service | มี interface local ซ้ำกับ services | ใช้ type จาก shared แทน local |

## 5. Performance & UX (Low–Med)
| จุด | File | Detail | แนะนำ |
|---|---|---|---|
| `daysWithColors` recreated | `Calendar.tsx:112–120` | สร้าง array ใหม่ทุก render → ทำให้ `calendar` useMemo re-calc โดยไม่จำเป็น | ย้ายออกนอก component หรือ `useMemo`/`const` static export |
| `calendar` useMemo deps ใหญ่ | `Calendar.tsx:478` | Depend หลายตัว (รวมทั้ง `todosCache` object) → recompute เมื่อ cache เปลี่ยนส่วนใดก็ได้ | แยกเป็น 2–3 memo: header/dayNames, grid, หรือ memo per-day หรือใช้ `useCallback` สำหรับ `Selectedday` ดีอยู่แล้ว + ลด deps |
| `Todolist` fetch guard | `Todolist.tsx:310–313` | เช็ค `todosCache[monthKey]` แต่ monthKey ใช้ targetMonth? (line 106 `monthKey = YYYY-MM` ของ activeDay, line 102 targetMonth เหมือนกัน) ใช้ `monthKey` ตรง guard แต่ set ใช้ `targetMonth` — สอดคล้องแต่ควร unify ตัวแปรเดียวกันเพื่อลด confusion |
| Alert inline | หลายที่ | ใช้ `alert()` (sync blocking, native) | พิจารณา toast/snackbar ในอนาคต (UX ดีขึ้น) — ไม่จำเป็นเร่งด่วน |

## 6. Code Cleanliness (Minor)
| File | จุด | แนะนำ |
|---|---|---|
| `App.tsx` | มี comment debug `// ตรวจสอบค่า uid ใน console` (line 106) + โค้ดที่ comment ล้น (section center เวอร์เก่า ~230–334) | ลบ comment debug + dead/commented UI ส่วนใหญ่ (ถ้าไม่ใช้) |
| `Todolist.tsx` | Commented icon code (lines 259–270) | ลบหรือแปลงเป็น TODO พร้อมเหตุผล |
| `Calendar.tsx` | Comment `// 5. Reset Quick Todo List Data...` (line 312) ไม่สมบูรณ์ | ลบหรือเติมความหมาย |
| `services.tsx` | Comment `//UserData/UserID/...` เก่า (17–22) | ทำความสะอาด |
| `firebase.js` (root) | ถ้ามี | ตรวจสอบไม่ commit secrets (มี `.env` ใน repo) — ดีแล้ว |

## 7. Architectural Suggestions (Optional, Medium-term)
| เรื่อง | Detail | Benefit |
|---|---|---|
| Extract hooks | `useTodosByMonth`, `useQuickTodos`, `useMonthNavigation` | แยก logic/UI, ทดสอบง่ายขึ้น |
| Error handling | แทน `alert()` ด้วย state (error/toast) + centralize | UX สม่ำเสมอ, testable |
| Cache normalization | ป้องกัน stale shape, ใช้ immer หรือ reducer pattern | ปลอดภัยขึ้นเวลาย้าย logic |
| Constants | สี default, transitionDuration → `constants/` | reuse ได้ |

# สรุป (Summary)
- **Flow ชัดเจน**: Auth → Guards → Providers (Cache) → Calendar/Todolist แยกหน้าชัดเจน, ใช้ Year/Month scoped Firestore + cache-first strategy ดี
- **จุดปรับปรุงหลัก**: Extract `ColorPicker` + shared types (ลด duplication), แก้ naming typos (`Navbar`, `AuthProvider`), ตัดสินใจจัดการ deps warnings ใน `Calendar`/`Todolist` อย่างถูกต้อง (focus ที่ `daysWithColors` static + deps ที่ใช้จริง), unify return type ใน `services.getTodos`
- **Refactor แบบ incremental** แนะนำเริ่มจาก **Duplication + Naming** ก่อน (low risk, high clarity) → ตามด้วย **Hooks deps + Types** (correctness)
