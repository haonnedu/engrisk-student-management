# Multilanguage Implementation - Parent Portal

## Tổng Quan

Parent Portal hiện hỗ trợ đa ngôn ngữ (i18n) với 2 ngôn ngữ:
- 🇻🇳 **Tiếng Việt** (mặc định)
- 🇬🇧 **English**

## Cấu Trúc

### 1. Translation Files

```
fe/messages/
├── vi.json   # Tiếng Việt
└── en.json   # English
```

### 2. Core Components

```
fe/src/
├── contexts/
│   └── LocaleContext.tsx       # Locale state management
├── hooks/
│   └── useTranslations.ts      # Custom translation hook
├── components/layout/
│   └── LanguageSwitcher.tsx    # Language switcher UI
└── i18n.ts                     # i18n configuration
```

## Cách Sử Dụng

### 1. Thêm Translations Mới

Chỉnh sửa `fe/messages/vi.json` và `fe/messages/en.json`:

```json
{
  "parent": {
    "newFeature": {
      "title": "Tiêu đề mới",
      "description": "Mô tả mới"
    }
  }
}
```

### 2. Sử Dụng Trong Component

```typescript
import { useTranslations } from "@/hooks/useTranslations";

export default function MyComponent() {
  const { t } = useTranslations('parent.newFeature');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 3. Translations Với Parameters

```typescript
// Trong translation file:
{
  "message": "Bạn có {count} tin nhắn"
}

// Trong component:
const message = t('message', { count: 5 });
// Kết quả: "Bạn có 5 tin nhắn"
```

## Features

### 1. Language Switcher

- **Vị trí**: Sidebar footer (Parent Portal)
- **Icon**: 🌐 Languages
- **Hiển thị**: 
  - Desktop: Flag + Language name (🇻🇳 Tiếng Việt)
  - Mobile: Flag only (🇻🇳)

### 2. Persistent Language Selection

Ngôn ngữ được lưu trong `localStorage` và tự động load khi user quay lại:

```typescript
// Auto-save
localStorage.setItem('locale', 'vi');

// Auto-load
const savedLocale = localStorage.getItem('locale');
```

### 3. Default Language

Default language: **Tiếng Việt (vi)**

Được set trong `LocaleContext.tsx`:
```typescript
const [locale, setLocaleState] = useState<Locale>('vi');
```

## Translation Coverage

### Parent Portal - Grades Page

| Key | Tiếng Việt | English |
|-----|-----------|---------|
| title | Bảng Điểm Của Tôi | My Grades |
| description | Xem kết quả học tập và điểm số | View your academic performance |
| course | Khóa Học | Course |
| gradeType | Loại Điểm | Grade Type |
| score | Điểm Số | Score |
| weight | Trọng Số | Weight |
| comments | Nhận Xét | Comments |
| date | Ngày | Date |

### Parent Portal - Profile Page

| Key | Tiếng Việt | English |
|-----|-----------|---------|
| title | Hồ Sơ Của Tôi | My Profile |
| editProfile | Chỉnh Sửa Hồ Sơ | Edit Profile |
| firstName | Họ | First Name |
| lastName | Tên | Last Name |
| phoneNumber | Số Điện Thoại | Phone Number |
| address | Địa Chỉ | Address |
| saveChanges | Lưu Thay Đổi | Save Changes |
| cancel | Hủy | Cancel |

### Navigation

| Key | Tiếng Việt | English |
|-----|-----------|---------|
| myGrades | Bảng Điểm | My Grades |
| myProfile | Hồ Sơ | My Profile |

## API

### useTranslations Hook

```typescript
const { t, locale } = useTranslations(namespace?);

// t: Translation function
// locale: Current locale ('vi' | 'en')
```

**Parameters:**
- `namespace` (optional): Namespace path (e.g., 'parent.grades')

**Returns:**
- `t(key, params?)`: Translation function
  - `key`: Translation key
  - `params`: Optional parameters for interpolation

**Example:**
```typescript
const { t } = useTranslations('parent.grades');
const title = t('title');                           // "Bảng Điểm Của Tôi"
const count = t('gradesRecorded', { count: 5 });   // "5 điểm đã ghi nhận"
```

### useLocale Hook

```typescript
const { locale, setLocale } = useLocale();

// Get current locale
console.log(locale); // 'vi' or 'en'

// Change locale
setLocale('en');
```

## Thêm Ngôn Ngữ Mới

### 1. Tạo Translation File

```bash
fe/messages/fr.json  # French
```

### 2. Update Types

```typescript
// fe/src/contexts/LocaleContext.tsx
type Locale = 'vi' | 'en' | 'fr';

// fe/src/i18n.ts
export const locales = ['vi', 'en', 'fr'] as const;
```

### 3. Update LanguageSwitcher

```typescript
// fe/src/components/layout/LanguageSwitcher.tsx
const languages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
] as const;
```

### 4. Update Hook

```typescript
// fe/src/hooks/useTranslations.ts
import frMessages from '../../messages/fr.json';

const messages = {
  vi: viMessages,
  en: enMessages,
  fr: frMessages,
};
```

## Best Practices

### 1. Organization

Tổ chức translations theo module/feature:
```json
{
  "parent": {
    "grades": { ... },
    "profile": { ... },
    "common": { ... }
  }
}
```

### 2. Naming Convention

- **Keys**: camelCase
- **Namespaces**: dot notation (parent.grades.title)
- **Parameters**: {paramName}

### 3. Pluralization

Xử lý số nhiều:
```json
{
  "items": "{count} mục",
  "itemsPlural": "{count} mục"
}
```

### 4. Fallback

Nếu translation không tồn tại, system sẽ:
1. Log warning trong console
2. Trả về translation key

## Troubleshooting

### Translation không hiển thị

1. **Kiểm tra key có đúng không:**
   ```typescript
   // ❌ Wrong
   t('parent.grades.title')
   
   // ✅ Correct (with namespace)
   const { t } = useTranslations('parent.grades');
   t('title')
   ```

2. **Kiểm tra file JSON:**
   - Đảm bảo valid JSON
   - Keys có đúng spelling không
   - Có nested đúng structure không

3. **Clear cache:**
   ```bash
   # Clear browser cache
   # Or hard reload (Ctrl + Shift + R)
   ```

### Locale không persist

Kiểm tra localStorage:
```javascript
// In browser console
localStorage.getItem('locale');  // Should return 'vi' or 'en'
localStorage.setItem('locale', 'vi');  // Manual set
```

## Performance

### Bundle Size

Chỉ translations cần thiết được load:
- Grades page: ~2KB (compressed)
- Profile page: ~3KB (compressed)
- Total: ~5KB cho toàn bộ parent portal

### Loading Strategy

- Translations được load tại client-side
- Không blocking initial page load
- Instant language switching (no reload required)

## Future Enhancements

Có thể mở rộng:
- [ ] Server-side rendering với next-intl
- [ ] Dynamic locale detection (from browser)
- [ ] RTL language support
- [ ] Locale-specific date/number formatting
- [ ] Translation management UI
- [ ] Auto-translation API integration

## Support

Ngôn ngữ hiện tại:
- ✅ Tiếng Việt (vi)
- ✅ English (en)

Có thể thêm:
- 🔜 Français (fr)
- 🔜 日本語 (ja)
- 🔜 한국어 (ko)
- 🔜 中文 (zh)

