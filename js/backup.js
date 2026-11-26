'use strict';
/* =========================================================
   SAO LƯU & XUẤT DỮ LIỆU HỌC (Tài khoản → Hồ sơ). Chạy hoàn toàn trong trình duyệt, chỉ đọc dữ liệu của chính người đang đăng nhập.
   - Tải file sao lưu .json: sổ tập trung theo ngày (focusLog), việc cần làm, chuỗi trăng (moon), mốc đếm ngược (exam),
     Planner (users/<uid>/planner/*, chỉ khi có quyền dùng Planner) và cài đặt trên máy (giao diện, ngôn ngữ, múi giờ, âm báo, thời lượng Pomodoro).
   - Tải .csv mở bằng Excel / Google Sheets: theo ngày (phút, số phiên, điểm danh trăng), việc Planner, việc cần làm.
   - Khôi phục từ file .json: kiểm tra định dạng và làm sạch từng trường, hỏi lại trước khi ghi.
     Kiểu GỘP: dữ liệu đang có được giữ nguyên, file chỉ bổ sung phần còn thiếu (mỗi ngày lấy số phút lớn hơn, việc trùng id giữ bản hiện tại…),
     nên không bao giờ làm mất dữ liệu mới hơn. Riêng phần cài đặt được thay bằng cài đặt trong file.
   - KHÔNG xuất / khôi phục: mã nhận thông báo của máy (plPush, mjPush), trạng thái Người đồng hành, mã dùng thử, đơn hàng, ưu đãi: những thứ đó do admin / máy chủ quản lý.
   Rules: chỉ ghi vào users/<uid> (đã cho phép chính chủ ghi) và users/<uid>/planner/* (chỉ Người đồng hành còn hạn / đang dùng thử): không cần sửa firestore.rules.
   ========================================================= */
