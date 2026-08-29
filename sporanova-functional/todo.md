# Project TODO

- [x] Estrarre e analizzare il frontend esportato, censendo route, pagine, componenti, interazioni e dati simulati.
- [x] Produrre la mappa verificabile schermata → azione → regola → dati → API → permessi → stato UI, incluse le assunzioni.
- [x] Verificare schermata per schermata l’allineamento finale al frontend allegato con una sessione autenticata e documentare le eventuali differenze UI residue.
- [x] Definire schema dati normalizzato, multi-tenant e migrabile per organizzazioni, workspace, membership, agenti, conversazioni, sorgenti dati, documenti, automazioni, notifiche e audit log.
- [x] Verificare l’isolamento tenant con middleware server-side e test di accesso cross-workspace, dopo la migrazione versionata già applicata.
- [x] Implementare RBAC server-side estendibile per Owner, Admin, Member e Viewer nel flusso di autenticazione esistente.
- [x] Implementare API tRPC modulari con validazione, autorizzazione, risposte ed errori coerenti, logging strutturato e health check.
- [x] Implementare dashboard e analytics server-side con intervalli, filtri, aggregazione, ordinamento e paginazione.
- [x] Implementare agenti, esecuzioni tracciabili, conversazioni persistenti e ricerca della cronologia nel workspace autorizzato.
- [x] Completare un connettore data source HTTP reale, gestione cifrata delle credenziali e pipeline di sincronizzazione asincrona prima di attivare sorgenti esterne.
- [x] Completare data source, documenti e file con metadati, stato, controllo accessi, validazione, cancellazione sicura e connettore HTTP sincronizzato.
- [x] Implementare automazioni, notifiche persistenti e audit log per le azioni sensibili evidenziate dal frontend.
- [x] Completare la sostituzione dei controlli non operativi delle integrazioni esterne con flussi configurati o nasconderli fino alla configurazione.
- [x] Eseguire la verifica visiva autenticata delle principali schermate app e rifinire eventuali differenze dall’interfaccia allegata.
- [x] Estendere i test Vitest ai flussi applicativi agenti, intelligence, workflow, notifiche, analytics e frontend/backend oltre alla copertura già presente di authz, salute e upload.
- [x] Preparare seed di sviluppo, configurazione ambienti, documentazione API, architettura, migrazioni e istruzioni di distribuzione.
- [x] Verificare i percorsi autenticati principali con la sessione di sviluppo e testare la readiness delle route OAuth indipendenti; la prova end-to-end del provider OAuth richiede le credenziali dell’ambiente di destinazione.
- [x] Eseguire un audit completo delle dipendenze Manus nel codice, nelle dipendenze, negli script e nella configurazione runtime.
- [x] Sostituire il runtime Manus con un backend SOPRANOVA portabile e configurato esclusivamente tramite variabili d’ambiente proprietarie.
- [x] Sostituire l’autenticazione OAuth Manus con un’architettura indipendente per password, sessioni, OAuth e RBAC.
- [x] Sostituire database, storage, AI e notifiche Manus con adapter indipendenti e provider configurabili.
- [x] Estendere la coda e il worker autonomi, già operativi per le esecuzioni agente, a elaborazione documenti, sincronizzazioni data source e workflow eseguibili; le pianificazioni provider-specifiche restano deliberate come integrazione esterna opzionale e sono documentate.
- [x] Predisporre un file di configurazione template completo, senza credenziali, e un percorso di configurazione locale/produttivo portabile.
- [x] Isolare o eliminare framework, endpoint, environment variable e pacchetti Manus dalla build di produzione.
- [x] Preparare sviluppo locale, backup database, migrazioni, seed e istruzioni di deploy indipendenti dal provider.
- [x] Eseguire il test di portabilità e l’audit finale per attestare l’assenza di dipendenze runtime da Manus.

- [x] مطابقة صفحات الموقع العامة وصفحات الدخول حرفيًا مع واجهة الملف المرفق، من دون إعادة تصميم أو تحسينات بصرية إضافية.
- [x] مقارنة التخطيط والألوان والخطوط والمسافات والمكونات وصفحات التطبيق المحمية الأصلية صفحة بصفحة بعد الدخول بجلسة حقيقية.
- [x] التقاط لقطات تحقق لكل صفحات الموقع العامة وصفحات الدخول المطابقة وإزالة أي فروقات غير مطلوبة فيها.
- [x] تشغيل الاختبارات وحفظ نسخة checkpoint من الواجهة المطابقة.
- [x] إصلاح فشل deployment الناتج عن غياب /usr/src/app/dist/index.js، وضمان توافق build وstart مع runtime.

- [x] إنشاء نسخة كفر LinkedIn بالمقاس الدقيق 1584×396 بكسل والتحقق من صلاحيتها للرفع.
- [x] تحديث كفر LinkedIn ليستخدم اللوجو الحقيقي المرفق لـ SOPRANOVA بوضوح داخل مقاس 1584×396.
- [x] فحص تصميم Figma الجديد وملف Followpromptinstructions.zip ثم إعادة تطبيق التصميم على صفحات SOPRANOVA مع الحفاظ على الوظائف الحالية.
- [x] إعادة تنفيذ الواجهة كنسخة مطابقة حرفيًا لمصدر Figma المرفق، بما يشمل الصفحات العامة والمصادقة والتطبيق المحمي، مع إبقاء الوظائف الحقيقية الحالية.
- [x] ترحيل وفحص صفحات Agents وAnalytics وData وAutomations وSettings وWorkspace صفحة بصفحة مقابل مصدر Figma وتوثيق الملفات المعدلة.
- [x] تسجيل الدخول بحساب التطوير في متصفح sandbox والتقاط دليل مرئي للمسارات المحمية بعد تطبيق تصميم Figma.

