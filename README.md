<div dir="rtl">

# کتاب‌خوان فارسی

وب‌اپ تک‌صفحه‌ای فارسی و راست‌به‌چپ برای پیدا کردن، معرفی و خواندن نمونهٔ کتاب، با الهام از چیدمان سایت طاقچه. تمرین اول درس برنامه‌سازی وب، نیم‌سال پاییز ۱۴۰۵.

فقط با HTML، CSS و JavaScript خام نوشته شده است. هیچ کتابخانه، فریم‌ورک، CDN یا درخواست شبکه‌ای ندارد.

## اجرا

- **مسیر شروع:** `index.html` در ریشهٔ پروژه.
- **روش اجرا:** روی `index.html` دابل‌کلیک کنید تا در مرورگر باز شود. نصب، سرور و اینترنت لازم نیست و صفحه از روی `file://` کار می‌کند.
- جاوااسکریپت مرورگر باید روشن باشد. اگر خاموش باشد، صفحه پیام فعال کردن آن را نشان می‌دهد.

## مرورگر آزمایش‌شده

- **Google Chrome 157** روی Windows 10، در عرض‌های ۳۶۰، ۷۶۸ و ۱۴۴۰ پیکسل، در هر دو تم روشن و تیره.

## پاک کردن وضعیت ذخیره‌شده

همهٔ وضعیت برنامه در `localStorage` همین مرورگر ذخیره می‌شود:

| کلید | محتوا |
|---|---|
| `taaghche-hw1:favorites` | شناسهٔ کتاب‌های مورد علاقه |
| `taaghche-hw1:owned` | شناسهٔ کتاب‌های دریافت‌شده |
| `taaghche-hw1:user` | نام و موبایل کاربر نمایشی، یا `null` |
| `taaghche-hw1:theme` | `light` یا `dark` |
| `taaghche-hw1:reader` | اندازهٔ قلم نمونه‌خوان: `small`، `medium` یا `large` |

**روش ۱، از Console:** با F12 ابزار توسعه را باز کنید و در زبانهٔ Console این را اجرا کنید:

<div dir="ltr">

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith("taaghche-hw1:"))
  .forEach((key) => localStorage.removeItem(key));
location.reload();
```

</div>

این دستور فقط کلیدهای همین برنامه را پاک می‌کند. از `localStorage.clear()` استفاده نکنید. در Chrome همهٔ فایل‌هایی که با `file://` باز می‌شوند یک `localStorage` مشترک دارند و `clear()` دادهٔ صفحه‌های محلی دیگر را هم پاک می‌کند.

**روش ۲، از ابزار توسعه:** F12، بعد زبانهٔ Application، بعد Local Storage. کلیدهایی را که با `taaghche-hw1:` شروع می‌شوند حذف کنید و صفحه را دوباره بار کنید.

اگر دادهٔ ذخیره‌شده خراب یا نامعتبر باشد، برنامه از کار نمی‌افتد و برای آن بخش مقدار پیش‌فرض را می‌گذارد.

## ساختار پوشه‌ها

<div dir="ltr">

```text
HW1/
├── index.html            the only page: header, <main id="app">, footer, scripts
├── css/
│   └── style.css         design tokens (light + dark), all styles
├── js/
│   ├── theme-init.js     loaded in <head>: applies the saved theme before first paint
│   ├── books.js          data only: CATEGORIES and BOOKS (12 books)
│   ├── utils.js          DOM helper, icons, Persian digits, price formatting
│   ├── store.js          state, localStorage, validation, book queries
│   ├── catalog.js        search, filters and sorting (pure functions)
│   ├── components.js     header, footer, book card, dialog, toast, theme toggle
│   ├── pages/
│   │   ├── misc.js       not-found page
│   │   ├── home.js       #/            banner, categories, three book rows
│   │   ├── list.js       #/books       list with search, filters, sort
│   │   ├── book.js       #/book/<id>   detail page, simulated purchase
│   │   ├── login.js      #/login       demo login (name + mobile)
│   │   ├── library.js    #/library     owned books and favorites
│   │   └── reader.js     #/read/<id>   sample reader
│   ├── router.js         hash router: renders the page into <main id="app">
│   └── app.js            entry point: wires everything together
├── assets/
│   ├── covers/           12 SVG covers made for this project
│   └── fonts/            Vazirmatn Regular + Bold (woff2) and its license OFL.txt
├── docs/
│   ├── hw1.pdf           assignment
│   └── reference/        Taaghche reference screenshots (comparison only)
└── README.md
```