(function(){
  const S = {
    en:{ bk_title:'Backup & export your study data', bk_sub:'Download everything you have recorded here (focus history, to-dos, Moon streak, countdown, Planner, settings). Only you can see this file.',
      bk_json:'Backup file (.json)', bk_json_tip:'Full backup, can be restored later', bk_csv:'Spreadsheet (.csv)', bk_csv_tip:'Opens in Excel or Google Sheets',
      bk_csv_days:'By day', bk_csv_pl:'Planner tasks', bk_csv_todo:'To-dos', bk_restore:'Restore from backup', bk_restore_tip:'Choose a .json backup file downloaded from this page.',
      bk_busy:'Preparing…', bk_done:'Downloaded {f}', bk_err:'Could not export: ', bk_pl_skip:'Planner was not included (you need Companion access or an active trial to read it).',
      bk_bad:'This file is not an Ép Study Room backup, or it is damaged.', bk_big:'File is too large (max 5 MB).', bk_none:'This file has nothing that can be restored.',
      bk_r_title:'Restore this backup?', bk_r_from:'Backup made on {d}', bk_r_other:'This backup was made from a different account. It will be added to the account you are signed in with now.',
      bk_r_keep:'Nothing you have now is deleted: the backup only fills in what is missing (for each day the larger focus time is kept). Settings you tick will replace the settings on this device.',
      bk_r_focus:'Focus history: {n} days', bk_r_todos:'To-dos: {n}', bk_r_moon:'Moon check-ins: {n} days', bk_r_exam:'Countdown: {n}', bk_r_pl:'Planner: {n} weeks', bk_r_pl_no:'Planner: {n} weeks (needs Companion access or a trial)',
      bk_r_set:'Settings on this device (theme, language, time zone, sounds, Pomodoro lengths)', bk_r_go:'Restore', bk_r_cancel:'Cancel', bk_r_pick:'Tick at least one item.',
      bk_r_busy:'Restoring…', bk_r_ok:'Restored. Reloading the page…', bk_r_err:'Could not restore: ',
      bk_h_date:'Date', bk_h_min:'Focus minutes', bk_h_ses:'Sessions', bk_h_moon:'Moon check-in', bk_h_week:'Week', bk_h_day:'Day', bk_h_start:'Start', bk_h_dur:'Minutes',
      bk_h_title:'Task', bk_h_grp:'Group', bk_h_done:'Done', bk_h_q:'Completion (1-5)', bk_h_pomo:'Pomodoros', bk_yes:'yes', bk_no:'no' },
    vi:{ bk_title:'Sao lưu và xuất dữ liệu học', bk_sub:'Tải về mọi thứ bạn đã ghi ở đây (lịch sử tập trung, việc cần làm, chuỗi trăng, đếm ngược, Planner, cài đặt). File chỉ mình bạn giữ.',
      bk_json:'File sao lưu (.json)', bk_json_tip:'Bản đầy đủ, dùng để khôi phục sau này', bk_csv:'Bảng tính (.csv)', bk_csv_tip:'Mở bằng Excel hoặc Google Sheets',
      bk_csv_days:'Theo ngày', bk_csv_pl:'Việc Planner', bk_csv_todo:'Việc cần làm', bk_restore:'Khôi phục từ file sao lưu', bk_restore_tip:'Chọn file .json đã tải ở trang này.',
      bk_busy:'Đang chuẩn bị…', bk_done:'Đã tải {f}', bk_err:'Chưa xuất được: ', bk_pl_skip:'Chưa kèm Planner (cần là Người đồng hành hoặc đang dùng thử mới đọc được).',
      bk_bad:'File này không phải bản sao lưu của Ép Study Room, hoặc đã bị hỏng.', bk_big:'File quá lớn (tối đa 5 MB).', bk_none:'File này không có gì để khôi phục.',
      bk_r_title:'Khôi phục bản sao lưu này?', bk_r_from:'Bản sao lưu ngày {d}', bk_r_other:'Bản sao lưu này được tạo từ một tài khoản khác. Dữ liệu sẽ được thêm vào tài khoản bạn đang đăng nhập.',
      bk_r_keep:'Không có gì bạn đang có bị xoá: file chỉ bổ sung phần còn thiếu (mỗi ngày giữ số phút tập trung lớn hơn). Riêng cài đặt nếu bạn tích sẽ thay cài đặt trên máy này.',
      bk_r_focus:'Lịch sử tập trung: {n} ngày', bk_r_todos:'Việc cần làm: {n}', bk_r_moon:'Điểm danh trăng: {n} ngày', bk_r_exam:'Đếm ngược: {n}', bk_r_pl:'Planner: {n} tuần', bk_r_pl_no:'Planner: {n} tuần (cần là Người đồng hành hoặc đang dùng thử)',
      bk_r_set:'Cài đặt trên máy này (giao diện, ngôn ngữ, múi giờ, âm báo, thời lượng Pomodoro)', bk_r_go:'Khôi phục', bk_r_cancel:'Huỷ', bk_r_pick:'Hãy tích ít nhất một mục.',
      bk_r_busy:'Đang khôi phục…', bk_r_ok:'Đã khôi phục. Đang tải lại trang…', bk_r_err:'Chưa khôi phục được: ',
      bk_h_date:'Ngày', bk_h_min:'Phút tập trung', bk_h_ses:'Số phiên', bk_h_moon:'Điểm danh trăng', bk_h_week:'Tuần', bk_h_day:'Ngày', bk_h_start:'Bắt đầu', bk_h_dur:'Số phút',
      bk_h_title:'Việc', bk_h_grp:'Nhóm', bk_h_done:'Xong', bk_h_q:'Mức hoàn thành (1-5)', bk_h_pomo:'Số pomodoro', bk_yes:'có', bk_no:'không' },
    ja:{ bk_title:'学習データのバックアップとエクスポート', bk_sub:'ここで記録したすべて（集中履歴、ToDo、月の連続記録、カウントダウン、プランナー、設定）をダウンロードします。ファイルはあなただけのものです。',
      bk_json:'バックアップ (.json)', bk_json_tip:'完全版。後で復元できます', bk_csv:'表計算 (.csv)', bk_csv_tip:'Excel や Google スプレッドシートで開けます',
      bk_csv_days:'日別', bk_csv_pl:'プランナーのタスク', bk_csv_todo:'ToDo', bk_restore:'バックアップから復元', bk_restore_tip:'このページでダウンロードした .json ファイルを選んでください。',
      bk_busy:'準備中…', bk_done:'{f} をダウンロードしました', bk_err:'エクスポートできませんでした: ', bk_pl_skip:'プランナーは含まれていません（読み込むにはコンパニオンか体験中である必要があります）。',
      bk_bad:'Ép Study Room のバックアップではないか、ファイルが壊れています。', bk_big:'ファイルが大きすぎます（最大 5 MB）。', bk_none:'このファイルには復元できるものがありません。',
      bk_r_title:'このバックアップを復元しますか？', bk_r_from:'{d} のバックアップ', bk_r_other:'このバックアップは別のアカウントで作成されました。現在ログイン中のアカウントに追加されます。',
      bk_r_keep:'今あるデータは削除されません。足りない分だけを補います（各日の集中時間は大きい方を残します）。チェックした設定はこの端末の設定と置き換わります。',
      bk_r_focus:'集中履歴: {n} 日', bk_r_todos:'ToDo: {n} 件', bk_r_moon:'月のチェックイン: {n} 日', bk_r_exam:'カウントダウン: {n}', bk_r_pl:'プランナー: {n} 週', bk_r_pl_no:'プランナー: {n} 週（コンパニオンか体験が必要）',
      bk_r_set:'この端末の設定（テーマ、言語、タイムゾーン、サウンド、ポモドーロの長さ）', bk_r_go:'復元する', bk_r_cancel:'キャンセル', bk_r_pick:'少なくとも 1 つ選んでください。',
      bk_r_busy:'復元中…', bk_r_ok:'復元しました。ページを再読み込みします…', bk_r_err:'復元できませんでした: ',
      bk_h_date:'日付', bk_h_min:'集中（分）', bk_h_ses:'セッション数', bk_h_moon:'月のチェックイン', bk_h_week:'週', bk_h_day:'日', bk_h_start:'開始', bk_h_dur:'分',
      bk_h_title:'タスク', bk_h_grp:'グループ', bk_h_done:'完了', bk_h_q:'達成度 (1-5)', bk_h_pomo:'ポモドーロ', bk_yes:'はい', bk_no:'いいえ' },
    ko:{ bk_title:'학습 데이터 백업 및 내보내기', bk_sub:'여기에 기록한 모든 것(집중 기록, 할 일, 달 연속 기록, 카운트다운, 플래너, 설정)을 내려받습니다. 파일은 나만 볼 수 있어요.',
      bk_json:'백업 파일 (.json)', bk_json_tip:'전체 백업, 나중에 복원 가능', bk_csv:'스프레드시트 (.csv)', bk_csv_tip:'Excel 또는 Google 스프레드시트에서 열기',
      bk_csv_days:'날짜별', bk_csv_pl:'플래너 할 일', bk_csv_todo:'할 일', bk_restore:'백업에서 복원', bk_restore_tip:'이 페이지에서 내려받은 .json 파일을 선택하세요.',
      bk_busy:'준비 중…', bk_done:'{f} 내려받기 완료', bk_err:'내보내지 못했어요: ', bk_pl_skip:'플래너는 포함되지 않았어요(동행자이거나 체험 중이어야 읽을 수 있어요).',
      bk_bad:'Ép Study Room 백업 파일이 아니거나 손상되었어요.', bk_big:'파일이 너무 커요(최대 5 MB).', bk_none:'이 파일에는 복원할 내용이 없어요.',
      bk_r_title:'이 백업을 복원할까요?', bk_r_from:'{d} 백업', bk_r_other:'다른 계정에서 만든 백업이에요. 지금 로그인한 계정에 추가됩니다.',
      bk_r_keep:'지금 있는 데이터는 삭제되지 않아요. 빠진 부분만 채웁니다(날마다 더 긴 집중 시간을 유지). 체크한 설정은 이 기기의 설정을 대체합니다.',
      bk_r_focus:'집중 기록: {n}일', bk_r_todos:'할 일: {n}개', bk_r_moon:'달 체크인: {n}일', bk_r_exam:'카운트다운: {n}', bk_r_pl:'플래너: {n}주', bk_r_pl_no:'플래너: {n}주 (동행자 또는 체험 필요)',
      bk_r_set:'이 기기의 설정(테마, 언어, 시간대, 소리, 뽀모도로 길이)', bk_r_go:'복원', bk_r_cancel:'취소', bk_r_pick:'하나 이상 선택하세요.',
      bk_r_busy:'복원 중…', bk_r_ok:'복원했어요. 페이지를 새로 고칩니다…', bk_r_err:'복원하지 못했어요: ',
      bk_h_date:'날짜', bk_h_min:'집중(분)', bk_h_ses:'세션 수', bk_h_moon:'달 체크인', bk_h_week:'주', bk_h_day:'날짜', bk_h_start:'시작', bk_h_dur:'분',
      bk_h_title:'할 일', bk_h_grp:'그룹', bk_h_done:'완료', bk_h_q:'완성도 (1-5)', bk_h_pomo:'뽀모도로', bk_yes:'예', bk_no:'아니요' },
    zh:{ bk_title:'备份和导出学习数据', bk_sub:'下载你在这里记录的全部内容（专注记录、待办、月亮连续打卡、倒计时、计划表、设置）。文件只有你自己保存。',
      bk_json:'备份文件 (.json)', bk_json_tip:'完整备份，之后可以恢复', bk_csv:'表格 (.csv)', bk_csv_tip:'可用 Excel 或 Google 表格打开',
      bk_csv_days:'按天', bk_csv_pl:'计划表任务', bk_csv_todo:'待办', bk_restore:'从备份恢复', bk_restore_tip:'选择在本页下载的 .json 备份文件。',
      bk_busy:'正在准备…', bk_done:'已下载 {f}', bk_err:'导出失败：', bk_pl_skip:'未包含计划表（需要是同行者或正在试用才能读取）。',
      bk_bad:'这不是 Ép Study Room 的备份文件，或文件已损坏。', bk_big:'文件太大（最多 5 MB）。', bk_none:'这个文件里没有可恢复的内容。',
      bk_r_title:'恢复这个备份？', bk_r_from:'{d} 的备份', bk_r_other:'这个备份来自另一个账号，数据将添加到你当前登录的账号。',
      bk_r_keep:'你现有的数据不会被删除：备份只补上缺少的部分（每天保留较长的专注时间）。勾选的设置会替换这台设备上的设置。',
      bk_r_focus:'专注记录：{n} 天', bk_r_todos:'待办：{n} 项', bk_r_moon:'月亮打卡：{n} 天', bk_r_exam:'倒计时：{n}', bk_r_pl:'计划表：{n} 周', bk_r_pl_no:'计划表：{n} 周（需要同行者或试用）',
      bk_r_set:'这台设备上的设置（主题、语言、时区、声音、番茄钟时长）', bk_r_go:'恢复', bk_r_cancel:'取消', bk_r_pick:'请至少勾选一项。',
      bk_r_busy:'正在恢复…', bk_r_ok:'已恢复，正在重新加载页面…', bk_r_err:'恢复失败：',
      bk_h_date:'日期', bk_h_min:'专注分钟', bk_h_ses:'次数', bk_h_moon:'月亮打卡', bk_h_week:'周', bk_h_day:'日期', bk_h_start:'开始', bk_h_dur:'分钟',
      bk_h_title:'任务', bk_h_grp:'分组', bk_h_done:'完成', bk_h_q:'完成度 (1-5)', bk_h_pomo:'番茄数', bk_yes:'是', bk_no:'否' },
    fr:{ bk_title:'Sauvegarder et exporter vos données d\'étude', bk_sub:'Téléchargez tout ce que vous avez enregistré ici (historique de concentration, tâches, série Lune, compte à rebours, Planner, réglages). Ce fichier n\'appartient qu\'à vous.',
      bk_json:'Fichier de sauvegarde (.json)', bk_json_tip:'Sauvegarde complète, restaurable plus tard', bk_csv:'Tableur (.csv)', bk_csv_tip:'S\'ouvre dans Excel ou Google Sheets',
      bk_csv_days:'Par jour', bk_csv_pl:'Tâches du Planner', bk_csv_todo:'Tâches', bk_restore:'Restaurer une sauvegarde', bk_restore_tip:'Choisissez un fichier .json téléchargé depuis cette page.',
      bk_busy:'Préparation…', bk_done:'{f} téléchargé', bk_err:'Export impossible : ', bk_pl_skip:'Le Planner n\'est pas inclus (il faut être Compagnon ou en essai pour le lire).',
      bk_bad:'Ce fichier n\'est pas une sauvegarde Ép Study Room, ou il est endommagé.', bk_big:'Fichier trop volumineux (5 Mo max).', bk_none:'Ce fichier ne contient rien à restaurer.',
      bk_r_title:'Restaurer cette sauvegarde ?', bk_r_from:'Sauvegarde du {d}', bk_r_other:'Cette sauvegarde vient d\'un autre compte. Elle sera ajoutée au compte actuellement connecté.',
      bk_r_keep:'Rien de ce que vous avez n\'est supprimé : la sauvegarde complète seulement ce qui manque (pour chaque jour, la durée la plus longue est gardée). Les réglages cochés remplaceront ceux de cet appareil.',
      bk_r_focus:'Historique : {n} jours', bk_r_todos:'Tâches : {n}', bk_r_moon:'Pointages Lune : {n} jours', bk_r_exam:'Compte à rebours : {n}', bk_r_pl:'Planner : {n} semaines', bk_r_pl_no:'Planner : {n} semaines (Compagnon ou essai requis)',
      bk_r_set:'Réglages de cet appareil (thème, langue, fuseau horaire, sons, durées Pomodoro)', bk_r_go:'Restaurer', bk_r_cancel:'Annuler', bk_r_pick:'Cochez au moins un élément.',
      bk_r_busy:'Restauration…', bk_r_ok:'Restauré. Rechargement de la page…', bk_r_err:'Restauration impossible : ',
      bk_h_date:'Date', bk_h_min:'Minutes de concentration', bk_h_ses:'Sessions', bk_h_moon:'Pointage Lune', bk_h_week:'Semaine', bk_h_day:'Jour', bk_h_start:'Début', bk_h_dur:'Minutes',
      bk_h_title:'Tâche', bk_h_grp:'Groupe', bk_h_done:'Fait', bk_h_q:'Réalisation (1-5)', bk_h_pomo:'Pomodoros', bk_yes:'oui', bk_no:'non' },
    es:{ bk_title:'Copia de seguridad y exportación de tus datos de estudio', bk_sub:'Descarga todo lo que has registrado aquí (historial de enfoque, tareas, racha lunar, cuenta atrás, Planner, ajustes). El archivo es solo tuyo.',
      bk_json:'Copia de seguridad (.json)', bk_json_tip:'Copia completa, se puede restaurar después', bk_csv:'Hoja de cálculo (.csv)', bk_csv_tip:'Se abre en Excel o Google Sheets',
      bk_csv_days:'Por día', bk_csv_pl:'Tareas del Planner', bk_csv_todo:'Tareas', bk_restore:'Restaurar copia de seguridad', bk_restore_tip:'Elige un archivo .json descargado desde esta página.',
      bk_busy:'Preparando…', bk_done:'Descargado {f}', bk_err:'No se pudo exportar: ', bk_pl_skip:'No se incluyó el Planner (necesitas ser Acompañante o tener una prueba activa para leerlo).',
      bk_bad:'Este archivo no es una copia de Ép Study Room o está dañado.', bk_big:'El archivo es demasiado grande (máx. 5 MB).', bk_none:'Este archivo no tiene nada que restaurar.',
      bk_r_title:'¿Restaurar esta copia?', bk_r_from:'Copia del {d}', bk_r_other:'Esta copia se hizo desde otra cuenta. Se añadirá a la cuenta con la que has iniciado sesión.',
      bk_r_keep:'No se borra nada de lo que tienes: la copia solo completa lo que falta (de cada día se guarda el tiempo de enfoque mayor). Los ajustes marcados reemplazarán los de este dispositivo.',
      bk_r_focus:'Historial de enfoque: {n} días', bk_r_todos:'Tareas: {n}', bk_r_moon:'Registros lunares: {n} días', bk_r_exam:'Cuenta atrás: {n}', bk_r_pl:'Planner: {n} semanas', bk_r_pl_no:'Planner: {n} semanas (requiere Acompañante o prueba)',
      bk_r_set:'Ajustes de este dispositivo (tema, idioma, zona horaria, sonidos, duración Pomodoro)', bk_r_go:'Restaurar', bk_r_cancel:'Cancelar', bk_r_pick:'Marca al menos un elemento.',
      bk_r_busy:'Restaurando…', bk_r_ok:'Restaurado. Recargando la página…', bk_r_err:'No se pudo restaurar: ',
      bk_h_date:'Fecha', bk_h_min:'Minutos de enfoque', bk_h_ses:'Sesiones', bk_h_moon:'Registro lunar', bk_h_week:'Semana', bk_h_day:'Día', bk_h_start:'Inicio', bk_h_dur:'Minutos',
      bk_h_title:'Tarea', bk_h_grp:'Grupo', bk_h_done:'Hecha', bk_h_q:'Cumplimiento (1-5)', bk_h_pomo:'Pomodoros', bk_yes:'sí', bk_no:'no' },
    hi:{ bk_title:'पढ़ाई का डेटा बैकअप और एक्सपोर्ट', bk_sub:'यहाँ दर्ज की गई हर चीज़ डाउनलोड करें (फ़ोकस इतिहास, टू-डू, मून स्ट्रीक, काउंटडाउन, प्लानर, सेटिंग्स)। यह फ़ाइल सिर्फ़ आपके पास रहेगी।',
      bk_json:'बैकअप फ़ाइल (.json)', bk_json_tip:'पूरा बैकअप, बाद में वापस लाया जा सकता है', bk_csv:'स्प्रेडशीट (.csv)', bk_csv_tip:'Excel या Google Sheets में खुलती है',
      bk_csv_days:'दिन के अनुसार', bk_csv_pl:'प्लानर के काम', bk_csv_todo:'टू-डू', bk_restore:'बैकअप से वापस लाएँ', bk_restore_tip:'इस पेज से डाउनलोड की गई .json फ़ाइल चुनें।',
      bk_busy:'तैयार हो रहा है…', bk_done:'{f} डाउनलोड हो गई', bk_err:'एक्सपोर्ट नहीं हो सका: ', bk_pl_skip:'प्लानर शामिल नहीं है (इसे पढ़ने के लिए साथी या ट्रायल पर होना ज़रूरी है)।',
      bk_bad:'यह Ép Study Room की बैकअप फ़ाइल नहीं है, या ख़राब हो गई है।', bk_big:'फ़ाइल बहुत बड़ी है (अधिकतम 5 MB)।', bk_none:'इस फ़ाइल में वापस लाने लायक कुछ नहीं है।',
      bk_r_title:'यह बैकअप वापस लाएँ?', bk_r_from:'{d} का बैकअप', bk_r_other:'यह बैकअप किसी दूसरे खाते से बना है। डेटा उस खाते में जोड़ा जाएगा जिससे आप अभी साइन इन हैं।',
      bk_r_keep:'आपका मौजूदा डेटा नहीं मिटेगा: बैकअप सिर्फ़ कमी पूरी करता है (हर दिन का ज़्यादा फ़ोकस समय रखा जाता है)। चुनी गई सेटिंग्स इस डिवाइस की सेटिंग्स की जगह लेंगी।',
      bk_r_focus:'फ़ोकस इतिहास: {n} दिन', bk_r_todos:'टू-डू: {n}', bk_r_moon:'मून चेक-इन: {n} दिन', bk_r_exam:'काउंटडाउन: {n}', bk_r_pl:'प्लानर: {n} हफ़्ते', bk_r_pl_no:'प्लानर: {n} हफ़्ते (साथी या ट्रायल ज़रूरी)',
      bk_r_set:'इस डिवाइस की सेटिंग्स (थीम, भाषा, समय क्षेत्र, आवाज़ें, पोमोडोरो अवधि)', bk_r_go:'वापस लाएँ', bk_r_cancel:'रद्द करें', bk_r_pick:'कम से कम एक चीज़ चुनें।',
      bk_r_busy:'वापस ला रहे हैं…', bk_r_ok:'वापस आ गया। पेज फिर से लोड हो रहा है…', bk_r_err:'वापस नहीं ला सके: ',
      bk_h_date:'तारीख़', bk_h_min:'फ़ोकस मिनट', bk_h_ses:'सत्र', bk_h_moon:'मून चेक-इन', bk_h_week:'हफ़्ता', bk_h_day:'दिन', bk_h_start:'शुरू', bk_h_dur:'मिनट',
      bk_h_title:'काम', bk_h_grp:'समूह', bk_h_done:'पूरा', bk_h_q:'पूर्णता (1-5)', bk_h_pomo:'पोमोडोरो', bk_yes:'हाँ', bk_no:'नहीं' }
  };
  Object.keys(S).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(S[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = S[l][k]; }); });
})();