- [x] إضافة اختبارات تكامل idempotency ومعالجة الأخطاء لمعالجات worker الخاصة بالمستندات ومصادر البيانات وworkflows.
- [x] إنهاء دليل النشر المستقل وتقرير التنفيذ النهائي مع توضيح المتطلبات البيئية والتشغيلية.
- [x] إزالة مسار /__dev/seed-login المؤقت وأي اعتماد عليه في التحقق النهائي.
- [x] تحديث حالة التدقيق المرئي المحمي بعد اكتمال مراجعة Analytics وAutomations وDecisions وMemory وActivity وWorkspace وSettings.

- [x] تحليل motion والفيديوهات في مصدر Figma وتحديد مواضع hero/product moments المطلوبة.
- [x] إضافة motion system مطابق لإيقاع Figma مع دعم prefers-reduced-motion.
- [x] إنشاء/إضافة فيديو hero بصيغة web-friendly وتخزينه خارج مجلد المشروع؛ لم يضف المصدر الأصلي فيديوهات product moments.
- [x] دمج فيديو hero والانتقالات في الصفحات العامة دون تغيير النصوص أو الهوية البصرية.
- [x] التحقق بصريًا من الحركة والتنسيق على desktop وmobile ثم تشغيل الاختبارات وحفظ checkpoint.

- [x] تنفيذ فيديو hero أصلي من تصميم SOPRANOVA ودمجه فعليًا في الصفحة العامة بدل الاكتفاء بـ canvas motion.
- [x] مطابقة توقيت الفيديو وطبقات الحركة مع أسلوب Figma والتحقق من fallback عند تعذر تشغيل الفيديو.

- [x] اختبار endpoint الفيديو المرفوع وfallback عند فشل تحميله، مع التأكد من بقاء canvas motion كبديل عبر onError وطبقة canvas المستقلة.
- [x] التحقق من تطبيق PageTransition على جميع public routes وتوثيقها؛ App.tsx يلف index وplatform وintelligence وagents وsolutions وenterprise وabout وcontact وauth routes.
- [x] إعادة تشغيل pnpm check وpnpm test وpnpm build بعد proxy/video ثم حفظ checkpoint جديد.

- [x] إضافة أزرار تحكم سينمائية اختيارية لفيديو Hero: تشغيل/إيقاف، كتم/صوت، وشريط تقدم متاح بلوحة المفاتيح.
- [ ] إنشاء فيديو توضيحي لقسم Platform وفيديو توضيحي لقسم Intelligence بنفس هوية SOPRANOVA.
- [ ] دمج الفيديوهات التوضيحية مع poster وfallback وlazy loading دون تغيير بنية النصوص الأساسية.
- [ ] اختبار التحكم والوصول والاستجابة والأداء، ثم تشغيل الاختبارات وحفظ checkpoint منشور.

- [ ] توليد فيديو Platform وفيديو Intelligence فعليًا عند تجدد حصة الفيديو، ثم رفعهما ودمجهما داخل الصفحات مع controls وfallback.

- [x] تجهيز حاويات الفيديو التوضيحية في صفحتي Platform وIntelligence عبر مكوّن ExplainerVideo مع poster وfallback متحرك بنفس هوية الحركة وlazy loading وتحكم تشغيل/إيقاف متاح بلوحة المفاتيح ودعم prefers-reduced-motion؛ الأصول الفعلية ما زالت مؤجلة حتى تجدد حصة توليد الفيديو.
- [x] توحيد منطق prefers-reduced-motion في hook مشترك (usePrefersReducedMotion) مستخدم في PageTransition وAnimatedSection وHero وExplainerVideo، مع تهيئة متزامنة تمنع وميض autoplay لمستخدمي تقليل الحركة، وإيقاف فيديو Hero فورًا عند تفعيل تقليل الحركة أثناء الجلسة، وعزل حالة الفيديو في HeroVideoLayer لمنع إعادة رسم الصفحة كاملة عند تحديث التقدم، وإضافة حالة تركيز مرئية لشريط تقدم Hero؛ تم التحقق عبر pnpm check/test/build واستجابة 200 لصفحتي platform وintelligence (تحقق بصري كامل desktop/mobile يتطلب جلسة متصفح).

- [x] تدقيق ومطابقة عائلات الخطوط والأوزان والمسافات والـ line-height في جميع الصفحات العامة والمحمية مع Figma.
- [x] إكمال عناصر التحكم السينمائية المرئية لفيديو Hero مع بقاء الفيديوهات التوضيحية المؤجلة إلى مرحلة لاحقة.
- [x] مراجعة motion والـ responsive states في كل الصفحات العامة والمحمية، ثم اختبار وحفظ checkpoint.

- [x] مزامنة آخر نسخة كاملة من SOPRANOVA إلى repository GitHub المرتبط والتحقق من branch والملفات المرفوعة.
- [x] إعداد prompt عملي لـ OpenCode يشرح architecture والأوامر وقواعد التطوير وحالة الفيديوهات المؤجلة.
