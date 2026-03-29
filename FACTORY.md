# FACTORY DATABASE: MC-DASHBOARD ENTERPRISE

## โครงสร้างโรงงาน (Factory Structure)
โรงงาน mcDashboard แบ่งออกเป็น 3 หน่วยงานหลัก เพื่อประสิทธิภาพในการติดตามและบริหารจัดการ ดังนี้:

### 1. แผนกผลิต (Production Department - ZONE A)
เน้นการทำงานต่อเนื่องและปริมาณผลผลิต
- **M01: Hydraulic Press 01** - เครื่องปั๊มไฮดรอลิกหลัก (Category: PROCESS)
- **M02: Hydraulic Press 02** - เครื่องปั๊มไฮดรอลิกเสริม (Category: PROCESS)
- **M03: Conveyor Line A1** - สายพานลำเลียงหลักของโซน A (Category: PROCESS)

### 2. แผนกตัดและกลึง (Machining Department - ZONE B)
เน้นความแม่นยำและสถานะของใบมีด/หัวเจาะ
- **M04: CNC Milling 01** - เครื่องกัดความเร็วสูง (Category: PROCESS)
- **M05: CNC Milling 02** - เครื่องกัดชิ้นงานขนาดใหญ่ (Category: PROCESS)
- **M06: Lathe Machine 01** - เครื่องกลึงอัตโนมัติ (Category: PROCESS)

### 3. แผนกตรวจสอบและบรรจุ (QC & Packaging - ZONE C)
เน้นความเร็วในการตรวจเช็คและบรรจุลงกล่อง
- **M07: Auto Sorter 01** - เครื่องคัดแยกสินค้าอัตโนมัติ (Category: PACKING)
- **M08: Packing Robot 01** - แขนกลบรรจุสินค้า (Category: PACKING)
- **M09: Labeling Unit 01** - เครื่องติดฉลากความร้อน (Category: PACKING)

## รายละเอียดทางเทคนิค (Machine Specs)
- **Current (A):** วัดกระแสไฟฟ้าที่มอเตอร์ใช้งาน (ปกติ 10-20A)
- **Vibration (mm/s):** วัดการสั่นสะเทือน (ปกติ < 2.5 mm/s)
- **Amp Load (%):** ภาระงานเทียบกับค่าสูงสุดของเครื่องจักร (ปกติ 70-90%)

## เกณฑ์การตัดสินสถานะ (Status Logic)
- **RUNNING:** เครื่องจักรทำงานปกติ ค่าอยู่ในเกณฑ์มาตรฐาน
- **IDLE:** เครื่องจักรเปิดอยู่แต่ไม่มีงาน (โหลด < 20%)
- **STOP/DOWN:** เครื่องจักรปิดการทำงาน หรือเกิดข้อผิดพลาด (ค่าเป็น 0)