const BK = { busy:'', file:null, pl:null };
const BK_DAY = /^\d{4}-\d{2}-\d{2}$/, BK_WEEK = /^\d{4}-W\d{1,2}$/, BK_LANGS = ['en', 'vi', 'ja', 'ko', 'zh', 'fr', 'es', 'hi'], BK_MAX_FILE = 5 * 1024 * 1024;
const bkPlAccess = () => state.companion || state.isAdmin || trialActive();
const bkStamp = () => DT.now().setZone(userTZ).toFormat('yyyy-LL-dd');
const bkObj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const bkStr = (v, n) => String(v ?? '').slice(0, n);
const bkInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v || 0)));

/* ---------- làm sạch từng phần (dùng cho cả xuất và khôi phục: file có thể đã bị sửa tay) ---------- */
const bkTodo = x => { x = bkObj(x); const id = bkStr(x.id, 40).trim(), text = bkStr(x.text, 300).trim(); return id && text ? { id, text, done:!!x.done, ...(x.p > 0 ? { p:bkInt(x.p, 0, 999) } : {}) } : null; };
const bkTodos = l => (Array.isArray(l) ? l : []).map(bkTodo).filter(Boolean).slice(0, 500);
const bkMoon = m => {
  m = bkObj(m); const today = todayKey(), okDay = k => typeof k === 'string' && BK_DAY.test(k) && k <= today && k >= '2020-01-01';
  const days = [...new Set((Array.isArray(m.days) ? m.days : []).filter(okDay))].sort().slice(-3000);
  if (!days.length) return null;
  const saved = [...new Set((Array.isArray(m.saved) ? m.saved : []).filter(okDay))].filter(k => days.includes(k)).sort().slice(-500);
  return { startedAt:Math.max(0, Math.round(+m.startedAt || 0)) || Date.now(), days, saved, moons:bkInt(m.moons, 0, 500), best:Math.min(bkInt(m.best, 0, 5000), days.length), rounds:bkInt(m.rounds, 0, 100) };
};
const bkTask = x => {
  x = bkObj(x); const start = /^\d{1,2}:\d{2}$/.test(x.start || '') ? x.start : '', day = Number.isInteger(x.day) && x.day >= 0 && x.day <= 6 ? x.day : null;
  const p = start.split(':'), sm = Math.min(1439, (+p[0] || 0) * 60 + (+p[1] || 0)), st = start ? String(Math.floor(sm / 60)).padStart(2, '0') + ':' + String(sm % 60).padStart(2, '0') : '';
  let dur = bkInt(x.dur, 0, 1440); if (st && !dur) dur = 30; if (st) dur = Math.min(dur, 1440 - sm);
  const id = bkStr(x.id, 40).trim(); if (!id) return null;
  return { id, title:bkStr(x.title, 80).trim(), day, start:day === null ? '' : st, dur, c:bkInt(x.c, 0, 5), done:!!x.done, ...(x.done && x.q >= 1 && x.q <= 5 ? { q:x.q | 0 } : {}), ...(x.carried ? { carried:typeof x.carried === 'string' ? bkStr(x.carried, 20) : true } : {}) };
};
const bkGone = g => {
  g = bkObj(g); const day = Number.isInteger(g.day) && g.day >= 0 && g.day <= 6 ? g.day : null, to = g.to === 'w' || (Number.isInteger(g.to) && g.to >= 0 && g.to <= 6) ? g.to : null, id = bkStr(g.id, 40);
  return id ? { id, t:bkStr(g.t, 80), day, dur:bkInt(g.dur, 0, 1440), c:bkInt(g.c, 0, 5), s:g.s === 'm' ? 'm' : 'x', ...(to !== null ? { to } : {}) } : null;
};
const bkWeek = w => { w = bkObj(w); return { tasks:(Array.isArray(w.tasks) ? w.tasks : []).map(bkTask).filter(Boolean).slice(0, 300), gone:(Array.isArray(w.gone) ? w.gone : []).map(bkGone).filter(Boolean).slice(-300) }; };
const bkPrefs = p => {
  p = bkObj(p); const o = {};
  if ('dayGoalMin' in p) o.dayGoalMin = bkInt(p.dayGoalMin, 0, 1440);
  if ('goalMin' in p) o.goalMin = bkInt(p.goalMin, 0, 10080);
  if ('studyGoalMin' in p) o.studyGoalMin = bkInt(p.studyGoalMin, 0, 10080);
  if (Array.isArray(p.template)) o.template = p.template.map(bkTask).filter(Boolean).slice(0, 100).map(x => ({ ...x, done:false, carried:false }));
  return o;
};
/* cài đặt trên máy: chỉ những khoá này, đúng kiểu, mới được ghi lại */
const bkSettings = s => {
  s = bkObj(s); const o = {};
  if (BK_LANGS.includes(s.lang)) o.lang = s.lang;
  if (typeof s.tz === 'string' && s.tz.length <= 64) { try { if (s.tz === 'auto' || DT.local().setZone(s.tz).isValid) o.tz = s.tz; } catch (e) {} }
  if (s.theme === null || (typeof s.theme === 'string' && /^[\w-]{1,20}$/.test(s.theme))) o.theme = s.theme;
  if (typeof s.sky === 'string' && /^[\w-]{1,20}$/.test(s.sky)) o.sky = s.sky;
  if (typeof s.calm === 'boolean') o.calm = s.calm;
  if (s.motion === null || typeof s.motion === 'boolean' || (typeof s.motion === 'string' && /^[\w-]{1,12}$/.test(s.motion))) o.motion = s.motion;
  if (s.currency === 'VND' || s.currency === 'USD') o.currency = s.currency;
  if (typeof s.ambvol === 'number' && s.ambvol >= 0 && s.ambvol <= 1) o.ambvol = s.ambvol;
  if (s.snd && typeof s.snd === 'object') {
    const n = bkObj(s.snd), cats = {};
    Object.entries(bkObj(n.cats)).slice(0, 20).forEach(([k, v]) => { if (/^[a-z_]{1,20}$/.test(k)) { v = bkObj(v); cats[k] = { on:v.on !== false, ...(typeof v.tone === 'string' && /^[a-z]{1,12}$/.test(v.tone) ? { tone:v.tone } : {}) }; } });
    o.snd = { on:n.on !== false, vol:Math.min(1, Math.max(.1, +n.vol || .8)), cats };
  }
  if (s.pomo && typeof s.pomo === 'object') {
    const c = bkObj(s.pomo);
    o.pomo = { focus:bkInt(c.focus || 25, 1, 180), short:bkInt(c.short || 5, 1, 60), long:bkInt(c.long || 15, 1, 120), every:bkInt(c.every || 4, 1, 12), auto:!!c.auto, noise:!!c.noise, goal:bkInt(c.goal, 0, 50) };
  }
  return o;
};
const bkLocalSettings = () => bkSettings({ lang:state.lang, tz:state.tz, theme:state.theme, sky:state.sky, calm:state.calm, motion:state.motion, currency:state.currency, ambvol:store.get('ambvol', .3), snd:store.get('snd', null), pomo:(store.get('pomo', null) || {}).cfg || null });

