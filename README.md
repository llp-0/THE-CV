# مساعد السير الذاتية | Arabic CV & Cover Letter Assistant

موقع يساعد الباحثين عن عمل على كتابة **سيرة ذاتية ورسالة تقديم** احترافية بالعربية أو الإنجليزية بمساعدة الذكاء الاصطناعي.

A web app that helps job seekers write a professional CV and cover letter in Arabic or English using AI.

**Live demo / الموقع:** _ضع رابط الموقع هنا_

## المزايا | Features
- واجهة عربية (RTL) تعمل جيداً على الجوال
- توليد سيرة ذاتية ورسالة تقديم بالذكاء الاصطناعي (Gemini)
- لصق إعلان الوظيفة لتخصيص المحتوى
- 3 أشكال للسيرة: كلاسيكي، عصري، بسيط
- صورة شخصية اختيارية (تبقى في المتصفح ولا تُرسل لأي خادم)
- تحميل PDF بنص حقيقي قابل للتحديد (أو الطباعة كبديل)

## التقنيات | Tech
Node.js, Express, Gemini API, Puppeteer (PDF), HTML/CSS/JavaScript (vanilla)

## التشغيل محلياً | Run locally
```bash
npm install
cp .env.example .env    # ثم ضع مفتاح GEMINI_API_KEY (مجاني من aistudio.google.com/apikey)
npm start               # http://localhost:3000
```

## النشر | Deploy
انشره مجاناً على [Render](https://render.com): اربط المستودع، أو استخدم ملف `render.yaml`، وأضف المتغير `GEMINI_API_KEY`.

## الخصوصية | Privacy
النص الذي يكتبه المستخدم يُرسل إلى Gemini API لإنشاء المستند. لا يُخزَّن شيء على الخادم.

## مخططات UML
أضف هنا صور مخططات حالات الاستخدام والفئات والتتابع.