</div>

فایل‌های JS با `<script src>` معمولی و به همان ترتیب بالا بار می‌شوند، نه به‌شکل ماژول، چون ماژول‌ها روی `file://` بار نمی‌شوند. هر فایل داخل یک IIFE است و فقط یک شیء سراسری به نام `App` می‌سازد. `books.js` هم دو آرایهٔ `CATEGORIES` و `BOOKS` را تعریف می‌کند.

## مسیرها

| مسیر | صفحه |
|---|---|
| `#/` | صفحهٔ اصلی |
| `#/books?q=…&category=…&free=1&sort=price-asc\|price-desc\|rating` | فهرست کتاب‌ها. همهٔ فیلترها در آدرس می‌مانند. |
| `#/book/<id>` | جزییات کتاب |
| `#/read/<id>` | نمونه‌خوان |
| `#/library` | کتابخانه: دریافت‌شده‌ها و علاقه‌مندی‌ها |
| `#/login` | ورود نمایشی |

## نکته‌ها

- **ورود و خرید فقط شبیه‌سازی‌اند.** رمز یا اطلاعات پرداخت گرفته نمی‌شود و چیزی به جایی فرستاده نمی‌شود.
- **چه چیزی ورود لازم دارد:** طبق گام شش صورت تمرین، فقط دریافت کتاب رایگان و خرید کتاب پولی ورود لازم دارند. علاقه‌مندی بدون ورود هم کار می‌کند. «خروج» فقط کاربر نمایشی را پاک می‌کند و کتاب‌های دریافت‌شده و علاقه‌مندی‌ها در همین مرورگر می‌مانند. ثبت‌نام جدا نداریم: اولین ورود با نام و موبایل همان ثبت‌نام است.
- **تخفیف:** قیمت نهایی همیشه با `getFinalPrice` حساب می‌شود و به نزدیک‌ترین ۱۰۰ تومان گرد می‌شود.
- **کتاب‌های بی‌نمونه:** فقط سه کتاب نمونهٔ متن دارند، که حداقل خواستهٔ تمرین است. بقیه عمداً بدون نمونه‌اند تا رفتار «برای این کتاب نمونه‌ای موجود نیست» هم دیده شود.

## منابع

- **متن‌ها:** همهٔ عنوان‌ها، نام نویسنده‌ها، توضیح‌ها، نمونه‌های متن و متن بنرها ساختگی‌اند و برای همین تمرین، با کمک دستیار هوش مصنوعی، نوشته شده‌اند. هیچ‌کدام از کتاب واقعی برداشته نشده است.
- **جلدها:** فایل‌های SVG در `assets/covers/` برای همین پروژه ساخته شده‌اند.
- **فونت:** [Vazirmatn](https://github.com/rastikerdar/vazirmatn) نسخهٔ 33.0.3 از صابر راستی‌کردار، با مجوز SIL Open Font License 1.1. فایل‌ها و متن مجوز (`OFL.txt`) در `assets/fonts/` هستند و از همان‌جا بار می‌شوند، نه از اینترنت. جلدهای SVG قلم Tahoma دارند، چون تصویری که با `<img>` نمایش داده شود به فونت‌های صفحه دسترسی ندارد.
- **آیکون‌ها:** مسیرهای SVG ساده‌ای که داخل `js/utils.js` تعریف شده‌اند.
- **تصاویر مرجع:** سه تصویر `docs/reference/` از سایت طاقچه، فقط برای مقایسهٔ چیدمان. هیچ تصویر، لوگو یا متنی از طاقچه در خود برنامه استفاده نشده است.

</div>
