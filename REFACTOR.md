# REFACTOR - จุดที่ควรทำต่อ

อัปเดตล่าสุด: 2026-10-05
สถานะล่าสุด: `npm run lint` ผ่าน, `npm run build` ผ่าน

## ทำแล้วในรอบล่าสุด

- เปลี่ยนระบบสีเป็น "ผู้ใช้เลือกสีได้ทุกค่า" — `PALETTE` เหลือเป็น quick preset และเพิ่ม `<input type="color">` ของ native
- "ไม่มีสี" เปลี่ยนจาก `NO_COLOR = "#ffffff"` เป็น absence ของ field `color` (`undefined`) เพื่อไม่ให้ชนกับสีขาวที่ผู้ใช้เลือกเอง
- อ่านข้อมูลเก่าที่เป็น `#ffffff` แล้วแปลงเป็น `undefined` ผ่าน `toTagColor()` เพื่อให้หน้าตาเดิม
- เพิ่ม field `textColor` ใน `Todolist` และ `QuickTodo` พร้อมปุ่ม "อัตโนมัติ" ที่คำนวณสีตัวอักษรจาก relative luminance ของพื้นหลัง
- ตั้ง `ignoreUndefinedProperties: true` ใน `initializeFirestore` และให้ `services.updateTodo()` แปลง `undefined` เป็น `deleteField()`
- ตัด `SaveableColor`, `isSaveableColor`, `PALETTE_MAP` และ union type ของ `TagColor` ออก
- แก้ `Alertconfirm` ให้แสดง diff ของ `textColor` และนับ "ล้างสี" เป็นการเปลี่ยนแปลง
- แก้ `Calendar.tsx` useMemo dependency ให้ครบ เพื่อให้ todo cache และ pending stamp render ถูกต้อง
- ย้าย `DAYS_WITH_COLORS` ออกนอก component เพื่อลด dependency ที่เปลี่ยนทุก render
- แก้ `Todolist.tsx` fetch effect dependency ให้ lint ผ่าน
- กัน event bubble ตอนกดลบ quick todo เพื่อไม่ให้ปุ่มลบไป toggle tag ที่ครอบอยู่
- อัปเดต `Flow.md` ให้ตรงกับโค้ดปัจจุบัน

## Priority 1 - ควรทำก่อน

| จุด | ไฟล์ | เหตุผล | แนวทาง |
|---|---|---|---|
| แยก logic fetch/cache todo รายเดือน | `Calendar.tsx`, `Todolist.tsx`, `TodoProvider.tsx` | ตอนนี้ทั้ง Calendar และ Todolist มี pattern fetch เดือน + group by day คล้ายกัน ถ้าแก้ schema/cache มีโอกาสลืมแก้อีกหน้า | สร้าง hook เช่น `useTodosByMonth(monthKey, year, month)` และ helper `groupTodosByDay()` |
| แยก helper patch cache | `Calendar.tsx`, `Todolist.tsx` | มีการ update cache แบบ manual หลายที่ เช่น add/edit/delete/toggle/stamp | เพิ่ม helper ใน `TodoProvider` หรือ `src/utils/todoCache.ts` เช่น `addTodoToCache`, `replaceTodoInCache`, `removeTodoFromCache` |
| ปรับ type ของ Alertconfirm | `Alertconfirm.tsx`, `Calendar.tsx`, `Todolist.tsx` | ตอนนี้ props เป็น optional หลายตัวและแยกพฤติกรรมด้วย `Page` ทำให้พลาดง่าย | ใช้ discriminated union: `{ page: "Calendar", ... } | { page: "Todolist", ... }` |
| ป้องกัน duplicate pending stamp ให้แม่นขึ้น | `Calendar.tsx` | ตอนนี้ toggle pending stamp เช็ค `dateKey + name` ถ้ามี quick todo ชื่อซ้ำอาจชนกัน | ใช้ `quickTodoId` ใน `PendingStamp` แล้วเช็ค `dateKey + quickTodoId` |

