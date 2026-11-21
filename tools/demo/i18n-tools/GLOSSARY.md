# English for the web demo — translator's rules and glossary

The texts are the interface of **Ibtekr Ops**, an operations system for a handmade-goods marketplace in Egypt (orders synced from
WooCommerce / Dokan, makers and their commissions, accounts, a warehouse, products, customer service, HR, marketing, AI assistants).
They are written in Egyptian Arabic. Translate them into **plain, concise product English** — what a good SaaS interface says.

## How the texts are used (read this first)

Each text is one **string from the code**. Many are whole labels or sentences; many are **fragments** that the code joins with
numbers, names or other fragments at run time, e.g. `"مفيش صفوف فيها «"` + the search word + `"»"`, or a number + `" أوردر"`.
So:

1. **Translate each text on its own, so it still fits where it stands.** Keep its leading and trailing punctuation and symbols
   exactly (`:` `—` `·` `(` `)` `«` `»` `…` `+` `=` `/` `%`), in the same position. Do not add a full stop the Arabic does not have.
   A fragment that ends with `«` must end with `“`; one that starts with `»` must start with `”`.
2. **Capital letter** at the start only when the text is a label, a title, a button or a full sentence. A fragment that starts with
   a connector (من، في، على، و، لـ، بـ، لحد، مع، عن، أو، ثم) or with punctuation starts in **lowercase**.
3. A **single counting noun** that follows a number in the page (أوردر، منتج، قطعة، يوم، عضو، صف، طلب، مبتكر، عميل، رسالة، ساعة، دقيقة…)
   is translated **plural and lowercase**: `orders`, `products`, `pieces`, `days`, `members`, `rows`, `requests`, `makers`.
4. `«…»` around a name of something in the interface becomes `“…”`, and the name inside is translated **exactly as the glossary
   says** (it is the same label the page shows elsewhere).
5. Keep unchanged: numbers, Latin words, product names, SKUs, URLs, e-mail addresses, code names (`woo-sync`, `has_perm`), emoji,
   arrows (← → ‹ ›), `⋮`, and the symbols `✓ ! ○`.
6. **Template variables** in braces, e.g. `{اسم_العميل}` or a bare `اسم_العميل` with underscores: translate to English snake_case and
   keep the braces: `{customer_name}`, `{order_number}`, `{total}`, `{tracking_link}`, `{ship_date}`, `{maker_name}`,
   `{sub_order_number}`, `{product}`, `{delivery_date}`, `{amount}`, `{cart_link}`, `{payment_link}`, `{discount_code}`.
7. People's names are written in Latin letters the usual Egyptian way (سارة أحمد → Sara Ahmed, محمد علي → Mohamed Ali,
   صفوت كمال → Safwat Kamal, منى حسن → Mona Hassan, هدى سمير → Hoda Samir). Cities: القاهرة Cairo, الجيزة Giza, الإسكندرية Alexandria.
8. Money: `ج.م` → `EGP`. Dates and month names in English (نوفمبر → November, السبت → Saturday; short forms stay short).
9. **The result must hold no Arabic letters at all.**
10. Tone: neutral and short. No exclamation marks, no “please kindly”. Egyptian colloquial («مفيش», «دلوقتي», «عايز», «لسه»)
    becomes ordinary English (“No …”, “now”, “want”, “still / not yet”). Messages of a made-up customer or team member stay
    natural and conversational.
11. If a text is a note for developers that the page still shows (mentions of migrations, function names), translate the words and
    keep the code names.

## Glossary — always these words

### The business
| Arabic | English |
|---|---|
| إبتكر / ابتكر · إبتكر كلوب | Ibtekr · Ibtekr Club |
| مبتكر · المبتكرين / مبتكرين | maker · makers |
| المورد · الموردين (old word for maker) | maker · makers |
| متابعة المبتكرين / متابعة الموردين (team) | Maker follow-up |
| أوردر · أوردرات | order · orders |
| أوردر فرعي · الأوردرات الفرعية · فرعي / فرعيات | sub-order · sub-orders |
| الأوردر الأصلي / الرئيسي / الأساسي | main order |
| العميل · عملاء | customer · customers |
| المتجر · الموقع | store · website (the WooCommerce site) |
| عربون | down payment |
| المتبقي | balance due |
| الإجمالي | total |
| براند · براندات | brand · brands |
| قسم · أقسام (of products) | category · categories |
| فئة · فئات (of makers) | category · categories |
| البيع الفردي | single-seller mode |

