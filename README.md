# GPX Viewer

Ứng dụng web để đọc và phân tích file GPX các giải chạy trail với các tính năng:

- Hiển thị track lên bản đồ (OpenStreetMap + Leaflet)
- Biểu đồ độ cao tương tác
- Đồng bộ hover giữa bản đồ và biểu đồ
- Phân tích chi tiết các đoạn dốc (lên/xuống)
- Tính khoảng cách giữa các waypoints
- Quản lý nhiều giải đua với các cự ly khác nhau

## Cài đặt

```bash
npm install
```

## Chạy development server

```bash
npm run dev
```

Mở browser tại http://localhost:5173

## Build production

```bash
npm run build
```

## Thêm file GPX

### Cấu trúc thư mục

```
public/gpx/
├── vietnam-mountain-marathon/
│   ├── 100k.gpx
│   ├── 70k.gpx
│   ├── 42k.gpx
│   ├── 21k.gpx
│   └── 10k.gpx
├── vietnam-jungle-marathon/
│   ├── 70k.gpx
│   ├── 42k.gpx
│   ├── 25k.gpx
│   └── 10k.gpx
└── dalat-ultra-trail/
    ├── 70k.gpx
    ├── 42k.gpx
    └── 21k.gpx
```

### Thêm giải đua mới

1. Tạo folder mới trong `public/gpx/`
2. Copy các file GPX vào folder (đặt tên theo cự ly: `10k.gpx`, `21k.gpx`, v.v.)
3. Chỉnh sửa file `src/data/races.ts` để thêm cấu hình:

```typescript
{
  id: 'ten-giai-dau',
  name: 'Tên Giải Đấu',
  folder: 'ten-folder',
  distances: [
    { id: '42k', name: '42km', fileName: '42k.gpx' },
    { id: '21k', name: '21km', fileName: '21k.gpx' },
  ],
},
```

## Sử dụng

1. Chọn giải đua từ sidebar bên trái
2. Click vào cự ly muốn xem
3. Xem track được hiển thị trên bản đồ với màu sắc theo độ dốc
4. Di chuột trên biểu đồ độ cao để xem vị trí tương ứng trên bản đồ
5. Chuyển tab để xem phân tích chi tiết:
   - **Tổng quan**: Thống kê tổng quát về track
   - **Độ dốc**: Danh sách các đoạn dốc đáng kể
   - **Waypoints**: Khoảng cách giữa các waypoints

## Màu sắc độ dốc

- 🟢 Xanh lá: < 3% (dễ)
- 🟡 Vàng: 3-6% (trung bình)
- 🟠 Cam: 6-10% (khó)
- 🔴 Đỏ: 10-15% (rất khó)
- 🟤 Nâu đậm: > 15% (cực khó)

## Tech Stack

- React 18 + TypeScript
- Vite
- Leaflet + react-leaflet
- Recharts
- Tailwind CSS