## Priority 2 - ควรทำหลังจาก flow หลักนิ่ง

| จุด | ไฟล์ | เหตุผล | แนวทาง |
|---|---|---|---|
| Rename naming typo | `Calendar.tsx` | `firestDayOfMonth`, `emptyfirstDays`, `emtyLastDays`, `ceartstarte` อ่านยากและค้นหายาก | เปลี่ยนเป็น `firstDayOfMonth`, `emptyFirstDays`, `emptyLastDays`, `resetQuickTodoDraft` |
| Rename auth/context ให้ตรงหน้าที่ | `AuthPreventContext.tsx` | ชื่อดูเหมือน guard แต่จริงคือ auth provider | เปลี่ยนเป็น `AuthProvider.tsx` และ hook `useAuth()` แบบค่อยเป็นค่อยไป |
| Rename network hook | `UseNetworkStatus.tsx` | custom hook ควรเป็น camelCase และอาจอยู่ใน `hooks/` | ย้ายเป็น `src/hooks/useNetworkStatus.ts` แล้ว update import |
| ลด native `alert()` | หลายไฟล์ | alert block UI และ UX ไม่สม่ำเสมอ | เพิ่ม toast/snackbar component กลาง หรือ notification context |
| ทำความสะอาด comment/dead code | `main.tsx`, `Calendar.tsx`, `Todolist.tsx`, `services.tsx` | มี comment เก่า/debug/commented code ทำให้อ่าน flow ยาก | ลบ comment ที่ไม่อธิบายพฤติกรรมปัจจุบัน หรือแปลงเป็น TODO ที่ actionable |

## Priority 3 - งานปรับสถาปัตยกรรมระยะกลาง

| จุด | เหตุผล | แนวทาง |
|---|---|---|
| Realtime sync | ตอนนี้เป็น one-shot fetch ถ้าแก้จากอีกเครื่องต้อง refresh | ใช้ `onSnapshot` รายเดือน และกำหนด merge strategy กับ local optimistic update |
| Reducer สำหรับ todo cache | cache update หลายแบบจะซับซ้อนขึ้นเมื่อเพิ่ม realtime/error rollback | ใช้ `useReducer` ใน `TodoProvider` พร้อม action เช่น `hydrateMonth`, `addTodo`, `updateTodo`, `deleteTodo` |
| Error handling กลาง | service catch error แล้วบางจุดแค่ log ทำให้ UI ไม่รู้สถานะ | ส่ง error state กลับ hook/page หรือใช้ notification context |
| แยก domain types | ตอนนี้ type อยู่ใน `services.tsx` ซึ่งผูก data layer กับ UI | ย้าย `Todolist`, `QuickTodo`, `SavedColor` ไป `src/types/todo.ts` หรือ `src/types/domain.ts` |
| Test coverage | ตอนนี้ยังไม่มี test รองรับ parser/cache logic | เริ่มจาก unit test parser และ cache helper หลังแยก helper แล้ว |

## ไม่ต้องทำแล้ว / ปิดรายการเก่า

- Extract `ColorPicker` เสร็จแล้ว (`src/components/ColorPicker.tsx`)
- Shared color constants เสร็จแล้ว (`src/constants/color.ts`)
- Saved colors flow เสร็จแล้ว (`ColorProvider`, `colorStorage`, Firestore `saved_colors`)
- เลือกสีอิสระ + สีตัวอักษร เสร็จแล้ว (`<input type="color">`, `textColor`, `autoTextColor`)
- Hook dependency warning ของ `Calendar.tsx` และ `Todolist.tsx` แก้แล้ว
- `Navbar.tsx` มีอยู่แล้ว ไม่ต้องแก้จาก `Navber.tsx` เพิ่ม ยกเว้นต้องการล้าง reference เก่าใน git/history
