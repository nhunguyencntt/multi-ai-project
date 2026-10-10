-- v19.19: deleteable handover history and report-style auto-filled allocation templates.
SET @db := DATABASE();

UPDATE `allocationTemplates`
SET `title`='BIÊN BẢN BÀN GIAO TÀI SẢN',
    `headerText`='Đơn vị: {{department}}\nĐịa điểm: {{location}}',
    `bodyText`='Căn cứ nhu cầu quản lý tài sản, các bên thống nhất bàn giao tài sản theo thông tin dưới đây.',
    `footerText`='BÊN GIAO                              NGƯỜI NHẬN\n(Ký, ghi rõ họ tên)                    (Ký, ghi rõ họ tên)'
WHERE `type`='handover' AND `active`=1;

UPDATE `allocationTemplates`
SET `title`='BIÊN BẢN THU HỒI TÀI SẢN',
    `headerText`='Đơn vị: {{department}}\nĐịa điểm: {{location}}',
    `bodyText`='Căn cứ nhu cầu quản lý tài sản, các bên thống nhất thu hồi tài sản theo thông tin dưới đây.',
    `footerText`='BÊN THU HỒI                              NGƯỜI BÀN GIAO\n(Ký, ghi rõ họ tên)                    (Ký, ghi rõ họ tên)'
WHERE `type`='return' AND `active`=1;
