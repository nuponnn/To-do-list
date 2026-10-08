# Flow ทั้งระบบ - To Do List

อัปเดตล่าสุด: 2026-10-07
สถานะตรวจสอบ: `npm run lint` ผ่าน, `npm run build` ผ่าน

เอกสารนี้สรุป flow ปัจจุบันของแอป To Do List ครอบคลุม bootstrap, auth, routing, Firestore, cache, ระบบสี, Calendar และ Todolist

## สารบัญ

- [1. ภาพรวมระบบ](#1-ภาพรวมระบบ)
- [2. Provider และ Bootstrap Flow](#2-provider-และ-bootstrap-flow)
- [3. Routing](#3-routing)
- [4. Auth Flow](#4-auth-flow)
- [5. Firestore Data Layer](#5-firestore-data-layer)
- [6. Runtime Parsing และ Type Safety](#6-runtime-parsing-และ-type-safety)
- [7. Global Todo Cache](#7-global-todo-cache)
- [8. Color Flow](#8-color-flow)
- [9. Calendar Flow](#9-calendar-flow)
- [10. Todolist Flow](#10-todolist-flow)
- [11. Layout และ UI Supporting](#11-layout-และ-ui-supporting)
- [12. จุดที่ต้องระวังเวลาแก้ต่อ](#12-จุดที่ต้องระวังเวลาแก้ต่อ)

## 1. ภาพรวมระบบ

### Stack

- React 19
- TypeScript strict
- Vite 8
- React Router 7
- Firebase 12
- dayjs

### คำสั่งหลัก

```bash
npm install
npm run dev
npm run lint
npm run build
```

### โครงสร้างข้อมูลหลัก

ข้อมูลหลักเก็บใน Firestore ใต้ `UserData/{uid}` โดยใช้ `user.uid` เป็น partition key ของข้อมูลผู้ใช้ทั้งหมด เช่น todo, quick todo และ saved colors

ฝั่ง client ใช้ React Context เป็น global state โดยเฉพาะ auth, todo cache, saved colors และ app-ready state

## 2. Provider และ Bootstrap Flow

`src/main.tsx` render provider tree ตามลำดับนี้:

```txt
StrictMode
└─ Suspense
   └─ AuthPreventContext
      └─ TodoProvider
         └─ ColorProvider
            └─ AppReadyProviderContext
               └─ AppGate
                  └─ RouterProvider
```

ลำดับการทำงาน:

1. `AuthPreventContext` subscribe `onAuthStateChanged` และถือ `user/loading`
2. `TodoProvider` เก็บ `todosCache` ที่แชร์ระหว่าง Calendar และ Todolist
3. `ColorProvider` โหลดสีที่ผู้ใช้บันทึกไว้จาก localStorage ก่อน แล้ว sync จาก Firestore
4. `AppReadyProviderContext` และ `AppGate` รอ `document.readyState === "complete"`
5. `RouterProvider` mount routes

## 3. Routing

Routes อยู่ที่ `src/Router.tsx`

- `/`
  - Page: `Pages/App.tsx`
  - Guard: ถ้า login แล้ว redirect ไป `/calendar`
- `/calendar`
  - Page: `Pages/Calendar.tsx`
  - Guard: ต้อง login
- `/to-do-list/:day`
  - Page: `Pages/Todolist.tsx`
  - Guard: ต้อง login

ทุกหน้าใช้ lazy route และ fallback ผ่าน `Suspense` ใน layout/provider tree

## 4. Auth Flow

ไฟล์หลัก:

- `src/Pages/App.tsx` - login/signup UI
- `src/Context/AuthPreventContext.tsx` - auth provider และ hook `AuthContext()`

Signup สร้างข้อมูล 2 จุด:

```txt
AuthUser/{uid}
UserData/{uid}
```

หลัง login แล้ว `user.uid` จะเป็น key หลักสำหรับข้อมูลทั้งหมดของผู้ใช้คนนั้น

## 5. Firestore Data Layer

ไฟล์เดียวที่คุย Firestore โดยตรงคือ `src/components/services.tsx`

Path ของข้อมูลแต่ละประเภท:

- Todo รายเดือน: `UserData/{uid}/Years/{YYYY}/Months/{MM}/Tasks/{id}`
- Quick todo: `UserData/{uid}/quick_todos/{id}`
- Saved colors: `UserData/{uid}/saved_colors/{id}`

Service สำคัญ:

- Todo: `getTodos`, `addTodo`, `updateTodo`, `toggleComplete`, `deleteTodo`
- Quick todo: `getQuickTodos`, `addQuickTodo`, `deleteQuickTodo`
- Saved colors: `getSavedColors`, `addSavedColor`, `deleteSavedColor`

กติกาของ getter:

- คืน array เสมอ
- ถ้า `uid` ว่างหรือเกิด error จะคืน `[]`
- ข้อมูลที่คืนให้ UI ผ่าน parser ก่อนเสมอ

## 6. Runtime Parsing และ Type Safety

`services.tsx` มี parser ก่อนปล่อยข้อมูลเข้า UI:

- `parseTodolist(raw)`: ต้องมี `id`, `name`, `datekey` และแปลง `createdAt` เป็น `Date`
- `parseQuickTodo(raw)`: ต้องมี `id`, `name`
- `parseSavedColor(raw)`: ต้องมี `id` และ `hex` ที่เป็น hex ที่ระบบรับได้

### ระบบสี

ระบบสีอยู่ที่ `src/constants/color.ts`

- ผู้ใช้เลือกสีได้ทุกค่า ผ่าน `<input type="color">`
- `PALETTE` เป็น quick preset 8 สีเท่านั้น ไม่ใช่ allowlist
- `TagColor = string` คือ hex ที่ผ่านการ validate แล้ว ไม่ใช่ union แบบเดิม
- "ไม่มีสี" แทนด้วย absence ของ field `color` (`undefined`) ไม่ใช่ค่า hex
- `LEGACY_NO_COLOR = "#ffffff"` คือ sentinel ที่ระบบเก่าเคยใช้บันทึกไว้
- `toTagColor()` จะแปลง `#ffffff` เป็น `undefined` เพื่อให้ข้อมูลเก่ายังหน้าตาเดิม
- `toTextColor()` ต่างจาก `toTagColor()` ตรงที่ยอมรับ `#ffffff` เพราะสีตัวอักษรไม่เคยใช้ sentinel
- `hasRealColor()` ใช้ sort งานที่มีสีให้อยู่ก่อนงานที่ไม่มีสี

ข้อจำกัดปัจจุบัน:

- ถ้าผู้ใช้เลือกสีขาวผ่าน native picker แล้ว reload ระบบจะอ่านเป็น "ไม่มีสี"
- saved color สีขาวจะถูกทิ้ง เพราะชนกับ legacy sentinel

### สีตัวอักษร

`Todolist` และ `QuickTodo` มี field `textColor` แบบ optional คู่กับ `color`

พฤติกรรมในแต่ละกรณี:

- **ไม่มี `textColor`**: `autoTextColor()` คำนวณจาก relative luminance (WCAG) ของพื้นหลัง
- **ผู้ใช้เลือกสีเอง**: ใช้ค่านั้นผ่าน `resolveTextColor(background, override)`
- **ผู้ใช้กด "อัตโนมัติ"**: ลบ `textColor` ออกจาก Firestore ด้วย `deleteField()`

`autoTextColor()` เทียบ contrast ระหว่างตัวอักษรเข้ม (`#1e293b`) กับตัวอักษรสว่าง (`#ffffff`) แล้วเลือกอันที่อ่านออกกว่า

ห้ามใช้ค่าความสว่างครึ่งเดียวตัดสิน เพราะจะพลาด เช่น `#4da6ff` ควรใช้ตัวอักษรสีเข้ม (contrast 5.72) ไม่ใช่สีขาว (2.56)

### Firestore กับค่า undefined

`color` และ `textColor` เป็น optional แต่ Firestore เขียน `undefined` ไม่ได้ จึงต้องรองรับ 2 จุด:

1. `initializeFirestore` ใน `src/firebase.js` ตั้ง `ignoreUndefinedProperties: true` เพื่อให้ add/set ข้าม field ที่เป็น `undefined`
2. `services.updateTodo()` แปลงค่า `undefined` เป็น `deleteField()` เพื่อให้ field เดิมถูกลบจริง โดยเฉพาะตอนผู้ใช้กด "ล้าง" สีตัวอักษร

## 7. Global Todo Cache

`src/Context/TodoProvider.tsx` เก็บ todo cache รูปแบบ:

```ts
Record<monthKey, Record<dayKey, Todolist[]>>
// monthKey = YYYY-MM
// dayKey = YYYY-MM-DD
```

Calendar และ Todolist ใช้ cache ร่วมกัน:

- ถ้า `todosCache[monthKey]` มีแล้ว จะไม่ fetch ซ้ำ
- เมื่อ add/edit/delete/toggle จะ patch cache ทันทีหลัง Firestore สำเร็จ
- ไม่มี `onSnapshot`; ถ้าข้อมูลเปลี่ยนจากเครื่องอื่นต้อง refresh หรือเปิดใหม่เพื่อเห็นข้อมูลล่าสุด

## 8. Color Flow

ไฟล์หลัก:

- `src/Context/ColorProvider.tsx`
- `src/components/ColorPicker.tsx`
- `src/utils/colorStorage.ts`
- `src/constants/color.ts`

ลำดับการทำงาน:

1. `ColorProvider` อ่าน saved colors ของ `uid` ปัจจุบันจาก localStorage เพื่อแสดงเร็ว
2. Fetch `UserData/{uid}/saved_colors` จาก Firestore
3. เมื่อ state เปลี่ยน จะเขียนกลับ localStorage ตาม `uid`
4. `ColorPicker` ใช้ `useColors()` เพื่อแสดง saved colors, save สีใหม่ และ delete สีเดิม
5. `ColorPicker` ถูกใช้ทั้ง `Calendar.tsx` และ `Todolist.tsx`

หน้าตาของ `ColorPicker`:

```txt
สีแท็ก
[8 preset dots] [วง native color] [วงขีด = ไม่มีสี] [save]

สีตัวอักษร   (แสดงเฉพาะเมื่อส่ง onTextChange)
[อัตโนมัติ] [วง native color] [ล้าง]

──────────────────────
[saved colors พร้อมปุ่มลบ]
```

พฤติกรรมสำคัญ:

- ปุ่ม "ไม่มีสี" ตั้ง `value` เป็น `undefined`
- วง native เก็บค่าไว้ใน local state เพื่อไม่ให้ถูกรีเซ็ตเป็นสีเทาทุกครั้งที่ยังไม่มีสี
- ไม่มีการ sync state ผ่าน `useEffect` เพราะ `react-hooks` lint ไม่อนุญาต
- ค่าที่แสดงจึง derive จาก `value` เป็นหลัก
- ปุ่ม "save" จะ disable เมื่อไม่มีสี หรือสีนั้นถูกบันทึกไว้แล้ว

## 9. Calendar Flow

ไฟล์หลัก: `src/Pages/Calendar.tsx`

### State สำคัญ

- `currentDate`: เดือนที่กำลังแสดง
- `quickTodos`: template งานที่ stamp ลงวันได้
- `activeQuickId`: quick todo ที่กำลังเลือกอยู่
- `pendingStamps`: งานที่เลือกไว้แต่ยังไม่บันทึกลง Firestore
- `redoHistory`: รายการสำหรับ redo หลัง undo
- `todoopen`: เปิด/ปิด quick todo drawer
- `Alert`: modal confirm add/delete

### ลำดับการทำงาน

1. Fetch quick todos เมื่อ `user.uid` พร้อม
2. Fetch todos ของเดือนปัจจุบันแบบ cache-first
3. Render calendar 42 cells คงที่ เพื่อให้ layout เดือน 5/6 แถวไม่กระโดด
4. Todo badge ในแต่ละวัน sort โดยสีจริงขึ้นก่อน
5. ถ้ามี `activeQuickId`, คลิกวันจะ toggle pending stamp แทนการ navigate
6. Undo/redo ย้าย item ระหว่าง `pendingStamps` และ `redoHistory`
7. Confirm stamp เปิด modal จากรายการ pending โดยตรง ไม่อิง quick todo ที่ active อยู่เพียงตัวเดียว
8. เมื่อ confirm แล้ว จะสร้าง todo ทุก pending item ด้วย `services.addTodo()` แล้ว patch cache ของแต่ละเดือน
9. Delete quick todo หยุด event bubbling แล้วเปิด confirm modal จึงไม่ไป toggle active tag โดยไม่ตั้งใจ
10. การกด Enter ใน quick todo input ใช้ confirm modal เดียวกับปุ่ม Add ไม่ข้ามขั้น confirm

### หมายเหตุล่าสุด

- `DAYS_WITH_COLORS` ถูกย้ายออกนอก component แล้ว
- `calendar` useMemo ใส่ dependency แค่   Selectedday,
  activeQuickId,
  currentDate,
  monthKey,
  pendingStamps,
  todosCache, เพื่อให้ pending/todo/cache update แสดงผลถูกต้องและ re-renders เท่าที่จำเป็น
- 2026-10-06: แยก helper สำหรับ reset/open confirm ใน Calendar แล้ว
- 2026-10-06: แก้ redo flow ตอน toggle pending stamp ออกจากวันเดิมไม่ให้ถูกล้างทันที

## 10. Todolist Flow

ไฟล์หลัก: `src/Pages/Todolist.tsx`

### ลำดับการทำงาน

1. อ่าน `:day` จาก route; ถ้าไม่มีใช้วันนี้ (`YYYY-MM-DD`)
2. คำนวณ `year`, `month`, `monthKey`, `activeDay`
3. อ่านรายการจาก `todosCache[monthKey]?.[activeDay] || []`
4. Sort งานโดยสีจริงขึ้นก่อน แล้วงานที่ยังไม่เสร็จขึ้นก่อนงานที่ complete
5. Fetch รายเดือนแบบ cache-first ถ้ายังไม่มี cache
6. Mode หลักคือ `null | "Add" | "Edit" | "Delete"`
7. Add/Edit/Delete เปิด `Alertconfirm` ผ่าน `openTodoConfirm()` ก่อนเขียน Firestore เพื่อลด logic ซ้ำของ modal payload
8. Add/Edit trim `name` และ `value` ก่อนบันทึก
9. Edit จะไม่ยอมบันทึกถ้า `name` ว่าง เพื่อไม่ให้เอกสารถูก parser ทิ้งตอนโหลดกลับ
10. หลังเขียนสำเร็จ จะ patch cache ด้วย functional update
11. Toggle complete เขียน Firestore แล้ว patch cache ทันที
12. ปุ่ม Add/Cancel/Exit Manage Mode ใช้ reset helper เดียวกัน เพื่อล้าง input, edit state, tag color และ text color ไม่ให้ค่าจากโหมดก่อนหน้าค้างไปโหมดถัดไป
13. สีตัวอักษรของ todo item ใช้ `resolveTextColor(todo.color, todo.textColor)` จึงรองรับทั้งสีที่ผู้ใช้เลือกเองและ auto contrast จากพื้นหลัง
14. Day slider ตั้ง `isDayTransitioning` ระหว่าง animation แล้ว reset `trackDirection`/`isDayTransitioning` หลัง `navigate()` เพื่อไม่ให้ปุ่มวันก่อนหน้า/ถัดไป disabled ค้าง

### หมายเหตุล่าสุด

- Refactor confirm helper ของ Todolist
- แก้ auto text color ให้ใช้ `resolveTextColor()` จริง
- กัน edit ชื่อว่าง
- Trim input ก่อน save
- แก้ day slider ไม่ให้ transition state ค้างหลังเปลี่ยนวัน
- 2026-10-06: refactor form reset ของ Todolist
- 2026-10-06: แก้การแสดงสีตัวอักษร auto ให้ทำงานเหมือน Calendar

## 11. Layout และ UI Supporting

- `src/Layouts/Mainlayout.tsx`: Shell หลัก มี Navbar, NetworkBanner, Suspense/Outlet
- `src/Layouts/Navbar.tsx`: Navigation/logout
- `src/Layouts/NetworkBanner.tsx`: แสดงสถานะ online/offline จาก `UseNetworkStatus`
- `src/components/Alertconfirm.tsx`: Modal confirm สำหรับ Calendar/Todolist
- `src/assets/css/Calendar.css`: Calendar และ quick todo drawer
- `src/assets/css/Todolist.module.css`: CSS Module ของหน้า Todolist
- `src/assets/css/ColorPicker.css`: Style ของ ColorPicker

## 12. จุดที่ต้องระวังเวลาแก้ต่อ

- ถ้าเปลี่ยน schema Firestore ให้แก้ parser ใน `services.tsx` ด้วยเสมอ
- `PALETTE` เป็น quick preset แล้ว ไม่ใช่ allowlist ผู้ใช้เลือกสีนอกชุดได้ ถ้าอยากได้สีที่ใช้บ่อยเพิ่มให้เพิ่มใน `PALETTE`
- "ไม่มีสี" คือ `undefined` ห้ามใช้ hex เป็น sentinel เพิ่ม เพราะจะไปชนกับสีที่ผู้ใช้เลือกเอง
- ถ้าเพิ่ม field ที่เป็น optional ลง Firestore ต้องตรวจว่า path ที่เขียนรองรับ `undefined` แล้วหรือยัง (`ignoreUndefinedProperties` + `deleteField()`)
- ถ้าเปลี่ยน cache shape ต้องแก้ทั้ง Calendar, Todolist และ TodoProvider พร้อมกัน
- ถ้าทำ realtime sync ควรออกแบบการ merge cache ใหม่ เพราะปัจจุบันเป็น one-shot fetch + local patch