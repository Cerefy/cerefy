# SOPRANOVA — سجل الدليل البصري

## طريقة التحقق

تم فتح المسارات المحمية في بيئة preview بجلسة تطوير مصادق عليها، مع استخدام رابط seed داخلي مؤقت خلال التدقيق فقط. الرابط أزيل من خادم التسليم بعد اكتمال التحقق، ولم يدخل إلى build production. كما التُقطت لقطات preview للمسارات العامة ومداخل التطبيق الثمانية في جلسة التحقق الأخيرة؛ صفحات `/app/*` في جلسة preview المعزولة تعرض login عند غياب cookie الخاص بها، لذلك يعتمد الدليل المحمي النهائي على جلسة المتصفح المصادق عليها الموثقة في الجدول التالي.

## المسارات المحمية

| المسار | الإطار المرئي الذي تم التحقق منه | مصدر البيانات المرئي | النتيجة |
|---|---|---|---|
| `/app/dashboard` | Command Center مع KPI وبنية sidebar | Dashboard tRPC وworkspace الحالي | مطابق للإطار المصدّر |
| `/app/intelligence` | Conversation sidebar، سؤال، ومصادر | Conversations وIntelligence tRPC | مطابق؛ السؤال الحقيقي محفوظ ويُرسل للـ provider المكوّن |
| `/app/agents` | AI Agents، filters، cards، detail panel | Agents tRPC وqueue | مطابق بعد تصحيح تسمية AI Agents |
| `/app/data` | Enterprise Data، KPI، sources/documents/memory tabs | Data Sources وDocuments tRPC | مطابق؛ counts والصفوف حقيقية |
| `/app/analytics` | Business Performance، period filters، KPI، segments | Analytics tRPC | مطابق؛ aggregations محسوبة server-side |
| `/app/automations` | Workflows list واللوحة الجانبية | Workflows tRPC والـ queue | مطابق؛ empty state حقيقي بلا workflow مختلق |
| `/app/decisions` | قائمة القرارات وevidence panel | Decision records وauthorization | مطابق؛ حالات القرار والأدلة محمّلة من backend |
| `/app/memory` | Enterprise Memory، البحث، filters، upload | Documents/Memory tRPC | مطابق؛ indexed/processing states حقيقية |
| `/app/activity` | Activity Center grouped timeline | Audit/activity records | مطابق؛ events موزعة على الفئات المطلوبة |
| `/app/workspace` | Workspace Management، counts، member table | Membership/workspace tRPC | مطابق؛ Development Owner هو العضو الفعلي الوحيد في seed |
| `/app/settings` | Account Settings tabs وProfile | Preferences/profile tRPC | مطابق؛ Security أصبحت لوحة حقيقية لا placeholder |
| `/app/settings` → Security | Authentication status، sign out، audit log | Session architecture وaudit.list | مطابق للبنية؛ sign-out وdownload مربوطان بعمليات فعلية |

## ملاحظات قابلية التكرار

التحقق المرئي لا يثبت وحده صلاحية provider خارجي غير مكوّن. لذلك تم دعم الدليل باختبارات Vitest لمسارات API وworker، وبفحوصات TypeScript وbuild. يجب على بيئة الإنتاج إعادة اختبار Google OAuth بعد تسجيل `OAUTH_GOOGLE_CLIENT_ID` و`OAUTH_GOOGLE_CLIENT_SECRET` وcallback URL الموافق، لأن sandbox لا يملك بيانات اعتماد المؤسسة.