### Order statuses and words
| Arabic | English |
|---|---|
| قيد الانتظار | Pending |
| جاري التنفيذ | Processing |
| جاهز للشحن | Ready to ship |
| قيد الشحن | Shipping |
| مكتمل | Completed |
| ملغي | Cancelled |
| استرجاع | Refunded |
| فشل | Failed |
| معلّق | On hold |
| مؤكد · غير مؤكد · تأكيد | Confirmed · Unconfirmed · confirmation |
| مؤكد بعربون · مؤكد بدون عربون | Confirmed with down payment · Confirmed without down payment |
| في انتظار الرد | Awaiting reply |
| قيد التنفيذ (product) | In progress |
| جاهز للشحن من المبتكر للعميل | Ready to ship: maker → customer |
| جاهز للشحن من المخزن للعميل | Ready to ship: warehouse → customer |
| جاهز للشحن من المبتكر للمخزن | Ready to ship: maker → warehouse |
| تم الشحن للعميل · تم الشحن للمخزن | Shipped to customer · Shipped to warehouse |
| وصل المخزن | Arrived at warehouse |
| مرتجع · مرتجع للمخزن · مرتجع للمبتكر | return · Returned to warehouse · Returned to maker |
| متأخر · قابل للتأخير · تأخير | Late · At risk · delay |
| مدة التصنيع | lead time |
| تاريخ التأكيد · تاريخ تبليغ المبتكر | confirmation date · maker notified on |
| حالة الأوردر · حالة التأكيد · حالة المنتج · حالة الموقع | order status · confirmation status · product status · website status |
| بوليصة · رقم التتبع · بيك أب · شركة الشحن | waybill · tracking number · pickup · courier |
| بوسطة · باي موب | Bosta · Paymob |
| مسح الأوردر / المنتج | delete the order / the product |

### Accounts
| Arabic | English |
|---|---|
| الحسابات | Accounts |
| المصروفات · المرتبات · الاشتراكات · الإعلانات | Expenses · Salaries · Subscriptions · Ads |
| المبيعات | Sales |
| سحب · إيداع | withdrawal · deposit |
| حركة · حركات · سجل الحركات | transaction · transactions · Transaction log |
| الحساب الفعلي | Actual balance |
| حساب البنك · حساب بوسطة · حساب باي موب · محفظة · حساب أوبريشن | Bank account · Bosta account · Paymob account · Wallet · Operations account |
| المستفيد | beneficiary |
| حصة إبتكر · نسبة إبتكر · عمولة | Ibtekr’s share · Ibtekr’s rate · commission |
| حصة / حق المبتكر | maker’s share / maker’s earnings |
| الصافي · صافي الفترة | net · Net for the period |
| رصيد · الرصيد المحتمل | balance · projected balance |
| كشف حساب · طلب سحب · تسوية | statement · withdrawal request · settlement |
| المواصلات | transport |
| ربح · خسارة | profit · loss |

### Warehouse
| Arabic | English |
|---|---|
| المخزون (page) · المخزن | Inventory · warehouse |
| سجل المخزون · حركات المخزن · الجرد | Stock register · Stock movements · Stock count |
| تجميع أوردر / تجميع في المخزن | order consolidation / consolidate at the warehouse |
| تصوير · متاح للبيع · المرتجعات | photo shoot · available for sale · returns |
| بانتظار الفحص · الفحص | awaiting inspection · inspection |
| أمانة · ملك ابتكر | on consignment · owned by Ibtekr |
| قطعة · قطع · صنف · أصناف | piece · pieces · item · items |
| استلام في المخزن · اسحب من المخزن | receive at the warehouse · pull from the warehouse |
| المكان / المنطقة | location / zone |

### Products and the studio
| Arabic | English |
|---|---|
| سجل المنتجات | Product list |
| تركيبة · تركيبات | variation · variations |
| سعر المبتكر · سعر البيع · قبل الخصم | maker price · sale price · regular price |
| الخصم الوهمي | compare-at markup |
| مسودة · منشور · في انتظار المراجعة · المهملات | Draft · Published · Pending review · Trash |
| استوديو المنتجات · دفعة · شيت | Product studio · batch · sheet |
| لقطة · صورة المقاس · صورة المميزات | shot · size image · features image |
| الخامة · الستايل · اللون · المقاس | material · style · colour · size |
| ولّد / توليد · كريدت | generate · credits |

