# AVATAR HUB — خطوات النشر (حوالي 10 دقائق، مجاني)
1. أنشئ حسابًا في github.com ثم New repository باسم avatar-hub (Public).
2. Add file ← Upload files، اسحب كل محتويات هذا المجلد (بما فيه .github و scripts و data) ثم Commit.
3. Settings ← Pages ← Branch: main و Folder: / (root) ← Save. رابط موقعك سيظهر هناك.
4. Settings ← Actions ← General ← Workflow permissions ← Read and write ← Save.
5. تبويب Actions ← Update library ← Run workflow. بعد دقيقة افتح الموقع.
الأنمي يعمل بدون أي مفتاح. للأفلام/المسلسلات (TMDB) والألعاب (RAWG) أضف مفتاحين مجانيين:
- TMDB: themoviedb.org ← Settings ← API ← Create ← Developer.
- RAWG: rawg.io/apidocs ← Get API Key.
ثم في GitHub: Settings ← Secrets and variables ← Actions ← New repository secret بالاسم TMDB_KEY أو RAWG_KEY.
التحديث التلقائي يعمل يوميًا بجدولة GitHub Actions، وزر التحديث اليدوي هو Run workflow.