/* ---------- đọc dữ liệu của chính mình ---------- */
async function bkReadPlanner(){
  if (DEMO || !bkPlAccess()) return null;
  const s = await db.collection('users').doc(state.user.uid).collection('planner').get(), weeks = {}; let prefs = {};
  s.docs.forEach(d => { if (d.id === '_prefs') prefs = bkPrefs(d.data()); else if (BK_WEEK.test(d.id)) weeks[d.id] = bkWeek(d.data()); });
  return { weeks, prefs };
}
async function bkCollect(){
  let p = profile || {};
  if (!DEMO) { try { const d = await db.collection('users').doc(state.user.uid).get(); if (d.exists) p = d.data(); } catch (e) { /* mất mạng: dùng bản đã tải */ } }
  const fl = cleanFocus(p.focusLog); Object.entries(localFocus()).forEach(([k, v]) => { const o = fl[k] || { m:0, s:0 }; fl[k] = { m:Math.max(o.m, v.m), s:Math.max(o.s, v.s) }; });   // gộp cả phần trên máy chưa kịp đồng bộ
  const gone = new Set([...(Array.isArray(p.todosGone) ? p.todosGone : []), ...todosGone()]), todos = bkTodos(p.todos).filter(x => !gone.has(x.id));
  bkTodos(localTodos()).forEach(x => { if (!gone.has(x.id) && !todos.find(y => y.id === x.id)) todos.push(x); });
  const ex = examRaw(), pe = examClean(p.exam), exam = (pe && (!ex || pe.t >= ex.t) ? pe : ex);
  let planner = null, plErr = '';
  try { planner = await bkReadPlanner(); } catch (e) { plErr = e.code || e.message || 'error'; }
  Object.keys(fl).forEach(k => { if (!BK_DAY.test(k) || (!fl[k].m && !fl[k].s)) delete fl[k]; });
  return {
    app:'ep-study-room', kind:'backup', v:1, exportedAt:new Date().toISOString(), tz:userTZ,
    account:{ uid:state.user.uid, email:state.user.email || '', name:displayName() },
    profile:{ focusLog:fl, todos, todosGone:[...gone].slice(-300), exam:exam && exam.d ? { n:exam.n, d:exam.d, t:exam.t } : null, moon:bkMoon(p.moon) },
    planner, settings:bkLocalSettings(), _plErr:plErr
  };
}