### Customer service, auto-reply, requests
| Arabic | English |
|---|---|
| الرسايل · محادثة · محادثات | Messages · conversation · conversations |
| مستنية ردنا · مستنية العميل · جديدة · مؤجلة · اتحلت | Waiting for us · Waiting for customer · New · Snoozed · Resolved |
| شرايح العملاء · شريحة | Customer segments · segment |
| الحملات · حملة (messages) | Campaigns · campaign |
| القنوات · قناة | Channels · channel |
| القوالب · قالب · الردود السريعة · قواعد الرد الآلي | Templates · template · Quick replies · Auto-reply rules |
| ملاحظة داخلية | internal note |
| طلبات الفريق · طلب · فتح طلب · طلب جديد | Team requests · request · Open a request · New request |
| مطلوبة مني · طلباتي | Assigned to me · My requests |
| عاجل · عالي · عادي · منخفض | Urgent · High · Normal · Low |
| جاري العمل · بانتظار الرد · تم الحل · مغلق | In progress · Awaiting reply · Resolved · Closed |

### HR
| Arabic | English |
|---|---|
| الموارد البشرية | HR |
| الفريق والحضور · الفريق · عضو · أعضاء | Team & attendance · Team · member · members |
| ابدأ الدوام · إنهاء الدوام · الدوام | Clock in · Clock out · work day |
| حضور · انصراف · سجل الحضور · تقويم الفريق | clock-in · clock-out · Attendance log · Team calendar |
| وقت إضافي / أوفر تايم | overtime |
| إجازة · راحة أسبوعية · عطلة · سلفة · فترة راحة | leave · weekly day off · holiday · salary advance · break |
| التقييمات · تقييم | Evaluations · evaluation |
| كشف المرتبات · قسيمة · مكافأة · خصم (salary) | payroll · payslip · bonus · deduction |
| المدير المباشر · مدير الدور | direct manager · role manager |
| ملفي · مهامي · أدائي | My profile · My tasks · My performance |

### Marketing and AI
| Arabic | English |
|---|---|
| كامبين | campaign |
| بوست · كاروسيل · ستوري · ريل | post · carousel · story · reel |
| سجل النشر · الخطة الإعلانية · قوالب التصميم | Publishing log · Content calendar · Design templates |
| الحملات الإعلانية · الصرف · العائد | Ad campaigns · spend · return |
| الميديا باير · الديزاينر · المبرمج | Media buyer · Designer · Developer |
| … الذكي / الذكية (assistant names) | Smart … (e.g. المحاسب الذكي → Smart accountant, التشغيل الذكي → Smart operations) |
| مساعد · المساعدين | assistant · assistants |
| الذكاء الاصطناعي | AI |
| القواعد · السكيلز · التريندات | Rules · Skills · Trends |
| تعليمات | instructions |

### Settings and general interface
| Arabic | English |
|---|---|
| الإعدادات | Settings |
| الأدوار والصلاحيات · دور · أدوار إضافية | Roles & permissions · role · additional roles |
| أدمن / مدير النظام · مدير · موظف · مشاهد | Admin · Manager · Employee · Viewer |
| العمليات · الحسابات (roles) | Operations · Accounts |
| مسموح · عرض بس · غير مسموح | Allowed · View only · Not allowed |
| الربط بالمنصات · ربط · فصل · متصل · غير متصل | Integrations · Connect · Disconnect · Connected · Not connected |
| التنبيهات · الإشعارات | Notifications |
| القوائم والحالات | Lists & statuses |
| الهوية البصرية | Branding |
| الأمان · سجل النشاط · البيانات · منطقة الخطر | Security · Activity log · Data · Danger zone |
| حفظ · إلغاء · إغلاق · تعديل · حذف / مسح · إضافة | Save · Cancel · Close · Edit · Delete · Add |
| بحث · فلتر · ترتيب · أعمدة الجدول | Search · Filter · Sort · Columns |
| التفاصيل · نظرة عامة · الكل | Details · Overview · All |
| تخصيص اللوحة · إجراءات سريعة | Customize · Quick actions |
| الملفات (export / import menu) · تصدير · استيراد · القوالب (of sheets) | Files · Export · Import · Templates |
| مزامنة · تحديث · الفترة | Sync · Refresh · Period |
| بوب أب · تاب · درج | popup · tab · drawer |
| مفيش … | No … |
| بنحمّل… · بنحفظ… · ثواني… | Loading… · Saving… · One moment… |
| اتحفظ · اتمسح · اتضاف | Saved · Deleted · Added |
| ووكومرس · واتساب · ماسنجر · إنستجرام · فيسبوك · تيك توك · ميتا · جوجل | WooCommerce · WhatsApp · Messenger · Instagram · Facebook · TikTok · Meta · Google |