/* ---------- tải file ---------- */
function bkDownload(name, text, type){
  const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30e3);
  toast(t('bk_done', { f:name }), 3000);
}
/* ô CSV: bọc ngoặc kép; chặn công thức (=, +, -, @ ở đầu) để Excel không chạy chữ trong tên việc như một công thức */
const bkCell = v => { if (typeof v === 'number') return String(v); let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
const bkCsv = rows => '﻿' + rows.map(r => r.map(bkCell).join(',')).join('\r\n') + '\r\n';     // BOM: Excel đọc đúng tiếng Việt
const bkWeekDate = (key, day) => { const m = /^(\d{4})-W(\d{1,2})$/.exec(key); if (!m || day === null) return ''; const d = DT.fromObject({ weekYear:+m[1], weekNumber:+m[2], weekday:day + 1 }); return d.isValid ? d.toISODate() : ''; };
const bkYes = v => v ? t('bk_yes') : t('bk_no');
function bkCsvOf(kind, b){
  if (kind === 'days') {
    const fl = b.profile.focusLog, moon = new Set(b.profile.moon ? b.profile.moon.days : []), keys = [...new Set([...Object.keys(fl), ...moon])].sort();
    return [[t('bk_h_date'), t('bk_h_min'), t('bk_h_ses'), t('bk_h_moon')], ...keys.map(k => [k, (fl[k] || {}).m || 0, (fl[k] || {}).s || 0, bkYes(moon.has(k))])];
  }
  if (kind === 'pl') {
    const rows = [[t('bk_h_week'), t('bk_h_date'), t('bk_h_start'), t('bk_h_dur'), t('bk_h_title'), t('bk_h_grp'), t('bk_h_done'), t('bk_h_q')]], w = (b.planner && b.planner.weeks) || {};
    Object.keys(w).sort((a, c) => { const [ya, wa] = a.split('-W').map(Number), [yc, wc] = c.split('-W').map(Number); return ya - yc || wa - wc; }).forEach(k => {
      w[k].tasks.slice().sort((x, y) => (x.day ?? 9) - (y.day ?? 9) || (x.start || '99').localeCompare(y.start || '99')).forEach(x => rows.push([k, bkWeekDate(k, x.day), x.start, x.dur || '', x.title, x.c || '', bkYes(x.done), x.q || '']));
    });
    return rows;
  }
  return [[t('bk_h_title'), t('bk_h_done'), t('bk_h_pomo')], ...b.profile.todos.map(x => [x.text, bkYes(x.done), x.p || 0])];
}
async function bkExport(kind){
  if (!state.user || BK.busy) return;
  BK.busy = kind; render(true);
  try {
    const b = await bkCollect(), plErr = b._plErr; delete b._plErr;
    const base = 'ep-study-room-' + bkStamp();
    if (kind === 'json') bkDownload(base + '-backup.json', JSON.stringify(b, null, 1), 'application/json');
    else bkDownload(base + '-' + (kind === 'pl' ? 'planner' : kind === 'days' ? 'focus-by-day' : 'todos') + '.csv', bkCsv(bkCsvOf(kind, b)), 'text/csv;charset=utf-8');
    if ((kind === 'json' || kind === 'pl') && !b.planner) setTimeout(() => toast(t('bk_pl_skip') + (plErr ? ' (' + plErr + ')' : ''), 5000), 3100);
  } catch (e) { console.warn('backup export', e); toast(t('bk_err') + (e.code || e.message || e), 5000); }
  BK.busy = ''; render(true);
}

/* ---------- khôi phục ---------- */
function bkParse(text){
  let j; try { j = JSON.parse(text); } catch (e) { return null; }
  if (!j || typeof j !== 'object' || j.app !== 'ep-study-room' || j.kind !== 'backup' || j.v !== 1) return null;
  const p = bkObj(j.profile), fl = cleanFocus(Object.fromEntries(Object.entries(bkObj(p.focusLog)).filter(([k]) => BK_DAY.test(k)).slice(0, 5000)));
  Object.keys(fl).forEach(k => { if (!fl[k].m && !fl[k].s) delete fl[k]; });
  const ex = examClean(p.exam), pl = j.planner && typeof j.planner === 'object' ? j.planner : null, weeks = {};
  if (pl) Object.entries(bkObj(pl.weeks)).slice(0, 600).forEach(([k, w]) => { if (BK_WEEK.test(k)) { const c = bkWeek(w); if (c.tasks.length || c.gone.length) weeks[k] = c; } });
  const prefs = pl ? bkPrefs(pl.prefs) : {};
  return {
    at:typeof j.exportedAt === 'string' ? j.exportedAt.slice(0, 30) : '', uid:bkStr(bkObj(j.account).uid, 128),
    focus:fl, todos:bkTodos(p.todos), exam:ex && ex.d ? ex : null, moon:bkMoon(p.moon),
    weeks, prefs, settings:bkSettings(j.settings)
  };
}
function bkPick(){ const f = $('bk-file'); if (f) { f.value = ''; f.click(); } }
CHANGES.bkFile = el => {
  const f = el.files && el.files[0]; if (!f) return;
  if (f.size > BK_MAX_FILE) return toast(t('bk_big'), 4000);
  const r = new FileReader();
  r.onload = () => { const b = bkParse(String(r.result || '')); if (!b) return toast(t('bk_bad'), 4500); BK.file = b; bkAsk(); };
  r.onerror = () => toast(t('bk_bad'), 4500);
  r.readAsText(f);
};
function bkAsk(){
  const b = BK.file; if (!b || !state.user) return;
  const nW = Object.keys(b.weeks).length, pl = bkPlAccess(), nSet = Object.keys(b.settings).length;
  const items = [
    ['focus', Object.keys(b.focus).length, t('bk_r_focus', { n:Object.keys(b.focus).length })],
    ['todos', b.todos.length, t('bk_r_todos', { n:b.todos.length })],
    ['moon', b.moon ? b.moon.days.length : 0, t('bk_r_moon', { n:b.moon ? b.moon.days.length : 0 })],
    ['exam', b.exam ? 1 : 0, t('bk_r_exam', { n:b.exam ? `${b.exam.n || ''} ${b.exam.d}`.trim() : '' })],
    ['pl', nW || Object.keys(b.prefs).length, t(pl ? 'bk_r_pl' : 'bk_r_pl_no', { n:nW })],
    ['set', nSet, t('bk_r_set')]
  ].filter(x => x[1]);
  if (!items.length) { BK.file = null; return toast(t('bk_none'), 4000); }
  let when = b.at; try { const d = DT.fromISO(b.at); if (d.isValid) when = d.setZone(userTZ).setLocale(state.lang).toLocaleString(DT.DATETIME_MED); } catch (e) {}
  openModal(`<h3 style="margin-bottom:6px;padding-right:32px">${esc(t('bk_r_title'))}</h3>
    ${when ? `<p class="small muted">${esc(t('bk_r_from', { d:when }))}</p>` : ''}
    ${b.uid && b.uid !== state.user.uid ? `<div class="banner mt-s">${ic('info', 'sm')} <span>${esc(t('bk_r_other'))}</span></div>` : ''}
    <p class="small mt-s">${esc(t('bk_r_keep'))}</p>
    <div class="stack bk-pick mt-s">${items.map(([k, , l]) => `<label class="bk-opt"><input type="checkbox" data-bk="${k}" ${k === 'pl' && !pl ? 'disabled' : k === 'set' ? '' : 'checked'}> <span>${esc(l)}</span></label>`).join('')}</div>
    <p class="small" id="bk-st" role="status" style="min-height:1.2em;margin-top:10px"></p>
    <div class="row mt-s"><button type="button" class="btn primary" id="bk-go" data-act="bkGo">${ic('check', 'sm')} ${esc(t('bk_r_go'))}</button><button type="button" class="btn ghost" data-act="closeModal">${esc(t('bk_r_cancel'))}</button></div>`, true);
}
async function bkGo(){
  const b = BK.file, st = $('bk-st'), go = $('bk-go'); if (!b || !state.user || BK.busy) return;
  const on = k => { const c = document.querySelector(`[data-bk="${k}"]`); return !!c && c.checked && !c.disabled; };
  const pick = { focus:on('focus'), todos:on('todos'), moon:on('moon'), exam:on('exam'), pl:on('pl') && bkPlAccess(), set:on('set') };
  if (!Object.values(pick).some(Boolean)) { if (st) st.textContent = t('bk_r_pick'); return; }
  BK.busy = 'restore'; if (go) go.disabled = true; if (st) st.textContent = t('bk_r_busy');
  try {
    const uid = state.user.uid, ref = db.collection('users').doc(uid);
    let cur = profile || {};
    if (!DEMO) { const d = await ref.get(); cur = d.exists ? d.data() : {}; }   // gộp với bản mới nhất trên máy chủ, không phải bản cũ đã tải lúc mở trang
    const patch = {};
    if (pick.focus) {      // mỗi ngày lấy số lớn hơn (giống cách web gộp giữa các máy)
      const fl = cleanFocus(cur.focusLog); [localFocus(), b.focus].forEach(src => Object.entries(src).forEach(([k, v]) => { const o = fl[k] || { m:0, s:0 }; fl[k] = { m:Math.max(o.m, v.m), s:Math.max(o.s, v.s) }; }));
      store.set('focus', fl); profile.focusLog = fl; patch.focusLog = fl;
    }
    if (pick.todos) {      // giữ việc hiện có; việc trong file mà đã từng xoá thì thêm lại với id mới (để máy khác không xoá nó lần nữa)
      const gone = new Set([...(Array.isArray(cur.todosGone) ? cur.todosGone : []), ...todosGone()]), list = bkTodos(cur.todos).filter(x => !gone.has(x.id));
      bkTodos(localTodos()).forEach(x => { if (!gone.has(x.id) && !list.find(y => y.id === x.id)) list.push(x); });
      const have = new Set(list.map(x => x.id)), texts = new Set(list.map(x => x.text + '\u0000' + x.done));
      b.todos.forEach((x, i) => { if (have.has(x.id) || texts.has(x.text + '\u0000' + x.done)) return; const id = gone.has(x.id) ? Date.now().toString(36) + i.toString(36) + Math.random().toString(36).slice(2, 5) : x.id; list.push({ ...x, id }); have.add(id); });
      const todos = list.slice(0, 500);
      store.set('todos', todos); store.set('todos_gone', [...gone].slice(-300)); profile.todos = todos; patch.todos = todos; patch.todosGone = [...gone].slice(-300);
    }
    if (pick.exam) {       // chỉ thêm khi hiện chưa có mốc đếm ngược (không đè mốc bạn đang dùng)
      const ce = examClean(cur.exam), le = examRaw(), now = (ce && le ? (ce.t >= le.t ? ce : le) : ce || le);
      if (!now || !now.d) { const ex = { n:b.exam.n, d:b.exam.d, t:Date.now() }; store.set('exam', { ...ex, u:uid }); patch.exam = ex; }
    }
    if (pick.moon) {       // gộp ngày điểm danh; số trăng / chuỗi dài nhất lấy số lớn hơn
      const cm = bkMoon(cur.moon), fm = b.moon;
      const days = [...new Set([...(cm ? cm.days : []), ...fm.days])].sort().slice(-3000), saved = [...new Set([...(cm ? cm.saved : []), ...fm.saved])].filter(k => days.includes(k)).sort().slice(-500);
      const raw = bkObj(cur.moon), m = { ...raw, startedAt:Math.min(cm ? cm.startedAt : Infinity, fm.startedAt), days, saved, moons:Math.max(+raw.moons || 0, fm.moons), best:Math.max(+raw.best || 0, fm.best) };
      if (raw.rounds || fm.rounds) m.rounds = Math.max(+raw.rounds || 0, fm.rounds);
      profile.moon = m; store.set('moon_' + uid, m); patch.moon = m;
    }
    if (!DEMO && Object.keys(patch).length) await ref.set({ ...patch, updatedAt:TS() }, { merge:true });
    if (pick.pl && !DEMO) {
      const col = ref.collection('planner');
      for (const [k, w] of Object.entries(b.weeks)) {       // mỗi tuần: giữ việc hiện có, thêm việc chưa có (theo id)
        const d = await col.doc(k).get(), v = d.exists ? d.data() : {}, ct = (Array.isArray(v.tasks) ? v.tasks : []).map(bkTask).filter(Boolean), cg = (Array.isArray(v.gone) ? v.gone : []).map(bkGone).filter(Boolean);
        const ids = new Set(ct.map(x => x.id)), gk = new Set(cg.map(g => g.id + '|' + g.day));
        const tasks = [...ct, ...w.tasks.filter(x => !ids.has(x.id))].slice(0, 300), gone = [...cg, ...w.gone.filter(g => !gk.has(g.id + '|' + g.day))].slice(-300);
        if (tasks.length === ct.length && gone.length === cg.length) continue;
        await col.doc(k).set({ tasks, gone, updatedAt:TS() }, { merge:true });
        try { localStorage.removeItem('ep_plw_' + uid + '_' + k); } catch (e) {}   // bỏ bản nhớ tạm của tuần đó để Planner tải lại bản đã gộp
      }
      if (Object.keys(b.prefs).length) {
        const d = await col.doc('_prefs').get(), cp = d.exists ? d.data() : {}, np = {};
        Object.entries(b.prefs).forEach(([k, v]) => { if (k === 'template' ? !(Array.isArray(cp.template) && cp.template.length) : !cp[k]) np[k] = v; });   // chỉ điền mục tiêu / mẫu tuần còn trống
        if (Object.keys(np).length) await col.doc('_prefs').set(np, { merge:true });
      }
    }
    if (pick.set) {
      const s = b.settings;
      ['lang', 'tz', 'theme', 'sky', 'calm', 'motion', 'currency', 'ambvol', 'snd'].forEach(k => { if (k in s) store.set(k, s[k]); });
      if (s.pomo) { const p = store.get('pomo', null) || {}; store.set('pomo', { ...p, cfg:{ ...(p.cfg || {}), ...s.pomo } }); }
    }
    store.set('profsig', '');
    BK.file = null; if (st) st.textContent = t('bk_r_ok');
    toast(t('bk_r_ok'), 3000);
    setTimeout(() => location.reload(), 1200);    // tải lại để mọi phần (Pomodoro, giao diện, Planner…) đọc dữ liệu mới
  } catch (e) {
    console.warn('backup restore', e); BK.busy = ''; if (go) go.disabled = false;
    if (st) st.textContent = t('bk_r_err') + (e.code || e.message || e);
  }
}
Object.assign(ACTIONS, { bkExport:el => bkExport(el.dataset.k), bkPick, bkGo });

/* thẻ hiện ở Tài khoản → Hồ sơ */
function bkCard(){
  const b = BK.busy, btn = (k, icn, label) => `<button type="button" class="btn ${k === 'json' ? 'primary' : 'secondary'} sm" data-act="bkExport" data-k="${k}" ${b ? 'disabled' : ''}>${ic(b === k ? 'timer' : icn, 'sm')} ${esc(b === k ? t('bk_busy') : label)}</button>`;
  return `<section class="card pad bk-card" id="backup" style="margin-top:18px">
    <h2 class="h3" style="margin-bottom:6px">${ic('shield', 'sm')} ${esc(t('bk_title'))}</h2>
    <p class="small muted">${esc(t('bk_sub'))}</p>
    <div class="bk-grp mt"><div class="small"><b>${esc(t('bk_json'))}</b> <span class="faint">· ${esc(t('bk_json_tip'))}</span></div><div class="row mt-s">${btn('json', 'download', t('bk_json'))}</div></div>
    <div class="bk-grp mt"><div class="small"><b>${esc(t('bk_csv'))}</b> <span class="faint">· ${esc(t('bk_csv_tip'))}</span></div><div class="row mt-s">${btn('days', 'chart', t('bk_csv_days'))}${bkPlAccess() ? btn('pl', 'calendar', t('bk_csv_pl')) : ''}${btn('todo', 'check', t('bk_csv_todo'))}</div></div>
    <div class="bk-grp mt"><div class="small"><b>${esc(t('bk_restore'))}</b> <span class="faint">· ${esc(t('bk_restore_tip'))}</span></div><div class="row mt-s"><button type="button" class="btn secondary sm" data-act="bkPick" ${b ? 'disabled' : ''}>${ic('up', 'sm')} ${esc(t('bk_restore'))}</button><input type="file" id="bk-file" accept=".json,application/json" data-change="bkFile" hidden></div></div>
  </section>`;
}
